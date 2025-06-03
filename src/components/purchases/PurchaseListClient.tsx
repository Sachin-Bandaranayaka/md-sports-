'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, FileText, ExternalLink, Calendar, DollarSign, X, RefreshCw } from 'lucide-react';
import { PurchaseInvoice, Supplier } from '@/types';
import { usePurchaseUpdates } from '@/hooks/useWebSocket';
import { WEBSOCKET_EVENTS } from '@/lib/websocket';
import { toast } from 'sonner';
// InvoiceFormModal import removed - using separate pages for forms

// Status badge colors (can be utility)
const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'partial':
            return 'bg-yellow-100 text-yellow-800';
        case 'unpaid':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

interface PurchaseListClientProps {
    initialPurchaseInvoices: PurchaseInvoice[];
    initialSuppliers: Supplier[];
    initialTotalPages: number;
    initialCurrentPage: number;
}

export default function PurchaseListClient({
    initialPurchaseInvoices,
    initialSuppliers,
    initialTotalPages,
    initialCurrentPage,
}: PurchaseListClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(initialPurchaseInvoices);
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [loading, setLoading] = useState<boolean>(false); // Initial load handled by server
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isWebSocketUpdate, setIsWebSocketUpdate] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(new Date());

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [currentPage, setCurrentPage] = useState(initialCurrentPage);
    const [totalPages, setTotalPages] = useState(initialTotalPages);

    // New filter states
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [supplierFilter, setSupplierFilter] = useState(searchParams.get('supplierId') || '');
    const [startDateFilter, setStartDateFilter] = useState(searchParams.get('startDate') || '');
    const [endDateFilter, setEndDateFilter] = useState(searchParams.get('endDate') || '');

    // Modal states removed - using separate pages for detail and edit views

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchTerm) {
                params.set('search', searchTerm);
            } else {
                params.delete('search');
            }
            params.set('page', '1'); // Reset to page 1 on new search
            router.replace(`${pathname}?${params.toString()}`);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, router, pathname, searchParams]);

    // useEffect to update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (statusFilter) params.set('status', statusFilter); else params.delete('status');
        if (supplierFilter) params.set('supplierId', supplierFilter); else params.delete('supplierId');
        if (startDateFilter) params.set('startDate', startDateFilter); else params.delete('startDate');
        if (endDateFilter) params.set('endDate', endDateFilter); else params.delete('endDate');

        // Reset to page 1 when filters change, except for initial load or if only page changes
        const currentPathQuery = `?${params.toString()}`;
        if (pathname + currentPathQuery !== window.location.pathname + window.location.search) {
            params.set('page', '1');
        }

        router.replace(`${pathname}?${params.toString()}`);
    }, [statusFilter, supplierFilter, startDateFilter, endDateFilter, router, pathname, searchParams]);

    // Update state if initial props change (e.g. due to navigation)
    useEffect(() => {
        if (!isWebSocketUpdate) {
            setPurchaseInvoices(initialPurchaseInvoices);
            setSuppliers(initialSuppliers);
            setTotalPages(initialTotalPages);
            setCurrentPage(initialCurrentPage);
            setSearchTerm(searchParams.get('search') || '');
            // Initialize new filters from searchParams as well
            setStatusFilter(searchParams.get('status') || '');
            setSupplierFilter(searchParams.get('supplierId') || '');
            setStartDateFilter(searchParams.get('startDate') || '');
            setEndDateFilter(searchParams.get('endDate') || '');
            setLastRefreshed(new Date());
        }
        setIsWebSocketUpdate(false);
    }, [initialPurchaseInvoices, initialSuppliers, initialTotalPages, initialCurrentPage, searchParams, isWebSocketUpdate]);

    // WebSocket handler for purchase updates
    const handlePurchaseUpdate = useCallback((eventData: any) => {
        console.log('Received purchase update via WebSocket:', eventData);
        setIsWebSocketUpdate(true);

        const { type, ...payload } = eventData;

        if (type === WEBSOCKET_EVENTS.PURCHASE_INVOICE_CREATED && payload.invoice) {
            console.log('Adding new purchase invoice to list:', payload.invoice);
            setPurchaseInvoices(prev => {
                // Add to beginning of list if on first page
                if (currentPage === 1) {
                    return [payload.invoice, ...prev];
                }
                // If not on page 1, or to simply refresh to show correct total/pagination:
                // router.refresh(); // Option: refresh if created item should appear on other pages or affect totals
                return prev;
            });
            setLastRefreshed(new Date());
        } else if (type === WEBSOCKET_EVENTS.PURCHASE_INVOICE_UPDATED && payload.invoice) {
            console.log('Updating purchase invoice in list:', payload.invoice);
            setPurchaseInvoices(prev =>
                prev.map(invoice => invoice.id === payload.invoice.id ? payload.invoice : invoice)
            );
            setLastRefreshed(new Date());
            // Optionally, refresh if an update could affect sorting or filtering that's partially server-managed
            // router.refresh();
        } else if (type === WEBSOCKET_EVENTS.PURCHASE_INVOICE_DELETED && payload.id) {
            console.log('Removing purchase invoice from list:', payload.id);
            setPurchaseInvoices(prev => prev.filter(invoice => invoice.id !== payload.id));
            setLastRefreshed(new Date());
            router.refresh();
        }
    }, [currentPage, router]);

    // Subscribe to purchase updates via WebSocket
    usePurchaseUpdates(handlePurchaseUpdate);

    // Function to manually refresh data
    const refreshData = useCallback(async () => {
        try {
            setIsRefreshing(true);
            setError(null);

            // Build query parameters
            const params = new URLSearchParams(searchParams);
            params.set('_t', Date.now().toString()); // Add timestamp to bust cache

            console.log('Manually refreshing purchase invoices...');

            const response = await fetch(`/api/purchases?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to refresh: ${response.status}`);
            }

            const data = await response.json();

            if (data.data) {
                setPurchaseInvoices(data.data || []);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setCurrentPage(data.pagination.page);
                }
                setLastRefreshed(new Date());
            } else if (data.error && data.error.message) {
                throw new Error(data.error.message);
            } else {
                throw new Error('Failed to refresh data due to an unknown error structure');
            }
        } catch (err) {
            console.error('Error refreshing data:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh data');
        } finally {
            setIsRefreshing(false);
        }
    }, [searchParams]);

    // Auto-refresh when page loads - REMOVED as initial props should be sufficient
    // useEffect(() => {
    //     refreshData();
    // }, []);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleAddInvoice = () => { router.push('/purchases/new'); };

    const handleEditInvoice = (invoice: PurchaseInvoice) => {
        router.push(`/purchases/${invoice.id}/edit`);
    };

    const handleViewInvoice = (invoice: PurchaseInvoice) => {
        router.push(`/purchases/${invoice.id}`);
    };

    const handleDeleteInvoice = async (id: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/purchases/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Expect standardized error: { error: { message: "..." } }
                const message = errorData.error?.message || 'Failed to delete purchase invoice';
                throw new Error(message);
            }
            // Remove manual local state update - let WebSocket handle UI update for consistency
            // The PURCHASE_INVOICE_DELETED event will automatically update the UI
            toast.success('Invoice deleted successfully.');
        } catch (err: any) {
            console.error('Error deleting purchase invoice:', err);
            setError(err.message || 'Failed to delete purchase invoice. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Modal handlers removed - using separate pages for detail and edit views


    // Placeholder for modals - these should be imported or defined
    const InvoiceDetailModal = ({ invoice, onClose, onEdit }: { invoice: PurchaseInvoice, onClose: () => void, onEdit: (inv: PurchaseInvoice) => void }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Invoice Details: {invoice.invoiceNumber}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                </div>
                <p><strong>Supplier:</strong> {invoice.supplier?.name || 'N/A'}</p>
                <p><strong>Date:</strong> {invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Due Date:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Amount:</strong> Rs. {invoice.total?.toLocaleString() || '0.00'}</p>
                <p><strong>Status:</strong> {invoice.status}</p>
                <h3 className="font-semibold mt-4 mb-2">Items:</h3>
                {invoice.items && invoice.items.length > 0 ? (
                    <ul className="list-disc pl-5">
                        {invoice.items.map(item => (
                            <li key={item.id}>{item.product?.name} (Qty: {item.quantity}, Price: {item.price})</li>
                        ))}
                    </ul>
                ) : <p>No items found.</p>}
                <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button variant="primary" onClick={() => onEdit(invoice)}>Edit Invoice</Button>
                </div>
            </div>
        </div>
    );

    const InvoiceFormModal = ({ open, onClose, onSave, suppliers, initialData, isEditMode }: any) => {
        // This is a simplified placeholder. The actual form is more complex.
        // In a real scenario, this would be a separate, more detailed component.
        if (!open) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                    <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Edit' : 'Add'} Purchase Invoice</h2>
                    <p>Form fields would go here...</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" onClick={() => onSave({})}>Save</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header with actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Invoices</h1>
                    <p className="text-gray-500">Manage your purchase invoices and supplier orders</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleAddInvoice}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Purchase Invoice
                    </Button>
                </div>
            </div>

            {/* Last refreshed indicator */}
            {lastRefreshed && (
                <div className="text-xs text-gray-500 mb-2 flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 bg-green-500`}></div>
                    Last refreshed: {lastRefreshed.toLocaleTimeString()}
                </div>
            )}

            {/* Search bar */}
            <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                        placeholder="Search invoices by number, supplier or status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        id="status-filter"
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="overdue">Overdue</option>
                        {/* Add other statuses if they exist */}
                    </select>
                </div>
                <div>
                    <label htmlFor="supplier-filter" className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                        id="supplier-filter"
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        value={supplierFilter}
                        onChange={(e) => setSupplierFilter(e.target.value)}
                    >
                        <option value="">All Suppliers</option>
                        {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id!.toString()}>{supplier.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        id="start-date-filter"
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type="date"
                        id="end-date-filter"
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        value={endDateFilter}
                        onChange={(e) => setEndDateFilter(e.target.value)}
                    />
                </div>
            </div>

            {loading && <div className="text-center py-4">Loading...</div>}
            {error && (
                <div className="text-center py-4 text-red-500">
                    <p>{error}</p>
                    <Button variant="outline" size="sm" onClick={() => router.refresh()} className="mt-2">Retry</Button>
                </div>
            )}

            {/* Invoices table */}
            {!loading && !error && (
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Invoice #</th>
                                    <th className="px-6 py-3">Supplier</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Due Date</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseInvoices.length > 0 ? purchaseInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            <button onClick={() => handleViewInvoice(invoice)} className="text-primary hover:underline">{invoice.invoiceNumber}</button>
                                        </td>
                                        <td className="px-6 py-4">{invoice.supplier?.name || 'Unknown Supplier'}</td>
                                        <td className="px-6 py-4">{invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-4">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-4 font-medium">Rs. {invoice.total ? invoice.total.toLocaleString() : '0.00'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(invoice.status || '')}`}>
                                                {invoice.status?.charAt(0).toUpperCase() + (invoice.status?.slice(1) || '')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)} title="View Details">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(invoice)} title="Edit Invoice">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteInvoice(invoice.id!)} title="Delete Invoice" className="text-red-500 hover:text-red-700">
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center">
                                            No purchase invoices found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-gray-700">
                                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals removed - using separate pages for detail and edit views */}
        </>
    );
}