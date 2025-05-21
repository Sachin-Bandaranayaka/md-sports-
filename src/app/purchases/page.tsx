'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, FileText, ExternalLink, Calendar, DollarSign, X } from 'lucide-react';
import { PurchaseInvoice, Supplier } from '@/types';

// Status badge colors
const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'partial':
            return 'bg-yellow-100 text-yellow-800';
        case 'unpaid':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Purchases() {
    const router = useRouter();
    const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Fetch purchase invoices from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch purchase invoices
                const purchasesResponse = await fetch('/api/purchases');
                if (!purchasesResponse.ok) {
                    throw new Error('Failed to fetch purchase invoices');
                }
                const purchasesData = await purchasesResponse.json();
                setPurchaseInvoices(purchasesData);

                // Fetch suppliers for the form
                const suppliersResponse = await fetch('/api/suppliers');
                if (!suppliersResponse.ok) {
                    throw new Error('Failed to fetch suppliers');
                }
                const suppliersData = await suppliersResponse.json();
                setSuppliers(suppliersData);

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

    // Filter invoices based on search term
    const filteredInvoices = purchaseInvoices.filter((invoice) =>
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddInvoice = () => { router.push('/purchases/new'); };

    const handleEditInvoice = (invoice: PurchaseInvoice) => {
        setSelectedInvoice(invoice);
        setIsEditMode(true);
        setShowAddEditModal(true);
    };

    const handleViewInvoice = (invoice: PurchaseInvoice) => {
        setSelectedInvoice(invoice);
        setShowDetailModal(true);
    };

    const handleDeleteInvoice = async (id: string) => {
        if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/purchases/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete purchase invoice');
                }

                setPurchaseInvoices(purchaseInvoices.filter(invoice => invoice.id !== id));
            } catch (err) {
                console.error('Error deleting purchase invoice:', err);
                alert('Failed to delete purchase invoice. Please try again.');
            }
        }
    };

    const handleSaveInvoice = async (invoice: PurchaseInvoice) => {
        try {
            if (isEditMode) {
                // Update existing invoice
                const response = await fetch(`/api/purchases/${invoice.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(invoice)
                });

                if (!response.ok) {
                    throw new Error('Failed to update purchase invoice');
                }

                const updatedInvoice = await response.json();
                setPurchaseInvoices(purchaseInvoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
            } else {
                // Create new invoice
                const response = await fetch('/api/purchases', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(invoice)
                });

                if (!response.ok) {
                    throw new Error('Failed to create purchase invoice');
                }

                const newInvoice = await response.json();
                setPurchaseInvoices([...purchaseInvoices, newInvoice]);
            }
            setShowAddEditModal(false);
        } catch (err) {
            console.error('Error saving purchase invoice:', err);
            alert('Failed to save purchase invoice. Please try again.');
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Purchase Invoices</h1>
                        <p className="text-gray-500">Manage your purchase invoices and supplier orders</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" size="sm" onClick={handleAddInvoice}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Purchase Invoice
                        </Button>
                    </div>
                </div>

                {/* Search bar */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                            placeholder="Search invoices by number, supplier or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Loading and error states */}
                {loading && (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 animate-pulse">
                        {/* Loading header placeholder */}
                        <div className="p-5">
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-full"></div>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded w-full"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="text-center py-4">
                        <p className="text-red-500">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="mt-2"
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {/* Invoices table */}
                {!loading && !error && (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Invoice #</th>
                                        <th className="px-6 py-3">Supplier</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Due Date</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {invoice.invoiceNumber}
                                            </td>
                                            <td className="px-6 py-4">
                                                {invoice.supplier?.name || 'Unknown Supplier'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(invoice.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                Rs. {invoice.total?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(invoice.status)}`}>
                                                    {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewInvoice(invoice)}
                                                        className="text-blue-500 hover:text-blue-700"
                                                        title="View Details"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditInvoice(invoice)}
                                                        className="text-yellow-500 hover:text-yellow-700"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteInvoice(invoice.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Delete"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredInvoices.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center">
                                                {purchaseInvoices.length === 0 ? 'No purchase invoices found.' : 'No invoices match your search criteria.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{filteredInvoices.length}</span> invoices
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoice Detail Modal */}
                {showDetailModal && selectedInvoice && (
                    <InvoiceDetailModal
                        invoice={selectedInvoice}
                        onClose={() => setShowDetailModal(false)}
                        onEdit={() => {
                            setShowDetailModal(false);
                            setIsEditMode(true);
                            setShowAddEditModal(true);
                        }}
                    />
                )}

                {/* Add/Edit Invoice Modal */}
                {showAddEditModal && (
                    <InvoiceFormModal
                        invoice={selectedInvoice}
                        isEdit={isEditMode}
                        onClose={() => setShowAddEditModal(false)}
                        onSave={handleSaveInvoice}
                        suppliers={suppliers}
                    />
                )}
            </div>
        </MainLayout>
    );
}

interface InvoiceDetailModalProps {
    invoice: PurchaseInvoice;
    onClose: () => void;
    onEdit: () => void;
}

function InvoiceDetailModal({ invoice, onClose, onEdit }: InvoiceDetailModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">Purchase Invoice Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    {/* Invoice Header */}
                    <div className="flex flex-col md:flex-row justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">{invoice.invoiceNumber}</h3>
                            <p className="text-gray-600">{invoice.supplier?.name || 'Unknown Supplier'}</p>
                            <div className="flex items-center mt-1 text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Date: {new Date(invoice.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center mt-1 text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeClass(invoice.status)}`}>
                                {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                            </span>
                            <div className="flex items-center mt-2 text-gray-600">
                                <FileText className="w-4 h-4 mr-1" />
                                <span>ID: {invoice.id}</span>
                            </div>
                            <div className="flex items-center mt-1 text-gray-600">
                                <DollarSign className="w-4 h-4 mr-1" />
                                <span>Payment: {invoice.paymentMethod}</span>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="mt-6">
                        <h4 className="text-lg font-medium mb-2">Items</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2">Product</th>
                                        <th className="px-4 py-2">Qty</th>
                                        <th className="px-4 py-2">Unit Price</th>
                                        <th className="px-4 py-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="px-4 py-2">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.productName}</p>
                                                    <p className="text-xs text-gray-500">ID: {item.productId}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">{item.quantity}</td>
                                            <td className="px-4 py-2">Rs. {item.unitPrice.toLocaleString()}</td>
                                            <td className="px-4 py-2 font-medium">Rs. {item.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Invoice Totals */}
                    <div className="mt-6 flex justify-end">
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between py-2 border-b">
                                <span>Subtotal:</span>
                                <span>Rs. {invoice.subtotal?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span>Tax:</span>
                                <span>Rs. {invoice.tax?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span>Discount:</span>
                                <span>Rs. {invoice.discount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 font-bold">
                                <span>Total:</span>
                                <span>Rs. {invoice.total?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="mt-6">
                            <h4 className="text-lg font-medium mb-2">Notes</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded">{invoice.notes}</p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-6 pt-3 border-t">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button variant="primary" onClick={onEdit}>
                            Edit Invoice
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface InvoiceFormModalProps {
    invoice: PurchaseInvoice | null;
    isEdit: boolean;
    onClose: () => void;
    onSave: (invoice: PurchaseInvoice) => void;
    suppliers: Supplier[];
}

function InvoiceFormModal({ invoice, isEdit, onClose, onSave, suppliers }: InvoiceFormModalProps) {
    // Initialize form with empty or existing invoice
    const [formData, setFormData] = useState<Partial<PurchaseInvoice>>(
        invoice || {
            supplierId: '',
            supplierName: '',
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            total: 0,
            notes: '',
            status: 'unpaid',
            paymentMethod: 'Bank Transfer'
        }
    );

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newItem, setNewItem] = useState({
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
    });

    // Fetch products for the dropdown
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/products');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setProducts(data.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Handle form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'supplierId') {
            const selectedSupplier = suppliers.find(s => s.id === value);
            setFormData({
                ...formData,
                supplierId: value,
                supplierName: selectedSupplier ? selectedSupplier.name : ''
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Handle new item field changes
    const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'productId') {
            const selectedProduct = products.find(p => p.id === value);
            setNewItem({
                ...newItem,
                productId: value,
                productName: selectedProduct ? selectedProduct.name : '',
                unitPrice: selectedProduct ? selectedProduct.weightedAverageCost || 0 : 0,
                total: newItem.quantity * (selectedProduct ? selectedProduct.weightedAverageCost || 0 : 0)
            });
        } else if (name === 'quantity' || name === 'unitPrice') {
            const newValue = parseFloat(value) || 0;
            const updatedItem = { ...newItem, [name]: newValue };

            // Recalculate total
            if (name === 'quantity') {
                updatedItem.total = newValue * newItem.unitPrice;
            } else if (name === 'unitPrice') {
                updatedItem.total = newItem.quantity * newValue;
            }

            setNewItem(updatedItem);
        } else {
            setNewItem({ ...newItem, [name]: value });
        }
    };

    // Add a new item to the invoice
    const handleAddItem = () => {
        if (!newItem.productId || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
            alert('Please select a product, and enter a valid quantity and unit price');
            return;
        }

        const updatedItems = [...(formData.items || []), {
            ...newItem,
            id: Date.now().toString() // temporary ID for new items
        }];

        setFormData({
            ...formData,
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, item) => sum + item.total, 0)
        });

        // Reset the new item form
        setNewItem({
            productId: '',
            productName: '',
            quantity: 1,
            unitPrice: 0,
            total: 0
        });
    };

    // Remove an item from the invoice
    const handleRemoveItem = (index: number) => {
        const updatedItems = [...(formData.items || [])];
        updatedItems.splice(index, 1);

        setFormData({
            ...formData,
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, item) => sum + item.total, 0)
        });
    };

    // Calculate totals whenever items or discount changes
    useEffect(() => {
        if (formData.items) {
            const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
            const tax = Math.round(subtotal * 0.17); // 17% tax
            const discount = formData.discount || 0;
            const total = subtotal + tax - discount;

            setFormData(prev => ({
                ...prev,
                subtotal,
                tax,
                total
            }));
        }
    }, [formData.items, formData.discount]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.items || formData.items.length === 0) {
            alert('Please add at least one item to the invoice');
            return;
        }

        onSave(formData as PurchaseInvoice);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">{isEdit ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supplier*
                            </label>
                            <select
                                name="supplierId"
                                value={formData.supplierId || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status*
                            </label>
                            <select
                                name="status"
                                value={formData.status || 'unpaid'}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partially Paid</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Invoice Date*
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date*
                            </label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Online Payment">Online Payment</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Discount Amount
                            </label>
                            <input
                                type="number"
                                name="discount"
                                value={formData.discount || 0}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="0"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            ></textarea>
                        </div>
                    </div>

                    {/* Item Management */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Items</h3>

                        {/* Add New Item Form */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <h4 className="font-medium mb-2">Add New Item</h4>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                <div className="md:col-span-2">
                                    <label className="block text-xs text-gray-700 mb-1">Product</label>
                                    <select
                                        name="productId"
                                        value={newItem.productId}
                                        onChange={handleItemChange}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.sku})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={newItem.quantity}
                                        onChange={handleItemChange}
                                        min="1"
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-700 mb-1">Unit Price</label>
                                    <input
                                        type="number"
                                        name="unitPrice"
                                        value={newItem.unitPrice}
                                        onChange={handleItemChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="w-full bg-blue-600 text-white py-1 px-3 rounded-md text-sm hover:bg-blue-700"
                                    >
                                        Add Item
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        {formData.items && formData.items.length > 0 ? (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quantity
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Unit Price
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {formData.items.map((item, index) => (
                                            <tr key={item.id || index}>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {item.productName}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    Rs. {item.unitPrice.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    Rs. {item.total.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No items added yet. Add items using the form above.</p>
                            </div>
                        )}
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-4">
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between py-2 border-b">
                                <span>Subtotal:</span>
                                <span>Rs. {(formData.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span>Tax (17%):</span>
                                <span>Rs. {(formData.tax || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span>Discount:</span>
                                <span>Rs. {(formData.discount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 font-bold">
                                <span>Total:</span>
                                <span>Rs. {(formData.total || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Invoice</Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 