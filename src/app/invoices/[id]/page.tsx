'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Printer, ArrowLeft, Download, Bell, CheckCircle, Clock, AlertTriangle, DollarSign, Link, Copy, Eye, Trash2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency } from '@/utils/formatters';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import InvoiceTemplate from '@/components/templates/InvoiceTemplate';
import { usePermission } from '@/hooks/usePermission';

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
    receipt?: {
        id: number;
        receiptNumber: string;
        receiptDate: string;
    };
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
    publicToken?: string;
    publicTokenExpiresAt?: string;
    publicViewCount?: number;
    publicLastViewedAt?: string;
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
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [isRevokingLink, setIsRevokingLink] = useState(false);
    const [linkStatus, setLinkStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [showLinkDetails, setShowLinkDetails] = useState(false);
    const { canManageInvoices } = usePermission();

    const handlePrint = useReactToPrint({
        contentRef: printRef,
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

    // Handle generating public link
    const handleGeneratePublicLink = async () => {
        if (!invoice) return;

        setIsGeneratingLink(true);
        setLinkStatus(null);

        try {
            const response = await fetch(`/api/invoices/${invoice.id}/public-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok) {
                // Update the invoice with new public link data
                setInvoice(prev => prev ? {
                    ...prev,
                    publicToken: result.data.publicToken,
                    publicTokenExpiresAt: result.data.publicTokenExpiresAt,
                    publicViewCount: result.data.publicViewCount || 0,
                    publicLastViewedAt: result.data.publicLastViewedAt
                } : null);
                
                setLinkStatus({
                    success: true,
                    message: 'Public link generated successfully'
                });
            } else {
                setLinkStatus({
                    success: false,
                    message: result.message || 'Failed to generate public link'
                });
            }
        } catch (error) {
            console.error('Error generating public link:', error);
            setLinkStatus({
                success: false,
                message: 'Error generating public link. Please try again.'
            });
        } finally {
            setIsGeneratingLink(false);
        }
    };

    // Handle copying public link to clipboard
    const handleCopyPublicLink = async () => {
        if (!invoice?.publicToken) return;

        const baseUrl = window.location.origin;
        const publicUrl = `${baseUrl}/invoices/public/${invoice.publicToken}`;

        try {
            await navigator.clipboard.writeText(publicUrl);
            setLinkStatus({
                success: true,
                message: 'Public link copied to clipboard'
            });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            setLinkStatus({
                success: false,
                message: 'Failed to copy link to clipboard'
            });
        }
    };

    // Handle revoking public link
    const handleRevokePublicLink = async () => {
        if (!invoice) return;

        setIsRevokingLink(true);
        setLinkStatus(null);

        try {
            const response = await fetch(`/api/invoices/${invoice.id}/public-link`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok) {
                // Update the invoice to remove public link data
                setInvoice(prev => prev ? {
                    ...prev,
                    publicToken: undefined,
                    publicTokenExpiresAt: undefined,
                    publicViewCount: undefined,
                    publicLastViewedAt: undefined
                } : null);
                
                setLinkStatus({
                    success: true,
                    message: 'Public link revoked successfully'
                });
                setShowLinkDetails(false);
            } else {
                setLinkStatus({
                    success: false,
                    message: result.message || 'Failed to revoke public link'
                });
            }
        } catch (error) {
            console.error('Error revoking public link:', error);
            setLinkStatus({
                success: false,
                message: 'Error revoking public link. Please try again.'
            });
        } finally {
            setIsRevokingLink(false);
        }
    };

    // Check if public link is expired
    const isPublicLinkExpired = () => {
        if (!invoice?.publicTokenExpiresAt) return false;
        return new Date() > new Date(invoice.publicTokenExpiresAt);
    };

    // Get public link URL
    const getPublicLinkUrl = () => {
        if (!invoice?.publicToken) return '';
        const baseUrl = window.location.origin;
        return `${baseUrl}/public/invoice/${invoice.publicToken}`;
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
                            onClick={handleSendSms}
                            disabled={isSendingSms}
                        >
                            <Bell className="w-4 h-4 mr-2" />
                            {isSendingSms ? 'Sending...' : 'Send SMS'}
                        </Button>

                        {/* Public Link Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLinkDetails(!showLinkDetails)}
                        >
                            <Link className="w-4 h-4 mr-2" />
                            Public Link
                        </Button>

                        {/* Only show Record Payment button for unpaid invoices */}
                        {(invoice.status.toLowerCase() === 'pending' || invoice.status.toLowerCase() === 'partial') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/payments/simple?invoiceId=${invoice.id}`)}
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Record Payment
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

                {/* Link Status Message */}
                {linkStatus && (
                    <div className={`mb-4 p-3 rounded-md print:hidden ${linkStatus.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                        <p className="text-sm flex items-center">
                            {linkStatus.success ? (
                                <CheckCircle className="w-4 h-4 mr-2" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 mr-2" />
                            )}
                            {linkStatus.message}
                        </p>
                    </div>
                )}

                {/* Public Link Management */}
                {showLinkDetails && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg print:hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-medium text-gray-900">Public Invoice Link</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowLinkDetails(false)}
                            >
                                ×
                            </Button>
                        </div>
                        
                        {invoice.publicToken ? (
                            <div className="space-y-3">
                                {/* Link URL Display */}
                                <div className="bg-white p-3 rounded border">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Public Link URL
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={getPublicLinkUrl()}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyPublicLink}
                                        >
                                            <Copy className="w-4 h-4 mr-1" />
                                            Copy
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(getPublicLinkUrl(), '_blank')}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </Button>
                                    </div>
                                </div>

                                {/* Link Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Status:</span>
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                            isPublicLinkExpired() 
                                                ? 'bg-red-100 text-red-800' 
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {isPublicLinkExpired() ? 'Expired' : 'Active'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Expires:</span>
                                        <span className="ml-2 text-gray-600">
                                            {invoice.publicTokenExpiresAt 
                                                ? new Date(invoice.publicTokenExpiresAt).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Views:</span>
                                        <span className="ml-2 text-gray-600">
                                            {invoice.publicViewCount || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGeneratePublicLink}
                                        disabled={isGeneratingLink}
                                    >
                                        <Link className="w-4 h-4 mr-1" />
                                        {isGeneratingLink ? 'Regenerating...' : 'Regenerate Link'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRevokePublicLink}
                                        disabled={isRevokingLink}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        {isRevokingLink ? 'Revoking...' : 'Revoke Link'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-600 mb-3">
                                    No public link has been generated for this invoice yet.
                                </p>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleGeneratePublicLink}
                                    disabled={isGeneratingLink}
                                >
                                    <Link className="w-4 h-4 mr-2" />
                                    {isGeneratingLink ? 'Generating...' : 'Generate Public Link'}
                                </Button>
                            </div>
                        )}
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