/**
 * Optimized Transfer Hooks with React Query
 * Provides intelligent caching, background updates, and optimistic mutations
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { transferCacheService, TransferFilters } from '@/lib/transferCache';
import { deduplicatedFetchJson } from '@/lib/request-deduplication';

// Cache keys for React Query
const TRANSFER_QUERY_KEYS = {
  transfers: (filters: TransferFilters) => ['transfers', 'list', filters],
  transfer: (id: number) => ['transfers', 'detail', id],
  transferStats: (shopId?: number) => ['transfers', 'stats', shopId],
  shops: ['shops', 'list'],
  products: (shopId?: number) => ['products', 'list', shopId]
};

// Types
interface Transfer {
  id: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
  source_shop_id: number;
  destination_shop_id: number;
  source_shop_name: string;
  destination_shop_name: string;
  initiated_by: string;
  item_count: number;
  total_items: number;
}

interface TransferDetail extends Transfer {
  items: TransferItem[];
}

interface TransferItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  notes?: string;
  retail_price: string;
}

interface CreateTransferData {
  sourceShopId: number;
  destinationShopId: number;
  items: {
    productId: number;
    quantity: number;
  }[];
}

interface PaginatedTransferResponse {
  success: boolean;
  data: Transfer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Fetch functions with caching
const fetchTransfersOptimized = async (filters: TransferFilters): Promise<PaginatedTransferResponse> => {
  const cacheKey = transferCacheService.generateTransferCacheKey('transfers:list', filters);

  return await transferCacheService.getOrSet(
    cacheKey,
    async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.sourceShopId) params.append('sourceShopId', filters.sourceShopId.toString());
      if (filters.destinationShopId) params.append('destinationShopId', filters.destinationShopId.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `/api/inventory/transfers${params.toString() ? `?${params.toString()}` : ''}`;
      return await deduplicatedFetchJson<PaginatedTransferResponse>(url);
    },
    300 // 5 minutes TTL
  );
};

const fetchTransferDetailOptimized = async (id: number): Promise<TransferDetail> => {
  const cacheKey = `transfers:detail:${id}`;

  return await transferCacheService.getOrSet(
    cacheKey,
    async () => {
      const response = await deduplicatedFetchJson<{ success: boolean; data: TransferDetail }>(
        `/api/inventory/transfers/${id}`
      );
      return response.data;
    },
    600 // 10 minutes TTL
  );
};

// Optimized hooks
export const useTransfersOptimized = (filters: TransferFilters = {}) => {
  return useQuery({
    queryKey: TRANSFER_QUERY_KEYS.transfers(filters),
    queryFn: () => fetchTransfersOptimized(filters),
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useTransferDetailOptimized = (id: number) => {
  return useQuery({
    queryKey: TRANSFER_QUERY_KEYS.transfer(id),
    queryFn: () => fetchTransferDetailOptimized(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    enabled: !!id,
    refetchOnWindowFocus: false
  });
};

export const useInfiniteTransfersOptimized = (filters: Omit<TransferFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: ['transfers', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      return fetchTransfersOptimized({ ...filters, page: pageParam });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    initialPageParam: 1
  });
};

// Mutation hooks with optimistic updates
export const useCreateTransferOptimized = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransferData) => {
      const response = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create transfer');
      }

      return response.json();
    },
    onSuccess: async (result, variables) => {
      // Invalidate transfer lists
      await queryClient.invalidateQueries({ queryKey: ['transfers', 'list'] });

      // Invalidate shop inventory cache
      await transferCacheService.invalidateTransferCache(
        undefined,
        [variables.sourceShopId, variables.destinationShopId]
      );

      console.log('✓ Transfer created successfully:', result.data?.id);
    },
    onError: (error) => {
      console.error('✗ Failed to create transfer:', error);
    }
  });
};

export const useUpdateTransferStatusOptimized = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'complete' | 'cancel' }) => {
      const response = await fetch(`/api/inventory/transfers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} transfer`);
      }

      return response.json();
    },
    onMutate: async ({ id, action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: TRANSFER_QUERY_KEYS.transfer(id) });

      // Snapshot the previous value
      const previousTransfer = queryClient.getQueryData(TRANSFER_QUERY_KEYS.transfer(id));

      // Optimistically update the transfer status
      queryClient.setQueryData(TRANSFER_QUERY_KEYS.transfer(id), (old: TransferDetail | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: action === 'complete' ? 'completed' as const : 'cancelled' as const,
          completed_at: action === 'complete' ? new Date().toISOString() : undefined
        };
      });

      return { previousTransfer, id };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousTransfer) {
        queryClient.setQueryData(
          TRANSFER_QUERY_KEYS.transfer(context.id),
          context.previousTransfer
        );
      }
      console.error('✗ Failed to update transfer status:', error);
    },
    onSuccess: async (result, { id, action }) => {
      // Invalidate and refetch transfer lists
      await queryClient.invalidateQueries({ queryKey: ['transfers', 'list'] });

      // Refetch the specific transfer
      await queryClient.invalidateQueries({ queryKey: TRANSFER_QUERY_KEYS.transfer(id) });

      // Invalidate transfer cache
      await transferCacheService.invalidateTransferCache(id);

      console.log(`✓ Transfer ${action}d successfully:`, id);
    }
  });
};

export const useDeleteTransferOptimized = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/inventory/transfers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete transfer');
      }

      return response.json();
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transfers'] });

      // Remove the transfer from all lists optimistically
      queryClient.setQueriesData(
        { queryKey: ['transfers', 'list'] },
        (old: PaginatedTransferResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter(transfer => transfer.id !== id)
          };
        }
      );

      return { id };
    },
    onError: (error, id, context) => {
      // Invalidate queries to refetch fresh data on error
      queryClient.invalidateQueries({ queryKey: ['transfers', 'list'] });
      console.error('✗ Failed to delete transfer:', error);
    },
    onSuccess: async (result, id) => {
      // Remove the specific transfer from cache
      queryClient.removeQueries({ queryKey: TRANSFER_QUERY_KEYS.transfer(id) });

      // Invalidate transfer cache
      await transferCacheService.invalidateTransferCache(id);

      console.log('✓ Transfer deleted successfully:', id);
    }
  });
};

// Utility hooks for related data
export const useShopsOptimized = () => {
  return useQuery({
    queryKey: TRANSFER_QUERY_KEYS.shops,
    queryFn: async () => {
      return await deduplicatedFetchJson<{ id: number; name: string }[]>('/api/shops');
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useProductsForTransferOptimized = (shopId?: number) => {
  return useQuery({
    queryKey: TRANSFER_QUERY_KEYS.products(shopId),
    queryFn: async () => {
      const url = shopId ? `/api/products?shopId=${shopId}` : '/api/products';
      return await deduplicatedFetchJson<{
        id: number;
        name: string;
        sku: string;
        price: number;
        quantity?: number;
      }[]>(url);
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Prefetch utilities
export const prefetchTransferDetail = (queryClient: any, id: number) => {
  return queryClient.prefetchQuery({
    queryKey: TRANSFER_QUERY_KEYS.transfer(id),
    queryFn: () => fetchTransferDetailOptimized(id),
    staleTime: 1000 * 60 * 5
  });
};

export const warmTransferCache = async (filters: TransferFilters) => {
  await transferCacheService.warmTransferCache(filters);
};

// Export types
export type {
  Transfer,
  TransferDetail,
  TransferItem,
  CreateTransferData,
  TransferFilters,
  PaginatedTransferResponse
};