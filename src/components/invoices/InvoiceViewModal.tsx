'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Eye, Download, Printer, Edit, X } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
}

interface InvoiceItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
    product?: Product;
}

interface Payment {
    id: number;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    createdAt: string;
}

interface InvoiceData {
    id: number;
    invoiceNumber: string;
    customerId: number;
    customerName: string;
    customer?: Customer;
    dueDate: string;
    createdAt: string;
    paymentMethod: string;
    notes: string;
    items: InvoiceItem[];
    payments?: Payment[];
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    totalProfit?: number;
    profitMargin?: number;
}

interface InvoiceViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onDownload?: () => void;
    onPrint?: () => void;
    invoice: InvoiceData | null;
    showActions?: boolean;
}

const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
    isOpen,
    onClose,
    onEdit,
    onDownload,
    onPrint,
    invoice,
    showActions = true
}) => {
    if (!invoice) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'unpaid':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'overdue':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const paidAmount = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const remainingBalance = invoice.total - paidAmount;
    const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';

    const footer = showActions ? (
        <div className="flex justify-between items-center">
            <div className="flex space-x-2">
                {onDownload && (
                    <Button variant="outline" size="sm" onClick={onDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                )}
                {onPrint && (
                    <Button variant="outline" size="sm" onClick={onPrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                )}
            </div>
            <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
                {onEdit && invoice.status !== 'paid' && (
                    <Button variant="primary" onClick={onEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Invoice
                    </Button>
                )}
            </div>
        </div>
    ) : (
        <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
                Close
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Invoice ${invoice.invoiceNumber}`}
            size="4xl"
            footer={footer}
        >
            <div className="space-y-6">
                {/* Invoice Header */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Invoice Details</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Invoice Number:</span> {invoice.invoiceNumber}</p>
                                <p><span className="font-medium">Created:</span> {formatDate(invoice.createdAt)}</p>
                                <p><span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}</p>
                                <p><span className="font-medium">Payment Method:</span> {invoice.paymentMethod}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Customer Information</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Name:</span> {invoice.customerName}</p>
                                {invoice.customer?.email && (
                                    <p><span className="font-medium">Email:</span> {invoice.customer.email}</p>
                                )}
                                {invoice.customer?.phone && (
                                    <p><span className="font-medium">Phone:</span> {invoice.customer.phone}</p>
                                )}
                                {invoice.customer?.address && (
                                    <p><span className="font-medium">Address:</span> {invoice.customer.address}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status and Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Status</h4>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(isOverdue ? 'overdue' : invoice.status)
                            }`}>
                            {isOverdue ? 'Overdue' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Total Amount</h4>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Balance Due</h4>
                        <p className={`text-2xl font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {formatCurrency(remainingBalance)}
                        </p>
                    </div>
                </div>

                {/* Invoice Items */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Items</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Quantity</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Unit Price</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {invoice.items.map((item, index) => (
                                    <tr key={item.id || index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.productName}</p>
                                                {item.product?.description && (
                                                    <p className="text-sm text-gray-500">{item.product.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.price)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invoice Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="max-w-sm ml-auto space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax (10%):</span>
                            <span className="text-gray-900">{formatCurrency(invoice.tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold border-t pt-2">
                            <span className="text-gray-900">Total:</span>
                            <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
                        </div>
                        {paidAmount > 0 && (
                            <>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Paid Amount:</span>
                                    <span>{formatCurrency(paidAmount)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold">
                                    <span className={remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                                        Balance Due:
                                    </span>
                                    <span className={remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                                        {formatCurrency(remainingBalance)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Payment History */}
                {invoice.payments && invoice.payments.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Method</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reference</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {invoice.payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-900">{formatDate(payment.createdAt)}</td>
                                            <td className="px-4 py-3 text-gray-900 capitalize">{payment.paymentMethod}</td>
                                            <td className="px-4 py-3 text-gray-900">{payment.referenceNumber || '-'}</td>
                                            <td className="px-4 py-3 text-right font-medium text-green-600">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Profit Information */}
                {invoice.totalProfit !== undefined && invoice.profitMargin !== undefined && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Profit Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-blue-700">Total Profit:</span>
                                <span className="ml-2 text-blue-900">{formatCurrency(invoice.totalProfit)}</span>
                            </div>
                            <div>
                                <span className="font-medium text-blue-700">Profit Margin:</span>
                                <span className="ml-2 text-blue-900">{invoice.profitMargin.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {invoice.notes && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default InvoiceViewModal;