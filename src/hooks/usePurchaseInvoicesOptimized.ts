'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { deduplicatedFetchJson } from '@/lib/request-deduplication';
import { cacheService } from '@/lib/cache';
import { PurchaseInvoice, Supplier } from '@/types';

interface PurchaseInvoiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  supplier?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface PaginatedPurchaseResponse {
  data: PurchaseInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Cache keys for different data types
const CACHE_KEYS = {
  purchaseInvoices: (filters: PurchaseInvoiceFilters) =>
    `purchase-invoices-${JSON.stringify(filters)}`,
  suppliers: 'suppliers-list',
  purchaseStats: 'purchase-stats',
};

// Optimized fetch function with caching and deduplication
const fetchPurchaseInvoicesOptimized = async (filters: PurchaseInvoiceFilters): Promise<PaginatedPurchaseResponse> => {
  const cacheKey = CACHE_KEYS.purchaseInvoices(filters);

  // Try cache first
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.supplier) params.append('supplier', filters.supplier);
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const url = `/api/purchases?${params.toString()}`;

  // Use deduplicated fetch
  const data = await deduplicatedFetchJson<PaginatedPurchaseResponse>(url);

  // Cache the result for 2 minutes
  await cacheService.set(cacheKey, data, 120);

  return data;
};

// Optimized hook for purchase invoices with progressive loading
export const usePurchaseInvoicesOptimized = (filters: PurchaseInvoiceFilters = {}) => {
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);

  const queryKey = ['purchase-invoices-optimized', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchPurchaseInvoicesOptimized(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Progressive loading for large datasets
  const loadMoreData = useCallback(async () => {
    if (query.data && filters.page && filters.page < query.data.pagination.totalPages) {
      setIsProgressiveLoading(true);
      try {
        const nextPageFilters = { ...filters, page: filters.page + 1 };
        await fetchPurchaseInvoicesOptimized(nextPageFilters);
      } finally {
        setIsProgressiveLoading(false);
      }
    }
  }, [query.data, filters]);

  return {
    ...query,
    loadMoreData,
    isProgressiveLoading,
    hasNextPage: query.data ? filters.page! < query.data.pagination.totalPages : false,
  };
};

// Infinite query for better UX with large datasets
export const usePurchaseInvoicesInfinite = (baseFilters: Omit<PurchaseInvoiceFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: ['purchase-invoices-infinite', baseFilters],
    queryFn: ({ pageParam = 1 }) =>
      fetchPurchaseInvoicesOptimized({ ...baseFilters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

// Optimized suppliers hook with caching
export const useSuppliersOptimized = () => {
  return useQuery({
    queryKey: ['suppliers-optimized'],
    queryFn: async (): Promise<Supplier[]> => {
      const cached = await cacheService.get(CACHE_KEYS.suppliers);
      if (cached) return cached;

      const data = await deduplicatedFetchJson<Supplier[]>('/api/suppliers');
      await cacheService.set(CACHE_KEYS.suppliers, data, 600); // 10 minutes
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Purchase statistics hook with caching
export const usePurchaseStatsOptimized = (dateRange?: { startDate: string; endDate: string }) => {
  return useQuery({
    queryKey: ['purchase-stats-optimized', dateRange],
    queryFn: async () => {
      const cacheKey = `${CACHE_KEYS.purchaseStats}-${JSON.stringify(dateRange)}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;

      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

      const data = await deduplicatedFetchJson(`/api/purchases/stats?${params.toString()}`);
      await cacheService.set(cacheKey, data, 300); // 5 minutes
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!dateRange,
  });
};

// Optimized mutation hooks with cache invalidation
export const useCreatePurchaseInvoiceOptimized = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create purchase invoice');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch purchase invoices
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats-optimized'] });

      // Clear related cache entries
      cacheService.clear('purchase-invoices');
      cacheService.clear('purchase-stats');
    },
  });
};

export const useUpdatePurchaseInvoiceOptimized = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update purchase invoice');
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      // Invalidate specific invoice and lists
      queryClient.invalidateQueries({ queryKey: ['purchase-invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices-infinite'] });

      // Clear cache
      cacheService.clear('purchase-invoices');
    },
  });
};

export const useDeletePurchaseInvoiceOptimized = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete purchase invoice');
      }

      return response.json();
    },
    onSuccess: (_, id) => {
      // Remove from cache and invalidate queries
      queryClient.removeQueries({ queryKey: ['purchase-invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices-infinite'] });

      // Clear cache
      cacheService.clear('purchase-invoices');
    },
  });
};

// Search suggestions hook with debouncing
export const usePurchaseSearchSuggestions = (query: string, debounceMs = 300) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useMemo(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: ['purchase-search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const data = await deduplicatedFetchJson<string[]>(
        `/api/purchases/search-suggestions?q=${encodeURIComponent(debouncedQuery)}`
      );
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};