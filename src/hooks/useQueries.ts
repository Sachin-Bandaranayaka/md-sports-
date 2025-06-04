'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/context/QueryProvider';

// Types
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Generic fetch function
const fetchApi = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Inventory Hooks
export const useInventory = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.inventoryList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.shop) params.append('shop', filters.shop);

      return fetchApi<PaginatedResponse<any>>(`/api/inventory/summary?${params.toString()}`);
    },
    staleTime: 1000 * 10, // 10 seconds for inventory data (reduced from 2 minutes)
  });
};

export const useInventoryItem = (id: string) => {
  return useQuery({
    queryKey: queryKeys.inventoryItem(id),
    queryFn: () => fetchApi<ApiResponse<any>>(`/api/inventory/${id}`),
    enabled: !!id,
  });
};

// Products Hooks
export const useProducts = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.productsList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.shop) params.append('shop', filters.shop);

      return fetchApi<any[]>(`/api/products?${params.toString()}`);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes for products
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => fetchApi<ApiResponse<any>>(`/api/products/${id}`),
    enabled: !!id,
  });
};

// Suppliers Hooks
export const useSuppliers = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.suppliersList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);

      return fetchApi<any[]>(`/api/suppliers?${params.toString()}`);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for suppliers
  });
};

// Customers Hooks
export const useCustomers = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.customersList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);

      return fetchApi<any[]>(`/api/customers?${params.toString()}`);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for customers
  });
};

// Purchase Invoices Hooks
export const usePurchaseInvoices = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.purchaseInvoicesList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.supplier) params.append('supplier', filters.supplier);
      if (filters?.status) params.append('status', filters.status);

      return fetchApi<PaginatedResponse<any>>(`/api/purchases?${params.toString()}`);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes for purchase invoices
  });
};

export const usePurchaseInvoice = (id: string) => {
  return useQuery({
    queryKey: queryKeys.purchaseInvoice(id),
    queryFn: () => fetchApi<ApiResponse<any>>(`/api/purchases/${id}`),
    enabled: !!id,
  });
};

// Sales Invoices Hooks
export const useInvoices = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.invoicesList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.customer) params.append('customer', filters.customer);
      if (filters?.status) params.append('status', filters.status);

      return fetchApi<PaginatedResponse<any>>(`/api/invoices?${params.toString()}`);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes for invoices
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: queryKeys.invoice(id),
    queryFn: () => fetchApi<ApiResponse<any>>(`/api/invoices/${id}`),
    enabled: !!id,
  });
};

// Categories Hooks
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => fetchApi<any[]>('/api/categories'),
    staleTime: 1000 * 60 * 15, // 15 minutes for categories
  });
};

// Shops Hooks
export const useShops = (simple?: boolean) => {
  return useQuery({
    queryKey: queryKeys.shopsList({ simple }),
    queryFn: () => {
      const params = simple ? '?simple=true' : '';
      return fetchApi<any[]>(`/api/shops${params}`);
    },
    staleTime: 1000 * 60 * 15, // 15 minutes for shops
  });
};

// Dashboard Hooks
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: queryKeys.dashboardMetrics,
    queryFn: () => fetchApi<any>('/api/dashboard/metrics'),
    staleTime: 1000 * 60 * 5, // 5 minutes for dashboard metrics
  });
};

// Mutation Hooks for optimistic updates
export const useCreatePurchaseInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      fetchApi<ApiResponse<any>>('/api/purchases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate and refetch purchase invoices
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseInvoices });
      // Also invalidate inventory as it might have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
};

export const useUpdatePurchaseInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi<ApiResponse<any>>(`/api/purchases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      // Invalidate specific invoice and list
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseInvoice(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseInvoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
};

export const useDeletePurchaseInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<any>>(`/api/purchases/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseInvoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      fetchApi<ApiResponse<any>>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi<ApiResponse<any>>(`/api/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<any>>(`/api/invoices/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
};