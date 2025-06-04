'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: how long data is considered fresh
            staleTime: 1000 * 60 * 5, // 5 minutes
            // Cache time: how long data stays in cache after component unmounts
            gcTime: 1000 * 60 * 10, // 10 minutes
            // Retry failed requests
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            // Refetch on window focus for critical data
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry failed mutations
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

// Query keys for consistent cache management
export const queryKeys = {
  // Inventory
  inventory: ['inventory'] as const,
  inventoryList: (filters?: any) => ['inventory', 'list', filters] as const,
  inventoryItem: (id: string) => ['inventory', 'item', id] as const,

  // Products
  products: ['products'] as const,
  productsList: (filters?: any) => ['products', 'list', filters] as const,
  product: (id: string) => ['products', 'item', id] as const,

  // Suppliers
  suppliers: ['suppliers'] as const,
  suppliersList: (filters?: any) => ['suppliers', 'list', filters] as const,
  supplier: (id: string) => ['suppliers', 'item', id] as const,

  // Customers
  customers: ['customers'] as const,
  customersList: (filters?: any) => ['customers', 'list', filters] as const,
  customer: (id: string) => ['customers', 'item', id] as const,

  // Invoices
  invoices: ['invoices'] as const,
  invoicesList: (filters?: any) => ['invoices', 'list', filters] as const,
  invoice: (id: string) => ['invoices', 'item', id] as const,

  // Purchase Invoices
  purchaseInvoices: ['purchase-invoices'] as const,
  purchaseInvoicesList: (filters?: any) => ['purchase-invoices', 'list', filters] as const,
  purchaseInvoice: (id: string) => ['purchase-invoices', 'item', id] as const,

  // Categories
  categories: ['categories'] as const,
  categoriesList: (filters?: any) => ['categories', 'list', filters] as const,

  // Shops
  shops: ['shops'] as const,
  shopsList: (filters?: any) => ['shops', 'list', filters] as const,
  shop: (id: string) => ['shops', 'item', id] as const,

  // Dashboard
  dashboard: ['dashboard'] as const,
  dashboardMetrics: ['dashboard', 'metrics'] as const,
} as const;