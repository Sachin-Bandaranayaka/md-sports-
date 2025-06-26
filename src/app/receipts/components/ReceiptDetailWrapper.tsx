'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ArrowLeft, Printer, Edit, Save, X, FileText, User, CreditCard, Calendar, Hash, Building, Phone, Mail, MapPin } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

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
        account: {
            id: number;
            name: string;
        } | null;
    };
    confirmedByUser: {
        id: number;
        name: string;
    } | null;
}

interface ReceiptDetailWrapperProps {
    receipt: ReceiptData;
}

export default function ReceiptDetailWrapper({ receipt: initialReceipt }: ReceiptDetailWrapperProps) {
    const router = useRouter();
    const [receipt, setReceipt] = useState<ReceiptData>(initialReceipt);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper function to format date for input
    const formatDateForInput = (date: string | Date): string => {
        if (!date) return '';
        
        // If it's already a string, check if it's in ISO format
        if (typeof date === 'string') {
            // If it includes 'T', it's likely an ISO string
            if (date.includes('T')) {
                return date.substring(0, 10);
            }
            // Otherwise, assume it's already in YYYY-MM-DD format
            return date;
        }
        
        // If it's a Date object, convert to YYYY-MM-DD
        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        // Fallback: try to parse it as a date
        try {
            const parsedDate = new Date(date);
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    };

    // Helper function to format address
    const formatAddress = (address: string | null): string => {
        if (!address) return 'N/A';
        
        // Try to parse as JSON
        try {
            const parsedAddress = JSON.parse(address);
            const parts = [];
            
            if (parsedAddress.mainAddress && parsedAddress.mainAddress.trim()) {
                parts.push(parsedAddress.mainAddress);
            }
            if (parsedAddress.city && parsedAddress.city.trim()) {
                parts.push(parsedAddress.city);
            }
            if (parsedAddress.postalCode && parsedAddress.postalCode.trim()) {
                parts.push(parsedAddress.postalCode);
            }
            if (parsedAddress.contactPerson && parsedAddress.contactPerson.trim()) {
                parts.push(`Contact: ${parsedAddress.contactPerson}`);
            }
            
            return parts.length > 0 ? parts.join(', ') : 'N/A';
        } catch {
            // If not JSON, return as is
            return address.trim() || 'N/A';
        }
    };

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

    const handlePrintView = () => {
        // Open the printable version in a new tab
        window.open(`/receipts/${receipt.id}/print`, '_blank');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-primary" />
                        Receipt Details
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Receipt #{receipt.receiptNumber} • Invoice #{receipt.payment.invoice.invoiceNumber}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/receipts')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Receipts
                    </Button>
                    {!isEditing && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrintView}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Receipt
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
                                Save Changes
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Receipt Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Receipt Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Hash className="w-5 h-5 text-primary" />
                            Receipt Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Receipt Number
                                </label>
                                <p className="text-lg font-semibold text-gray-900">{receipt.receiptNumber}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Receipt Date
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        name="receiptDate"
                                        value={formatDateForInput(receipt.receiptDate)}
                                        onChange={handleInputChange}
                                        className="w-full"
                                    />
                                ) : (
                                    <p className="text-lg font-semibold text-gray-900">{formatDate(receipt.receiptDate)}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Invoice Number
                                </label>
                                <p className="text-lg font-semibold text-primary">{receipt.payment.invoice.invoiceNumber}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount Paid
                                </label>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(receipt.payment.amount)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            Payment Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <p className="text-gray-900 font-medium">{receipt.payment.paymentMethod}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account
                                </label>
                                <p className="text-gray-900 font-medium">{receipt.payment.account?.name || 'N/A'}</p>
                            </div>
                            {receipt.payment.referenceNumber && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reference Number
                                    </label>
                                    <p className="text-gray-900 font-medium">{receipt.payment.referenceNumber}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bank Name
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="text"
                                        name="bankName"
                                        value={receipt.bankName || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter bank name"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-medium">{receipt.bankName || 'N/A'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account Number
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="text"
                                        name="accountNumber"
                                        value={receipt.accountNumber || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter account number"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-medium">{receipt.accountNumber || 'N/A'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cheque Number
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="text"
                                        name="chequeNumber"
                                        value={receipt.chequeNumber || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter cheque number"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-medium">{receipt.chequeNumber || 'N/A'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transaction ID
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="text"
                                        name="transactionId"
                                        value={receipt.transactionId || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter transaction ID"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-medium">{receipt.transactionId || 'N/A'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Notes
                        </h2>
                        {isEditing ? (
                            <Textarea
                                name="notes"
                                value={receipt.notes || ''}
                                onChange={handleInputChange}
                                placeholder="Enter notes about this payment"
                                rows={4}
                                className="w-full"
                            />
                        ) : (
                            <p className="text-gray-700">{receipt.notes || 'No notes provided'}</p>
                        )}
                    </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Customer Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name
                                </label>
                                <p className="text-gray-900 font-medium">{receipt.payment.customer.name}</p>
                            </div>
                            {receipt.payment.customer.email && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </label>
                                    <p className="text-gray-900">{receipt.payment.customer.email}</p>
                                </div>
                            )}
                            {receipt.payment.customer.phone && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        Phone
                                    </label>
                                    <p className="text-gray-900">{receipt.payment.customer.phone}</p>
                                </div>
                            )}
                            {receipt.payment.customer.address && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        Address
                                    </label>
                                    <p className="text-gray-900">{formatAddress(receipt.payment.customer.address)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* System Information */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary" />
                            System Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirmed By
                                </label>
                                <p className="text-gray-900 font-medium">{receipt.confirmedByUser?.name || 'System'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Created Date
                                </label>
                                <p className="text-gray-900">{formatDate(receipt.createdAt)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment ID
                                </label>
                                <p className="text-gray-900 font-mono text-sm">{receipt.paymentId}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}