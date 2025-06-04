'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, FileText, Download, Eye, CheckCircle, Trash2, Edit, Loader2, X } from 'lucide-react';
import { InvoiceCreateModal, InvoiceEditModal, InvoiceViewModal } from '@/components/invoices';
import type { InvoiceData } from '@/components/invoices';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';
import { FixedSizeList as List } from 'react-window';

// Interface for Invoice
interface Invoice {
    id: string | number;
    invoiceNumber: string;
    customerId: number;
    customerName?: string;
    total: number;
    totalProfit?: number;
    profitMargin?: number;
    status: string;
    paymentMethod: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    date?: string;
    dueDate?: string;
    itemCount?: number;
}

// Memoized status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized invoice row component for virtual scrolling
const InvoiceRow = memo(({ index, style, data }: { index: number; style: any; data: any }) => {
    const { invoices, onView, onEdit, onDelete, onRecordPayment } = data;
    const invoice = invoices[index];

    const formatDate = useCallback((dateString: string | Date) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);

    const getDueStatus = useCallback((dueDate: string | Date | undefined) => {
        if (!dueDate) return { text: 'No due date', class: 'text-gray-500' };

        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `${Math.abs(diffDays)} days overdue`, class: 'text-red-600 font-medium' };
        } else if (diffDays === 0) {
            return { text: 'Due today', class: 'text-orange-600 font-medium' };
        } else if (diffDays <= 7) {
            return { text: `Due in ${diffDays} days`, class: 'text-yellow-600' };
        } else {
            return { text: `Due in ${diffDays} days`, class: 'text-green-600' };
        }
    }, []);

    const dueStatus = getDueStatus(invoice.dueDate);

    return (
        <div style={style} className="border-b border-gray-200 hover:bg-gray-50">
            <div className="px-6 py-4 grid grid-cols-9 gap-4 items-center">
                <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                <div className="text-gray-600">{invoice.customerName}</div>
                <div className="text-gray-600">{formatDate(invoice.createdAt)}</div>
                <div className={dueStatus.class}>{dueStatus.text}</div>
                <div className="font-medium">${invoice.total.toFixed(2)}</div>
                <div className="text-green-600">${(invoice.totalProfit || 0).toFixed(2)}</div>
                <div className="text-gray-600">{invoice.itemCount || 0}</div>
                <StatusBadge status={invoice.status} />
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(invoice)}
                        className="p-1"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(invoice)}
                        className="p-1"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    {invoice.status !== 'paid' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRecordPayment(invoice)}
                            className="p-1 text-green-600 hover:text-green-700"
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(invoice)}
                        className="p-1 text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
});

InvoiceRow.displayName = 'InvoiceRow';

interface InvoiceClientWrapperOptimizedProps {
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

// Query keys
const QUERY_KEYS = {
    invoices: (filters: any) => ['invoices', filters],
    customers: ['customers'],
    products: ['products'],
    statistics: ['invoice-statistics']
};

// API functions
const fetchInvoices = async (filters: any) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
    });

    const response = await fetch(`/api/invoices?${params}`);
    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
};

const fetchCustomers = async () => {
    const response = await fetch('/api/customers?limit=1000');
    if (!response.ok) throw new Error('Failed to fetch customers');
    const data = await response.json();
    return data.customers || [];
};

const fetchProducts = async () => {
    const response = await fetch('/api/inventory?limit=1000');
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.items || [];
};

export default function InvoiceClientWrapperOptimized({
    initialInvoices,
    initialTotalPages,
    initialCurrentPage,
    initialStatistics
}: InvoiceClientWrapperOptimizedProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    // Filter states
    const [filters, setFilters] = useState({
        page: initialCurrentPage,
        status: searchParams.get('status') || '',
        paymentMethod: searchParams.get('paymentMethod') || '',
        search: searchParams.get('search') || '',
        timePeriod: searchParams.get('timePeriod') || 'all',
        sortBy: searchParams.get('sortBy') || 'newest'
    });

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

    // Debounced search
    const debouncedSearch = useMemo(
        () => debounce((searchTerm: string) => {
            setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
        }, 300),
        []
    );

    // React Query for invoices
    const {
        data: invoicesData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: QUERY_KEYS.invoices(filters),
        queryFn: () => fetchInvoices(filters),
        initialData: {
            invoices: initialInvoices,
            totalPages: initialTotalPages,
            currentPage: initialCurrentPage,
            statistics: initialStatistics
        },
        staleTime: 30000, // 30 seconds
        cacheTime: 300000, // 5 minutes
    });

    // React Query for customers (prefetch)
    const { data: customers = [] } = useQuery({
        queryKey: QUERY_KEYS.customers,
        queryFn: fetchCustomers,
        staleTime: 600000, // 10 minutes
        cacheTime: 1800000, // 30 minutes
    });

    // React Query for products (prefetch)
    const { data: products = [] } = useQuery({
        queryKey: QUERY_KEYS.products,
        queryFn: fetchProducts,
        staleTime: 600000, // 10 minutes
        cacheTime: 1800000, // 30 minutes
    });

    // Mutations
    const deleteInvoiceMutation = useMutation({
        mutationFn: async (invoiceId: string | number) => {
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete invoice');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Invoice deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete invoice');
        }
    });

    const recordPaymentMutation = useMutation({
        mutationFn: async (invoiceId: string | number) => {
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' })
            });
            if (!response.ok) throw new Error('Failed to record payment');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Payment recorded successfully');
        },
        onError: () => {
            toast.error('Failed to record payment');
        }
    });

    // Memoized handlers
    const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
        const updatedFilters = { ...filters, ...newFilters, page: 1 };
        setFilters(updatedFilters);

        // Update URL
        const params = new URLSearchParams();
        Object.entries(updatedFilters).forEach(([key, value]) => {
            if (value && value !== 'all' && key !== 'page') {
                params.set(key, String(value));
            }
        });
        if (updatedFilters.page > 1) {
            params.set('page', String(updatedFilters.page));
        }

        router.push(`/invoices?${params.toString()}`);
    }, [filters, router]);

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleView = useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice as InvoiceData);
        setIsViewModalOpen(true);
    }, []);

    const handleEdit = useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice as InvoiceData);
        setIsEditModalOpen(true);
    }, []);

    const handleDelete = useCallback((invoice: Invoice) => {
        if (confirm('Are you sure you want to delete this invoice?')) {
            deleteInvoiceMutation.mutate(invoice.id);
        }
    }, [deleteInvoiceMutation]);

    const handleRecordPayment = useCallback((invoice: Invoice) => {
        if (confirm('Mark this invoice as paid?')) {
            recordPaymentMutation.mutate(invoice.id);
        }
    }, [recordPaymentMutation]);

    const handleCreateSuccess = useCallback(() => {
        setIsCreateModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }, [queryClient]);

    const handleEditSuccess = useCallback(() => {
        setIsEditModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }, [queryClient]);

    // Memoized virtual list data
    const listData = useMemo(() => ({
        invoices: invoicesData?.invoices || [],
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onRecordPayment: handleRecordPayment
    }), [invoicesData?.invoices, handleView, handleEdit, handleDelete, handleRecordPayment]);

    const statistics = invoicesData?.statistics || initialStatistics;
    const invoices = invoicesData?.invoices || [];
    const totalPages = invoicesData?.totalPages || 0;
    const currentPage = invoicesData?.currentPage || 1;

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">Error loading invoices: {(error as Error).message}</p>
                <Button onClick={() => refetch()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-500">Total Outstanding</h3>
                    <p className="text-2xl font-bold text-red-600">${statistics.totalOutstanding.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-500">Paid This Month</h3>
                    <p className="text-2xl font-bold text-green-600">${statistics.paidThisMonth.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-500">Overdue Count</h3>
                    <p className="text-2xl font-bold text-orange-600">{statistics.overdueCount}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-500">Credit Sales</h3>
                    <p className="text-2xl font-bold text-blue-600">${statistics.totalCreditSales.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-500">Cash Sales</h3>
                    <p className="text-2xl font-bold text-purple-600">${statistics.totalNonCreditSales.toFixed(2)}</p>
                </div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
                <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>New Invoice</span>
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow border space-y-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                defaultValue={filters.search}
                                onChange={(e) => debouncedSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange({ status: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        value={filters.paymentMethod}
                        onChange={(e) => handleFilterChange({ paymentMethod: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Payment Methods</option>
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>

                    <select
                        value={filters.timePeriod}
                        onChange={(e) => handleFilterChange({ timePeriod: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>

                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="amount-high">Amount (High to Low)</option>
                        <option value="amount-low">Amount (Low to High)</option>
                        <option value="customer">Customer Name</option>
                        <option value="due-date">Due Date</option>
                    </select>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-9 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div>Invoice #</div>
                        <div>Customer</div>
                        <div>Date</div>
                        <div>Due Status</div>
                        <div>Total</div>
                        <div>Profit</div>
                        <div>Items</div>
                        <div>Status</div>
                        <div>Actions</div>
                    </div>
                </div>

                {/* Virtual Scrolling List */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                        <span className="ml-2">Loading invoices...</span>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
                    </div>
                ) : (
                    <List
                        height={600}
                        itemCount={invoices.length}
                        itemSize={80}
                        itemData={listData}
                    >
                        {InvoiceRow}
                    </List>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        Previous
                    </Button>

                    <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Modals */}
            <InvoiceCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                customers={customers}
                products={products}
            />

            <InvoiceEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                invoice={selectedInvoice}
                customers={customers}
                products={products}
            />

            <InvoiceViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
}