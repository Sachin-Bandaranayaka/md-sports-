'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, FileText, ExternalLink, Calendar, DollarSign, X, RefreshCw } from 'lucide-react';
import { PurchaseInvoice, Supplier } from '@/types';
import { usePurchaseInvoices, useDeletePurchaseInvoice } from '@/hooks/useQueries';
import { usePurchaseUpdates } from '@/hooks/useRealtime';
import { toast } from 'sonner';
import NewPurchaseInvoiceModal from '@/components/purchases/NewPurchaseInvoiceModal';
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

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [supplierFilter, setSupplierFilter] = useState(searchParams.get('supplierId') || '');
    const [startDateFilter, setStartDateFilter] = useState(searchParams.get('startDate') || '');
    const [endDateFilter, setEndDateFilter] = useState(searchParams.get('endDate') || '');
    const [currentPage, setCurrentPage] = useState(initialCurrentPage);
    const itemsPerPage = 10;

    // React Query for data fetching
    const {
        data: purchasesData,
        isLoading: loading,
        error,
        refetch
    } = usePurchaseInvoices({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        supplier: supplierFilter,
        status: statusFilter,
        startDate: startDateFilter,
        endDate: endDateFilter
    });

    const deleteInvoiceMutation = useDeletePurchaseInvoice();

    // Real-time updates for purchase invoices
    const { updates: purchaseUpdates } = usePurchaseUpdates({
        enabled: true,
        onUpdate: (update) => {
            console.log('Purchase invoice update received:', update);
            // Refetch data when purchase invoices are created, updated, or deleted
            if (update.type === 'purchase') {
                refetch();
                toast.success(`Purchase invoice ${update.data.action === 'created' ? 'created' : update.data.action === 'updated' ? 'updated' : 'modified'} successfully!`);
            }
        }
    });

    // Transform the purchase invoices to ensure supplier name is available
    const rawPurchaseInvoices = purchasesData?.data || initialPurchaseInvoices;
    const purchaseInvoices = rawPurchaseInvoices.map(invoice => ({
        ...invoice,
        supplierName: invoice.supplierName || invoice.supplier?.name || 'Unknown Supplier'
    }));
    const totalPages = purchasesData?.pagination?.totalPages || initialTotalPages;
    const suppliers = initialSuppliers;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(new Date());
    const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
    const [customError, setCustomError] = useState<string | null>(null);

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
        setSearchTerm(searchParams.get('search') || '');
        
        // Handle success status separately from invoice status filter
        const urlStatus = searchParams.get('status') || '';
        const urlAction = searchParams.get('action') || '';
        
        if (urlStatus === 'success') {
            // Show success message based on action
            if (urlAction === 'update') {
                toast.success('Purchase invoice updated successfully!');
            } else if (urlAction === 'create') {
                toast.success('Purchase invoice created successfully!');
            }
            
            // Clear the success status from URL without affecting other params
            const params = new URLSearchParams(searchParams);
            params.delete('status');
            params.delete('action');
            router.replace(`${pathname}?${params.toString()}`);
            
            // Don't set statusFilter to 'success'
            setStatusFilter('');
        } else {
            // Normal invoice status filter (paid, unpaid, etc.)
            setStatusFilter(urlStatus);
        }
        
        setSupplierFilter(searchParams.get('supplierId') || '');
        setStartDateFilter(searchParams.get('startDate') || '');
        setEndDateFilter(searchParams.get('endDate') || '');
        setLastRefreshed(new Date());
    }, [searchParams, pathname, router]);

    // Refetch when filters change
    useEffect(() => {
        refetch();
    }, [searchTerm, statusFilter, supplierFilter, startDateFilter, endDateFilter, currentPage, refetch]);

    // Function to manually refresh data
    const refreshData = useCallback(async () => {
        try {
            setIsRefreshing(true);
            setCustomError(null);

            console.log('Manually refreshing purchase invoices...');

            // First, trigger server-side cache revalidation
            try {
                await fetch('/api/revalidate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tags: ['purchase-invoices']
                    }),
                });
            } catch (revalidateError) {
                console.warn('Server-side cache revalidation failed:', revalidateError);
                // Continue with client-side refresh even if revalidation fails
            }

            // Then refetch using React Query
            await refetch();
            
            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Error refreshing data:', err);
            setCustomError(err instanceof Error ? err.message : 'Failed to refresh data');
        } finally {
            setIsRefreshing(false);
        }
    }, [refetch]);

    // Auto-refresh when page loads - REMOVED as initial props should be sufficient
    // useEffect(() => {
    //     refreshData();
    // }, []);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleAddInvoice = () => {
        // Open modal instead of redirecting
        setShowNewInvoiceModal(true);
    };

    // Function to handle successful invoice creation
    const handleInvoiceCreated = () => {
        // Close the modal
        setShowNewInvoiceModal(false);
        // Refresh the data
        refetch();
        // Note: Success message is shown by the form component
    };

    const handleEditInvoice = (invoice: PurchaseInvoice) => {
        router.push(`/purchases/${invoice.id}/edit`);
    };

    const handleViewInvoice = (invoice: PurchaseInvoice) => {
        router.push(`/purchases/${invoice.id}`);
    };

    const handleDeleteInvoice = async (id: string) => {
        if (!confirm('Are you sure you want to delete this purchase invoice?')) {
            return;
        }

        try {
            await deleteInvoiceMutation.mutateAsync(id);
            toast.success('Invoice deleted successfully.');
        } catch (err: any) {
            console.error('Error deleting purchase invoice:', err);
            toast.error('Failed to delete purchase invoice. Please try again.');
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
                <p><strong>Supplier:</strong> {invoice.supplierName || 'N/A'}</p>
                <p><strong>Date:</strong> {invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Due Date:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Amount:</strong> Rs. {invoice.total?.toLocaleString() || '0.00'}</p>
                <p><strong>Status:</strong> {invoice.status}</p>
                <h3 className="font-semibold mt-4 mb-2">Items:</h3>
                {invoice.items && invoice.items.length > 0 ? (
                    <ul className="list-disc pl-5">
                        {invoice.items.map(item => (
                            <li key={item.id}>{item.productName} (Qty: {item.quantity}, Price: {item.unitPrice})</li>
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
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddInvoice}
                        className="flex items-center gap-2"
                    >
                        <Plus size={16} />
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
            {(error || customError) && (
                <div className="text-center py-4 text-red-500">
                    <p>{error instanceof Error ? error.message : customError || 'An error occurred'}</p>
                    <Button variant="outline" size="sm" onClick={() => {
                        setCustomError(null);
                        refetch();
                    }} className="mt-2">Retry</Button>
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
                                        <td className="px-6 py-4">{invoice.supplierName || 'Unknown Supplier'}</td>
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

            {/* New Purchase Invoice Modal */}
            <NewPurchaseInvoiceModal
                isOpen={showNewInvoiceModal}
                onClose={() => setShowNewInvoiceModal(false)}
                onSuccess={handleInvoiceCreated}
                suppliers={suppliers}
            />
        </>
    );
}