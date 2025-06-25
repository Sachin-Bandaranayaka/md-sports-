'use client';

import React, { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw } from 'lucide-react';
import { useInvoicesOptimized } from '@/hooks/useInvoicesOptimized';
import { usePermission } from '@/hooks/usePermission';

// Types
interface Invoice {
    id: string | number;
    invoiceNumber: string;
    customerId: number;
    customerName?: string;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// Create a query client with optimized settings
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000, // 30 seconds
            gcTime: 300000, // 5 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: (failureCount, error: any) => {
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
    const { canManageInvoices } = usePermission();
    
    // State
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        search: '',
        customer: '',
        status: ''
    });
    
    const {
        data: invoicesData,
        isLoading,
        error,
        refetch
    } = useInvoicesOptimized(filters);
    
    const invoices = invoicesData?.data || [];
    
    // Handle refresh
    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);
    
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold tracking-tight">Sales Invoices (Optimized)</h1>
                    <p className="text-gray-600">
                        Optimized version of the invoice management page
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    {canManageInvoices() && (
                        <Button disabled>
                            <Plus className="h-4 w-4 mr-2" />
                            New Invoice
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Invoices
                            {invoices.length > 0 && (
                                <Badge variant="secondary">
                                    {invoices.length} total
                                </Badge>
                            )}
                        </CardTitle>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">No invoices found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invoices.map((invoice: Invoice) => (
                                <div key={invoice.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                                            <p className="text-sm text-gray-600">
                                                {invoice.customerName || 'Unknown Customer'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(invoice.createdAt).toLocaleDateString()}
                                            </p>
                    </div>
                                        <div className="text-right">
                                            <p className="font-semibold">${invoice.total.toFixed(2)}</p>
                                            <Badge 
                                                variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {invoice.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        )}
                </CardContent>
            </Card>
        </div>
    );
}

// Main page component with providers
export default function OptimizedInvoicesPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <InvoicePageContent />
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}