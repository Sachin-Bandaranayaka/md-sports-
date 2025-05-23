'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { Loader2, Save, XCircle, Plus, Minus, Search, FileText, DollarSign, Calendar, ArrowLeft, Trash, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PurchaseInvoice, Supplier, Product } from '@/types';

// Animation variants
const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.1,
            duration: 0.3
        }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
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

export default function NewPurchaseInvoice() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [newProductData, setNewProductData] = useState({
        name: '',
        sku: '',
        description: '',
        retailPrice: 0,
        basePrice: 0,
        categoryId: ''
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [shops, setShops] = useState<any[]>([]);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
    const [showDistributionModal, setShowDistributionModal] = useState(false);
    const [distribution, setDistribution] = useState<{ [key: number]: number }[]>([]);

    // Generate a unique invoice number
    const generateInvoiceNumber = () => {
        const now = new Date();
        const year = now.getFullYear().toString().slice(2); // Get last 2 digits of year
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PI${year}${month}${day}-${random}`;
    };

    // Form data
    const [formData, setFormData] = useState<Partial<PurchaseInvoice>>({
        invoiceNumber: generateInvoiceNumber(),
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        supplierId: '',
        status: 'unpaid',
        notes: '',
        items: [],
        totalAmount: 0,
        paidAmount: 0
    });

    // Load suppliers and products
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch suppliers
                const suppliersResponse = await fetch('/api/suppliers');
                if (!suppliersResponse.ok) {
                    throw new Error('Failed to fetch suppliers');
                }
                const suppliersData = await suppliersResponse.json();
                setSuppliers(suppliersData);

                // Fetch products
                const productsResponse = await fetch('/api/products');
                if (!productsResponse.ok) {
                    throw new Error('Failed to fetch products');
                }
                const productsData = await productsResponse.json();
                // Ensure products is an array
                const productsArray = Array.isArray(productsData) ? productsData :
                    (productsData.data && Array.isArray(productsData.data)) ? productsData.data : [];
                setProducts(productsArray);
                setFilteredProducts(productsArray);

                setError(null);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate total amount
    useEffect(() => {
        if (formData.items && formData.items.length > 0) {
            const total = formData.items.reduce((sum, item) => {
                return sum + (item.quantity * item.unitPrice);
            }, 0);

            setFormData(prev => ({
                ...prev,
                totalAmount: total
            }));
        }
    }, [formData.items]);

    // Load shops and categories
    useEffect(() => {
        const fetchAdditionalData = async () => {
            try {
                // Fetch categories
                const categoriesResponse = await fetch('/api/products/categories');
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    setCategories(categoriesData.data || []);
                }

                // Fetch shops
                const shopsResponse = await fetch('/api/shops');
                if (shopsResponse.ok) {
                    const shopsData = await shopsResponse.json();
                    // Ensure shops is always an array
                    const shopsArray = Array.isArray(shopsData) ? shopsData :
                        (shopsData?.data && Array.isArray(shopsData.data)) ? shopsData.data : [];
                    setShops(shopsArray);
                } else {
                    console.error('Failed to fetch shops:', shopsResponse.statusText);
                    setShops([]);
                }
            } catch (err) {
                console.error('Error fetching additional data:', err);
                // Initialize with empty arrays on error
                setShops([]);
            }
        };

        fetchAdditionalData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddItem = () => {
        setFormData(prev => {
            const newItems = [
                ...(prev.items || []),
                {
                    productId: '',
                    productName: '',
                    quantity: '',
                    unitPrice: '',
                    subtotal: 0
                }
            ];

            // Initialize distribution for the new item
            const newDistribution = [...distribution];
            newDistribution.push({});
            setDistribution(newDistribution);

            return {
                ...prev,
                items: newItems
            };
        });
    };

    const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newItems = [...(prev.items || [])];

            if (name === 'productId' && value) {
                // Check if products is an array before using find
                const selectedProduct = Array.isArray(products) ?
                    products.find(p => p.id.toString() === value) : null;

                if (selectedProduct) {
                    newItems[index] = {
                        ...newItems[index],
                        productId: value,
                        productName: selectedProduct.name,
                        unitPrice: selectedProduct.weightedAverageCost || ''
                    };

                    // Recalculate subtotal
                    const qty = newItems[index].quantity === '' ? 0 : Number(newItems[index].quantity);
                    const price = newItems[index].unitPrice === '' ? 0 : Number(newItems[index].unitPrice);
                    newItems[index].subtotal = qty * price;
                }
            } else {
                newItems[index] = {
                    ...newItems[index],
                    [name]: value
                };

                // Recalculate subtotal if quantity or unitPrice changed
                if (name === 'quantity' || name === 'unitPrice') {
                    const qty = newItems[index].quantity === '' ? 0 : Number(newItems[index].quantity);
                    const price = newItems[index].unitPrice === '' ? 0 : Number(newItems[index].unitPrice);
                    newItems[index].subtotal = qty * price;
                }
            }

            return {
                ...prev,
                items: newItems
            };
        });
    };

    const handleRemoveItem = (index: number) => {
        setFormData(prev => {
            const newItems = [...(prev.items || [])];
            newItems.splice(index, 1);
            return {
                ...prev,
                items: newItems
            };
        });
    };

    const handleOpenDistributionModal = (index: number) => {
        setSelectedItemIndex(index);
        setShowDistributionModal(true);
    };

    const handleDistributionChange = (shopId: number, quantity: number) => {
        if (selectedItemIndex === null) return;

        setDistribution(prev => {
            const updated = [...prev];
            if (!updated[selectedItemIndex]) {
                updated[selectedItemIndex] = {};
            }
            updated[selectedItemIndex][shopId] = quantity;
            return updated;
        });
    };

    const getTotalDistributed = (index: number) => {
        if (!distribution[index]) return 0;
        return Object.values(distribution[index]).reduce((sum, qty) => sum + qty, 0);
    };

    const handleCreateProduct = async () => {
        try {
            setSubmitting(true);
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProductData)
            });

            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            const result = await response.json();

            if (result.success && result.data) {
                // Add the new product to the products list
                const newProduct = result.data;
                setProducts(prev => [...prev, newProduct]);
                setFilteredProducts(prev => [...prev, newProduct]);

                // If we have a selected item, update it with the new product
                if (selectedItemIndex !== null) {
                    handleItemChange({
                        target: {
                            name: 'productId',
                            value: newProduct.id.toString()
                        }
                    } as React.ChangeEvent<HTMLSelectElement>, selectedItemIndex);
                }

                // Close the modal and reset the form
                setShowNewProductModal(false);
                setNewProductData({
                    name: '',
                    sku: '',
                    description: '',
                    retailPrice: 0,
                    basePrice: 0,
                    categoryId: ''
                });
                setSelectedItemIndex(null);
            }
        } catch (err) {
            console.error('Error creating product:', err);
            setError('Failed to create product. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.date || !formData.supplierId) {
            setError('Please fill in all required fields');
            return;
        }

        if (!formData.items || formData.items.length === 0) {
            setError('Please add at least one item');
            return;
        }

        // Check if any items have invalid data
        if (formData.items.some(item => !item.productId || item.quantity === '' || Number(item.quantity) <= 0 || item.unitPrice === '')) {
            setError('All items must have a product, quantity greater than zero, and a unit price');
            return;
        }

        // Validate distributions
        for (let i = 0; i < formData.items.length; i++) {
            const totalDistributed = getTotalDistributed(i);
            const itemQuantity = Number(formData.items[i].quantity);
            if (totalDistributed !== itemQuantity) {
                setError(`Item ${i + 1} (${formData.items[i].productName}): Distribution (${totalDistributed}) does not match total quantity (${itemQuantity})`);
                return;
            }
        }

        setSubmitting(true);
        setError(null);

        try {
            // Transform the data to include shop distribution
            const transformedData = {
                invoiceNumber: formData.invoiceNumber,
                supplierId: formData.supplierId,
                status: formData.status || 'unpaid',
                totalAmount: formData.totalAmount || 0,
                paidAmount: parseFloat(formData.paidAmount as unknown as string) || 0,
                date: formData.date,
                dueDate: formData.dueDate,
                notes: formData.notes,
                items: formData.items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice)
                })) || [],
                distributions: distribution
            };

            const response = await fetch('/api/purchases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transformedData)
            });

            if (!response.ok) {
                throw new Error('Failed to create purchase invoice');
            }

            // Redirect to purchases page on success
            router.push('/purchases');
        } catch (err) {
            console.error('Error creating purchase invoice:', err);
            setError('Failed to create purchase invoice. Please try again.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <motion.div
                className="space-y-6"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={pageVariants}
            >
                {/* Header */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200"
                    variants={cardVariants}
                >
                    <div>
                        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            Create Purchase Invoice
                        </h1>
                        <p className="text-black mt-1">Add a new purchase invoice to the system</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/purchases')}
                            className="shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Purchases
                        </Button>
                    </div>
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <XCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold">Error</h3>
                                <p>{error}</p>
                            </div>
                            <button
                                className="ml-auto text-red-800"
                                onClick={() => setError(null)}
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    variants={cardVariants}
                >
                    {/* Invoice details */}
                    <motion.div
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                        variants={cardVariants}
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center text-black">
                            <FileText className="w-5 h-5 mr-2 text-primary" />
                            Invoice Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Invoice Number (Auto-generated)
                                </label>
                                <input
                                    type="text"
                                    name="invoiceNumber"
                                    value={formData.invoiceNumber}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black bg-gray-50"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Supplier*
                                </label>
                                <select
                                    name="supplierId"
                                    value={formData.supplierId}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                    required
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="partial">Partially Paid</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Invoice Date*
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Calendar className="w-4 h-4 text-black" />
                                    </div>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Due Date
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Calendar className="w-4 h-4 text-black" />
                                    </div>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Paid Amount
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <DollarSign className="w-4 h-4 text-black" />
                                    </div>
                                    <input
                                        type="number"
                                        name="paidAmount"
                                        value={formData.paidAmount}
                                        onChange={handleChange}
                                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-black mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                rows={3}
                            />
                        </div>
                    </motion.div>

                    {/* Items */}
                    <motion.div
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                        variants={cardVariants}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center text-black">
                                <DollarSign className="w-5 h-5 mr-2 text-primary" />
                                Invoice Items
                            </h2>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddItem}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        {/* Items list */}
                        <AnimatePresence>
                            {(!formData.items || formData.items.length === 0) ? (
                                <motion.div
                                    className="text-center py-8 text-black"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    No items added yet. Click "Add Item" to start.
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="overflow-visible"
                                    variants={itemVariants}
                                >
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-black">Product</th>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-black">Quantity</th>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-black">Unit Price</th>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-black">Subtotal</th>
                                                <th className="px-4 py-2 text-center text-sm font-semibold text-black">Distribution</th>
                                                <th className="px-4 py-2 text-right text-sm font-semibold text-black">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence>
                                                {formData.items.map((item, index) => (
                                                    <motion.tr
                                                        key={index}
                                                        className="border-b border-gray-200"
                                                        variants={itemVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit={{ opacity: 0, x: 20 }}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center">
                                                                <div className="w-full" style={{ position: 'relative', zIndex: 50 }}>
                                                                    <Combobox
                                                                        value={item.productId}
                                                                        onChange={(value) => handleItemChange({
                                                                            target: {
                                                                                name: 'productId',
                                                                                value: value
                                                                            }
                                                                        } as React.ChangeEvent<HTMLSelectElement>, index)}
                                                                        options={filteredProducts.map(product => ({
                                                                            value: product.id.toString(),
                                                                            label: `${product.name} ${product.sku ? `(${product.sku})` : ''}`
                                                                        }))}
                                                                        placeholder="Select Product"
                                                                        required
                                                                    />
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedItemIndex(index);
                                                                        setShowNewProductModal(true);
                                                                    }}
                                                                    className="ml-2 px-2 flex-shrink-0"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                name="quantity"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(e, index)}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                                                placeholder="Quantity"
                                                                min="1"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                name="unitPrice"
                                                                value={item.unitPrice}
                                                                onChange={(e) => handleItemChange(e, index)}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                                                placeholder="Price"
                                                                min="0"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-black">
                                                            {(item.quantity * item.unitPrice).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenDistributionModal(index)}
                                                                className="text-xs"
                                                            >
                                                                <Store className="w-3 h-3 mr-1" />
                                                                {distribution[index] && Object.keys(distribution[index]).length > 0
                                                                    ? `${getTotalDistributed(index)}/${item.quantity}`
                                                                    : "Distribute"}
                                                            </Button>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Total */}
                        {formData.items && formData.items.length > 0 && (
                            <motion.div
                                className="mt-4 text-right"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <p className="text-lg font-semibold text-black">
                                    Total: Rs. {formData.totalAmount?.toFixed(2) || '0.00'}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Submit button */}
                    <motion.div
                        className="flex justify-end"
                        variants={cardVariants}
                    >
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            disabled={submitting}
                            className="w-full md:w-auto"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Purchase Invoice
                                </>
                            )}
                        </Button>
                    </motion.div>
                </motion.form>
            </motion.div>

            {/* New Product Modal */}
            {showNewProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        className="bg-white rounded-xl p-6 w-full max-w-lg mx-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-xl font-bold text-black mb-4">Add New Product</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Product Name*
                                </label>
                                <input
                                    type="text"
                                    value={newProductData.name}
                                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    SKU
                                </label>
                                <input
                                    type="text"
                                    value={newProductData.sku}
                                    onChange={(e) => setNewProductData({ ...newProductData, sku: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Category
                                </label>
                                <select
                                    value={newProductData.categoryId}
                                    onChange={(e) => setNewProductData({ ...newProductData, categoryId: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={newProductData.description}
                                    onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-1">
                                        Purchase Price*
                                    </label>
                                    <input
                                        type="number"
                                        value={newProductData.basePrice}
                                        onChange={(e) => setNewProductData({ ...newProductData, basePrice: parseFloat(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-black mb-1">
                                        Retail Price*
                                    </label>
                                    <input
                                        type="number"
                                        value={newProductData.retailPrice}
                                        onChange={(e) => setNewProductData({ ...newProductData, retailPrice: parseFloat(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowNewProductModal(false);
                                    setSelectedItemIndex(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleCreateProduct}
                                disabled={submitting || !newProductData.name}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Product
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Distribution Modal */}
            {showDistributionModal && selectedItemIndex !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        className="bg-white rounded-xl p-6 w-full max-w-lg mx-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-xl font-bold text-black mb-4">
                            Distribute {formData.items[selectedItemIndex].productName || 'Product'}
                        </h2>
                        <p className="text-black mb-4">
                            Total Quantity: {formData.items[selectedItemIndex].quantity}
                        </p>

                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {Array.isArray(shops) && shops.length > 0 ? (
                                shops.map(shop => (
                                    <div key={shop.id} className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-black">
                                            {shop.name} ({shop.location || 'No location'})
                                        </label>
                                        <input
                                            type="number"
                                            value={distribution[selectedItemIndex]?.[shop.id] || 0}
                                            onChange={(e) => handleDistributionChange(shop.id, parseInt(e.target.value) || 0)}
                                            className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                            min="0"
                                            max={formData.items[selectedItemIndex].quantity}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">No shops available</div>
                            )}
                        </div>

                        <div className="mt-4 py-2 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-black font-medium">
                                    Total Distributed:
                                </span>
                                <span className={`font-semibold ${getTotalDistributed(selectedItemIndex) === Number(formData.items[selectedItemIndex].quantity)
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                    }`}>
                                    {getTotalDistributed(selectedItemIndex)} / {formData.items[selectedItemIndex].quantity}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDistributionModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => {
                                    // Quick distribution - evenly distribute across all shops
                                    if (!Array.isArray(shops) || shops.length === 0) {
                                        return;
                                    }

                                    const itemQty = Number(formData.items[selectedItemIndex].quantity);
                                    const shopCount = shops.length;
                                    const baseQty = Math.floor(itemQty / shopCount);
                                    const remainder = itemQty % shopCount;

                                    const newDist = {};
                                    shops.forEach((shop, idx) => {
                                        newDist[shop.id] = baseQty + (idx < remainder ? 1 : 0);
                                    });

                                    setDistribution(prev => {
                                        const updated = [...prev];
                                        updated[selectedItemIndex] = newDist;
                                        return updated;
                                    });
                                }}
                                disabled={!Array.isArray(shops) || shops.length === 0}
                            >
                                Auto Distribute
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setShowDistributionModal(false)}
                                disabled={getTotalDistributed(selectedItemIndex) !== Number(formData.items[selectedItemIndex].quantity)}
                            >
                                Done
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </MainLayout>
    );
} 