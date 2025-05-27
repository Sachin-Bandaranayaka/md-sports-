'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ArrowLeft, Printer, Edit, Save, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useReactToPrint } from 'react-to-print';

interface ReceiptData {
    id: number;
    receiptNumber: string;
    receiptDate: string;
    bankName: string | null;
    accountNumber: string | null;
    chequeNumber: string | null;
    transactionId: string | null;
    notes: string | null;
    paymentId: number;
    confirmedBy: number | null;
    createdAt: string;
    payment: {
        id: number;
        amount: number;
        paymentMethod: string;
        referenceNumber: string | null;
        invoice: {
            id: number;
            invoiceNumber: string;
            items: any[];
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
        id: number;
        name: string;
    } | null;
}

interface ReceiptClientWrapperProps {
    receipt: ReceiptData;
}

export default function ReceiptClientWrapper({ receipt: initialReceipt }: ReceiptClientWrapperProps) {
    const router = useRouter();
    const [receipt, setReceipt] = useState<ReceiptData>(initialReceipt);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Receipt-${receipt.receiptNumber}`,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReceipt((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/receipts/${receipt.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiptDate: receipt.receiptDate,
                    bankName: receipt.bankName,
                    accountNumber: receipt.accountNumber,
                    chequeNumber: receipt.chequeNumber,
                    transactionId: receipt.transactionId,
                    notes: receipt.notes
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update receipt');
            }

            const updatedReceipt = await response.json();
            setReceipt(updatedReceipt);
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating receipt:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while updating the receipt');
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEdit = () => {
        setReceipt(initialReceipt);
        setIsEditing(false);
        setError(null);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
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
                    {!isEditing && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        </>
                    )}
                    {isEditing && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEdit}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                isLoading={isSaving}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p>{error}</p>
                </div>
            )}

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
                            <h3 className="text-lg font-bold text-gray-900">MS Sports</h3>
                            <p className="text-gray-500">support@mssports.com</p>
                            <p className="text-gray-500">123 Sports Ave, City</p>
                            <p className="text-gray-500">Phone: (123) 456-7890</p>
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
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        name="receiptDate"
                                        value={receipt.receiptDate.substring(0, 10)}
                                        onChange={handleInputChange}
                                        className="h-8 text-sm"
                                    />
                                ) : (
                                    <p className="font-medium">{formatDate(receipt.receiptDate)}</p>
                                )}

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

                        <div className="flex justify-between py-3 border-b">
                            <span className="text-gray-700">Bank Name:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    name="bankName"
                                    value={receipt.bankName || ''}
                                    onChange={handleInputChange}
                                    className="w-1/2 h-8 text-sm"
                                    placeholder="Enter bank name"
                                />
                            ) : (
                                <span className="font-medium text-black">{receipt.bankName || 'N/A'}</span>
                            )}
                        </div>

                        <div className="flex justify-between py-3 border-b">
                            <span className="text-gray-700">Account Number:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    name="accountNumber"
                                    value={receipt.accountNumber || ''}
                                    onChange={handleInputChange}
                                    className="w-1/2 h-8 text-sm"
                                    placeholder="Enter account number"
                                />
                            ) : (
                                <span className="font-medium text-black">{receipt.accountNumber || 'N/A'}</span>
                            )}
                        </div>

                        <div className="flex justify-between py-3 border-b">
                            <span className="text-gray-700">Cheque Number:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    name="chequeNumber"
                                    value={receipt.chequeNumber || ''}
                                    onChange={handleInputChange}
                                    className="w-1/2 h-8 text-sm"
                                    placeholder="Enter cheque number"
                                />
                            ) : (
                                <span className="font-medium text-black">{receipt.chequeNumber || 'N/A'}</span>
                            )}
                        </div>

                        <div className="flex justify-between py-3 border-b">
                            <span className="text-gray-700">Transaction ID:</span>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    name="transactionId"
                                    value={receipt.transactionId || ''}
                                    onChange={handleInputChange}
                                    className="w-1/2 h-8 text-sm"
                                    placeholder="Enter transaction ID"
                                />
                            ) : (
                                <span className="font-medium text-black">{receipt.transactionId || 'N/A'}</span>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-8 pt-6 border-t">
                        <h4 className="font-medium text-gray-700 mb-2">Notes:</h4>
                        {isEditing ? (
                            <Textarea
                                name="notes"
                                value={receipt.notes || ''}
                                onChange={handleInputChange}
                                className="w-full"
                                placeholder="Enter notes about this payment"
                                rows={3}
                            />
                        ) : (
                            <p className="text-black text-sm">{receipt.notes || 'No notes provided'}</p>
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
    );
} 