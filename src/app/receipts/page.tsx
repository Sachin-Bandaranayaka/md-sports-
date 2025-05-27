'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Eye, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Receipt {
    id: number;
    receiptNumber: string;
    receiptDate: string;
    paymentId: number;
    payment: {
        amount: number;
        paymentMethod: string;
        invoice: {
            invoiceNumber: string;
        };
        customer: {
            name: string;
        };
    };
    confirmedByUser: {
        name: string;
    } | null;
    createdAt: string;
}

export default function ReceiptsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Sort
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');

    // Load receipts on component mount and when filters/pagination change
    useEffect(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const search = searchParams.get('search') || '';
        const from = searchParams.get('dateFrom') || '';
        const to = searchParams.get('dateTo') || '';
        const sort = searchParams.get('sort') || 'createdAt';
        const direction = searchParams.get('direction') || 'desc';

        setCurrentPage(page);
        setSearchTerm(search);
        setDateFrom(from);
        setDateTo(to);
        setSortField(sort);
        setSortDirection(direction);

        fetchReceipts(page, search, from, to, sort, direction);
    }, [searchParams]);

    const fetchReceipts = async (
        page: number,
        search: string,
        from: string,
        to: string,
        sort: string,
        direction: string
    ) => {
        setLoading(true);

        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search,
                dateFrom: from,
                dateTo: to,
                sort,
                direction
            });

            const response = await fetch(`/api/receipts?${queryParams.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch receipts');
            }

            const data = await response.json();
            setReceipts(data.receipts);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error('Error fetching receipts:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while fetching receipts');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: string) => {
        const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';

        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', field);
        params.set('direction', direction);
        router.push(`/receipts?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams(searchParams.toString());
        params.set('search', searchTerm);
        params.set('page', '1'); // Reset to first page on new search
        router.push(`/receipts?${params.toString()}`);
    };

    const handleFilterChange = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (dateFrom) params.set('dateFrom', dateFrom);
        else params.delete('dateFrom');

        if (dateTo) params.set('dateTo', dateTo);
        else params.delete('dateTo');

        params.set('page', '1'); // Reset to first page on filter change
        router.push(`/receipts?${params.toString()}`);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`/receipts?${params.toString()}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Payment Receipts</h1>
                        <p className="text-gray-500">View and manage all payment receipts</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by receipt number, invoice number or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm"
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    size="sm"
                                    className="absolute right-1 top-1"
                                >
                                    Search
                                </Button>
                            </div>
                        </form>

                        <div className="flex flex-col md:flex-row gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Date From
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="rounded-md border border-gray-300 py-1.5 px-2 text-sm w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Date To
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="rounded-md border border-gray-300 py-1.5 px-2 text-sm w-full"
                                />
                            </div>
                            <div className="self-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFilterChange}
                                    className="h-9"
                                >
                                    <Filter className="h-4 w-4 mr-1" />
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receipts Table */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-2 text-gray-500">Loading receipts...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <p className="text-red-500">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchReceipts(currentPage, searchTerm, dateFrom, dateTo, sortField, sortDirection)}
                                className="mt-2"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : receipts.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">No receipts found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('receiptNumber')}
                                        >
                                            <div className="flex items-center">
                                                Receipt Number
                                                {sortField === 'receiptNumber' && (
                                                    <ArrowUpDown className="ml-1 h-4 w-4" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('receiptDate')}
                                        >
                                            <div className="flex items-center">
                                                Date
                                                {sortField === 'receiptDate' && (
                                                    <ArrowUpDown className="ml-1 h-4 w-4" />
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Invoice
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('payment.amount')}
                                        >
                                            <div className="flex items-center">
                                                Amount
                                                {sortField === 'payment.amount' && (
                                                    <ArrowUpDown className="ml-1 h-4 w-4" />
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment Method
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Confirmed By
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {receipts.map((receipt) => (
                                        <tr key={receipt.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {receipt.receiptNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(receipt.receiptDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {receipt.payment.invoice.invoiceNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {receipt.payment.customer.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatCurrency(receipt.payment.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {receipt.payment.paymentMethod}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {receipt.confirmedByUser?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/receipts/${receipt.id}`)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && !error && receipts.length > 0 && (
                        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                        <span className="font-medium">{totalPages}</span>
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        {/* Page numbers */}
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            // Show pages around current page
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
                                                    variant={currentPage === pageNum ? 'primary' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}