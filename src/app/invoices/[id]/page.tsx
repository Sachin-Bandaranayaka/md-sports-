'use client';

import { useEffect, useState, useRef } from 'react'; import { useRouter, useParams } from 'next/navigation'; import MainLayout from '@/components/layout/MainLayout'; import { Button } from '@/components/ui/Button'; import { Printer, ArrowLeft, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Download, Bell, Receipt } from 'lucide-react'; import { useReactToPrint } from 'react-to-print'; import { formatCurrency } from '@/utils/formatters'; import { generateInvoicePDF } from '@/utils/pdfGenerator'; import InvoiceTemplate from '@/components/templates/InvoiceTemplate';

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
    address?: string | {
        mainAddress?: string;
        city?: string;
        postalCode?: string;
        contactPerson?: string;
        contactPersonPhone?: string;
        customerType?: string;
        paymentType?: string;
        creditLimit?: number | null;
        creditPeriod?: number | null;
        taxId?: string;
        notes?: string;
    };
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
    paymentMethod: string;
    dueDate?: string;
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
    const [isSendingSms, setIsSendingSms] = useState(false);
    const [smsStatus, setSmsStatus] = useState<{ success: boolean; message: string } | null>(null);

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
                const errorData = await response.json();
                // Check if the error is a foreign key constraint related to receipts
                if (errorData.error && errorData.error.includes('Receipt_paymentId_fkey')) {
                    throw new Error('This invoice has associated receipts. Please delete the receipts first before deleting this invoice.');
                } else {
                    throw new Error(`Failed to delete invoice: ${errorData.message || response.statusText}`);
                }
            }

            router.push('/invoices');
        } catch (err) {
            console.error('Error deleting invoice:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete invoice');
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice) return;

        // Generate PDF client-side
        generateInvoicePDF(invoice);
    };

    // Handle sending SMS notification
    const handleSendSms = async () => {
        if (!invoice) return;

        setIsSendingSms(true);
        setSmsStatus(null);

        try {
            const response = await fetch('/api/sms/invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invoiceId: invoice.id }),
            });

            const result = await response.json();

            setSmsStatus({
                success: response.ok,
                message: result.message || (response.ok ? 'SMS sent successfully' : 'Failed to send SMS')
            });
        } catch (error) {
            console.error('Error sending SMS:', error);
            setSmsStatus({
                success: false,
                message: 'Error sending SMS. Please try again.'
            });
        } finally {
            setIsSendingSms(false);
        }
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
    // For cash payments, balance is always 0 regardless of payment records
    const remainingBalance = invoice.paymentMethod === 'Cash' ? 0 : invoice.total - paidAmount;

    // Format dates
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Due date calculation - for cash payments, there is no due date
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) :
        (invoice.paymentMethod === 'Cash' ?
            new Date(invoice.createdAt) : // For cash, due date is same as creation date
            new Date(new Date(invoice.createdAt).setDate(new Date(invoice.createdAt).getDate() + 30)));

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto py-6">
                {/* Action Bar - Compact version */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
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
                        <h1 className="text-xl font-semibold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
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

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendSms}
                            disabled={isSendingSms}
                        >
                            <Bell className="w-4 h-4 mr-2" />
                            {isSendingSms ? 'Sending...' : 'Send SMS'}
                        </Button>

                        {invoice.status === 'Pending' && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => router.push(`/receipts/confirm/${invoice.id}`)}
                            >
                                <Receipt className="w-4 h-4 mr-2" />
                                Confirm Receipt
                            </Button>
                        )}

                        {invoice.status.toLowerCase() !== 'paid' && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => router.push(`/payments/new?invoiceId=${invoice.id}`)}
                            >
                                Record Payment
                            </Button>
                        )}

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

                {/* SMS Status Message */}
                {smsStatus && (
                    <div className={`mb-4 p-3 rounded-md print:hidden ${smsStatus.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                        <p className="text-sm flex items-center">
                            {smsStatus.success ? (
                                <CheckCircle className="w-4 h-4 mr-2" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 mr-2" />
                            )}
                            {smsStatus.message}
                        </p>
                    </div>
                )}

                {/* Invoice Template - Main Content */}
                <div ref={printRef} className="bg-white">
                    <InvoiceTemplate invoice={invoice} />
                </div>
            </div>
        </MainLayout>
    );
}