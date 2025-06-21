'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Copy, Download, Calendar, User, FileText, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import QuotationTemplate from '@/components/templates/QuotationTemplate';
import { SalesQuotation } from '@/types';
import { usePermission } from '@/hooks/usePermission';



export default function ViewQuotation() {
    const router = useRouter();
    const params = useParams();
    const quotationId = params.id as string;
    const { canViewQuotations, canEditQuotations } = usePermission();

    const [quotation, setQuotation] = useState<SalesQuotation | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Check if user has permission to view quotations
    if (!canViewQuotations()) {
        return (
            <MainLayout>
                <div className="p-6">
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">You don't have permission to view quotations.</p>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => router.push('/quotations')}
                            className="mt-4"
                        >
                            Back to Quotations
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

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
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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

    const handlePrintQuotation = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Quotation-${quotation?.quotationNumber}`,
        onAfterPrint: () => console.log('Printed successfully'),
    });

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
                            {canEditQuotations() && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/quotations/${quotationId}/edit`)}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}
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
                                onClick={() => {
                                    if (printRef.current) {
                                        handlePrintQuotation();
                                    } else {
                                        console.error("Attempted to print but printRef.current is null. This should not happen if the button is correctly disabled.");
                                        // Optionally, you could alert the user or show a more formal notification
                                        alert("Cannot print: a required component reference is missing. Please try reloading the page.");
                                    }
                                }}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Print / Download
                            </Button>
                        </div>

                        {/* Display Quotation Template */}
                        <QuotationTemplate 
                            quotation={{
                                quotationNumber: quotation.quotationNumber,
                                customerName: quotation.customer?.name || 'N/A',
                                customerId: quotation.customerId,
                                date: quotation.createdAt || new Date().toISOString(),
                                expiryDate: quotation.validUntil || new Date().toISOString(),
                                items: quotation.items.map(item => ({
                                    id: item.id,
                                    productId: item.product?.sku || 'N/A',
                                    productName: item.product?.name || 'N/A',
                                    quantity: item.quantity,
                                    unitPrice: item.price || 0,
                                    total: item.total || 0
                                })),
                                subtotal: quotation.total || 0,
                                discount: 0,
                                tax: 0,
                                total: quotation.total || 0,
                                notes: '',
                                termsAndConditions: 'Thank you for your business. This quotation is valid for 30 days from the issue date.'
                            }}
                        />
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-black">Quotation not found</p>
                    </div>
                )}

                {/* Printable Quotation */}
                {quotation && (
                    <div ref={printRef} className="hidden print:block">
                        <QuotationTemplate 
                            quotation={{
                                quotationNumber: quotation.quotationNumber,
                                customerName: quotation.customer?.name || 'N/A',
                                customerId: quotation.customerId,
                                date: quotation.createdAt || new Date().toISOString(),
                                expiryDate: quotation.validUntil || new Date().toISOString(),
                                items: quotation.items.map(item => ({
                                    id: item.id,
                                    productId: item.product?.sku || 'N/A',
                                    productName: item.product?.name || 'N/A',
                                    quantity: item.quantity,
                                    unitPrice: item.price || 0,
                                    total: item.total || 0
                                })),
                                subtotal: quotation.total || 0,
                                discount: 0,
                                tax: 0,
                                total: quotation.total || 0,
                                notes: '',
                                termsAndConditions: 'Thank you for your business. This quotation is valid for 30 days from the issue date.'
                            }}
                        />
                    </div>
                )}
            </div>
        </MainLayout>
    );
}