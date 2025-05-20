'use client';

import { useEffect, useState, useRef } from 'react'; import { useRouter, useParams } from 'next/navigation'; import MainLayout from '@/components/layout/MainLayout'; import { Button } from '@/components/ui/Button'; import { Printer, ArrowLeft, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react'; import { useReactToPrint } from 'react-to-print'; import { formatCurrency } from '@/utils/formatters'; import { generateInvoicePDF } from '@/utils/pdfGenerator';

// Invoice and related interfaces
interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
}

interface InvoiceItem {
    id: number;
    productId: number;
    invoiceId: number;
    quantity: number;
    price: number;
    total: number;
    product: Product;
}

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    contactPerson?: string;
    contactPersonPhone?: string;
}

interface Payment {
    id: number;
    invoiceId: number;
    customerId: number;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    createdAt: string;
}

interface Invoice {
    id: number;
    invoiceNumber: string;
    customerId: number;
    total: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    customer: Customer;
    items: InvoiceItem[];
    payments: Payment[];
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    let icon = null;

    switch (status) {
        case 'Paid':
            bgColor = 'bg-green-100 text-green-800';
            icon = <CheckCircle className="w-4 h-4 mr-1" />;
            break;
        case 'Pending':
            bgColor = 'bg-yellow-100 text-yellow-800';
            icon = <Clock className="w-4 h-4 mr-1" />;
            break;
        case 'Overdue':
            bgColor = 'bg-red-100 text-red-800';
            icon = <AlertTriangle className="w-4 h-4 mr-1" />;
            break;
    }

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${bgColor}`}>
            {icon}
            {status}
        </span>
    );
};

export default function InvoiceDetail() {
    const router = useRouter();
    const params = useParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: invoice ? `Invoice-${invoice.invoiceNumber}` : 'Invoice',
        onAfterPrint: () => console.log('Printed successfully'),
    });

    useEffect(() => {
        if (!params.id) return;

        const fetchInvoice = async () => {
            try {
                const response = await fetch(`/api/invoices/${params.id}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch invoice: ${response.statusText}`);
                }
                const data = await response.json();
                setInvoice(data);
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError(err instanceof Error ? err.message : 'Failed to load invoice');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [params.id]);

    const handleStatusChange = async (newStatus: string) => {
        if (!invoice) return;

        try {
            const response = await fetch(`/api/invoices/${invoice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update invoice: ${response.statusText}`);
            }

            const updatedInvoice = await response.json();
            setInvoice(updatedInvoice.data);
        } catch (err) {
            console.error('Error updating invoice status:', err);
            alert('Failed to update invoice status');
        }
    };

    const handleDeleteInvoice = async () => {
        if (!invoice) return;

        try {
            const response = await fetch(`/api/invoices/${invoice.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Failed to delete invoice: ${response.statusText}`);
            }

            router.push('/invoices');
        } catch (err) {
            console.error('Error deleting invoice:', err);
            alert('Failed to delete invoice');
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice) return;

        // Generate PDF client-side
        generateInvoicePDF(invoice);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="max-w-5xl mx-auto py-6 space-y-6 animate-pulse">
                    <div className="h-10 bg-gray-200 rounded w-64 mb-6"></div>
                    <div className="bg-tertiary p-8 rounded-xl border border-gray-200">
                        <div className="space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-6 bg-gray-200 rounded w-64"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-6 bg-gray-200 rounded w-64"></div>
                                </div>
                            </div>
                            <div className="h-px bg-gray-200 my-6"></div>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-12 bg-gray-200 rounded w-full"></div>
                                ))}
                            </div>
                            <div className="h-px bg-gray-200 my-6"></div>
                            <div className="flex justify-end">
                                <div className="h-8 bg-gray-200 rounded w-32"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="max-w-5xl mx-auto py-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <h3 className="text-lg font-medium">Error</h3>
                        <p>{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/invoices')}
                            className="mt-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Return to Invoices
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!invoice) {
        return (
            <MainLayout>
                <div className="max-w-5xl mx-auto py-6">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                        <h3 className="text-lg font-medium">Invoice Not Found</h3>
                        <p>The requested invoice could not be found.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/invoices')}
                            className="mt-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Return to Invoices
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Calculate paid amount and remaining balance
    const paidAmount = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const remainingBalance = invoice.total - paidAmount;

    // Format dates
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Generate due date (30 days after creation)
    const createdDate = new Date(invoice.createdAt);
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + 30);

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto py-6">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/invoices')}
                            className="mr-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/invoices/edit/${invoice.id}`)}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>

                        {confirmDelete ? (
                            <>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteInvoice}
                                >
                                    Confirm Delete
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmDelete(false)}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmDelete(true)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        )}

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleDownloadPDF}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                {/* Status and Payment */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-500">Status</span>
                            <StatusBadge status={invoice.status} />
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-500">Date</span>
                            <span className="font-medium">{formatDate(invoice.createdAt)}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-500">Due Date</span>
                            <span className="font-medium">{formatDate(dueDate.toISOString())}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-500">Amount</span>
                            <span className="font-medium">{formatCurrency(invoice.total)}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-500">Paid</span>
                            <span className="font-medium">{formatCurrency(paidAmount)}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-500">Balance</span>
                            <span className={`font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(remainingBalance)}
                            </span>
                        </div>

                        {invoice.status !== 'Paid' && (
                            <div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => router.push(`/payments/new?invoiceId=${invoice.id}`)}
                                >
                                    Record Payment
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Printable Invoice */}
                <div ref={printRef} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                                <p className="text-gray-500">#{invoice.invoiceNumber}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-lg font-bold text-gray-900">Your Company Name</h3>
                                <p className="text-gray-500">your@email.com</p>
                                <p className="text-gray-500">Your Address</p>
                                <p className="text-gray-500">Phone: Your Phone</p>
                            </div>
                        </div>

                        {/* Customer and Invoice Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Bill To:</h4>
                                <div className="text-gray-600">
                                    <p className="font-medium">{invoice.customer.name}</p>
                                    <p>{invoice.customer.address}</p>
                                    {invoice.customer.city && invoice.customer.postalCode && (
                                        <p>{invoice.customer.city}, {invoice.customer.postalCode}</p>
                                    )}
                                    {invoice.customer.phone && <p>Phone: {invoice.customer.phone}</p>}
                                    {invoice.customer.email && <p>Email: {invoice.customer.email}</p>}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Invoice Details:</h4>
                                <div className="grid grid-cols-2 text-gray-600">
                                    <p>Invoice Number:</p>
                                    <p className="font-medium">{invoice.invoiceNumber}</p>

                                    <p>Invoice Date:</p>
                                    <p className="font-medium">{formatDate(invoice.createdAt)}</p>

                                    <p>Due Date:</p>
                                    <p className="font-medium">{formatDate(dueDate.toISOString())}</p>

                                    <p>Status:</p>
                                    <p className="font-medium">{invoice.status}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mt-8">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-left">
                                        <th className="py-3 px-4 text-sm font-medium text-gray-700 border-b">Item</th>
                                        <th className="py-3 px-4 text-sm font-medium text-gray-700 border-b text-right">Qty</th>
                                        <th className="py-3 px-4 text-sm font-medium text-gray-700 border-b text-right">Price</th>
                                        <th className="py-3 px-4 text-sm font-medium text-gray-700 border-b text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-4 px-4">
                                                <div className="font-medium text-gray-900">{item.product.name}</div>
                                                {item.product.description && (
                                                    <div className="text-sm text-gray-500">{item.product.description}</div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-gray-700 text-right">{item.quantity}</td>
                                            <td className="py-4 px-4 text-gray-700 text-right">{formatCurrency(item.price)}</td>
                                            <td className="py-4 px-4 text-gray-700 text-right">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-6 border-t pt-6">
                            <div className="flex justify-end">
                                <div className="w-64">
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(invoice.total)}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600">Tax:</span>
                                        <span className="font-medium">{formatCurrency(0)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-t border-gray-200 font-bold">
                                        <span>Total:</span>
                                        <span>{formatCurrency(invoice.total)}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600">Amount Paid:</span>
                                        <span className="font-medium">{formatCurrency(paidAmount)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 text-lg font-bold">
                                        <span>Balance Due:</span>
                                        <span className={remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                                            {formatCurrency(remainingBalance)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes & Terms */}
                        <div className="mt-8 pt-6 border-t">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Notes:</h4>
                                    <p className="text-gray-600 text-sm">Thank you for your business.</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Terms & Conditions:</h4>
                                    <p className="text-gray-600 text-sm">Payment is due within 30 days.</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Records */}
                        {invoice.payments && invoice.payments.length > 0 && (
                            <div className="mt-8 pt-6 border-t">
                                <h4 className="font-medium text-gray-700 mb-2">Payment History:</h4>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="py-2 px-4 text-sm font-medium text-gray-700 border-b">Date</th>
                                            <th className="py-2 px-4 text-sm font-medium text-gray-700 border-b">Method</th>
                                            <th className="py-2 px-4 text-sm font-medium text-gray-700 border-b">Reference</th>
                                            <th className="py-2 px-4 text-sm font-medium text-gray-700 border-b text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.payments.map((payment) => (
                                            <tr key={payment.id} className="border-b">
                                                <td className="py-3 px-4 text-sm text-gray-700">{formatDate(payment.createdAt)}</td>
                                                <td className="py-3 px-4 text-sm text-gray-700">{payment.paymentMethod}</td>
                                                <td className="py-3 px-4 text-sm text-gray-700">{payment.referenceNumber || '-'}</td>
                                                <td className="py-3 px-4 text-sm text-gray-700 text-right">{formatCurrency(payment.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 