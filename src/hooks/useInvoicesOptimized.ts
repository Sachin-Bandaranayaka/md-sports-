import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { toast } from 'react-hot-toast';

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

interface InvoiceFilters {
    status?: string;
    paymentMethod?: string;
    customerId?: string;
    search?: string;
    timePeriod?: string;
    sortBy?: string;
    shopId?: string;
}

interface InvoiceStatistics {
    totalOutstanding: number;
    paidThisMonth: number;
    overdueCount: number;
    totalCreditSales: number;
    totalNonCreditSales: number;
}

interface CreateInvoiceData {
    customerId: number;
    items: Array<{
        productId: number;
        quantity: number;
        price: number;
    }>;
    paymentMethod: string;
    dueDate?: string;
    notes?: string;
}

interface UpdateInvoiceData {
    status?: string;
    paymentMethod?: string;
    dueDate?: string;
    notes?: string;
    items?: Array<{
        id?: number;
        productId: number;
        quantity: number;
        price: number;
    }>;
}

// Query keys
const QUERY_KEYS = {
    invoices: (filters: InvoiceFilters) => ['invoices', filters],
    infiniteInvoices: (filters: InvoiceFilters) => ['invoices', 'infinite', filters],
    invoice: (id: string | number) => ['invoice', id],
    statistics: (shopId?: string) => ['invoice-statistics', shopId],
    customers: ['customers'],
    products: ['products']
};

// API functions
const fetchInvoices = async (filters: InvoiceFilters, pageParam?: string) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
            params.append(key, String(value));
        }
    });

    if (pageParam) {
        params.append('cursor', pageParam);
    }

    params.append('includeStatistics', 'true');

    const response = await fetch(`/api/invoices/optimized?${params}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }

    return response.json();
};

const fetchInvoice = async (id: string | number) => {
    const response = await fetch(`/api/invoices/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.statusText}`);
    }
    return response.json();
};

const createInvoice = async (data: CreateInvoiceData) => {
    const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create invoice');
    }

    return response.json();
};

const updateInvoice = async ({ id, data }: { id: string | number; data: UpdateInvoiceData }) => {
    const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update invoice');
    }

    return response.json();
};

const deleteInvoice = async (id: string | number) => {
    const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete invoice');
    }

    return response.json();
};

const bulkUpdateInvoices = async (invoiceIds: string[], operation: string, data: any) => {
    const response = await fetch('/api/invoices/optimized', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, invoiceIds, data })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to perform bulk operation');
    }

    return response.json();
};

// Main hook
export function useInvoicesOptimized(initialFilters: InvoiceFilters = {}) {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<InvoiceFilters>(initialFilters);
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

    // Debounced search
    const debouncedSetFilters = useMemo(
        () => debounce((newFilters: InvoiceFilters) => {
            setFilters(prev => ({ ...prev, ...newFilters }));
        }, 300),
        []
    );

    // Infinite query for virtual scrolling
    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingInfinite,
        error: infiniteError,
        refetch: refetchInfinite
    } = useInfiniteQuery({
        queryKey: QUERY_KEYS.infiniteInvoices(filters),
        queryFn: ({ pageParam }) => fetchInvoices(filters, pageParam),
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 30000, // 30 seconds
        cacheTime: 300000, // 5 minutes
        refetchOnWindowFocus: false
    });

    // Regular paginated query
    const {
        data: paginatedData,
        isLoading: isLoadingPaginated,
        error: paginatedError,
        refetch: refetchPaginated
    } = useQuery({
        queryKey: QUERY_KEYS.invoices(filters),
        queryFn: () => fetchInvoices(filters),
        staleTime: 30000,
        cacheTime: 300000,
        refetchOnWindowFocus: false
    });

    // Statistics query
    const {
        data: statistics,
        isLoading: isLoadingStatistics
    } = useQuery({
        queryKey: QUERY_KEYS.statistics(filters.shopId),
        queryFn: () => fetchInvoices({ ...filters, includeStatistics: true }).then(data => data.statistics),
        staleTime: 300000, // 5 minutes
        cacheTime: 900000, // 15 minutes
        refetchOnWindowFocus: false
    });

    // Create mutation with optimistic updates
    const createMutation = useMutation({
        mutationFn: createInvoice,
        onMutate: async (newInvoice) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.invoices(filters) });

            // Snapshot previous value
            const previousInvoices = queryClient.getQueryData(QUERY_KEYS.invoices(filters));

            // Optimistically update
            const optimisticInvoice = {
                id: `temp-${Date.now()}`,
                invoiceNumber: `INV-${Date.now()}`,
                ...newInvoice,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            queryClient.setQueryData(QUERY_KEYS.invoices(filters), (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    invoices: [optimisticInvoice, ...old.invoices]
                };
            });

            return { previousInvoices };
        },
        onError: (err, newInvoice, context) => {
            // Rollback on error
            if (context?.previousInvoices) {
                queryClient.setQueryData(QUERY_KEYS.invoices(filters), context.previousInvoices);
            }
            toast.error('Failed to create invoice');
        },
        onSuccess: () => {
            toast.success('Invoice created successfully');
        },
        onSettled: () => {
            // Refetch to get the real data
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice-statistics'] });
        }
    });

    // Update mutation with optimistic updates
    const updateMutation = useMutation({
        mutationFn: updateInvoice,
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.invoice(id) });
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.invoices(filters) });

            const previousInvoice = queryClient.getQueryData(QUERY_KEYS.invoice(id));
            const previousInvoices = queryClient.getQueryData(QUERY_KEYS.invoices(filters));

            // Optimistically update single invoice
            queryClient.setQueryData(QUERY_KEYS.invoice(id), (old: any) => {
                if (!old) return old;
                return { ...old, ...data, updatedAt: new Date().toISOString() };
            });

            // Optimistically update invoice list
            queryClient.setQueryData(QUERY_KEYS.invoices(filters), (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    invoices: old.invoices.map((invoice: Invoice) =>
                        invoice.id === id
                            ? { ...invoice, ...data, updatedAt: new Date().toISOString() }
                            : invoice
                    )
                };
            });

            return { previousInvoice, previousInvoices };
        },
        onError: (err, { id }, context) => {
            if (context?.previousInvoice) {
                queryClient.setQueryData(QUERY_KEYS.invoice(id), context.previousInvoice);
            }
            if (context?.previousInvoices) {
                queryClient.setQueryData(QUERY_KEYS.invoices(filters), context.previousInvoices);
            }
            toast.error('Failed to update invoice');
        },
        onSuccess: () => {
            toast.success('Invoice updated successfully');
        },
        onSettled: (data, error, { id }) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoice(id) });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
    });

    // Delete mutation with optimistic updates
    const deleteMutation = useMutation({
        mutationFn: deleteInvoice,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.invoices(filters) });

            const previousInvoices = queryClient.getQueryData(QUERY_KEYS.invoices(filters));

            // Optimistically remove from list
            queryClient.setQueryData(QUERY_KEYS.invoices(filters), (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    invoices: old.invoices.filter((invoice: Invoice) => invoice.id !== id)
                };
            });

            return { previousInvoices };
        },
        onError: (err, id, context) => {
            if (context?.previousInvoices) {
                queryClient.setQueryData(QUERY_KEYS.invoices(filters), context.previousInvoices);
            }
            toast.error('Failed to delete invoice');
        },
        onSuccess: () => {
            toast.success('Invoice deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice-statistics'] });
        }
    });

    // Bulk operations mutation
    const bulkMutation = useMutation({
        mutationFn: ({ invoiceIds, operation, data }: { invoiceIds: string[]; operation: string; data: any }) =>
            bulkUpdateInvoices(invoiceIds, operation, data),
        onSuccess: (data, variables) => {
            toast.success(`Bulk ${variables.operation} completed successfully`);
            setSelectedInvoices(new Set());
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice-statistics'] });
        },
        onError: () => {
            toast.error('Bulk operation failed');
        }
    });

    // Helper functions
    const updateFilters = useCallback((newFilters: Partial<InvoiceFilters>) => {
        if (newFilters.search !== undefined) {
            debouncedSetFilters(newFilters);
        } else {
            setFilters(prev => ({ ...prev, ...newFilters }));
        }
    }, [debouncedSetFilters]);

    const toggleInvoiceSelection = useCallback((invoiceId: string) => {
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

    const selectAllInvoices = useCallback((invoiceIds: string[]) => {
        setSelectedInvoices(new Set(invoiceIds));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedInvoices(new Set());
    }, []);

    const recordPayment = useCallback((invoiceId: string | number) => {
        return updateMutation.mutateAsync({
            id: invoiceId,
            data: { status: 'paid' }
        });
    }, [updateMutation]);

    // Memoized computed values
    const invoices = useMemo(() => {
        if (infiniteData) {
            return infiniteData.pages.flatMap(page => page.invoices);
        }
        return paginatedData?.invoices || [];
    }, [infiniteData, paginatedData]);

    const isLoading = isLoadingInfinite || isLoadingPaginated;
    const error = infiniteError || paginatedError;

    return {
        // Data
        invoices,
        statistics,
        filters,
        selectedInvoices,

        // Loading states
        isLoading,
        isLoadingStatistics,
        isFetchingNextPage,

        // Error states
        error,

        // Pagination
        hasNextPage,
        fetchNextPage,

        // Actions
        updateFilters,
        refetch: refetchPaginated,
        refetchInfinite,

        // Mutations
        createInvoice: createMutation.mutateAsync,
        updateInvoice: updateMutation.mutateAsync,
        deleteInvoice: deleteMutation.mutateAsync,
        recordPayment,
        bulkUpdate: bulkMutation.mutateAsync,

        // Selection
        toggleInvoiceSelection,
        selectAllInvoices,
        clearSelection,

        // Mutation states
        isCreating: createMutation.isLoading,
        isUpdating: updateMutation.isLoading,
        isDeleting: deleteMutation.isLoading,
        isBulkUpdating: bulkMutation.isLoading
    };
}

// Hook for single invoice
export function useInvoice(id: string | number) {
    const queryClient = useQueryClient();

    const {
        data: invoice,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: QUERY_KEYS.invoice(id),
        queryFn: () => fetchInvoice(id),
        staleTime: 60000, // 1 minute
        cacheTime: 300000, // 5 minutes
        enabled: !!id
    });

    const updateMutation = useMutation({
        mutationFn: updateInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoice(id) });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Invoice updated successfully');
        },
        onError: () => {
            toast.error('Failed to update invoice');
        }
    });

    return {
        invoice,
        isLoading,
        error,
        refetch,
        updateInvoice: updateMutation.mutateAsync,
        isUpdating: updateMutation.isLoading
    };
}

// Hook for invoice statistics
export function useInvoiceStatistics(shopId?: string) {
    return useQuery({
        queryKey: QUERY_KEYS.statistics(shopId),
        queryFn: () => fetchInvoices({ shopId, includeStatistics: true }).then(data => data.statistics),
        staleTime: 300000, // 5 minutes
        cacheTime: 900000, // 15 minutes
        refetchOnWindowFocus: false
    });
}