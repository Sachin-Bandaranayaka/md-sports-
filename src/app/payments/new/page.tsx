'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

// Interfaces
interface Invoice {
    id: number;
    invoiceNumber: string;
    customerId: number;
    total: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    customer: {
        id: number;
        name: string;
    };
}

interface Payment {
    invoiceId: number;
    customerId: number;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
    paymentDate: string;
}

export default function RecordPayment() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceIdParam = searchParams.get('invoiceId');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [payment, setPayment] = useState<Payment>({
        invoiceId: 0,
        customerId: 0,
        amount: 0,
        paymentMethod: 'Cash',
        referenceNumber: '',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0]
    });

    // Calculate balance if invoice exists
    const [paidAmount, setPaidAmount] = useState(0);
    const remainingBalance = invoice ? invoice.total - paidAmount : 0;

    // Fetch invoice if ID is provided
    useEffect(() => {
        if (!invoiceIdParam) {
            setLoading(false);
            return;
        }

        const fetchInvoice = async () => {
            try {
                const response = await fetch(`/api/invoices/${invoiceIdParam}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch invoice: ${response.statusText}`);
                }

                const data = await response.json();
                setInvoice(data);

                // Set payment initial values based on invoice
                setPayment(prev => ({
                    ...prev,
                    invoiceId: data.id,
                    customerId: data.customer.id,
                    amount: data.total // Default to full amount, user can adjust
                }));

                // Calculate already paid amount
                if (data.payments && data.payments.length > 0) {
                    const paid = data.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                    setPaidAmount(paid);
                }
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError(err instanceof Error ? err.message : 'Failed to load invoice');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [invoiceIdParam]);

    // Handle form input changes
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        // Parse amount as a number if it's the amount field
        if (name === 'amount') {
            setPayment({
                ...payment,
                [name]: parseFloat(value) || 0
            });
        } else {
            setPayment({
                ...payment,
                [name]: value
            });
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payment),
            });

            if (!response.ok) {
                throw new Error('Failed to record payment');
            }

            // If successful, redirect to invoice details
            router.push(`/invoices/${payment.invoiceId}`);
        } catch (err) {
            console.error('Error recording payment:', err);
            alert('Failed to record payment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // If we're still loading the invoice
    if (loading) {
        return (
            <MainLayout>
                <div className="max-w-3xl mx-auto py-6 space-y-6 animate-pulse">
                    <div className="h-10 bg-gray-200 rounded w-64 mb-6"></div>
                    <div className="bg-tertiary p-8 rounded-xl border border-gray-200">
                        <div className="space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // If there was an error
    if (error) {
        return (
            <MainLayout>
                <div className="max-w-3xl mx-auto py-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <h3 className="text-lg font-medium flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Error
                        </h3>
                        <p>{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                            className="mt-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                            className="mr-3"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
                            {invoice && (
                                <p className="text-gray-500">
                                    For Invoice #{invoice.invoiceNumber} - {invoice.customer.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Invoice Summary (if an invoice is selected) */}
                        {invoice && (
                            <div className="bg-gray-50 p-4 rounded-md mb-6">
                                <h3 className="font-medium text-gray-700 mb-3">Invoice Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Invoice Number</p>
                                        <p className="font-medium">{invoice.invoiceNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Customer</p>
                                        <p className="font-medium">{invoice.customer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Total Amount</p>
                                        <p className="font-medium">{formatCurrency(invoice.total)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Amount Paid</p>
                                        <p className="font-medium">{formatCurrency(paidAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Remaining Balance</p>
                                        <p className="font-medium text-red-600">{formatCurrency(remainingBalance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Status</p>
                                        <p className="font-medium">{invoice.status}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Details */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Payment Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={payment.amount}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        placeholder="0.00"
                                        required
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="paymentDate"
                                        value={payment.paymentDate}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Method <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="paymentMethod"
                                        value={payment.paymentMethod}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        required
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Check">Check</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Online Payment">Online Payment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reference Number
                                    </label>
                                    <input
                                        type="text"
                                        name="referenceNumber"
                                        value={payment.referenceNumber}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        placeholder="Check number, transaction ID, etc."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={payment.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                placeholder="Optional notes about this payment..."
                            ></textarea>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isSubmitting}
                                disabled={!invoice || payment.amount <= 0}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Record Payment
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
} 