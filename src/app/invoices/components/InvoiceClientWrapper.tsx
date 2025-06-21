'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, FileText, Download, Eye, CheckCircle, Trash2, Edit, Loader2, X, ChevronUp, ChevronDown, CalendarIcon } from 'lucide-react';
import { InvoiceCreateModal, InvoiceEditModal, InvoiceViewModal } from '@/components/invoices';
import type { InvoiceData } from '@/components/invoices';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
    notes?: string;
    totalPaid?: number; // Total amount paid
    dueAmount?: number; // Amount still due
    shop?: {
        id: string;
        name: string;
        location?: string;
    };
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

// Shop-based row colors
const getShopRowClass = (shopName?: string) => {
    if (!shopName) return 'hover:bg-gray-50';
    
    switch (shopName.toLowerCase()) {
        case 'mba':
        case 'mba branch':
            return 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400';
        case 'zymantra':
        case 'zymantra branch':
        case 'zimantra':
        case 'zimantra branch':
            return 'bg-green-50 hover:bg-green-100 border-l-4 border-green-400';
        default:
            return 'hover:bg-gray-50';
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
    shops: { id: number; name: string; location: string }[];
}

export default function InvoiceClientWrapper({
    initialInvoices,
    initialTotalPages,
    initialCurrentPage,
    initialStatistics,
    shops
}: InvoiceClientWrapperProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { accessToken } = useAuth();
    const { canEditInvoices } = usePermission();

    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
    const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage);
    const [statistics, setStatistics] = useState(initialStatistics);
    const [loading, setLoading] = useState<boolean>(false); // For client-side actions like payment, delete
    const [error, setError] = useState<string | null>(null);
    const [customers, setCustomers] = useState<{ id: number; name: string; customerType: 'wholesale' | 'retail' }[]>([]);
    const [products, setProducts] = useState<{ id: number; name: string; price: number }[]>([]);
    const [shopsState, setShopsState] = useState<{ id: string; name: string; location: string }[]>(
        shops.map(shop => ({ ...shop, id: shop.id.toString() }))
    );

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

    // Filters state - initialized from URL search params if present
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>(searchParams.get('paymentMethod') || '');
    const [shopFilter, setShopFilter] = useState<string>(searchParams.get('shopId') || '');
    const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined);
    const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'newest');
    const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = newest first, asc = oldest first
    const [dueStatusSortOrder, setDueStatusSortOrder] = useState<'asc' | 'desc'>('asc'); // asc = overdue first, desc = current first

    // Selection state for bulk operations
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState<boolean>(false);

    // Selection handlers
    const handleToggleSelection = useCallback((invoiceId: string) => {
        setSelectedInvoices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(invoiceId)) {
                newSet.delete(invoiceId);
            } else {
                newSet.add(invoiceId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectAll) {
            setSelectedInvoices(new Set());
            setSelectAll(false);
        } else {
            const allIds = new Set(invoices.map(invoice => String(invoice.id)));
            setSelectedInvoices(allIds);
            setSelectAll(true);
        }
    }, [selectAll, invoices]);

    const handleClearSelection = useCallback(() => {
        setSelectedInvoices(new Set());
        setSelectAll(false);
    }, []);

    // Handle date column sorting
    const handleDateSort = useCallback(() => {
        const newOrder = dateSortOrder === 'desc' ? 'asc' : 'desc';
        setDateSortOrder(newOrder);
        setSortBy(newOrder === 'desc' ? 'newest' : 'oldest');
    }, [dateSortOrder]);

    // Handle due days column sorting
    const handleDueStatusSort = useCallback(() => {
        const newOrder = dueStatusSortOrder === 'asc' ? 'desc' : 'asc';
        setDueStatusSortOrder(newOrder);
        setSortBy(newOrder === 'asc' ? 'due-date' : 'due-date-desc');
    }, [dueStatusSortOrder]);

    useEffect(() => {
        setInvoices(initialInvoices);
        setTotalPages(initialTotalPages);
        setCurrentPage(initialCurrentPage);
        setStatistics(initialStatistics);
    }, [initialInvoices, initialTotalPages, initialCurrentPage, initialStatistics]);

    // Handle search query changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleFilterChange();
        }, 300); // Debounce search by 300ms
        
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Handle status, payment method, and shop filter changes
    useEffect(() => {
        handleFilterChange();
    }, [statusFilter, paymentMethodFilter, shopFilter]);

    // Handle date range filter changes
    useEffect(() => {
        if (dateFrom || dateTo) {
            handleFilterChange();
        }
    }, [dateFrom, dateTo]);

    // Handle sort changes
    useEffect(() => {
        if (sortBy !== 'newest') {
            handleFilterChange();
        }
    }, [sortBy, dateSortOrder, dueStatusSortOrder]);

    // Fetch customers and products on component mount for better performance
    useEffect(() => {
        const fetchCustomersAndProducts = async () => {
            if (!accessToken) return;
            
            try {
                // Fetch customers (let the fetch interceptor handle auth headers)
                const customersResponse = await fetch('/api/customers');
                if (customersResponse.ok) {
                    const customersData = await customersResponse.json();
                    // Add default customerType if not present
                    const customersWithType = customersData.map((customer: any) => ({
                        ...customer,
                        customerType: customer.customerType || 'retail' as 'wholesale' | 'retail'
                    }));
                    setCustomers(customersWithType);
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
            } catch (err) {
                console.error('Error fetching customers and products:', err);
            }
        };

        fetchCustomersAndProducts();
    }, [accessToken]); // Run when accessToken becomes available

    const handleFilterChange = () => {
        const params = new URLSearchParams(searchParams);
        if (searchQuery) params.set('search', searchQuery);
        else params.delete('search');
        if (statusFilter) params.set('status', statusFilter);
        else params.delete('status');
        if (paymentMethodFilter) params.set('paymentMethod', paymentMethodFilter);
        else params.delete('paymentMethod');
        if (shopFilter) params.set('shopId', shopFilter);
        else params.delete('shopId');
        if (dateFrom) params.set('dateFrom', dateFrom.toISOString().split('T')[0]);
        else params.delete('dateFrom');
        if (dateTo) params.set('dateTo', dateTo.toISOString().split('T')[0]);
        else params.delete('dateTo');
        if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);
        else params.delete('sortBy');
        params.set('page', '1'); // Reset to page 1 on new filter
        router.push(`/invoices?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setPaymentMethodFilter('');
        setShopFilter('');
        setDateFrom(undefined);
        setDateTo(undefined);
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
                const response = await fetch(`/api/invoices/${invoiceId}`, { 
                    method: 'DELETE',
                    headers: {
                        'Authorization': accessToken ? `Bearer ${accessToken}` : '',
                    }
                });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Failed to delete invoice');
                }
                
                // Remove from selection if it was selected
                setSelectedInvoices(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(String(invoiceId));
                    return newSet;
                });
                
                router.refresh(); // Refresh data
            } catch (err: any) {
                console.error('Error deleting invoice:', err);
                setError(err.message || 'Failed to delete invoice. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedInvoices.size === 0) {
            alert('Please select invoices to delete.');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedInvoices.size} selected invoice(s)?`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const deletePromises = Array.from(selectedInvoices).map(invoiceId => 
                fetch(`/api/invoices/${invoiceId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': accessToken ? `Bearer ${accessToken}` : '',
                    }
                })
            );

            const results = await Promise.allSettled(deletePromises);
            
            // Check for any failures
            const failures = results.filter(result => result.status === 'rejected');
            
            if (failures.length > 0) {
                throw new Error(`Failed to delete ${failures.length} invoice(s)`);
            }

            // Clear selection
            handleClearSelection();
            
            router.refresh(); // Refresh data
        } catch (err: any) {
            console.error('Error deleting invoices:', err);
            setError(err.message || 'Failed to delete some invoices');
        } finally {
            setLoading(false);
        }
    };

    // Modal handlers
    const handleViewInvoice = async (invoiceId: string | number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                headers: {
                    'Authorization': accessToken ? `Bearer ${accessToken}` : '',
                }
            });
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
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                headers: {
                    'Authorization': accessToken ? `Bearer ${accessToken}` : '',
                }
            });
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
        // The InvoiceCreateModal already handles the API call
        // This callback is just for UI updates after successful creation
        setIsCreateModalOpen(false);
        router.refresh(); // Refresh the page to show new invoice
    };

    const handleEditSuccess = async (updatedInvoice: any) => {
        try {
            const response = await fetch(`/api/invoices/${updatedInvoice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': accessToken ? `Bearer ${accessToken}` : '',
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
        // If invoice is paid, show 'Paid' instead of due days
        if (invoice.status.toLowerCase() === 'paid') {
            return {
                text: 'Paid',
                className: 'text-green-600 font-medium'
            };
        }

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
                    {canEditInvoices() && (
                        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="flex items-center">
                            <Plus size={18} className="mr-2" /> Create New Invoice
                        </Button>
                    )}
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
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-left flex items-center",
                                            !dateFrom && "text-gray-500"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                                        <span className="text-gray-900">
                                            {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From"}
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded-md" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateFrom}
                                        onSelect={setDateFrom}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-left flex items-center",
                                            !dateTo && "text-gray-500"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                                        <span className="text-gray-900">
                                            {dateTo ? format(dateTo, "MMM dd, yyyy") : "To"}
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded-md" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateTo}
                                        onSelect={setDateTo}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        {(dateFrom || dateTo) && (
                            <div className="col-span-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDateFrom(undefined);
                                        setDateTo(undefined);
                                    }}
                                    className="w-full py-1 px-3 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 bg-white rounded-md hover:bg-gray-50 flex items-center justify-center"
                                >
                                    <X className="mr-1 h-3 w-3" />
                                    Clear Date Range
                                </button>
                            </div>
                        )}
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
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
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
                        <label htmlFor="shopFilter" className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
                        <select
                            id="shopFilter"
                            value={shopFilter}
                            onChange={(e) => setShopFilter(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                            <option value="">All Shops</option>
                            {shopsState.map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
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
                <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {selectedInvoices.size > 0 && (
                            <>
                                <span className="text-sm text-gray-600">
                                    {selectedInvoices.size} invoice(s) selected
                                </span>
                                {canEditInvoices() && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleBulkDelete} 
                                        disabled={loading}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 size={16} className="mr-1" />
                                        Delete Selected
                                    </Button>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleClearSelection}
                                    disabled={loading}
                                >
                                    <X size={16} className="mr-1" />
                                    Clear Selection
                                </Button>
                            </>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={clearFilters} disabled={loading}>
                            Clear Filters
                        </Button>
                        <Button variant="primary" onClick={handleFilterChange} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter size={18} className="mr-2" />} Apply Filters
                        </Button>
                    </div>
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
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 scale-90"
                                        disabled={loading}
                                    />
                                </th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                    <button 
                                        onClick={handleDateSort}
                                        className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
                                        title={`Sort by date (${dateSortOrder === 'desc' ? 'oldest first' : 'newest first'})`}
                                    >
                                        <span>Date</span>
                                        {dateSortOrder === 'desc' ? (
                                            <ChevronDown size={12} className="text-indigo-600" />
                                        ) : (
                                            <ChevronUp size={12} className="text-indigo-600" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                    <button 
                                        onClick={handleDueStatusSort}
                                        className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
                                        title={`Sort by due days (${dueStatusSortOrder === 'asc' ? 'current first' : 'overdue first'})`}
                                    >
                                        <span>Due Days</span>
                                        {dueStatusSortOrder === 'asc' ? (
                                            <ChevronUp size={12} className="text-indigo-600" />
                                        ) : (
                                            <ChevronDown size={12} className="text-indigo-600" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className={`transition-colors duration-150 ${
                                    selectedInvoices.has(String(invoice.id)) 
                                        ? 'bg-blue-100 border-l-4 border-blue-500' 
                                        : getShopRowClass(invoice.shop?.name)
                                }`}>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedInvoices.has(String(invoice.id))}
                                            onChange={() => handleToggleSelection(String(invoice.id))}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 scale-90"
                                            disabled={loading}
                                        />
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium">
                                        <div className="flex items-center space-x-0.5">
                                            {(invoice.status.toLowerCase() === 'pending' || invoice.status.toLowerCase() === 'partial') && (
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRecordPayment(invoice.id)} title="Record Payment" disabled={loading}>
                                                    {loading ? <Loader2 className="animate-spin h-3 w-3" /> : <CheckCircle size={12} className="text-green-600" />}
                                                </Button>
                                            )}
                                            {canEditInvoices() && (
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEditInvoice(invoice.id)} title="Edit Invoice" disabled={loading}>
                                                    {loading ? <Loader2 className="animate-spin h-3 w-3" /> : <Edit size={12} className="text-yellow-600" />}
                                                </Button>
                                            )}
                                            {canEditInvoices() && (
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteInvoice(invoice.id)} title="Delete Invoice" disabled={loading}>
                                                    {loading ? <Loader2 className="animate-spin h-3 w-3" /> : <Trash2 size={12} className="text-red-600" />}
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer" onClick={() => router.push(`/invoices/${invoice.id}`)}>{invoice.invoiceNumber}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{invoice.customerName}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 hidden md:table-cell">{formatDate(invoice.createdAt)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800 font-semibold">Rs. {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{invoice.notes || '-'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs hidden lg:table-cell">
                                        <span className={getDueDateStatus(invoice).className}>
                                            {getDueDateStatus(invoice).text}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="flex flex-col space-y-0.5">
                                            <span className={`px-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                            {invoice.status.toLowerCase() === 'partial' && invoice.dueAmount !== undefined && (
                                                <span className="text-xs text-gray-600">
                                                    Due: Rs. {invoice.dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800 font-semibold">Rs. {(invoice.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
                                                    variant={currentPage === page ? "primary" : "outline"}
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
                shops={shopsState}
                isLoading={loading}
            />

            <InvoiceEditModal
                isOpen={isEditModalOpen}
                onClose={handleCloseModals}
                onSave={handleEditSuccess}
                customers={customers}
                products={products}
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