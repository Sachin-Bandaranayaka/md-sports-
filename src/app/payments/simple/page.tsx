'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function SimplePaymentForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('invoiceId');

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invoice, setInvoice] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [paymentData, setPaymentData] = useState({
        amount: '',
        paymentMethod: 'Cash',
        referenceNumber: '',
        receiptDate: new Date().toISOString().split('T')[0],
        bankName: '',
        accountNumber: '',
        chequeNumber: '',
        transactionId: '',
        notes: ''
    });

    useEffect(() => {
        if (!invoiceId) {
            setIsLoading(false);
            setError('No invoice ID provided');
            return;
        }

        async function fetchInvoice() {
            try {
                const response = await fetch(`/api/invoices/${invoiceId}`);
                if (!response.ok) throw new Error('Failed to fetch invoice');

                const data = await response.json();
                setInvoice(data);

                // Calculate remaining amount
                const totalPaid = data.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                const remainingAmount = data.total - totalPaid;

                setPaymentData(prev => ({
                    ...prev,
                    amount: remainingAmount > 0 ? remainingAmount.toString() : data.total.toString()
                }));

                setIsLoading(false);
            } catch (err) {
                console.error('Error:', err);
                setError('Failed to load invoice');
                setIsLoading(false);
            }
        }

        fetchInvoice();
    }, [invoiceId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Create payment
            const paymentResponse = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: Number(invoiceId),
                    customerId: invoice.customerId,
                    amount: parseFloat(paymentData.amount),
                    paymentMethod: paymentData.paymentMethod,
                    referenceNumber: paymentData.referenceNumber || null,
                }),
            });

            if (!paymentResponse.ok) throw new Error('Failed to record payment');

            const payment = await paymentResponse.json();

            // 2. Create receipt
            const receiptResponse = await fetch('/api/receipts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId: payment.data.id,
                    receiptDate: paymentData.receiptDate,
                    bankName: paymentData.bankName || null,
                    accountNumber: paymentData.accountNumber || null,
                    chequeNumber: paymentData.chequeNumber || null,
                    transactionId: paymentData.transactionId || null,
                    notes: paymentData.notes || null,
                }),
            });

            if (!receiptResponse.ok) throw new Error('Payment recorded but failed to create receipt');

            const receiptData = await receiptResponse.json();

            alert(`Payment successfully recorded and receipt generated (${receiptData.receiptNumber}). The invoice has been marked as Paid.`);
            router.push(`/invoices/${invoiceId}`);

        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Failed to process payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const showBankFields = paymentData.paymentMethod === 'Bank Transfer';
    const showChequeFields = paymentData.paymentMethod === 'Cheque';
    const showCardFields = paymentData.paymentMethod === 'Card';

    if (isLoading) {
        return (
            <MainLayout>
                <div className="container max-w-md mx-auto py-8 px-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10"></div>
                            <h1 className="text-xl font-bold">Loading Payment Form</h1>
                        </div>
                        <div className="flex justify-center py-12">
                            <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="container max-w-md mx-auto py-8 px-4">
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                        <h3 className="text-lg font-medium flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Error
                        </h3>
                        <p>{error}</p>
                        <button
                            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                            onClick={() => router.back()}
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container max-w-md mx-auto py-8 px-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-6">
                        <button
                            className="mr-4 p-2 rounded-full hover:bg-gray-100"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold">Record Payment</h1>
                    </div>

                    {invoice && (
                        <div className="bg-gray-50 p-4 rounded mb-6">
                            <h3 className="font-medium mb-2">Invoice #{invoice.invoiceNumber}</h3>
                            <p className="text-sm text-gray-600">Customer: {invoice.customer?.name}</p>
                            <p className="text-sm text-gray-600">Total: ${invoice.total?.toFixed(2)}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                                type="number"
                                name="amount"
                                value={paymentData.amount}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                required
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <select
                                name="paymentMethod"
                                value={paymentData.paymentMethod}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                required
                            >
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                            <input
                                type="text"
                                name="referenceNumber"
                                value={paymentData.referenceNumber}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder="Optional"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Date</label>
                            <input
                                type="date"
                                name="receiptDate"
                                value={paymentData.receiptDate}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                required
                            />
                        </div>

                        {showBankFields && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={paymentData.bankName}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={paymentData.accountNumber}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                                    <input
                                        type="text"
                                        name="transactionId"
                                        value={paymentData.transactionId}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                            </>
                        )}

                        {showChequeFields && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={paymentData.bankName}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number</label>
                                    <input
                                        type="text"
                                        name="chequeNumber"
                                        value={paymentData.chequeNumber}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                            </>
                        )}

                        {showCardFields && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                                <input
                                    type="text"
                                    name="transactionId"
                                    value={paymentData.transactionId}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={paymentData.notes}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className={cn(
                                    "w-full py-2 px-4 rounded font-medium text-white bg-indigo-600 hover:bg-indigo-700",
                                    isSubmitting && "opacity-70 cursor-not-allowed"
                                )}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Processing..." : "Record Payment"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
} 