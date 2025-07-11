'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, FileText, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { SalesQuotation } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';

const getExpiryCountdown = (expiryDate?: string): string => {
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
        return 'Expired';
    }
    if (diffDays === 0) {
        return 'Expires today';
    }
    if (diffDays === 1) {
        return 'Expires in 1 day';
    }
    return `Expires in ${diffDays} days`;
}

export default function Quotations() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoading: authLoading, accessToken } = useAuth();
    const { canViewQuotations, canCreateQuotations, canEditQuotations } = usePermission();
    const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Initialize URL parameters
    useEffect(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const search = searchParams.get('search') || '';
        
        setCurrentPage(page);
        setSearchTerm(search);
    }, [searchParams]);

    // Fetch quotations from API
    useEffect(() => {
        // Wait for auth to load before checking permissions
        if (authLoading) {
            return;
        }

        // No need to fetch if the user can't view quotations anyway
        if (!canViewQuotations()) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                // Build query parameters
                const queryParams = new URLSearchParams();
                queryParams.set('page', currentPage.toString());
                queryParams.set('limit', '15');
                
                if (searchTerm.trim()) {
                    queryParams.set('search', searchTerm.trim());
                }

                // Fetch quotations with pagination
                const quotationsResponse = await fetch(`/api/quotations?${queryParams.toString()}`, {
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('[Quotations Page] API Response status:', quotationsResponse.status);
                
                if (!quotationsResponse.ok) {
                    throw new Error('Failed to fetch quotations');
                }
                
                const apiResponse = await quotationsResponse.json();
                console.log('[Quotations Page] API Response:', apiResponse);

                // Handle new API response format with pagination
                const apiQuotations = apiResponse.quotations || apiResponse; // Fallback for backward compatibility
                const pagination = apiResponse.pagination;

                if (pagination) {
                    setTotalPages(pagination.totalPages);
                    setTotalCount(pagination.totalCount);
                    console.log(`[Quotations Page] Pagination: page ${pagination.page} of ${pagination.totalPages}, total ${pagination.totalCount}`);
                }

                // Transform API data to match SalesQuotation frontend type
                const transformedQuotations = apiQuotations.map((q: any) => ({
                    ...q,
                    customerName: q.customer?.name || 'N/A', // Map from nested customer object
                    date: q.createdAt, // Use createdAt for the main 'date'
                    expiryDate: q.validUntil, // Map validUntil to expiryDate
                    // Ensure all fields from SalesQuotation are present, copying from q
                    // id, quotationNumber, customerId, items, subtotal, tax, discount, total, notes, status, createdAt are already in q
                }));

                console.log('[Quotations Page] Transformed quotations:', transformedQuotations);
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
    }, [authLoading, accessToken, currentPage, searchTerm]); // Depend on pagination and search state

    // Pagination handlers
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        
        setCurrentPage(newPage);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/quotations?${params.toString()}`);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams();
            if (searchTerm.trim()) {
                params.set('search', searchTerm.trim());
            }
            params.set('page', '1'); // Reset to first page on new search
            
            // Only update URL if search term has actually changed
            const currentSearch = searchParams.get('search') || '';
            if (currentSearch !== searchTerm.trim()) {
                router.push(`/quotations?${params.toString()}`);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, router, searchParams]);

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
            const { id: _id, quotationNumber: _quotationNumber, createdAt: _createdAt, ...quotationData } = quotation;

            const duplicatedQuotation = {
                ...quotationData,
                date: new Date().toISOString().split('T')[0],
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };

            const response = await fetch('/api/quotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                credentials: 'include',
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
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
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

    // Check if user has permission to view quotations AFTER all hooks have been called
    // Show loading while auth is still loading
    if (authLoading) {
        return (
            <MainLayout>
                <div className="p-6">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!canViewQuotations()) {
        return (
            <MainLayout>
                <div className="p-6">
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">You don't have permission to view quotations.</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

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
                        {canCreateQuotations() && (
                            <Button variant="primary" size="sm" onClick={handleAddQuotation}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Quotation
                            </Button>
                        )}
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
                            onChange={(e) => handleSearchChange(e.target.value)}
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
                        {quotations.length === 0 ? (
                            <div className="text-center py-8 bg-tertiary rounded-lg">
                                <FileText className="mx-auto h-12 w-12 text-black opacity-40" />
                                <h3 className="mt-2 text-lg font-medium text-black">No quotations found</h3>
                                <p className="mt-1 text-black">
                                    {searchTerm ? 'Try adjusting your search term' : 'Create your first quotation to get started'}
                                </p>
                                {!searchTerm && canCreateQuotations() && (
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
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {quotations.map((quotation: SalesQuotation) => (
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
                                                        const expiryText = getExpiryCountdown(quotation.expiryDate);
                                                        let textColorClass = 'text-black font-normal'; // Default class

                                                        if (expiryText === 'Expires today' || expiryText === 'Expires in 1 day') {
                                                            textColorClass = 'text-orange-600 font-medium';
                                                        } else if (expiryText.startsWith('Expires in')) { // Covers > 1 day
                                                            textColorClass = 'text-green-600 font-medium';
                                                        } else if (expiryText === 'Expired') {
                                                            textColorClass = 'text-red-700 font-medium';
                                                        } else if (expiryText === 'No expiry date') {
                                                            textColorClass = 'text-gray-500 font-normal';
                                                        }

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
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleViewQuotation(quotation)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="View"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </button>
                                                        {canEditQuotations() && (
                                                            <button
                                                                onClick={() => handleEditQuotation(quotation)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {canEditQuotations() && (
                                                             <button
                                                                 onClick={() => handleDeleteQuotation(quotation.id)}
                                                                 className="text-red-600 hover:text-red-900"
                                                                 title="Delete"
                                                             >
                                                                 <Trash className="w-4 h-4" />
                                                             </button>
                                                         )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && !loading && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center text-sm text-gray-700">
                                    <span>
                                        Showing {((currentPage - 1) * 15) + 1} to {Math.min(currentPage * 15, totalCount)} of {totalCount} quotations
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="flex items-center"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    
                                    {/* Page Numbers */}
                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "primary" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className="min-w-[40px]"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </MainLayout>
    );
}