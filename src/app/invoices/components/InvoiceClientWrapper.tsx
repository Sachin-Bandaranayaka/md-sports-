'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, FileText, Download, Eye, CheckCircle, Trash2, Edit, Loader2, X } from 'lucide-react';
import { InvoiceCreateModal, InvoiceEditModal, InvoiceViewModal } from '@/components/invoices';
import type { InvoiceData } from '@/components/invoices';

// Interface for Invoice (should match what the API provides or what page.tsx transforms)
interface Invoice {
    id: string | number;
    invoiceNumber: string;
    customerId: number;
    customerName?: string; // Added by API or server component
    total: number;
    totalProfit?: number; // Added
    profitMargin?: number; // Added
    status: string;
    paymentMethod: string;
    createdAt: Date | string; // Can be string if pre-formatted
    updatedAt: Date | string;
    date?: string; // UI formatted date
    dueDate?: string; // UI formatted due date
    itemCount?: number; // Number of items in the invoice
    totalPaid?: number; // Total amount paid
    dueAmount?: number; // Amount still due
}

// Status badge colors
const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'partial':
            return 'bg-blue-100 text-blue-800';
        case 'overdue':
            return 'bg-red-100 text-red-800';
        case 'cancelled':
            return 'bg-gray-100 text-gray-700';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

interface InvoiceClientWrapperProps {
    initialInvoices: Invoice[];
    initialTotalPages: number;
    initialCurrentPage: number;
    initialStatistics: {
        totalOutstanding: number;
        paidThisMonth: number;
        overdueCount: number;
        totalCreditSales: number;
        totalNonCreditSales: number;
    };
}

export default function InvoiceClientWrapper({
    initialInvoices,
    initialTotalPages,
    initialCurrentPage,
    initialStatistics
}: InvoiceClientWrapperProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
    const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage);
    const [statistics, setStatistics] = useState(initialStatistics);
    const [loading, setLoading] = useState<boolean>(false); // For client-side actions like payment, delete
    const [error, setError] = useState<string | null>(null);
    const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
    const [products, setProducts] = useState<{ id: number; name: string; price: number }[]>([]);
    const [shops, setShops] = useState<{ id: string; name: string; location: string }[]>([]);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

    // Filters state - initialized from URL search params if present
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>(searchParams.get('paymentMethod') || '');
    const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
    const [timePeriodFilter, setTimePeriodFilter] = useState<string>(searchParams.get('timePeriod') || 'all');
    const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'newest');

    useEffect(() => {
        setInvoices(initialInvoices);
        setTotalPages(initialTotalPages);
        setCurrentPage(initialCurrentPage);
        setStatistics(initialStatistics);
    }, [initialInvoices, initialTotalPages, initialCurrentPage, initialStatistics]);

    // Handle time period filter changes
    useEffect(() => {
        if (timePeriodFilter !== 'all') {
            handleFilterChange();
        }
    }, [timePeriodFilter]);

    // Handle sort changes
    useEffect(() => {
        if (sortBy !== 'newest') {
            handleFilterChange();
        }
    }, [sortBy]);

    // Fetch customers, products, and shops on component mount for better performance
    useEffect(() => {
        const fetchCustomersProductsAndShops = async () => {
            try {
                // Fetch customers
                const customersResponse = await fetch('/api/customers');
                if (customersResponse.ok) {
                    const customersData = await customersResponse.json();
                    setCustomers(customersData);
                }

                // Fetch products
                const productsResponse = await fetch('/api/products');
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    // Handle the API response structure
                    if (productsData.success && productsData.data) {
                        setProducts(productsData.data);
                    } else {
                        setProducts(productsData);
                    }
                }

                // Fetch shops
                const shopsResponse = await fetch('/api/shops');
                if (shopsResponse.ok) {
                    const shopsData = await shopsResponse.json();
                    // Handle the API response structure
                    if (shopsData.success && shopsData.data) {
                        setShops(shopsData.data);
                    } else {
                        setShops(shopsData);
                    }
                }
            } catch (err) {
                console.error('Error fetching customers, products, or shops:', err);
            }
        };

        fetchCustomersProductsAndShops();
    }, []); // Empty dependency array to run only on mount

    const handleFilterChange = () => {
        const params = new URLSearchParams(searchParams);
        if (searchQuery) params.set('search', searchQuery);
        else params.delete('search');
        if (statusFilter) params.set('status', statusFilter);
        else params.delete('status');
        if (paymentMethodFilter) params.set('paymentMethod', paymentMethodFilter);
        else params.delete('paymentMethod');
        if (timePeriodFilter && timePeriodFilter !== 'all') params.set('timePeriod', timePeriodFilter);
        else params.delete('timePeriod');
        if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);
        else params.delete('sortBy');
        params.set('page', '1'); // Reset to page 1 on new filter
        router.push(`/invoices?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setPaymentMethodFilter('');
        setTimePeriodFilter('all');
        setSortBy('newest');
        const params = new URLSearchParams();
        params.set('page', '1');
        router.push(`/invoices?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`/invoices?${params.toString()}`);
    };

    const handleRecordPayment = (invoiceId: string | number) => {
        router.push(`/payments/simple?invoiceId=${invoiceId}`);
    };

    const handleDeleteInvoice = async (invoiceId: string | number) => {
        if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Failed to delete invoice');
                }
                router.refresh(); // Refresh data
            } catch (err: any) {
                console.error('Error deleting invoice:', err);
                setError(err.message || 'Failed to delete invoice. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Modal handlers
    const handleViewInvoice = async (invoiceId: string | number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/invoices/${invoiceId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch invoice details');
            }
            const invoiceData = await response.json();
            setSelectedInvoice(invoiceData);
            setIsViewModalOpen(true);
        } catch (err: any) {
            console.error('Error fetching invoice:', err);
            setError(err.message || 'Failed to load invoice details');
        } finally {
            setLoading(false);
        }
    };

    const handleEditInvoice = async (invoiceId: string | number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/invoices/${invoiceId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch invoice details');
            }
            const invoiceData = await response.json();
            setSelectedInvoice(invoiceData);
            setIsEditModalOpen(true);
        } catch (err: any) {
            console.error('Error fetching invoice:', err);
            setError(err.message || 'Failed to load invoice details');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = async (newInvoice: any) => {
        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newInvoice),
            });

            if (!response.ok) {
                throw new Error('Failed to create invoice');
            }

            setIsCreateModalOpen(false);
            router.refresh(); // Refresh the page to show new invoice
        } catch (err: any) {
            console.error('Error creating invoice:', err);
            setError(err.message || 'Failed to create invoice');
        }
    };

    const handleEditSuccess = async (updatedInvoice: any) => {
        try {
            const response = await fetch(`/api/invoices/${updatedInvoice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedInvoice),
            });

            if (!response.ok) {
                throw new Error('Failed to update invoice');
            }

            setIsEditModalOpen(false);
            setSelectedInvoice(null);
            router.refresh(); // Refresh the page to show updated invoice
        } catch (err: any) {
            console.error('Error updating invoice:', err);
            setError(err.message || 'Failed to update invoice');
        }
    };

    const handleCloseModals = () => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedInvoice(null);
    };

    // Format date string for display (if not already formatted)
    const formatDate = (dateString: string | Date) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Calculate countdown or overdue days for due date
    const getDueDateStatus = (invoice: Invoice) => {
        let dueDate: Date;

        if (invoice.dueDate) {
            dueDate = new Date(invoice.dueDate);
        } else {
            // Default to 30 days after creation if no due date
            dueDate = new Date(invoice.createdAt);
            dueDate.setDate(dueDate.getDate() + 30);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        dueDate.setHours(0, 0, 0, 0); // Reset time to start of day

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            return {
                text: `${diffDays} day${diffDays === 1 ? '' : 's'} left`,
                className: diffDays <= 3 ? 'text-orange-600 font-medium' : 'text-green-600'
            };
        } else if (diffDays === 0) {
            return {
                text: 'Due today',
                className: 'text-orange-600 font-medium'
            };
        } else {
            const overdueDays = Math.abs(diffDays);
            return {
                text: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
                className: 'text-red-600 font-medium'
            };
        }
    };


    return (
        <>
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
                    {error}
                    <button onClick={() => setError(null)} className="ml-4 text-red-700 font-bold">X</button>
                </div>
            )}

            {/* Header & Statistics */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Manage Invoices</h1>
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="flex items-center">
                        <Plus size={18} className="mr-2" /> Create New Invoice
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 shadow rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500">Total Outstanding</h3>
                        <p className="text-2xl font-semibold text-gray-800">Rs. {statistics.totalOutstanding.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 shadow rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500">Paid This Month</h3>
                        <p className="text-2xl font-semibold text-green-600">Rs. {statistics.paidThisMonth.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 shadow rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500">Overdue Invoices</h3>
                        <p className="text-2xl font-semibold text-red-600">{statistics.overdueCount}</p>
                    </div>
                    <div className="bg-white p-4 shadow rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500">Credit Sales (Wholesale)</h3>
                        <p className="text-2xl font-semibold text-blue-600">Rs. {statistics.totalCreditSales.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 shadow rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500">Non-Credit Sales (Retail)</h3>
                        <p className="text-2xl font-semibold text-purple-600">Rs. {statistics.totalNonCreditSales.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 p-4 bg-white shadow rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="searchInvoice" className="block text-sm font-medium text-gray-700 mb-1">Search Invoices</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                id="searchInvoice"
                                placeholder="Search by Invoice #, Customer Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="timePeriodFilter" className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                        <select
                            id="timePeriodFilter"
                            value={timePeriodFilter}
                            onChange={(e) => setTimePeriodFilter(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            id="statusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="paymentMethodFilter" className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                            id="paymentMethodFilter"
                            value={paymentMethodFilter}
                            onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                            <option value="">All Methods</option>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="amount-high">Amount: High to Low</option>
                            <option value="amount-low">Amount: Low to High</option>
                            <option value="customer">Customer Name A-Z</option>
                            <option value="due-date">Due Date</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={clearFilters} disabled={loading}>
                        Clear Filters
                    </Button>
                    <Button variant="primary" onClick={handleFilterChange} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter size={18} className="mr-2" />} Apply Filters
                    </Button>
                </div>
            </div>

            {/* Invoices Table */}
            {loading && initialInvoices.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-indigo-600" size={48} />
                    <p className="ml-3 text-lg text-gray-600">Loading invoices...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-10 bg-white shadow rounded-lg">
                    <FileText size={48} className="mx-auto text-gray-400" />
                    <h3 className="mt-2 text-xl font-semibold text-gray-700">No Invoices Found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchQuery || statusFilter || paymentMethodFilter
                            ? "Try adjusting your search or filter criteria."
                            : "Get started by creating a new invoice."}
                    </p>
                    {(searchQuery || statusFilter || paymentMethodFilter) && (
                        <Button variant="outline" onClick={clearFilters} className="mt-4">Clear All Filters</Button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto bg-white shadow rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Due Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer" onClick={() => router.push(`/invoices/${invoice.id}`)}>{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{formatDate(invoice.createdAt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                                        <span className={getDueDateStatus(invoice).className}>
                                            {getDueDateStatus(invoice).text}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">Rs. {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">Rs. {(invoice.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{invoice.itemCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                            {invoice.status.toLowerCase() === 'partial' && invoice.dueAmount !== undefined && (
                                                <span className="text-xs text-gray-600">
                                                    Due: Rs. {invoice.dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => router.push(`/invoices/${invoice.id}`)} title="View Invoice" disabled={loading}>
                                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Eye size={16} className="text-blue-600" />}
                                            </Button>
                                            {(invoice.status.toLowerCase() === 'pending' || invoice.status.toLowerCase() === 'partial') && (
                                                <Button variant="ghost" size="icon" onClick={() => handleRecordPayment(invoice.id)} title="Record Payment" disabled={loading}>
                                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle size={16} className="text-green-600" />}
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(invoice.id)} title="Edit Invoice" disabled={loading}>
                                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Edit size={16} className="text-yellow-600" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteInvoice(invoice.id)} title="Delete Invoice" disabled={loading}>
                                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 size={16} className="text-red-600" />}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Enhanced Pagination Controls */}
            {totalPages > 0 && (
                <div className="mt-6 bg-white border-t border-gray-200 px-4 py-3 sm:px-6">
                    <div className="flex items-center justify-between">
                        {/* Mobile pagination info */}
                        <div className="flex flex-1 justify-between sm:hidden">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium"
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-700 flex items-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || loading}
                                className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium"
                            >
                                Next
                            </Button>
                        </div>
                        
                        {/* Desktop pagination */}
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing{' '}
                                    <span className="font-medium">{((currentPage - 1) * 15) + 1}</span>
                                    {' '}to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * 15, invoices.length + ((currentPage - 1) * 15))}
                                    </span>
                                    {' '}of{' '}
                                    <span className="font-medium">{totalPages * 15}</span>
                                    {' '}results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    {/* Previous button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || loading}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                        </svg>
                                    </Button>
                                    
                                    {/* Page numbers with smart truncation */}
                                    {(() => {
                                        const pages = [];
                                        const maxVisiblePages = 7;
                                        
                                        if (totalPages <= maxVisiblePages) {
                                            // Show all pages if total is small
                                            for (let i = 1; i <= totalPages; i++) {
                                                pages.push(i);
                                            }
                                        } else {
                                            // Smart pagination with ellipsis
                                            if (currentPage <= 4) {
                                                // Show first 5 pages + ellipsis + last page
                                                for (let i = 1; i <= 5; i++) pages.push(i);
                                                if (totalPages > 6) pages.push('ellipsis1');
                                                pages.push(totalPages);
                                            } else if (currentPage >= totalPages - 3) {
                                                // Show first page + ellipsis + last 5 pages
                                                pages.push(1);
                                                if (totalPages > 6) pages.push('ellipsis1');
                                                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                                            } else {
                                                // Show first + ellipsis + current-1,current,current+1 + ellipsis + last
                                                pages.push(1);
                                                pages.push('ellipsis1');
                                                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                                                pages.push('ellipsis2');
                                                pages.push(totalPages);
                                            }
                                        }
                                        
                                        return pages.map((page, index) => {
                                            if (typeof page === 'string') {
                                                return (
                                                    <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    disabled={loading}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                        currentPage === page
                                                            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                    }`}
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        });
                                    })()}
                                    
                                    {/* Next button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || loading}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                        </svg>
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                    
                    {/* Quick jump to page */}
                    {totalPages > 10 && (
                        <div className="mt-3 flex items-center justify-center space-x-2">
                            <span className="text-sm text-gray-700">Jump to page:</span>
                            <input
                                type="number"
                                min="1"
                                max={totalPages}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        const page = parseInt((e.target as HTMLInputElement).value);
                                        if (page >= 1 && page <= totalPages) {
                                            handlePageChange(page);
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }
                                }}
                                placeholder={currentPage.toString()}
                            />
                            <span className="text-sm text-gray-500">of {totalPages}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Components */}
            <InvoiceCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModals}
                onSave={handleCreateSuccess}
                customers={customers}
                products={products}
                shops={shops}
                isLoading={loading}
            />

            <InvoiceEditModal
                isOpen={isEditModalOpen}
                onClose={handleCloseModals}
                onSave={handleEditSuccess}
                customers={customers}
                products={products}
                shops={shops}
                initialData={selectedInvoice}
                isLoading={loading}
            />

            <InvoiceViewModal
                isOpen={isViewModalOpen}
                onClose={handleCloseModals}
                onEdit={() => {
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(true);
                }}
                invoice={selectedInvoice}
            />
        </>
    );
}