'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, ExternalLink, Calendar, DollarSign, X, Printer } from 'lucide-react';
import { Receipt } from '@/types';

// Dummy data for demonstration
const receiptsData: Receipt[] = [
    {
        id: 'REC001',
        receiptNumber: 'RCPT-001-2023',
        date: '2023-11-20',
        customerId: 'CUST001',
        customerName: 'Green Valley School',
        items: [
            {
                id: 'RITEM001',
                description: 'Payment for sports equipment',
                amount: 114020
            }
        ],
        amount: 114020,
        paymentMethod: 'Bank Transfer',
        notes: 'Advance payment for annual sports day equipment order',
        createdAt: '2023-11-20'
    },
    {
        id: 'REC002',
        receiptNumber: 'RCPT-002-2023',
        date: '2023-12-05',
        customerId: 'CUST002',
        customerName: 'Royal Sports Club',
        items: [
            {
                id: 'RITEM002',
                description: 'Tournament supplies invoice settlement',
                amount: 88600
            }
        ],
        amount: 88600,
        paymentMethod: 'Credit Card',
        notes: 'Payment for cricket bats and tennis rackets',
        createdAt: '2023-12-05'
    },
    {
        id: 'REC003',
        receiptNumber: 'RCPT-003-2024',
        date: '2024-01-15',
        items: [
            {
                id: 'RITEM003',
                description: 'Cash sale - Swimming equipment',
                amount: 12500
            }
        ],
        amount: 12500,
        paymentMethod: 'Cash',
        notes: 'Walk-in customer purchase',
        createdAt: '2024-01-15'
    },
    {
        id: 'REC004',
        receiptNumber: 'RCPT-004-2024',
        date: '2024-02-25',
        customerId: 'CUST004',
        customerName: 'University Sports Dept.',
        items: [
            {
                id: 'RITEM004',
                description: 'Football equipment - partial payment',
                amount: 35000
            }
        ],
        amount: 35000,
        paymentMethod: 'Cheque',
        notes: 'First installment for university championship equipment',
        createdAt: '2024-02-25'
    }
];

export default function Receipts() {
    const [receipts, setReceipts] = useState<Receipt[]>(receiptsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Filter receipts based on search term
    const filteredReceipts = receipts.filter((receipt) =>
        receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receipt.customerName && receipt.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        receipt.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddReceipt = () => {
        setSelectedReceipt(null);
        setIsEditMode(false);
        setShowAddEditModal(true);
    };

    const handleEditReceipt = (receipt: Receipt) => {
        setSelectedReceipt(receipt);
        setIsEditMode(true);
        setShowAddEditModal(true);
    };

    const handleViewReceipt = (receipt: Receipt) => {
        setSelectedReceipt(receipt);
        setShowDetailModal(true);
    };

    const handleDeleteReceipt = (id: string) => {
        if (confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
            setReceipts(receipts.filter(receipt => receipt.id !== id));
        }
    };

    const handleSaveReceipt = (receipt: Receipt) => {
        if (isEditMode) {
            setReceipts(receipts.map(r => r.id === receipt.id ? receipt : r));
        } else {
            const newId = `REC${(receipts.length + 1).toString().padStart(3, '0')}`;
            const newReceipt = {
                ...receipt,
                id: newId,
                receiptNumber: `RCPT-${(receipts.length + 1).toString().padStart(3, '0')}-${new Date().getFullYear()}`,
                createdAt: new Date().toISOString().split('T')[0]
            };
            setReceipts([...receipts, newReceipt]);
        }
        setShowAddEditModal(false);
    };

    const handlePrintReceipt = (receipt: Receipt) => {
        console.log('Printing receipt:', receipt);
        // In a real application, this would trigger a print action
        alert(`Printing receipt ${receipt.receiptNumber}`);
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
                        <p className="text-gray-500">Manage payment receipts for your customers</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" size="sm" onClick={handleAddReceipt}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Receipt
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
                            placeholder="Search receipts by number, customer, or payment method..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Receipts table */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Receipt #</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Payment Method</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReceipts.map((receipt) => (
                                    <tr key={receipt.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {receipt.receiptNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            {receipt.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            {receipt.customerName || 'Walk-in Customer'}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            Rs. {receipt.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {receipt.paymentMethod}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewReceipt(receipt)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                    title="View Details"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintReceipt(receipt)}
                                                    className="text-green-500 hover:text-green-700"
                                                    title="Print Receipt"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditReceipt(receipt)}
                                                    className="text-yellow-500 hover:text-yellow-700"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReceipt(receipt.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Delete"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReceipts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center">
                                            No receipts found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{filteredReceipts.length}</span> receipts
                        </div>
                    </div>
                </div>
            </div>

            {/* View Receipt Details Modal */}
            {showDetailModal && selectedReceipt && (
                <ReceiptDetailModal
                    receipt={selectedReceipt}
                    onClose={() => setShowDetailModal(false)}
                    onEdit={() => {
                        setShowDetailModal(false);
                        handleEditReceipt(selectedReceipt);
                    }}
                    onPrint={() => {
                        handlePrintReceipt(selectedReceipt);
                    }}
                />
            )}

            {/* Add/Edit Receipt Modal */}
            {showAddEditModal && (
                <ReceiptFormModal
                    receipt={selectedReceipt}
                    isEdit={isEditMode}
                    onClose={() => setShowAddEditModal(false)}
                    onSave={handleSaveReceipt}
                />
            )}
        </MainLayout>
    );
}

interface ReceiptDetailModalProps {
    receipt: Receipt;
    onClose: () => void;
    onEdit: () => void;
    onPrint: () => void;
}

function ReceiptDetailModal({ receipt, onClose, onEdit, onPrint }: ReceiptDetailModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">Receipt Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    {/* Receipt Header */}
                    <div className="flex flex-col md:flex-row justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">{receipt.receiptNumber}</h3>
                            <div className="flex items-center mt-1 text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Date: {receipt.date}</span>
                            </div>
                            {receipt.customerName && (
                                <p className="text-gray-700 mt-1">Customer: {receipt.customerName}</p>
                            )}
                        </div>
                        <div className="mt-4 md:mt-0 text-right">
                            <div className="text-gray-600">Receipt ID: {receipt.id}</div>
                            <div className="flex items-center mt-1 justify-end text-gray-600">
                                <DollarSign className="w-4 h-4 mr-1" />
                                <span>{receipt.paymentMethod}</span>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Items */}
                    <div className="mt-6">
                        <h4 className="text-lg font-medium mb-2">Details</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2">Description</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receipt.items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="px-4 py-2">{item.description}</td>
                                            <td className="px-4 py-2 text-right">Rs. {item.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold">
                                        <td className="px-4 py-2">Total</td>
                                        <td className="px-4 py-2 text-right">Rs. {receipt.amount.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    {receipt.notes && (
                        <div className="mt-6">
                            <h4 className="text-lg font-medium mb-2">Notes</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded">{receipt.notes}</p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-6 pt-3 border-t">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button variant="secondary" onClick={onPrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        <Button variant="primary" onClick={onEdit}>
                            Edit Receipt
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ReceiptFormModalProps {
    receipt: Receipt | null;
    isEdit: boolean;
    onClose: () => void;
    onSave: (receipt: Receipt) => void;
}

function ReceiptFormModal({ receipt, isEdit, onClose, onSave }: ReceiptFormModalProps) {
    // Initialize form with empty or existing receipt
    const [formData, setFormData] = useState<Partial<Receipt>>(
        receipt || {
            date: new Date().toISOString().split('T')[0],
            customerName: '',
            items: [{ id: 'new-item', description: '', amount: 0 }],
            amount: 0,
            paymentMethod: 'Cash',
            notes: ''
        }
    );

    // Handle form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle item changes
    const [items, setItems] = useState<{ id: string; description: string; amount: number }[]>(
        formData.items || [{ id: 'new-item', description: '', amount: 0 }]
    );

    const handleItemChange = (id: string, field: string, value: string | number) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setItems(updatedItems);

        // Update total amount
        const totalAmount = updatedItems.reduce((sum, item) => sum + Number(item.amount), 0);
        setFormData({ ...formData, items: updatedItems, amount: totalAmount });
    };

    const handleAddItem = () => {
        const newItem = { id: `new-item-${items.length}`, description: '', amount: 0 };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        setFormData({ ...formData, items: updatedItems });
    };

    const handleRemoveItem = (id: string) => {
        if (items.length === 1) {
            // Don't remove if it's the last item
            return;
        }

        const updatedItems = items.filter(item => item.id !== id);
        setItems(updatedItems);

        // Update total amount
        const totalAmount = updatedItems.reduce((sum, item) => sum + Number(item.amount), 0);
        setFormData({ ...formData, items: updatedItems, amount: totalAmount });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Calculate final amount
        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

        onSave({
            ...(formData as Receipt),
            items,
            amount: totalAmount
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">{isEdit ? 'Edit Receipt' : 'Create Receipt'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                                Customer Name
                            </label>
                            <input
                                type="text"
                                name="customerName"
                                value={formData.customerName || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Leave blank for walk-in customer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method*
                            </label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod || 'Cash'}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="Cash">Cash</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Mobile Payment">Mobile Payment</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            ></textarea>
                        </div>
                    </div>

                    {/* Receipt Items */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Receipt Items</h3>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                + Add Item
                            </button>
                        </div>

                        {items.map(_item => (
                            <div key={_item.id} className="grid grid-cols-12 gap-2 mb-2">
                                <div className="col-span-8">
                                    <input
                                        type="text"
                                        value={_item.description}
                                        onChange={(e) => handleItemChange(_item.id, 'description', e.target.value)}
                                        placeholder="Item description"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        value={_item.amount}
                                        onChange={(e) => handleItemChange(_item.id, 'amount', Number(e.target.value))}
                                        placeholder="Amount"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="col-span-1 flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(_item.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Total */}
                        <div className="flex justify-end mt-4 font-bold">
                            <div className="w-64 flex justify-between border-t pt-2">
                                <span>Total:</span>
                                <span>Rs. {items.reduce((sum, item) => sum + Number(item.amount), 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">
                            {isEdit ? 'Update Receipt' : 'Create Receipt'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 