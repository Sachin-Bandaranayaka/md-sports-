'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, FileText, ExternalLink } from 'lucide-react';
import { SalesQuotation } from '@/types';
import { useRouter } from 'next/navigation';

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

const getExpiryCountdown = (expiryDate?: string, status?: string): string => {
    if (status && ['expired', 'accepted', 'rejected'].includes(status.toLowerCase())) {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    if (!expiryDate) {
        return 'No expiry date';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return 'Expired'; // Should be handled by status, but as a fallback
    }
    if (diffDays === 0) {
        return 'Expires today';
    }
    if (diffDays === 1) {
        return 'Expires in 1 day';
    }
    return `Expires in ${diffDays} days`;
};

export default function Quotations() {
    const router = useRouter();
    const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch quotations from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch quotations
                const quotationsResponse = await fetch('/api/quotations');
                if (!quotationsResponse.ok) {
                    throw new Error('Failed to fetch quotations');
                }
                const apiQuotations = await quotationsResponse.json();

                // Transform API data to match SalesQuotation frontend type
                const transformedQuotations = apiQuotations.map((q: any) => ({
                    ...q,
                    customerName: q.customer?.name || 'N/A', // Map from nested customer object
                    date: q.createdAt, // Use createdAt for the main 'date'
                    expiryDate: q.validUntil, // Map validUntil to expiryDate
                    // Ensure all fields from SalesQuotation are present, copying from q
                    // id, quotationNumber, customerId, items, subtotal, tax, discount, total, notes, status, createdAt are already in q
                }));

                setQuotations(transformedQuotations);

                setError(null);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter quotations based on search term
    const filteredQuotations = quotations.filter((quotation) =>
        quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quotation.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddQuotation = () => {
        router.push('/quotations/create');
    };

    const handleEditQuotation = (quotation: SalesQuotation) => {
        router.push(`/quotations/${quotation.id}/edit`);
    };

    const handleViewQuotation = (quotation: SalesQuotation) => {
        router.push(`/quotations/${quotation.id}`);
    };

    const handleDuplicateQuotation = async (quotation: SalesQuotation) => {
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
            setQuotations([...quotations, newQuotation]);

            alert('Quotation duplicated successfully!');
        } catch (err) {
            console.error('Error duplicating quotation:', err);
            alert('Failed to duplicate quotation. Please try again.');
        }
    };

    const handleDeleteQuotation = async (id: string) => {
        if (confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/quotations/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete quotation');
                }

                setQuotations(quotations.filter(quotation => quotation.id !== id));
            } catch (err) {
                console.error('Error deleting quotation:', err);
                alert('Failed to delete quotation. Please try again.');
            }
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-black">Sales Quotations</h1>
                        <p className="text-black">Manage your sales quotations and customer proposals</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" size="sm" onClick={handleAddQuotation}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Quotation
                        </Button>
                    </div>
                </div>

                {/* Search bar */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-black" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                            placeholder="Search quotations by number, customer or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Loading and error states */}
                {loading && (
                    <div className="text-center py-4">
                        <p className="text-black">Loading quotations...</p>
                    </div>
                )}

                {error && (
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
                )}

                {/* Quotations table */}
                {!loading && !error && (
                    <>
                        {filteredQuotations.length === 0 ? (
                            <div className="text-center py-8 bg-tertiary rounded-lg">
                                <FileText className="mx-auto h-12 w-12 text-black opacity-40" />
                                <h3 className="mt-2 text-lg font-medium text-black">No quotations found</h3>
                                <p className="mt-1 text-black">
                                    {searchTerm ? 'Try adjusting your search term' : 'Create your first quotation to get started'}
                                </p>
                                {!searchTerm && (
                                    <div className="mt-6">
                                        <Button variant="primary" size="sm" onClick={handleAddQuotation}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Quotation
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto bg-tertiary rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                                Quotation #
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredQuotations.map((quotation) => (
                                            <tr key={quotation.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={() => handleViewQuotation(quotation)}
                                                            className="text-primary hover:text-primary-dark font-medium"
                                                        >
                                                            {quotation.quotationNumber}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-black">{quotation.customerName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-black">
                                                        {new Date(quotation.date).toLocaleDateString()}
                                                    </div>
                                                    {(() => {
                                                        const expiryText = getExpiryCountdown(quotation.expiryDate, quotation.status);
                                                        let textColorClass = 'text-black font-normal'; // Default class

                                                        if (expiryText === 'Expires today' || expiryText === 'Expires in 1 day') {
                                                            textColorClass = 'text-orange-600 font-medium';
                                                        } else if (expiryText.startsWith('Expires in')) { // Covers > 1 day
                                                            textColorClass = 'text-green-600 font-medium';
                                                        } else if (expiryText === 'Expired') { // Covers "Expired" from date calc or status
                                                            textColorClass = 'text-red-700 font-medium';
                                                        } else if (expiryText === 'No expiry date') {
                                                            textColorClass = 'text-gray-500 font-normal';
                                                        }
                                                        // For "Accepted", "Rejected" from status, they will take text-black font-normal (default)

                                                        return (
                                                            <div className={`text-sm ${textColorClass}`}>
                                                                {expiryText}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-black">
                                                        {quotation.total.toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(quotation.status)}`}>
                                                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleViewQuotation(quotation)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="View"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditQuotation(quotation)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteQuotation(quotation.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </MainLayout>
    );
} 