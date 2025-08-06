'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Eye, Download, Printer, Edit, X } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import InvoiceTemplate from './InvoiceTemplate';

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

    const paidAmount = invoice.payments?.reduce((sum, payment) => {
        return sum + (Number(payment.amount) || 0);
    }, 0) || 0;
    const remainingBalance = invoice.total - paidAmount;
    const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status.toLowerCase() !== 'paid';

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
                {onEdit && invoice.status.toLowerCase() !== 'paid' && (
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
            <InvoiceTemplate
                invoice={{
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    customerId: invoice.customerId,
                    customerName: invoice.customerName,
                    customer: invoice.customer,
                    dueDate: invoice.dueDate,
                    createdAt: invoice.createdAt,
                    paymentMethod: invoice.paymentMethod,
                    notes: invoice.notes,
                    items: invoice.items,
                    payments: invoice.payments,
                    subtotal: invoice.subtotal,
                    tax: invoice.tax,
                    total: invoice.total,
                    status: invoice.status,
                    totalProfit: invoice.totalProfit,
                    profitMargin: invoice.profitMargin
                }}
            />
        </Modal>
    );
};

export default InvoiceViewModal;