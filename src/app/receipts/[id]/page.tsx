'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { useReactToPrint } from 'react-to-print';

interface Receipt {
    id: number;
    receiptNumber: string;
    receiptDate: string;
    bankName: string | null;
    accountNumber: string | null;
    chequeNumber: string | null;
    transactionId: string | null;
    notes: string | null;
    confirmedBy: number | null;
    createdAt: string;
    payment: {
        amount: number;
        paymentMethod: string;
        referenceNumber: string | null;
        invoice: {
            id: number;
            invoiceNumber: string;
            total: number;
            status: string;
        };
        customer: {
            id: number;
            name: string;
            email: string | null;
            phone: string | null;
            address: string | null;
        };
    };
    confirmedByUser: {
        name: string;
    } | null;
}

export default function ReceiptDetail() {
    const router = useRouter();
    const params = useParams();
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: receipt ? `Receipt-${receipt.receiptNumber}` : 'Receipt',
    });

    useEffect(() => {
        if (!params.id) return;

        const fetchReceipt = async () => {
            try {
                const response = await fetch(`/api/receipts/${params.id}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch receipt: ${response.statusText}`);
                }
                const data = await response.json();
                setReceipt(data);
            } catch (err) {
                console.error('Error fetching receipt:', err);
                setError(err instanceof Error ? err.message : 'Failed to load receipt');
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [params.id]);

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
                            onClick={() => router.push('/receipts')}
                            className="mt-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Return to Receipts
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!receipt) {
        return (
            <MainLayout>
                <div className="max-w-3xl mx-auto py-6">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                        <h3 className="text-lg font-medium">Receipt Not Found</h3>
                        <p>The requested receipt could not be found.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/receipts')}
                            className="mt-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Return to Receipts
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
                        <h1 className="text-2xl font-bold text-gray-900">Receipt #{receipt.receiptNumber}</h1>
                        <p className="text-gray-500">
                            For Invoice #{receipt.payment.invoice.invoiceNumber}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/receipts')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </div>

                {/* Printable Receipt */}
                <div ref={printRef} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">RECEIPT</h2>
                                <p className="text-gray-500">#{receipt.receiptNumber}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-lg font-bold text-gray-900">Your Company Name</h3>
                                <p className="text-gray-500">your@email.com</p>
                                <p className="text-gray-500">Your Address</p>
                                <p className="text-gray-500">Phone: Your Phone</p>
                            </div>
                        </div>

                        {/* Receipt Details */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Receipt To:</h4>
                                <div className="text-gray-900">
                                    <p className="font-medium">{receipt.payment.customer.name}</p>
                                    {receipt.payment.customer.address && <p>{receipt.payment.customer.address}</p>}
                                    {receipt.payment.customer.email && <p>Email: {receipt.payment.customer.email}</p>}
                                    {receipt.payment.customer.phone && <p>Phone: {receipt.payment.customer.phone}</p>}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Receipt Details:</h4>
                                <div className="grid grid-cols-2 text-black">
                                    <p>Receipt Number:</p>
                                    <p className="font-medium">{receipt.receiptNumber}</p>

                                    <p>Receipt Date:</p>
                                    <p className="font-medium">{formatDate(receipt.receiptDate)}</p>

                                    <p>Invoice Number:</p>
                                    <p className="font-medium">{receipt.payment.invoice.invoiceNumber}</p>

                                    <p>Payment Method:</p>
                                    <p className="font-medium">{receipt.payment.paymentMethod}</p>

                                    {receipt.payment.referenceNumber && (
                                        <>
                                            <p>Reference Number:</p>
                                            <p className="font-medium">{receipt.payment.referenceNumber}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="mt-8">
                            <h4 className="font-medium text-gray-700 mb-4 border-b pb-2">Payment Details</h4>
                            <div className="flex justify-between py-3 border-b">
                                <span className="text-gray-700">Amount Paid:</span>
                                <span className="font-semibold text-black">{formatCurrency(receipt.payment.amount)}</span>
                            </div>

                            {receipt.bankName && (
                                <div className="flex justify-between py-3 border-b">
                                    <span className="text-gray-700">Bank Name:</span>
                                    <span className="font-medium text-black">{receipt.bankName}</span>
                                </div>
                            )}

                            {receipt.accountNumber && (
                                <div className="flex justify-between py-3 border-b">
                                    <span className="text-gray-700">Account Number:</span>
                                    <span className="font-medium text-black">{receipt.accountNumber}</span>
                                </div>
                            )}

                            {receipt.chequeNumber && (
                                <div className="flex justify-between py-3 border-b">
                                    <span className="text-gray-700">Cheque Number:</span>
                                    <span className="font-medium text-black">{receipt.chequeNumber}</span>
                                </div>
                            )}

                            {receipt.transactionId && (
                                <div className="flex justify-between py-3 border-b">
                                    <span className="text-gray-700">Transaction ID:</span>
                                    <span className="font-medium text-black">{receipt.transactionId}</span>
                                </div>
                            )}
                        </div>

                        {/* Confirmation */}
                        <div className="mt-8 pt-6 border-t">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Confirmed By:</h4>
                                    <p className="text-black text-sm">{receipt.confirmedByUser?.name || 'System'}</p>
                                    <p className="text-gray-500 text-sm">Date: {formatDate(receipt.createdAt)}</p>
                                </div>
                                <div>
                                    {receipt.notes && (
                                        <>
                                            <h4 className="font-medium text-gray-700 mb-2">Notes:</h4>
                                            <p className="text-black text-sm">{receipt.notes}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 pt-6 border-t text-center">
                            <p className="text-gray-500 text-sm">Thank you for your business!</p>
                            <p className="text-gray-500 text-sm">This receipt was generated electronically and is valid without a signature.</p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 