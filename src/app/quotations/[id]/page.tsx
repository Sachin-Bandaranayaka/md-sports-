'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Copy, Download, FileText, Calendar, User, Tag } from 'lucide-react';
import { SalesQuotation } from '@/types';

// Status badge colors
const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-blue-100 text-blue-800';
        case 'accepted':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        case 'expired':
            return 'bg-gray-100 text-black';
        default:
            return 'bg-gray-100 text-black';
    }
};

export default function ViewQuotation() {
    const router = useRouter();
    const params = useParams();
    const quotationId = params.id as string;

    const [quotation, setQuotation] = useState<SalesQuotation | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch quotation
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch the quotation
                const quotationResponse = await fetch(`/api/quotations/${quotationId}`);
                if (!quotationResponse.ok) {
                    throw new Error('Failed to fetch quotation');
                }
                const quotationData = await quotationResponse.json();
                setQuotation(quotationData);

                setError(null);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [quotationId]);

    const handleDuplicateQuotation = async () => {
        if (!quotation) return;

        try {
            // Create a copy of the quotation without the id and with a new date
            const { id: _id, quotationNumber: _quotationNumber, createdAt: _createdAt, updatedAt: _updatedAt, ...quotationData } = quotation;

            const duplicatedQuotation = {
                ...quotationData,
                date: new Date().toISOString().split('T')[0],
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending'
            };

            const response = await fetch('/api/quotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(duplicatedQuotation)
            });

            if (!response.ok) {
                throw new Error('Failed to duplicate quotation');
            }

            const newQuotation = await response.json();
            router.push(`/quotations/${newQuotation.id}`);
            alert('Quotation duplicated successfully!');
        } catch (err) {
            console.error('Error duplicating quotation:', err);
            alert('Failed to duplicate quotation. Please try again.');
        }
    };

    const handlePrintQuotation = () => {
        window.print();
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-black">Quotation Details</h1>
                        <p className="text-black">View and manage quotation information</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/quotations')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Quotations
                        </Button>
                    </div>
                </div>

                {/* Loading and error states */}
                {loading ? (
                    <div className="text-center py-4">
                        <p className="text-black">Loading data...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-4">
                        <p className="text-red-500">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="mt-2"
                        >
                            Retry
                        </Button>
                    </div>
                ) : quotation ? (
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/quotations/${quotationId}/edit`)}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDuplicateQuotation}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrintQuotation}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Print / Download
                            </Button>
                        </div>

                        {/* Quotation Header */}
                        <div className="flex flex-col md:flex-row justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-black mb-1">
                                    Quotation #{quotation.quotationNumber}
                                </h2>
                                <div className="flex items-center mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(quotation.status)}`}>
                                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <div className="flex items-center text-black mb-1">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>Created: {new Date(quotation.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-black">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>Expires: {new Date(quotation.expiryDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-black mb-2">Customer Information</h3>
                            <div className="p-4 bg-white rounded border border-gray-200">
                                <div className="flex items-start">
                                    <User className="w-5 h-5 mr-2 text-black" />
                                    <div>
                                        <p className="font-medium text-black">{quotation.customerName}</p>
                                        <p className="text-black">Customer ID: {quotation.customerId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-black mb-2">Items</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-3 text-left text-black font-medium">Product</th>
                                            <th className="p-3 text-left text-black font-medium">Quantity</th>
                                            <th className="p-3 text-right text-black font-medium">Unit Price</th>
                                            <th className="p-3 text-right text-black font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotation.items.map((item, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-3 text-black">
                                                    <div>
                                                        <p className="font-medium">{item.productName}</p>
                                                        <p className="text-sm">{item.productId}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-black">{item.quantity}</td>
                                                <td className="p-3 text-right text-black">{item.unitPrice.toLocaleString()}</td>
                                                <td className="p-3 text-right text-black font-medium">{item.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex flex-col items-end mb-8">
                            <div className="w-full md:w-1/3 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-black">Subtotal:</span>
                                    <span className="text-black font-medium">{quotation.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black">Tax (17%):</span>
                                    <span className="text-black font-medium">{quotation.tax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black">Discount:</span>
                                    <span className="text-black font-medium">{quotation.discount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="text-black font-bold">Total:</span>
                                    <span className="text-black font-bold">{quotation.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {quotation.notes && (
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-black mb-2">Notes</h3>
                                <div className="p-4 bg-white rounded border border-gray-200">
                                    <div className="flex items-start">
                                        <FileText className="w-5 h-5 mr-2 text-black" />
                                        <p className="text-black whitespace-pre-wrap">{quotation.notes}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-black">Quotation not found</p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 