'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, FileText, ExternalLink, Calendar, DollarSign, X, RefreshCw, Filter, Download } from 'lucide-react';
import { PurchaseInvoice, Supplier } from '@/types';
import {
  usePurchaseInvoicesOptimized,
  usePurchaseInvoicesInfinite,
  useDeletePurchaseInvoiceOptimized,
  usePurchaseSearchSuggestions
} from '@/hooks/usePurchaseInvoicesOptimized';
import { useSuppliersOptimized } from '@/hooks/useQueries';
import { useSupplierUpdates } from '@/hooks/useRealtime';
import { toast } from 'sonner';
import NewPurchaseInvoiceModal from '@/components/purchases/NewPurchaseInvoiceModal';
import { FixedSizeList as List } from 'react-window';
import { debounce } from 'lodash';
import { queryKeys } from '@/context/QueryProvider';

// Status badge colors
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'unpaid':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Memoized invoice row component for better performance
const InvoiceRow = React.memo(({ invoice, onEdit, onDelete, onView }: {
  invoice: PurchaseInvoice;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {invoice.invoiceNumber}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {invoice.supplier?.name || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(invoice.date).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${invoice.totalAmount?.toFixed(2) || '0.00'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(invoice.status)
          }`}>
          {invoice.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex space-x-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(invoice.id.toString())}
            className="text-blue-600 hover:text-blue-900"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(invoice.id.toString())}
            className="text-indigo-600 hover:text-indigo-900"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(invoice.id.toString())}
            className="text-red-600 hover:text-red-900"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

InvoiceRow.displayName = 'InvoiceRow';

// Virtualized list item component
const VirtualizedInvoiceItem = ({ index, style, data }: any) => {
  const { invoices, onEdit, onDelete, onView } = data;
  const invoice = invoices[index];

  if (!invoice) return null;

  return (
    <div style={style} className="border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
        <div className="flex-1 grid grid-cols-5 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
            <div className="text-sm text-gray-500">{invoice.supplier?.name || 'N/A'}</div>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(invoice.date).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-900">
            ${invoice.totalAmount?.toFixed(2) || '0.00'}
          </div>
          <div>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(invoice.status)
              }`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex space-x-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(invoice.id.toString())}
              className="text-blue-600 hover:text-blue-900"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(invoice.id.toString())}
              className="text-indigo-600 hover:text-indigo-900"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(invoice.id.toString())}
              className="text-red-600 hover:text-red-900"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PurchaseListClientOptimizedProps {
  initialPurchaseInvoices?: PurchaseInvoice[];
  initialSuppliers?: Supplier[];
  initialTotalPages?: number;
  initialCurrentPage?: number;
  enableVirtualization?: boolean;
  enableInfiniteScroll?: boolean;
}

export default function PurchaseListClientOptimized({
  initialPurchaseInvoices = [],
  initialSuppliers = [],
  initialTotalPages = 0,
  initialCurrentPage = 1,
  enableVirtualization = false,
  enableInfiniteScroll = false,
}: PurchaseListClientOptimizedProps) {
  const _router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  // Handle success status separately from invoice status filter
    const urlStatus = searchParams.get('status') || '';
    const urlAction = searchParams.get('action') || '';
    const [statusFilter, setStatusFilter] = useState(
        urlStatus === 'success' ? '' : urlStatus
    );
  const [supplierFilter, setSupplierFilter] = useState(searchParams.get('supplierId') || '');
  const [startDateFilter, setStartDateFilter] = useState(searchParams.get('startDate') || '');
  const [endDateFilter, setEndDateFilter] = useState(searchParams.get('endDate') || '');
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const itemsPerPage = 20; // Increased for better performance

  // Handle success status messages from URL
  useEffect(() => {
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
    }
  }, [urlStatus, urlAction, searchParams, pathname]);

  // Memoized filters object
  const filters = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    supplier: supplierFilter,
    status: statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  }), [currentPage, itemsPerPage, searchTerm, supplierFilter, statusFilter, startDateFilter, endDateFilter]);

  // Choose between regular pagination or infinite scroll
  const useInfiniteQuery = enableInfiniteScroll;

  // Regular pagination query
  const {
    data: purchasesData,
    isLoading: loading,
    error,
    refetch,
    isRefetching
  } = usePurchaseInvoicesOptimized(filters, { enabled: !useInfiniteQuery });

  // Infinite scroll query
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: infiniteLoading,
    error: infiniteError,
    refetch: infiniteRefetch
  } = usePurchaseInvoicesInfinite(
    { search: searchTerm, supplier: supplierFilter, status: statusFilter, startDate: startDateFilter, endDate: endDateFilter },
    { enabled: useInfiniteQuery }
  );

  // Suppliers query
  const { data: suppliers = initialSuppliers } = useSuppliersOptimized();
  
  // Enable real-time updates for suppliers
  useSupplierUpdates();

  // Search suggestions
  const { data: searchSuggestions = [] } = usePurchaseSearchSuggestions(searchTerm);

  // Delete mutation
  const deleteInvoiceMutation = useDeletePurchaseInvoiceOptimized();

  // Derived data
  const purchaseInvoices = useMemo(() => {
    if (useInfiniteQuery) {
      return infiniteData?.pages.flatMap(page => page.data) || initialPurchaseInvoices;
    }
    return purchasesData?.data || initialPurchaseInvoices;
  }, [useInfiniteQuery, infiniteData, purchasesData, initialPurchaseInvoices]);

  const totalPages = purchasesData?.pagination?.totalPages || initialTotalPages;
  const isLoadingData = useInfiniteQuery ? infiniteLoading : loading;
  const errorData = useInfiniteQuery ? infiniteError : error;

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      router.replace(`${pathname}?${params.toString()}`);
      setCurrentPage(1);
    }, 300),
    [pathname, searchParams]
  );

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (statusFilter) params.set('status', statusFilter); else params.delete('status');
    if (supplierFilter) params.set('supplierId', supplierFilter); else params.delete('supplierId');
    if (startDateFilter) params.set('startDate', startDateFilter); else params.delete('startDate');
    if (endDateFilter) params.set('endDate', endDateFilter); else params.delete('endDate');
    params.set('page', currentPage.toString());

    router.replace(`${pathname}?${params.toString()}`);
  }, [statusFilter, supplierFilter, startDateFilter, endDateFilter, currentPage, pathname, searchParams]);

  // Infinite scroll setup
  useEffect(() => {
    if (!useInfiniteQuery || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [useInfiniteQuery, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Action handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (useInfiniteQuery) {
        await infiniteRefetch();
      } else {
        await refetch();
      }
      toast.success('Data refreshed successfully');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [useInfiniteQuery, infiniteRefetch, refetch]);

  const handleEdit = useCallback((id: string) => {
    router.push(`/purchases/${id}/edit`);
  }, []);

  const handleView = useCallback((id: string) => {
    router.push(`/purchases/${id}`);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase invoice?')) return;

    try {
      await deleteInvoiceMutation.mutateAsync(id);
      toast.success('Purchase invoice deleted successfully');
    } catch {
      toast.error('Failed to delete purchase invoice');
    }
  }, [deleteInvoiceMutation]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setSupplierFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
    router.replace(pathname);
  }, [pathname]);

  // Export functionality
  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (supplierFilter) params.append('supplier', supplierFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);
      params.append('export', 'true');

      const response = await fetch(`/api/purchases?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase-invoices-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export completed successfully');
    } catch {
      toast.error('Failed to export data');
    }
  }, [searchTerm, statusFilter, supplierFilter, startDateFilter, endDateFilter]);

  // Render loading state
  if (isLoadingData && purchaseInvoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading purchase invoices...</span>
      </div>
    );
  }

  // Render error state
  if (errorData) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load purchase invoices</div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Invoices</h1>
          <p className="text-gray-600 mt-1">
            {purchaseInvoices.length} invoice{purchaseInvoices.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing || isRefetching}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isRefetching) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowNewInvoiceModal(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by invoice number or supplier..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search suggestions */}
            {searchSuggestions.length > 0 && searchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchChange(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(statusFilter || supplierFilter || startDateFilter || endDateFilter) && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              {/* Supplier Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(statusFilter || supplierFilter || startDateFilter || endDateFilter) && (
              <div className="mt-4">
                <Button onClick={clearFilters} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoice List */}
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        {purchaseInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase invoices</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter || supplierFilter || startDateFilter || endDateFilter
                ? 'No invoices match your current filters.'
                : 'Get started by creating a new purchase invoice.'}
            </p>
            {!(searchTerm || statusFilter || supplierFilter || startDateFilter || endDateFilter) && (
              <div className="mt-6">
                <Button onClick={() => setShowNewInvoiceModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Purchase Invoice
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {enableVirtualization ? (
              // Virtualized list for large datasets
              <div className="h-96">
                <List
                  ref={listRef}
                  height={384}
                  itemCount={purchaseInvoices.length}
                  itemSize={80}
                  itemData={{
                    invoices: purchaseInvoices,
                    onEdit: handleEdit,
                    onDelete: handleDelete,
                    onView: handleView,
                  }}
                >
                  {VirtualizedInvoiceItem}
                </List>
              </div>
            ) : (
              // Regular table view
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseInvoices.map((invoice) => (
                      <InvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Infinite scroll loading indicator */}
            {useInfiniteQuery && (
              <div ref={loadMoreRef} className="p-4 text-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading more...</span>
                  </div>
                ) : hasNextPage ? (
                  <Button onClick={() => fetchNextPage()} variant="outline">
                    Load More
                  </Button>
                ) : (
                  <span className="text-gray-500">No more invoices to load</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination for regular mode */}
      {!useInfiniteQuery && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {showNewInvoiceModal && (
        <NewPurchaseInvoiceModal
          isOpen={showNewInvoiceModal}
          onClose={() => setShowNewInvoiceModal(false)}
          onSuccess={() => {
            // Refetch suppliers and purchase invoices when a new invoice is created
            queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
            queryClient.invalidateQueries({ queryKey: queryKeys.suppliersList() });
            if (useInfiniteQuery) {
              infiniteRefetch();
            } else {
              refetch();
            }
            setShowNewInvoiceModal(false);
          }}
          suppliers={suppliers}
        />
      )}
    </div>
  );
}