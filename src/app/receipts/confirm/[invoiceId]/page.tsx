'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Receipt } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Invoice {
    id: number;
    invoiceNumber: string;
    customerId: number;
    total: number;
    status: string;
    customer: {
        name: string;
    };
    payments: Payment[];
}

interface Payment {
    id: number;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    createdAt: string;
    receipt?: {
        id: number;
    };
}

interface ReceiptFormData {
    paymentId: number;
    receiptNumber: string;
    receiptDate: string;
    bankName: string;
    accountNumber: string;
    chequeNumber: string;
    transactionId: string;
    notes: string;
}

export default function ConfirmReceipt() {
    const router = useRouter();
    const params = useParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

    const [formData, setFormData] = useState<ReceiptFormData>({
        paymentId: 0,
        receiptNumber: '',
        receiptDate: new Date().toISOString().split('T')[0],
        bankName: '',
        accountNumber: '',
        chequeNumber: '',
        transactionId: '',
        notes: ''
    });

    // Generate a unique receipt number based on current date
    const generateReceiptNumber = () => {
        const now = new Date();
        return `RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    };

    useEffect(() => {
        if (!params.invoiceId) return;

        const fetchInvoice = async () => {
            try {
                const response = await fetch(`/api/invoices/${params.invoiceId}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch invoice: ${response.statusText}`);
                }
                const data = await response.json();
                setInvoice(data);

                // If there's only one payment without a receipt, select it automatically
                const eligiblePayments = data.payments.filter((p: Payment) => !p.receipt);
                if (eligiblePayments.length === 1) {
                    setSelectedPaymentId(eligiblePayments[0].id);
                    setFormData(prev => ({
                        ...prev,
                        paymentId: eligiblePayments[0].id,
                        receiptNumber: generateReceiptNumber()
                    }));
                }
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError(err instanceof Error ? err.message : 'Failed to load invoice');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [params.invoiceId]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handlePaymentSelect = (paymentId: number) => {
        setSelectedPaymentId(paymentId);
        setFormData({
            ...formData,
            paymentId,
            receiptNumber: generateReceiptNumber()
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPaymentId) {
            alert('Please select a payment to confirm');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to create receipt');
            }

            // Redirect to the invoice page
            router.push(`/invoices/${params.invoiceId}`);
            router.refresh();
        } catch (error) {
            console.error('Error creating receipt:', error);
            alert('Failed to create receipt. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="max-w-3xl mx-auto py-6 space-y-6 animate-pulse">
                    <div className="h-10 bg-gray-200 rounded w-64 mb-6"></div>
                    <div className="bg-tertiary p-8 rounded-xl border border-gray-200">
                        <div className="space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-6 bg-gray-200 rounded w-64"></div>
                            <div className="h-px bg-gray-200 my-6"></div>
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-12 bg-gray-200 rounded w-full"></div>
                                ))}
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
                <div className="max-w-3xl mx-auto py-6">
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
                <div className="max-w-3xl mx-auto py-6">
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

    // Check if there are any payments without receipts
    const paymentsWithoutReceipts = invoice.payments.filter(payment => !payment.receipt);

    if (paymentsWithoutReceipts.length === 0) {
        return (
            <MainLayout>
                <div className="max-w-3xl mx-auto py-6">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                        <h3 className="text-lg font-medium">No Eligible Payments</h3>
                        <p>All payments for this invoice already have receipts.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/invoices/${invoice.id}`)}
                            className="mt-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Return to Invoice
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Confirm Receipt</h1>
                        <p className="text-gray-500">
                            Confirm payment receipt for Invoice #{invoice.invoiceNumber}
                        </p>
                    </div>
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/invoices/${invoice.id}`)}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Invoice
                        </Button>
                    </div>
                </div>

                {/* Invoice Summary */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Invoice Number</p>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Customer</p>
                            <p className="font-medium">{invoice.customer.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="font-medium">{formatCurrency(invoice.total)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-medium">{invoice.status}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Selection */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Select Payment to Confirm</h2>

                    <div className="space-y-4">
                        {paymentsWithoutReceipts.map((payment) => (
                            <div
                                key={payment.id}
                                className={`p-4 border rounded-lg cursor-pointer ${selectedPaymentId === payment.id ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                                onClick={() => handlePaymentSelect(payment.id)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <div>
                                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                        <p className="text-sm text-gray-500">
                                            {payment.paymentMethod} • {formatDate(payment.createdAt)}
                                        </p>
                                        {payment.referenceNumber && (
                                            <p className="text-sm text-gray-500">
                                                Ref: {payment.referenceNumber}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        {selectedPaymentId === payment.id ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                                                Selected
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                Select
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Receipt Form */}
                {selectedPaymentId && (
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
                            <Receipt className="inline-block w-5 h-5 mr-2" />
                            Receipt Details
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Receipt Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="receiptNumber"
                                        value={formData.receiptNumber}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        required
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Receipt Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="receiptDate"
                                        value={formData.receiptDate}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cheque Number
                                    </label>
                                    <input
                                        type="text"
                                        name="chequeNumber"
                                        value={formData.chequeNumber}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Transaction ID
                                    </label>
                                    <input
                                        type="text"
                                        name="transactionId"
                                        value={formData.transactionId}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                ></textarea>
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                                    className="mr-2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isSubmitting}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Confirm Receipt
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 