'use client';

import { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, Eye, CheckCircle, Trash2, Edit, Loader2, X, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Optimized interfaces
interface OptimizedInvoice {
    id: string;
    invoiceNumber: string;
    customerId: number | null;
    customerName: string;
    total: number;
    status: string;
    paymentMethod: string | null;
    createdAt: string;
    dueDate: string | null;
    shopName: string | null;
    itemCount: number;
    totalPaid: number;
}

interface OptimizedStatistics {
    totalOutstanding: number;
    paidThisMonth: number;
    overdueCount: number;
    totalInvoices: number;
}

interface WrapperProps {
    initialData: {
        invoices: OptimizedInvoice[];
        totalPages: number;
        currentPage: number;
        statistics: OptimizedStatistics;
        error: string | null;
    };
    searchParams: {
        page?: string;
        status?: string;
        paymentMethod?: string;
        search?: string;
        sortBy?: string;
        shopId?: string;
    };
}

// Memoized status badge for performance
const StatusBadge = memo(({ status }: { status: string }) => {
    const statusClasses = useMemo(() => {
        const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
        switch (status.toLowerCase()) {
            case 'paid': return `${baseClasses} bg-green-100 text-green-800`;
            case 'pending': return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'overdue': return `${baseClasses} bg-red-100 text-red-800`;
            case 'cancelled': return `${baseClasses} bg-gray-100 text-gray-700`;
            default: return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    }, [status]);

    return (
        <span className={statusClasses}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized date formatter
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Memoized due status calculator
const getDueStatus = (dueDate: string | null, status: string) => {
    if (status.toLowerCase() === 'paid') {
        return { text: 'Paid', class: 'text-green-600 font-medium' };
    }
    
    if (!dueDate) return { text: 'No due date', class: 'text-gray-500' };
    
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)}d overdue`, class: 'text-red-600 font-medium' };
    } else if (diffDays === 0) {
        return { text: 'Due today', class: 'text-orange-600 font-medium' };
    } else if (diffDays <= 7) {
        return { text: `${diffDays}d left`, class: 'text-yellow-600' };
    } else {
        return { text: `${diffDays}d left`, class: 'text-green-600' };
    }
};

// Optimized virtual row component
const InvoiceRow = memo(({ index, style, data }: { index: number; style: any; data: any }) => {
    const { invoices, onView, onEdit, onDelete, onRecordPayment } = data;
    const invoice = invoices[index];
    
    const dueStatus = useMemo(() => getDueStatus(invoice.dueDate, invoice.status), [invoice.dueDate, invoice.status]);
    const amountPaid = invoice.totalPaid;
    const amountDue = invoice.total - amountPaid;

    return (
        <div style={style} className="border-b border-gray-200 hover:bg-gray-50 px-6 py-3">
            <div className="grid grid-cols-9 gap-4 items-center">
                <div className="font-medium text-gray-900 text-sm">
                    {invoice.invoiceNumber}
                </div>
                <div className="text-gray-600 text-sm truncate">
                    {invoice.customerName}
                </div>
                <div className="text-gray-600 text-sm">
                    {formatDate(invoice.createdAt)}
                </div>
                <div className={`text-sm ${dueStatus.class}`}>
                    {dueStatus.text}
                </div>
                <div className="font-medium text-sm">
                    ${invoice.total.toFixed(2)}
                </div>
                <div className="text-green-600 text-sm">
                    ${amountPaid.toFixed(2)}
                </div>
                <div className={`text-sm ${amountDue > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    ${amountDue.toFixed(2)}
                </div>
                <StatusBadge status={invoice.status} />
                <div className="flex space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(invoice)}
                        className="p-1 h-7 w-7"
                    >
                        <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(invoice)}
                        className="p-1 h-7 w-7"
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    {invoice.status.toLowerCase() !== 'paid' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRecordPayment(invoice)}
                            className="p-1 h-7 w-7 text-green-600 hover:text-green-700"
                        >
                            <CheckCircle className="h-3 w-3" />
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(invoice)}
                        className="p-1 h-7 w-7 text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
});

InvoiceRow.displayName = 'InvoiceRow';

// Main component
export default function InvoiceSuperOptimizedWrapper({
    initialData,
    searchParams
}: WrapperProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: searchParams.search || '',
        status: searchParams.status || '',
        paymentMethod: searchParams.paymentMethod || '',
        sortBy: searchParams.sortBy || 'newest'
    });

    // Virtual scrolling refs
    const listRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounced search
    const debouncedSearch = useMemo(
        () => debounce((searchTerm: string) => {
            updateURL({ ...filters, search: searchTerm, page: '1' });
        }, 300),
        [filters]
    );

    // URL update handler
    const updateURL = useCallback((newFilters: any) => {
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value && value !== 'all' && key !== 'page') {
                params.set(key, String(value));
            }
        });
        if (newFilters.page && newFilters.page > 1) {
            params.set('page', String(newFilters.page));
        }
        router.push(`/invoices/super-optimized?${params.toString()}`);
    }, [router]);

    // Action handlers
    const handleView = useCallback((invoice: OptimizedInvoice) => {
        router.push(`/invoices/${invoice.id}`);
    }, [router]);

    const handleEdit = useCallback((invoice: OptimizedInvoice) => {
        router.push(`/invoices/edit/${invoice.id}`);
    }, [router]);

    const handleDelete = useCallback(async (invoice: OptimizedInvoice) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/invoices/${invoice.id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    const handleRecordPayment = useCallback(async (invoice: OptimizedInvoice) => {
        if (!confirm('Mark this invoice as paid?')) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/invoices/${invoice.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' })
            });
            if (response.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error('Payment recording failed:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    // Filter handlers
    const handleFilterChange = useCallback((key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        if (key !== 'search') {
            updateURL({ ...newFilters, page: '1' });
        }
    }, [filters, updateURL]);

    // Search handler
    const handleSearch = useCallback((value: string) => {
        setFilters(prev => ({ ...prev, search: value }));
        debouncedSearch(value);
    }, [debouncedSearch]);

    // Virtual list data
    const listData = useMemo(() => ({
        invoices: initialData.invoices,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onRecordPayment: handleRecordPayment
    }), [initialData.invoices, handleView, handleEdit, handleDelete, handleRecordPayment]);

    const { statistics } = initialData;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Sales Invoices (Optimized)</h1>
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Outstanding</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ${statistics.totalOutstanding.toFixed(2)}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Paid This Month</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${statistics.paidThisMonth.toFixed(2)}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Overdue Invoices</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {statistics.overdueCount}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Invoices</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {statistics.totalInvoices}
                                </p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                value={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                            />
                        </div>
                    </div>
                    
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <select
                        value={filters.paymentMethod}
                        onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Payment Methods</option>
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
                    
                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="amount-high">Amount: High to Low</option>
                        <option value="amount-low">Amount: Low to High</option>
                        <option value="customer">Customer Name</option>
                    </select>
                    
                    <Button
                        onClick={() => router.push('/invoices/new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Invoice
                    </Button>
                </div>
            </div>

            {/* Invoice Table with Virtual Scrolling */}
            <div className="bg-white rounded-lg shadow" ref={containerRef}>
                {/* Table Header */}
                <div className="border-b border-gray-200 px-6 py-3 bg-gray-50">
                    <div className="grid grid-cols-9 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div>Invoice #</div>
                        <div>Customer</div>
                        <div>Date</div>
                        <div>Due Status</div>
                        <div>Total</div>
                        <div>Paid</div>
                        <div>Due</div>
                        <div>Status</div>
                        <div>Actions</div>
                    </div>
                </div>
                
                {/* Virtual Scrolling List */}
                {initialData.invoices.length > 0 ? (
                    <List
                        ref={listRef}
                        height={600}
                        width="100%"
                        itemCount={initialData.invoices.length}
                        itemSize={50}
                        itemData={listData}
                        overscanCount={5}
                    >
                        {InvoiceRow}
                    </List>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        No invoices found
                    </div>
                )}
            </div>

            {/* Pagination */}
            {initialData.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <div className="flex space-x-2">
                        {Array.from({ length: Math.min(initialData.totalPages, 5) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <Button
                                    key={page}
                                    variant={page === initialData.currentPage ? "primary" : "outline"}
                                    onClick={() => updateURL({ ...filters, page: page.toString() })}
                                    disabled={loading}
                                >
                                    {page}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-gray-600">Processing...</p>
                    </div>
                </div>
            )}
        </div>
    );
} 