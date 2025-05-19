'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, FileText, ExternalLink, Calendar, DollarSign, X, Copy } from 'lucide-react';
import { SalesQuotation } from '@/types';

// Dummy data for demonstration
const quotationsData: SalesQuotation[] = [
    {
        id: 'QUO001',
        quotationNumber: 'QT-001-2023',
        customerId: 'CUST001',
        customerName: 'Green Valley School',
        date: '2023-11-15',
        expiryDate: '2023-12-15',
        items: [
            {
                id: 'QITEM001',
                productId: 'MD-002',
                productName: 'Basketball - Size 7',
                quantity: 20,
                unitPrice: 3200,
                total: 64000
            },
            {
                id: 'QITEM002',
                productId: 'MD-003',
                productName: 'Football - Size 5',
                quantity: 15,
                unitPrice: 2800,
                total: 42000
            }
        ],
        subtotal: 106000,
        tax: 18020,
        discount: 10000,
        total: 114020,
        notes: 'Quotation for annual sports day',
        status: 'pending',
        createdAt: '2023-11-15'
    },
    {
        id: 'QUO002',
        quotationNumber: 'QT-002-2023',
        customerId: 'CUST002',
        customerName: 'Royal Sports Club',
        date: '2023-12-01',
        expiryDate: '2023-12-31',
        items: [
            {
                id: 'QITEM003',
                productId: 'MD-001',
                productName: 'Cricket Bat - Professional',
                quantity: 5,
                unitPrice: 8500,
                total: 42500
            },
            {
                id: 'QITEM004',
                productId: 'MD-004',
                productName: 'Tennis Racket - Professional',
                quantity: 3,
                unitPrice: 12500,
                total: 37500
            }
        ],
        subtotal: 80000,
        tax: 13600,
        discount: 5000,
        total: 88600,
        notes: 'Tournament preparation supplies',
        status: 'accepted',
        createdAt: '2023-12-01'
    },
    {
        id: 'QUO003',
        quotationNumber: 'QT-003-2024',
        customerId: 'CUST003',
        customerName: 'City Gym',
        date: '2024-01-10',
        expiryDate: '2024-02-10',
        items: [
            {
                id: 'QITEM005',
                productId: 'MD-005',
                productName: 'Swimming Goggles - Adult',
                quantity: 25,
                unitPrice: 1500,
                total: 37500
            }
        ],
        subtotal: 37500,
        tax: 6375,
        discount: 2000,
        total: 41875,
        notes: 'For swimming classes',
        status: 'expired',
        createdAt: '2024-01-10'
    },
    {
        id: 'QUO004',
        quotationNumber: 'QT-004-2024',
        customerId: 'CUST004',
        customerName: 'University Sports Dept.',
        date: '2024-02-20',
        expiryDate: '2024-03-20',
        items: [
            {
                id: 'QITEM006',
                productId: 'MD-003',
                productName: 'Football - Size 5',
                quantity: 10,
                unitPrice: 2800,
                total: 28000
            },
            {
                id: 'QITEM007',
                productId: 'MD-002',
                productName: 'Basketball - Size 7',
                quantity: 10,
                unitPrice: 3200,
                total: 32000
            }
        ],
        subtotal: 60000,
        tax: 10200,
        discount: 3000,
        total: 67200,
        notes: 'For inter-university championship',
        status: 'rejected',
        createdAt: '2024-02-20'
    }
];

// Status badge colors
const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-blue-100 text-blue-800';
        case 'accepted':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        case 'expired':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Quotations() {
    const [quotations, setQuotations] = useState<SalesQuotation[]>(quotationsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<SalesQuotation | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Filter quotations based on search term
    const filteredQuotations = quotations.filter((quotation) =>
        quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddQuotation = () => {
        setSelectedQuotation(null);
        setIsEditMode(false);
        setShowAddEditModal(true);
    };

    const handleEditQuotation = (quotation: SalesQuotation) => {
        setSelectedQuotation(quotation);
        setIsEditMode(true);
        setShowAddEditModal(true);
    };

    const handleViewQuotation = (quotation: SalesQuotation) => {
        setSelectedQuotation(quotation);
        setShowDetailModal(true);
    };

    const handleDeleteQuotation = (id: string) => {
        if (confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
            setQuotations(quotations.filter(quotation => quotation.id !== id));
        }
    };

    const handleSaveQuotation = (quotation: SalesQuotation) => {
        if (isEditMode) {
            setQuotations(quotations.map(q => q.id === quotation.id ? quotation : q));
        } else {
            const newId = `QUO${(quotations.length + 1).toString().padStart(3, '0')}`;
            const newQuotation = {
                ...quotation,
                id: newId,
                quotationNumber: `QT-${(quotations.length + 1).toString().padStart(3, '0')}-${new Date().getFullYear()}`,
                createdAt: new Date().toISOString().split('T')[0],
                status: 'pending' as const
            };
            setQuotations([...quotations, newQuotation]);
        }
        setShowAddEditModal(false);
    };

    const handleDuplicateQuotation = (quotation: SalesQuotation) => {
        const newId = `QUO${(quotations.length + 1).toString().padStart(3, '0')}`;
        const duplicatedQuotation = {
            ...quotation,
            id: newId,
            quotationNumber: `QT-${(quotations.length + 1).toString().padStart(3, '0')}-${new Date().getFullYear()}`,
            date: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            status: 'pending' as const,
            notes: `${quotation.notes} (Duplicated from ${quotation.quotationNumber})`
        };
        setQuotations([...quotations, duplicatedQuotation]);
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales Quotations</h1>
                        <p className="text-gray-500">Create and manage price quotes for your customers</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" size="sm" onClick={handleAddQuotation}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Quotation
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
                            placeholder="Search quotations by number, customer, or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Quotations table */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Quotation #</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Expiry Date</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredQuotations.map((quotation) => (
                                    <tr key={quotation.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {quotation.quotationNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            {quotation.customerName}
                                        </td>
                                        <td className="px-6 py-4">
                                            {quotation.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            {quotation.expiryDate}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            Rs. {quotation.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(quotation.status)}`}>
                                                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewQuotation(quotation)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                    title="View Details"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditQuotation(quotation)}
                                                    className="text-yellow-500 hover:text-yellow-700"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicateQuotation(quotation)}
                                                    className="text-green-500 hover:text-green-700"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuotation(quotation.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Delete"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredQuotations.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center">
                                            No quotations found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{filteredQuotations.length}</span> quotations
                        </div>
                    </div>
                </div>
            </div>

            {/* View Quotation Details Modal */}
            {showDetailModal && selectedQuotation && (
                <QuotationDetailModal
                    quotation={selectedQuotation}
                    onClose={() => setShowDetailModal(false)}
                    onEdit={() => {
                        setShowDetailModal(false);
                        handleEditQuotation(selectedQuotation);
                    }}
                    onDuplicate={() => {
                        setShowDetailModal(false);
                        handleDuplicateQuotation(selectedQuotation);
                    }}
                />
            )}

            {/* Add/Edit Quotation Modal */}
            {showAddEditModal && (
                <QuotationFormModal
                    quotation={selectedQuotation}
                    isEdit={isEditMode}
                    onClose={() => setShowAddEditModal(false)}
                    onSave={handleSaveQuotation}
                />
            )}
        </MainLayout>
    );
}

interface QuotationDetailModalProps {
    quotation: SalesQuotation;
    onClose: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
}

function QuotationDetailModal({ quotation, onClose, onEdit, onDuplicate }: QuotationDetailModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">Quotation Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    {/* Quotation Header */}
                    <div className="flex flex-col md:flex-row justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">{quotation.quotationNumber}</h3>
                            <p className="text-gray-600">Customer: {quotation.customerName}</p>
                            <div className="flex items-center mt-1 text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Date: {quotation.date}</span>
                            </div>
                            <div className="flex items-center mt-1 text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Expires: {quotation.expiryDate}</span>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeClass(quotation.status)}`}>
                                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                            </span>
                            <div className="flex items-center mt-2 text-gray-600">
                                <FileText className="w-4 h-4 mr-1" />
                                <span>ID: {quotation.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quotation Items */}
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
                                    {quotation.items.map((item) => (
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

                    {/* Quotation Totals */}
                    <div className="mt-6 flex justify-end">
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between py-2 border-b">
                                <span>Subtotal:</span>
                                <span>Rs. {quotation.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span>Tax:</span>
                                <span>Rs. {quotation.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span>Discount:</span>
                                <span>Rs. {quotation.discount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 font-bold">
                                <span>Total:</span>
                                <span>Rs. {quotation.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {quotation.notes && (
                        <div className="mt-6">
                            <h4 className="text-lg font-medium mb-2">Notes</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded">{quotation.notes}</p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-6 pt-3 border-t">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button variant="secondary" onClick={onDuplicate}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                        </Button>
                        <Button variant="primary" onClick={onEdit}>
                            Edit Quotation
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface QuotationFormModalProps {
    quotation: SalesQuotation | null;
    isEdit: boolean;
    onClose: () => void;
    onSave: (quotation: SalesQuotation) => void;
}

function QuotationFormModal({ quotation, isEdit, onClose, onSave }: QuotationFormModalProps) {
    // Initialize form with empty or existing quotation
    const [formData, setFormData] = useState<Partial<SalesQuotation>>(
        quotation || {
            customerId: 'CUST001', // For simplicity, hardcoded value
            customerName: 'Green Valley School', // For simplicity, hardcoded value
            date: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            total: 0,
            notes: '',
            status: 'pending'
        }
    );

    // Handle form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // For simplicity, we're not implementing the full item management here
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // For demo purposes, if there are no items, add a dummy item
        const items = formData.items?.length ? formData.items : [
            {
                id: 'TEMP001',
                productId: 'MD-001',
                productName: 'Sample Product',
                quantity: 1,
                unitPrice: 1000,
                total: 1000
            }
        ];

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = Math.round(subtotal * 0.17); // 17% tax
        const discount = formData.discount || 0;
        const total = subtotal + tax - discount;

        onSave({
            ...(formData as SalesQuotation),
            items,
            subtotal,
            tax,
            total
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">{isEdit ? 'Edit Quotation' : 'Create Quotation'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Name*
                            </label>
                            <input
                                type="text"
                                name="customerName"
                                value={formData.customerName || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        {isEdit && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status || 'pending'}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date*
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
                                Expiry Date*
                            </label>
                            <input
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
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

                    {/* Item Management - Simplified for this demo */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Items</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            For this demo, we've simplified the item management. In a full implementation,
                            you would be able to add, edit, and remove items with dynamic total calculations.
                        </p>

                        {/* We would normally have a dynamic item list here */}
                        <div className="bg-gray-50 p-4 rounded">
                            <p className="text-center text-gray-600">
                                {isEdit && formData.items?.length ?
                                    `This quotation contains ${formData.items.length} items.` :
                                    'For demo purposes, a sample item will be added automatically.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">
                            {isEdit ? 'Update Quotation' : 'Create Quotation'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 