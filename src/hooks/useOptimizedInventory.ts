/**
 * Enterprise-grade Optimized Inventory Hooks
 * Advanced React Query implementation with predictive caching and real-time updates
 */

import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { inventoryCacheService, INVENTORY_CACHE_CONFIG } from '@/lib/inventoryCache';
import { useDebounce } from '@/hooks/useDebounce';
import { useWebSocket } from '@/hooks/useWebSocket';

// Types
interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'In Stock' | 'Low Stock' | 'Out of Stock';
  shopId?: number;
  sortBy?: 'name' | 'quantity' | 'value' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
}

interface InventoryItem {
  product_id: number;
  product_name: string;
  product_code: string;
  category_name: string;
  shop_name: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  stock_status: string;
  unit_price: number;
  total_value: number;
  last_updated: string;
  reorder_point: number;
  supplier_name: string;
}

interface InventoryResponse {
  data: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    cacheHit: boolean;
    responseTime: number;
    dataSource: 'cache' | 'materialized_view' | 'live_query';
    lastUpdated: string;
  };
}

interface UseOptimizedInventoryOptions {
  filters?: InventoryFilters;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  suspense?: boolean;
  enableRealtime?: boolean;
  enablePredictiveLoading?: boolean;
  enableOfflineSupport?: boolean;
}

interface UseOptimizedInventoryReturn {
  data: InventoryItem[];
  pagination: InventoryResponse['pagination'] | undefined;
  meta: InventoryResponse['meta'] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  isStale: boolean;
  refetch: () => void;
  prefetchNext: () => void;
  prefetchPrevious: () => void;
  invalidate: () => void;
  updateFilters: (newFilters: Partial<InventoryFilters>) => void;
  exportData: () => Promise<Blob>;
  cacheMetrics: any;
}

// Query key factory
const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters: InventoryFilters) => [...inventoryKeys.lists(), filters] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...inventoryKeys.details(), id] as const,
  analytics: () => [...inventoryKeys.all, 'analytics'] as const,
  alerts: () => [...inventoryKeys.all, 'alerts'] as const,
};

// API functions
const fetchInventory = async (filters: InventoryFilters): Promise<InventoryResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  // Add cache and meta flags
  params.append('useCache', 'true');
  params.append('includeMeta', 'true');

  const response = await fetch(`/api/inventory/optimized?${params}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const fetchInventoryItem = async (id: number): Promise<InventoryItem> => {
  const response = await fetch(`/api/inventory/optimized/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Main optimized inventory hook with enterprise features
 */
export function useOptimizedInventory(
  options: UseOptimizedInventoryOptions = {}
): UseOptimizedInventoryReturn {
  const {
    filters = { page: 1, limit: 20 },
    enabled = true,
    staleTime = 30 * 1000, // 30 seconds
    cacheTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = false,
    refetchInterval = false,
    suspense = false,
    enableRealtime = true,
    enablePredictiveLoading = true,
    enableOfflineSupport = true,
  } = options;

  const queryClient = useQueryClient();
  const debouncedFilters = useDebounce(filters, 300);
  const previousFiltersRef = useRef<InventoryFilters>(debouncedFilters);

  // Generate query key
  const queryKey = useMemo(() => inventoryKeys.list(debouncedFilters), [debouncedFilters]);

  // Main query
  const query = useQuery({
    queryKey,
    queryFn: () => fetchInventory(debouncedFilters),
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    refetchInterval,
    suspense,
    retry: (failureCount, error) => {
      // Retry logic for network errors
      if (failureCount < 3 && error.message.includes('fetch')) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Offline support
    networkMode: enableOfflineSupport ? 'offlineFirst' : 'online',
  });

  // Real-time updates via WebSocket
  const { isConnected } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    enabled: enableRealtime,
    onMessage: useCallback((message) => {
      try {
        const data = JSON.parse(message.data);

        if (data.type === 'inventory_update') {
          // Invalidate affected queries
          queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });

          // Smart invalidation based on the update
          if (data.productId || data.shopId || data.categoryId) {
            inventoryCacheService.invalidateInventoryData(
              data.productId,
              data.shopId,
              data.categoryId
            );
          }
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    }, [queryClient]),
  });

  // Predictive loading for adjacent pages
  useEffect(() => {
    if (!enablePredictiveLoading || !query.data) return;

    const { pagination } = query.data;
    const currentPage = pagination?.page || 1;

    // Prefetch next page
    if (pagination?.hasNext) {
      const nextPageFilters = { ...debouncedFilters, page: currentPage + 1 };
      queryClient.prefetchQuery({
        queryKey: inventoryKeys.list(nextPageFilters),
        queryFn: () => fetchInventory(nextPageFilters),
        staleTime: staleTime / 2, // Shorter stale time for prefetched data
      });
    }

    // Prefetch previous page
    if (pagination?.hasPrev) {
      const prevPageFilters = { ...debouncedFilters, page: currentPage - 1 };
      queryClient.prefetchQuery({
        queryKey: inventoryKeys.list(prevPageFilters),
        queryFn: () => fetchInventory(prevPageFilters),
        staleTime: staleTime / 2,
      });
    }
  }, [query.data, debouncedFilters, queryClient, staleTime, enablePredictiveLoading]);

  // Track filter usage for analytics
  useEffect(() => {
    if (JSON.stringify(previousFiltersRef.current) !== JSON.stringify(debouncedFilters)) {
      inventoryCacheService.trackFilterUsage(debouncedFilters);
      previousFiltersRef.current = debouncedFilters;
    }
  }, [debouncedFilters]);

  // Helper functions
  const prefetchNext = useCallback(() => {
    if (!query.data?.pagination?.hasNext) return;

    const nextPageFilters = {
      ...debouncedFilters,
      page: (query.data.pagination.page || 1) + 1
    };

    queryClient.prefetchQuery({
      queryKey: inventoryKeys.list(nextPageFilters),
      queryFn: () => fetchInventory(nextPageFilters),
    });
  }, [query.data, debouncedFilters, queryClient]);

  const prefetchPrevious = useCallback(() => {
    if (!query.data?.pagination?.hasPrev) return;

    const prevPageFilters = {
      ...debouncedFilters,
      page: (query.data.pagination.page || 1) - 1
    };

    queryClient.prefetchQuery({
      queryKey: inventoryKeys.list(prevPageFilters),
      queryFn: () => fetchInventory(prevPageFilters),
    });
  }, [query.data, debouncedFilters, queryClient]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
  }, [queryClient]);

  const updateFilters = useCallback((newFilters: Partial<InventoryFilters>) => {
    // This would be handled by the parent component
    // Just a placeholder for the interface
    console.log('Update filters:', newFilters);
  }, []);

  const exportData = useCallback(async (): Promise<Blob> => {
    // Export current data as CSV
    if (!query.data?.data) {
      throw new Error('No data to export');
    }

    const headers = [
      'Product Name',
      'Product Code',
      'Category',
      'Shop',
      'Current Stock',
      'Min Stock',
      'Max Stock',
      'Status',
      'Unit Price',
      'Total Value',
      'Last Updated'
    ];

    const csvContent = [
      headers.join(','),
      ...query.data.data.map(item => [
        `"${item.product_name}"`,
        `"${item.product_code}"`,
        `"${item.category_name}"`,
        `"${item.shop_name}"`,
        item.current_stock,
        item.min_stock_level,
        item.max_stock_level,
        `"${item.stock_status}"`,
        item.unit_price,
        item.total_value,
        `"${item.last_updated}"`
      ].join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }, [query.data]);

  const cacheMetrics = useMemo(() => {
    return inventoryCacheService.getMetrics();
  }, [query.dataUpdatedAt]);

  return {
    data: query.data?.data || [],
    pagination: query.data?.pagination,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    isStale: query.isStale,
    refetch: query.refetch,
    prefetchNext,
    prefetchPrevious,
    invalidate,
    updateFilters,
    exportData,
    cacheMetrics,
  };
}

/**
 * Hook for infinite scrolling inventory
 */
export function useInfiniteInventory(
  filters: Omit<InventoryFilters, 'page'> = {},
  options: Omit<UseOptimizedInventoryOptions, 'filters'> = {}
) {
  const {
    enabled = true,
    staleTime = 30 * 1000,
    cacheTime = 5 * 60 * 1000,
  } = options;

  return useInfiniteQuery({
    queryKey: ['inventory', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchInventory({ ...filters, page: pageParam, limit: 20 }),
    enabled,
    staleTime,
    cacheTime,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.hasPrev
        ? firstPage.pagination.page - 1
        : undefined;
    },
  });
}

/**
 * Hook for single inventory item with optimistic updates
 */
export function useInventoryItem(id: number, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => fetchInventoryItem(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for updating inventory item
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<InventoryItem>) => {
      const response = await fetch(`/api/inventory/optimized/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update inventory item');
      }

      return response.json();
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: inventoryKeys.detail(id) });

      // Snapshot previous value
      const previousItem = queryClient.getQueryData(inventoryKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(inventoryKeys.detail(id), (old: InventoryItem) => ({
        ...old,
        ...updates,
      }));

      return { previousItem };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      if (context?.previousItem) {
        queryClient.setQueryData(inventoryKeys.detail(id), context.previousItem);
      }
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });

  return {
    ...query,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

/**
 * Hook for inventory analytics
 */
export function useInventoryAnalytics(shopId?: number) {
  return useQuery({
    queryKey: inventoryKeys.analytics(),
    queryFn: async () => {
      const params = shopId ? `?shopId=${shopId}` : '';
      const response = await fetch(`/api/inventory/analytics${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for low stock alerts
 */
export function useLowStockAlerts(shopId?: number) {
  return useQuery({
    queryKey: inventoryKeys.alerts(),
    queryFn: async () => {
      const params = shopId ? `?shopId=${shopId}` : '';
      const response = await fetch(`/api/inventory/alerts${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}