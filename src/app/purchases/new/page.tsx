'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, Save, XCircle, Plus, Minus, Search, FileText, DollarSign, Calendar, ArrowLeft, Trash } from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState('');

    // Form data
    const [formData, setFormData] = useState<Partial<PurchaseInvoice>>({
        invoiceNumber: '',
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

    // Filter products based on search
    useEffect(() => {
        if (!products || !Array.isArray(products)) {
            setFilteredProducts([]);
            return;
        }

        if (!searchTerm.trim()) {
            setFilteredProducts(products);
            return;
        }

        const lowercasedSearch = searchTerm.toLowerCase();
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(lowercasedSearch) ||
            product.sku?.toLowerCase().includes(lowercasedSearch)
        );

        setFilteredProducts(filtered);
    }, [searchTerm, products]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...(prev.items || []),
                {
                    productId: '',
                    productName: '',
                    quantity: 1,
                    unitPrice: 0,
                    subtotal: 0
                }
            ]
        }));
    };

    const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newItems = [...(prev.items || [])];

            if (name === 'productId' && value) {
                // Check if products is an array before using find
                const selectedProduct = Array.isArray(products) ?
                    products.find(p => p.id === value) : null;

                if (selectedProduct) {
                    newItems[index] = {
                        ...newItems[index],
                        productId: value,
                        productName: selectedProduct.name,
                        unitPrice: selectedProduct.purchasePrice || 0
                    };

                    // Recalculate subtotal
                    newItems[index].subtotal = newItems[index].quantity * newItems[index].unitPrice;
                }
            } else {
                newItems[index] = {
                    ...newItems[index],
                    [name]: name === 'quantity' || name === 'unitPrice' ? Number(value) : value
                };

                // Recalculate subtotal if quantity or unitPrice changed
                if (name === 'quantity' || name === 'unitPrice') {
                    newItems[index].subtotal = newItems[index].quantity * newItems[index].unitPrice;
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.invoiceNumber || !formData.date || !formData.supplierId) {
            setError('Please fill in all required fields');
            return;
        }

        if (!formData.items || formData.items.length === 0) {
            setError('Please add at least one item');
            return;
        }

        if (formData.items.some(item => !item.productId || item.quantity <= 0)) {
            setError('All items must have a product and quantity greater than zero');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/purchases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
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
                                    Invoice Number*
                                </label>
                                <input
                                    type="text"
                                    name="invoiceNumber"
                                    value={formData.invoiceNumber}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                    required
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

                        {/* Product search */}
                        <div className="mb-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search className="w-4 h-4 text-black" />
                                </div>
                                <input
                                    type="text"
                                    className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                                    placeholder="Search products by name or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
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
                                    className="overflow-x-auto"
                                    variants={itemVariants}
                                >
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-black">Product</th>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-black">Quantity</th>
                                                                                                <th className="px-4 py-2 text-left text-sm font-semibold text-black">Unit Price</th>                                                <th className="px-4 py-2 text-left text-sm font-semibold text-black">Subtotal</th>                                                <th className="px-4 py-2 text-right text-sm font-semibold text-black">Actions</th>
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
                                                            <select
                                                                name="productId"
                                                                value={item.productId}
                                                                onChange={(e) => handleItemChange(e, index)}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
                                                                required
                                                            >
                                                                <option value="">Select Product</option>
                                                                {filteredProducts.map(product => (
                                                                    <option key={product.id} value={product.id}>
                                                                        {product.name} {product.sku ? `(${product.sku})` : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                name="quantity"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(e, index)}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-black"
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
                                                                min="0"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-black">
                                                            {(item.quantity * item.unitPrice).toFixed(2)}
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
        </MainLayout>
    );
} 