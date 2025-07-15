'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { Loader2, Save, XCircle, Plus, FileText, DollarSign, Calendar, Trash, Store, PackagePlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PurchaseInvoice, Supplier, Product, Category, Shop } from '@/types';
import { useCreatePurchaseInvoice, useProducts, useSuppliersOptimized } from '@/hooks/useQueries';

interface PurchaseInvoiceFormData extends Partial<PurchaseInvoice> {
    totalAmount?: number;
    paidAmount?: number;
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3 }
    }
};

interface NewPurchaseInvoiceFormProps {
    initialSuppliers: Supplier[];
    initialProducts: Product[];
    initialCategories: Category[];
    initialShops: Shop[];
    isModal?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function NewPurchaseInvoiceForm({
    initialSuppliers,
    initialProducts,
    initialCategories,
    initialShops,
    isModal = false,
    onSuccess,
    onCancel
}: NewPurchaseInvoiceFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use real-time hooks for data fetching
    const { data: suppliers = initialSuppliers || [] } = useSuppliersOptimized();
    const [products, setProducts] = useState<Product[]>(initialProducts || []);
    const [categories, setCategories] = useState<Category[]>(initialCategories || []);
    const [shops, setShops] = useState<Shop[]>(initialShops || []);

    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [newProductModalError, setNewProductModalError] = useState<string | null>(null);
    const [newProductSubmitting, setNewProductSubmitting] = useState(false);
    const [newProductData, setNewProductData] = useState({
        name: '',
        sku: '',
        description: '',
        price: 0,
        weightedAverageCost: 0,
        categoryId: ''
    });

    const [selectedItemIndexForDistribution, setSelectedItemIndexForDistribution] = useState<number | null>(null);
    const [showDistributionModal, setShowDistributionModal] = useState(false);
    const [itemDistributions, setItemDistributions] = useState<Array<Record<number, number>>>([]);

    const generateInvoiceNumber = useCallback(() => {
        const now = new Date();
        const year = now.getFullYear().toString().slice(2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PI-${year}${month}${day}-${random}`;
    }, []);

    const [formData, setFormData] = useState<PurchaseInvoiceFormData>({
        invoiceNumber: generateInvoiceNumber(),
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        supplierId: '',
        status: 'pending_approval', // Default status
        notes: '',
        items: [],
        totalAmount: 0,
        paidAmount: 0,
    });

    // Function to fetch updated product data
    const fetchUpdatedProductData = useCallback(async (productId?: number) => {
        try {
            // Add timestamp to ensure cache busting
            const timestamp = Date.now();
            const response = await fetch(`/api/products?t=${timestamp}&limit=10000`, {
                cache: 'no-store', // Ensure fresh data
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setProducts(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching updated product data:', error);
        }
    }, []);

    useEffect(() => {
        const total = (formData.items || []).reduce((sum, item) => {
            return sum + (Number(item.quantity) * Number(item.price));
        }, 0);
        setFormData(prev => ({ ...prev, totalAmount: total }));
    }, [formData.items]);

    // Force refresh products on component mount to ensure latest data
    useEffect(() => {
        fetchUpdatedProductData();
    }, [fetchUpdatedProductData]);

    const createInvoiceMutation = useCreatePurchaseInvoice();
    const { data: productsData, refetch: refetchProducts } = useProducts();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'paidAmount' || name === 'totalAmount' ? parseFloat(value) || 0 : value
        }));
    };

    const handleAddItem = () => {
        setFormData(prev => {
            const newItems = [
                ...(prev.items || []),
                {
                    productId: '',
                    productName: '',
                    quantity: 1,
                    price: 0,
                }
            ];
            setItemDistributions(prevDist => [...prevDist, {}]);
            return { ...prev, items: newItems };
        });
    };

    const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
        const { name, value } = e.target;
        const newItems = [...(formData.items || [])];
        const currentItem = { ...newItems[index] };

        if (name === 'productId') {
            const selectedProduct = products.find(p => p.id.toString() === value);
            if (selectedProduct) {
                currentItem.productId = selectedProduct.id.toString();
                currentItem.productName = selectedProduct.name;
                currentItem.price = selectedProduct.weightedAverageCost || 0;
            } else {
                currentItem.productId = '';
                currentItem.productName = '';
                currentItem.price = 0;
            }
        } else if (name === 'quantity' || name === 'price') {
            (currentItem as any)[name] = value === '' ? '' : parseFloat(value) || 0;
        } else {
            (currentItem as any)[name] = value;
        }
        newItems[index] = currentItem;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleRemoveItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: (prev.items || []).filter((_, i) => i !== index)
        }));
        setItemDistributions(prevDist => prevDist.filter((_, i) => i !== index));
    };

    const handleOpenDistributionModal = (itemIndex: number) => {
        setSelectedItemIndexForDistribution(itemIndex);
        setShowDistributionModal(true);
    };

    const handleDistributionChange = (shopId: number, quantityStr: string) => {
        if (selectedItemIndexForDistribution === null) return;
        const quantity = quantityStr === '' ? 0 : parseInt(quantityStr) || 0;
        setItemDistributions(prevDists => {
            const newDists = [...prevDists];
            const currentItemDist = { ...(newDists[selectedItemIndexForDistribution] || {}) };
            if (quantity > 0) {
                currentItemDist[shopId] = quantity;
            } else {
                delete currentItemDist[shopId];
            }
            newDists[selectedItemIndexForDistribution] = currentItemDist;
            return newDists;
        });
    };

    const getTotalDistributedForItem = (itemIndex: number): number => {
        if (itemIndex === null || !itemDistributions[itemIndex]) return 0;
        return Object.values(itemDistributions[itemIndex]).reduce((sum, qty) => sum + Number(qty), 0);
    };

    const getItemDistributionStatus = (itemIndex: number) => {
        if (!formData.items || !formData.items[itemIndex]) return { status: 'none', message: 'No item' };
        
        const item = formData.items[itemIndex];
        const requiredQty = Number(item.quantity);
        const distributedQty = getTotalDistributedForItem(itemIndex);
        
        if (distributedQty === 0) {
            return { status: 'none', message: 'Not distributed' };
        } else if (distributedQty < requiredQty) {
            return { status: 'partial', message: `${distributedQty}/${requiredQty} distributed` };
        } else if (distributedQty === requiredQty) {
            return { status: 'complete', message: 'Fully distributed' };
        } else {
            return { status: 'over', message: `Over-distributed: ${distributedQty}/${requiredQty}` };
        }
    };

    const handleCreateNewProduct = async () => {
        if (!newProductData.name || !newProductData.categoryId || newProductData.price <= 0 || newProductData.weightedAverageCost <= 0) {
            setNewProductModalError('Name, Category, Purchase Price, and Retail Price are required.');
            return;
        }
        setNewProductSubmitting(true);
        setNewProductModalError(null);
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProductData)
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create product');
            }
            const createdProduct = await response.json();

            // Refetch products to get updated list
            await refetchProducts();

            setProducts(prev => [...prev, createdProduct.data]);
            setShowNewProductModal(false);
            setNewProductData({ name: '', sku: '', description: '', price: 0, weightedAverageCost: 0, categoryId: '' });
            // Optionally, add the new product directly to the current invoice items
        } catch (err: any) {
            setNewProductModalError(err.message);
        } finally {
            setNewProductSubmitting(false);
        }
    };

    // Helper function to validate distributions
    const validateDistributions = () => {
        if (!formData.items || formData.items.length === 0) return { isValid: false, error: 'No items to validate' };
        
        if (shops.length === 0) {
            return { isValid: false, error: 'No shops available for distribution. Please configure at least one shop before creating purchase invoices.' };
        }

        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            const distribution = itemDistributions[i] || {};
            
            // Calculate total distributed quantity for this item
            const totalDistributed = Object.values(distribution).reduce((sum, qty) => {
                const num = Number(qty) || 0;
                return sum + num;
            }, 0);
            
            const requiredQuantity = Number(item.quantity);
            
            if (totalDistributed === 0) {
                return { 
                    isValid: false, 
                    error: `Product "${item.productName || `Product ${item.productId}`}" has no distribution set. Please distribute all quantities to shops.` 
                };
            }
            
            if (totalDistributed !== requiredQuantity) {
                return { 
                    isValid: false, 
                    error: `Product "${item.productName || `Product ${item.productId}`}" distribution mismatch. Required: ${requiredQuantity}, Distributed: ${totalDistributed}` 
                };
            }
        }
        
        return { isValid: true, error: null };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.supplierId) {
            setError('Please select a supplier.');
            return;
        }

        if (!formData.items || formData.items.length === 0) {
            setError('Please add at least one item to the invoice.');
            return;
        }

        // Validate all items have valid products and quantities
        const invalidItems = (formData.items || []).filter(item =>
            !item.productId || !item.quantity || item.quantity <= 0 || !item.price || item.price <= 0
        );

        if (invalidItems.length > 0) {
            setError('Please ensure all items have a product, quantity, and price.');
            return;
        }

        // Validate distributions
        const { isValid, error } = validateDistributions();
        if (!isValid) {
            setError(error || 'An unexpected error occurred during distribution validation.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Prepare the data with proper types
            const preparedData: any = { // Use 'any' for now, or create a more specific type
                ...formData,
                items: formData.items?.map(item => ({
                    ...item,
                    productId: parseInt(item.productId), // Ensure productId is a number
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                })),
                totalAmount: Number(formData.totalAmount),
                paidAmount: Number(formData.paidAmount || 0),
            };

            // Prepare distributions, ensuring length matches items
            const hasAnyDistribution = itemDistributions.some(dist => Object.keys(dist).length > 0);

            let distributions: Array<Record<number, number>>;

            if (!hasAnyDistribution && shops.length > 0) {
                // No distributions provided, assign all to default shop
                const defaultShop = shops.find(s => s.isDefault) || shops[0];
                if (defaultShop) {
                    distributions = formData.items.map(item => ({
                        [defaultShop.id]: Number(item.quantity)
                    }));
                } else {
                    // No default shop, set empty (will cause API error)
                    distributions = formData.items.map(() => ({}));
                }
            } else {
                // Use provided distributions, fill missing with empty
                distributions = formData.items.map((item, index) => itemDistributions[index] || {});
            }

            preparedData.distributions = distributions;

            console.log('Submitting purchase invoice:', preparedData);

            const createdInvoice = await createInvoiceMutation.mutateAsync(preparedData);
            console.log('Purchase invoice created:', createdInvoice);

            // If in modal mode, call onSuccess callback
            if (isModal && onSuccess) {
                onSuccess();
            } else {
                // Otherwise redirect to the purchase invoices list
                const invoiceId = (createdInvoice as any)?.data?.id || (createdInvoice as any)?.id || 'unknown';
                router.push('/purchases?success=true&action=created&id=' + invoiceId);
            }

        } catch (err) {
            console.error('Error creating purchase invoice:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    // Remove the global product search handler - let each Combobox handle its own filtering

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error &&
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
                    <Info size={18} /> {error}
                </motion.div>
            }
            <motion.div variants={cardVariants} className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                        <input type="text" name="invoiceNumber" id="invoiceNumber" value={formData.invoiceNumber || ''} readOnly className="block w-full rounded-md border border-gray-300 shadow-sm bg-gray-100 sm:text-sm text-gray-700 p-2 cursor-default" />
                    </div>
                    <div>
                        <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">Supplier <span className="text-red-500">*</span></label>
                        <Combobox
                            options={suppliers.map(s => ({ value: s.id.toString(), label: s.name }))}
                            value={formData.supplierId || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
                            placeholder="Select Supplier"
                            searchable={true}
                        />
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Invoice Date <span className="text-red-500">*</span></label>
                        <input type="date" name="date" id="date" value={formData.date || ''} onChange={handleChange} required className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" />
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input type="date" name="dueDate" id="dueDate" value={formData.dueDate || ''} onChange={handleChange} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" id="status" value={formData.status || 'pending_approval'} onChange={handleChange} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500">
                            <option value="pending_approval">Pending Approval</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="void">Void</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                        <input type="number" name="totalAmount" id="totalAmount" value={formData.totalAmount?.toFixed(2) || '0.00'} readOnly className="block w-full rounded-md border border-gray-300 shadow-sm bg-gray-100 sm:text-sm text-gray-700 p-2 cursor-default" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                        <input type="number" name="paidAmount" id="paidAmount" value={formData.paidAmount || 0} onChange={handleChange} min="0" step="0.01" className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500"></textarea>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={cardVariants} className="p-6 bg-white rounded-lg shadow">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b pb-3">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">Invoice Items</h2>
                    <div className="flex space-x-2 flex-shrink-0">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowNewProductModal(true)} className="flex items-center">
                            <PackagePlus className="w-4 h-4 mr-2" /> New Product
                        </Button>
                        <Button type="button" variant="primary" size="sm" onClick={handleAddItem} className="flex items-center">
                            <Plus className="w-4 h-4 mr-2" /> Add Item
                        </Button>
                    </div>
                </div>
                <div className="space-y-4">
                    {(formData.items || []).map((item, index) => (
                        <motion.div variants={itemVariants} key={index} className="p-4 border rounded-md bg-gray-50/80 space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-x-4 md:items-end">
                            <div className="md:col-span-4">
                                <label htmlFor={`item-product-${index}`} className="block text-xs font-medium text-gray-600 mb-1">Product <span className="text-red-500">*</span></label>
                                <Combobox
                                    options={products.map(p => ({ value: p.id.toString(), label: `${p.name} (SKU: ${p.sku || 'N/A'})` }))}
                                    value={item.productId || ''}
                                    onChange={(value) => handleItemChange({ target: { name: 'productId', value } } as any, index)}
                                    placeholder="Search or Select Product"
                                    searchable={true}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor={`item-quantity-${index}`} className="block text-xs font-medium text-gray-600 mb-1">Quantity <span className="text-red-500">*</span></label>
                                <input type="number" name="quantity" id={`item-quantity-${index}`} value={item.quantity || ''} onChange={(e) => handleItemChange(e, index)} required min="0.01" step="any" className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" placeholder="0.00" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor={`item-price-${index}`} className="block text-xs font-medium text-gray-600 mb-1">Unit Price <span className="text-red-500">*</span></label>
                                <input type="number" name="price" id={`item-price-${index}`} value={item.price || ''} onChange={(e) => handleItemChange(e, index)} required min="0" step="any" className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" placeholder="0.00" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Subtotal</label>
                                <input type="text" value={(Number(item.quantity) * Number(item.price)).toFixed(2)} readOnly className="block w-full rounded-md border border-gray-300 shadow-sm bg-gray-100 sm:text-sm text-gray-700 p-2 cursor-default" />
                            </div>
                            <div className="md:col-span-2 flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleOpenDistributionModal(index)} className="flex-1 flex items-center justify-center text-xs py-2" disabled={!item.productId || !item.quantity || Number(item.quantity) <= 0}>
                                        <Store className="w-3 h-3 mr-1" /> Distribute
                                    </Button>
                                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} className="h-9 w-9 flex-shrink-0">
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                                {/* Distribution Status Indicator */}
                                {(() => {
                                    const status = getItemDistributionStatus(index);
                                    return (
                                        <div className={`text-xs px-2 py-1 rounded-md text-center ${
                                            status.status === 'complete' ? 'bg-green-100 text-green-700' :
                                            status.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                            status.status === 'over' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {status.message}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    ))}
                </div>
                {formData.items && formData.items.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No items added yet.</p>}
            </motion.div>

            {showNewProductModal && (
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Add New Product</h3>
                                <button onClick={() => { setShowNewProductModal(false); setNewProductModalError(null); }} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
                            </div>
                            {newProductModalError && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center gap-2"><Info size={16} /> {newProductModalError}</div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                                <input type="text" value={newProductData.name} onChange={e => setNewProductData({ ...newProductData, name: e.target.value })} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                <input type="text" value={newProductData.sku} onChange={e => setNewProductData({ ...newProductData, sku: e.target.value })} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                                <Combobox
                                    options={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                                    value={newProductData.categoryId}
                                    onChange={value => setNewProductData({ ...newProductData, categoryId: value })}
                                    placeholder="Select Category"
                                    searchable={true}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (WAC) <span className="text-red-500">*</span></label>
                                    <input type="number" value={newProductData.weightedAverageCost} onChange={e => setNewProductData({ ...newProductData, weightedAverageCost: parseFloat(e.target.value) || 0 })} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" required min="0" step="any" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price <span className="text-red-500">*</span></label>
                                    <input type="number" value={newProductData.price} onChange={e => setNewProductData({ ...newProductData, price: parseFloat(e.target.value) || 0 })} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" required min="0" step="any" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={newProductData.description} onChange={e => setNewProductData({ ...newProductData, description: e.target.value })} className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-2 placeholder-gray-500" rows={2}></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <Button variant="outline" onClick={() => { setShowNewProductModal(false); setNewProductModalError(null); }} disabled={newProductSubmitting}>Cancel</Button>
                                <Button variant="primary" onClick={handleCreateNewProduct} disabled={newProductSubmitting} className="min-w-[130px]">
                                    {newProductSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Product'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}

            {showDistributionModal && selectedItemIndexForDistribution !== null && formData.items && formData.items[selectedItemIndexForDistribution] && (
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Distribute: {formData.items[selectedItemIndexForDistribution].productName}</h3>
                                <button onClick={() => setShowDistributionModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 space-y-1">
                                    <p>Total Quantity for item: <span className="font-semibold">{formData.items[selectedItemIndexForDistribution].quantity}</span></p>
                                    <p>Currently Distributed: <span className="font-semibold">{getTotalDistributedForItem(selectedItemIndexForDistribution)}</span></p>
                                    <p>Remaining: <span className="font-semibold text-blue-800">{Math.max(0, Number(formData.items[selectedItemIndexForDistribution].quantity) - getTotalDistributedForItem(selectedItemIndexForDistribution))}</span></p>
                                </div>
                                {shops.length > 0 ? shops.map(shop => (
                                    <div key={shop.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                        <label htmlFor={`dist-shop-${shop.id}`} className="text-sm text-gray-700">{shop.name}</label>
                                        <input
                                            type="number"
                                            id={`dist-shop-${shop.id}`}
                                            value={itemDistributions[selectedItemIndexForDistribution]?.[shop.id] || ''}
                                            onChange={(e) => handleDistributionChange(shop.id, e.target.value)}
                                            min="0"
                                            max={Number(formData.items![selectedItemIndexForDistribution].quantity) - (getTotalDistributedForItem(selectedItemIndexForDistribution) - (itemDistributions[selectedItemIndexForDistribution]?.[shop.id] || 0))}
                                            placeholder="0"
                                            className="block w-28 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 p-1.5 placeholder-gray-500"
                                        />
                                    </div>
                                )) : <p className="text-sm text-gray-500 py-4 text-center">No shops available for distribution.</p>}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button variant="primary" onClick={() => setShowDistributionModal(false)}>Done</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}
            
            {/* Validation Summary */}
            {formData.items && formData.items.length > 0 && (
                <div className="mt-6">
                    {(() => {
                        const { isValid, error } = validateDistributions();
                        if (!isValid) {
                            return (
                                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                    <div className="flex items-center">
                                        <Info className="w-5 h-5 text-red-600 mr-2" />
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800">Distribution Required</h4>
                                            <p className="text-sm text-red-700 mt-1">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        
                        // Show success state when all validations pass
                        const allItemsDistributed = formData.items.every((_, index) => {
                            const status = getItemDistributionStatus(index);
                            return status.status === 'complete';
                        });
                        
                        if (allItemsDistributed && formData.items.length > 0) {
                            return (
                                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                    <div className="flex items-center">
                                        <Info className="w-5 h-5 text-green-600 mr-2" />
                                        <div>
                                            <h4 className="text-sm font-medium text-green-800">Ready to Submit</h4>
                                            <p className="text-sm text-green-700 mt-1">All items are properly distributed to shops.</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        
                        return null;
                    })()}
                </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-8">
                <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    onClick={isModal ? onCancel : () => router.push('/purchases')}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting || !validateDistributions().isValid}
                    className="flex items-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="animate-spin h-4 w-4" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Invoice
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}