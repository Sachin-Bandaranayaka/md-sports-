'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// Removed react-hot-toast Toaster - using Sonner from MainLayout instead
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Download, Settings } from 'lucide-react';
import { useInvoicesOptimized } from '@/hooks/useInvoicesOptimized';
import InvoiceListOptimized from '@/components/invoices/InvoiceListOptimized';
import InvoiceFiltersOptimized from '@/components/invoices/InvoiceFiltersOptimized';
import InvoiceStatisticsOptimized from '@/components/invoices/InvoiceStatisticsOptimized';
import InvoiceCreateModal from '@/components/invoices/InvoiceCreateModal';
import InvoiceEditModal from '@/components/invoices/InvoiceEditModal';
import InvoiceViewModal from '@/components/invoices/InvoiceViewModal';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';

// Types
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

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    description?: string;
    category_name?: string;
}

// Create a query client with optimized settings
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000, // 30 seconds
            gcTime: 300000, // 5 minutes (renamed from cacheTime)
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: (failureCount, error: any) => {
                // Don't retry on 4xx errors
                if (error?.status >= 400 && error?.status < 500) {
                    return false;
                }
                return failureCount < 3;
            }
        },
        mutations: {
            retry: 1
        }
    }
});

// Main invoice page component
function InvoicePageContent() {
    const router = useRouter();
    const { canEditInvoices } = usePermission();
    
    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'infinite'>('list');
    const [showDetailedStats, setShowDetailedStats] = useState(false);

    // Initialize the basic invoice query
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        search: '',
        customer: '',
        status: ''
    });
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
    
    const {
        data: invoicesData,
        isLoading,
        error,
        refetch
    } = useInvoicesOptimized(filters);
    
    const invoices = invoicesData?.data || [];
    const statistics = invoicesData?.statistics || null;
    
    // Handle filter updates
    const updateFilters = useCallback((newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);
    
    // Handle invoice selection
    const toggleInvoiceSelection = useCallback((invoiceId: string) => {
        setSelectedInvoices(prev => 
            prev.includes(invoiceId) 
                ? prev.filter(id => id !== invoiceId)
                : [...prev, invoiceId]
        );
    }, []);
    
    const selectAllInvoices = useCallback(() => {
        setSelectedInvoices(invoices.map((inv: Invoice) => inv.id.toString()));
    }, [invoices]);
    
    const clearSelection = useCallback(() => {
        setSelectedInvoices([]);
    }, []);
    
    // Placeholder functions for missing functionality
    const handleCreateInvoice = useCallback(async (data: any) => {
        // TODO: Implement create invoice API call
        console.log('Create invoice:', data);
        refetch();
    }, [refetch]);
    
    const handleUpdateInvoice = useCallback(async (id: string, data: any) => {
        // TODO: Implement update invoice API call
        console.log('Update invoice:', id, data);
        refetch();
    }, [refetch]);
    
    const handleDeleteInvoice = useCallback(async (id: string) => {
        // TODO: Implement delete invoice API call
        console.log('Delete invoice:', id);
        refetch();
    }, [refetch]);
    
    const handleBulkDelete = useCallback(async (ids: string[]) => {
        // TODO: Implement bulk delete API call
        console.log('Bulk delete invoices:', ids);
        setSelectedInvoices([]);
        refetch();
    }, [refetch]);
    
    // Initialize with default filters
    const defaultFilters = useMemo(() => ({
        sortBy: 'createdAt_desc'
    }), []);

    // Fetch customers data
    const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const response = await fetch('/api/customers');
            if (!response.ok) {
                throw new Error('Failed to fetch customers');
            }
            const data = await response.json();
            console.log('Customers API response:', data);
            // Handle different response formats
            return Array.isArray(data) ? data : (data.success ? data.data : data.customers || []);
        },
        staleTime: 300000, // 5 minutes
        gcTime: 600000, // 10 minutes
    });

    // Fetch products data
    const { data: products = [], isLoading: isLoadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const data = await response.json();
            console.log('Products API response:', data);
            // The API returns data in { success: true, data: [...] } format
            return data.success ? data.data : [];
        },
        staleTime: 300000, // 5 minutes
        gcTime: 600000, // 10 minutes
    });

    // Fetch shops data
    const { data: shops = [], isLoading: isLoadingShops } = useQuery({
        queryKey: ['shops'],
        queryFn: async () => {
            const response = await fetch('/api/shops');
            if (!response.ok) {
                throw new Error('Failed to fetch shops');
            }
            const data = await response.json();
            console.log('Shops API response:', data);
            // The API returns data in { success: true, data: [...] } format
            return data.success ? data.data : [];
        },
        staleTime: 300000, // 5 minutes
        gcTime: 600000, // 10 minutes
    });

    // Modal handlers
    const handleOpenCreateModal = useCallback(() => {
        setIsCreateModalOpen(true);
    }, []);

    const handleViewInvoice = useCallback((invoice: Invoice) => {
        router.push(`/invoices/${invoice.id}`);
    }, [router]);

    const handleEditInvoice = useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteInvoiceAction = useCallback(async (invoiceId: string | number) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await handleDeleteInvoice(invoiceId.toString());
            } catch (error) {
                console.error('Failed to delete invoice:', error);
            }
        }
    }, [handleDeleteInvoice]);

    const handleRecordPayment = useCallback(async (invoiceId: string | number) => {
        try {
            await recordPayment(invoiceId);
        } catch (error) {
            console.error('Failed to record payment:', error);
        }
    }, [recordPayment]);

    // Bulk operations
    const handleBulkDeleteAction = useCallback(async () => {
        if (selectedInvoices.length === 0) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete ${selectedInvoices.length} invoice(s)?`
        );

        if (confirmed) {
            try {
                await handleBulkDelete(selectedInvoices);
            } catch (error) {
                console.error('Failed to delete invoices:', error);
            }
        }
    }, [selectedInvoices, handleBulkDelete]);

    const handleExport = useCallback(() => {
        // Implementation for exporting invoices
        console.log('Exporting invoices:', Array.from(selectedInvoices));
    }, [selectedInvoices]);

    // Refresh handlers
    const handleRefresh = useCallback(() => {
        if (viewMode === 'infinite') {
            refetchInfinite();
        } else {
            refetch();
        }
    }, [viewMode, refetch, refetchInfinite]);

    // Load more for infinite scroll
    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Modal close handlers
    const handleCloseModals = useCallback(() => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedInvoice(null);
    }, []);

    // Success handlers
    const handleInvoiceCreated = useCallback(() => {
        handleCloseModals();
        // Refetch will be handled by React Query automatically
    }, [handleCloseModals]);

    const handleInvoiceUpdated = useCallback(() => {
        handleCloseModals();
        // Refetch will be handled by React Query automatically
    }, [handleCloseModals]);

    // Error display
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-red-800 mb-2">
                                Error Loading Invoices
                            </h3>
                            <p className="text-red-600 mb-4">
                                {error.message || 'An unexpected error occurred'}
                            </p>
                            <Button onClick={handleRefresh} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Invoices</h1>
                    <p className="text-gray-600">
                        Manage and track your sales invoices efficiently
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDetailedStats(!showDetailedStats)}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        {showDetailedStats ? 'Simple View' : 'Detailed View'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                        Refresh
                    </Button>
                    {canEditInvoices() && (
                        <Button onClick={handleOpenCreateModal} disabled={isCreating}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Invoice
                        </Button>
                    )}
                </div>
            </div>

            {/* Statistics */}
            <InvoiceStatisticsOptimized
                statistics={statistics}
                isLoading={isLoadingStatistics}
                showDetailed={showDetailedStats}
            />

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="flex items-center gap-2">
                            Invoices
                            {invoices.length > 0 && (
                                <Badge variant="secondary">
                                    {invoices.length} total
                                </Badge>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'infinite')}>
                                <TabsList>
                                    <TabsTrigger value="list">Paginated</TabsTrigger>
                                    <TabsTrigger value="infinite">Infinite Scroll</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <InvoiceFiltersOptimized
                        filters={filters}
                        onFiltersChange={updateFilters}
                        customers={customers}
                        shops={shops}
                        selectedCount={selectedInvoices.length}
                        onBulkDelete={canEditInvoices() ? handleBulkDeleteAction : undefined}
                        onExport={handleExport}
                        isLoading={isLoading}
                    />

                    {/* Invoice List */}
                    <div className="space-y-4">
                        <InvoiceListOptimized
                            invoices={invoices}
                            selectedInvoices={selectedInvoices}
                            onToggleSelection={toggleInvoiceSelection}
                            onSelectAll={selectAllInvoices}
                            onClearSelection={clearSelection}
                            onView={handleViewInvoice}
                            onEdit={canEditInvoices() ? handleEditInvoice : undefined}
                            onDelete={canEditInvoices() ? handleDeleteInvoiceAction : undefined}
                            onRecordPayment={handleRecordPayment}
                            isLoading={isLoading}
                            height={600}
                        />

                        {/* Load More Button for Infinite Scroll */}
                        {viewMode === 'infinite' && hasNextPage && (
                            <div className="text-center">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={isFetchingNextPage}
                                >
                                    {isFetchingNextPage ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Loading more...
                                        </>
                                    ) : (
                                        'Load More'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            <InvoiceCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModals}
                onSave={handleCreateInvoice}
                customers={customers}
                            products={products}
                            shops={shops}
                isLoading={isLoadingCustomers || isLoadingProducts || isLoadingShops}
            />

            {selectedInvoice && (
                <>
                    <InvoiceEditModal
                        isOpen={isEditModalOpen}
                        onClose={handleCloseModals}
                        onSuccess={handleInvoiceUpdated}
                        initialData={selectedInvoice}
                    />

                    <InvoiceViewModal
                        isOpen={isViewModalOpen}
                        onClose={handleCloseModals}
                        invoice={selectedInvoice}
                    />
                </>
            )}

            {/* Loading Overlay */}
            {(isCreating || isUpdating || isDeleting || isBulkUpdating) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span>
                                {isCreating && 'Creating invoice...'}
                                {isUpdating && 'Updating invoice...'}
                                {isDeleting && 'Deleting invoice...'}
                                {isBulkUpdating && 'Processing bulk operation...'}
                            </span>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

// Main page component with providers
export default function OptimizedInvoicesPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <InvoicePageContent />
            {/* Toast notifications handled by Sonner in MainLayout */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;