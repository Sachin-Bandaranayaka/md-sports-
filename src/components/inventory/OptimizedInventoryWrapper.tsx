/**
 * Enterprise-grade Optimized Inventory Client Wrapper
 * Advanced React component with performance optimizations and real-time features
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  useOptimizedInventory,
  useInventoryAnalytics,
  useLowStockAlerts
} from '@/hooks/useOptimizedInventory';
import { useDebounce } from '@/hooks/useDebounce';
import { useWebSocket } from '@/hooks/useWebSocket';
import { inventoryCacheService } from '@/lib/inventoryCache';
import { PerformanceMonitor } from '@/lib/performance';

// Types
interface InventoryFilters {
  page: number;
  limit: number;
  search: string;
  category: string;
  status: string;
  shopId: number | null;
  sortBy: 'name' | 'quantity' | 'value' | 'lastUpdated';
  sortOrder: 'asc' | 'desc';
}

interface OptimizedInventoryWrapperProps {
  initialFilters?: Partial<InventoryFilters>;
  shopId?: number;
  enableRealtime?: boolean;
  enableAnalytics?: boolean;
  enableExport?: boolean;
  className?: string;
}

// Performance monitoring
const performanceMonitor = new PerformanceMonitor();

// Memoized components for better performance
const InventoryTable = React.memo(({ data, isLoading }: { data: any[], isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Product</th>
            <th className="text-left p-4">Category</th>
            <th className="text-left p-4">Stock</th>
            <th className="text-left p-4">Status</th>
            <th className="text-left p-4">Value</th>
            <th className="text-left p-4">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.product_id} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <div>
                  <div className="font-medium">{item.product_name}</div>
                  <div className="text-sm text-gray-500">{item.product_code}</div>
                </div>
              </td>
              <td className="p-4">{item.category_name}</td>
              <td className="p-4">
                <div className="text-sm">
                  <div>Current: {item.current_stock}</div>
                  <div className="text-gray-500">Min: {item.min_stock_level}</div>
                </div>
              </td>
              <td className="p-4">
                <Badge
                  variant={getStatusVariant(item.stock_status)}
                  className="text-xs"
                >
                  {item.stock_status}
                </Badge>
              </td>
              <td className="p-4">LKR {item.total_value.toFixed(2)}</td>
              <td className="p-4 text-sm text-gray-500">
                {new Date(item.last_updated).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

InventoryTable.displayName = 'InventoryTable';

const AnalyticsPanel = React.memo(({ shopId }: { shopId?: number }) => {
  const { data: analytics, isLoading } = useInventoryAnalytics(shopId);
  const { data: alerts } = useLowStockAlerts(shopId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.newItemsThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {analytics?.totalValue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.valueChange > 0 ? '+' : ''}{analytics?.valueChange?.toFixed(1) || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Items need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {alerts && alerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alerts.length} items are running low on stock. Consider reordering soon.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
});

AnalyticsPanel.displayName = 'AnalyticsPanel';

// Helper functions
function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'In Stock': return 'default';
    case 'Low Stock': return 'secondary';
    case 'Out of Stock': return 'destructive';
    default: return 'outline';
  }
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function OptimizedInventoryWrapper({
  initialFilters = {},
  shopId,
  enableRealtime = true,
  enableAnalytics = true,
  enableExport = true,
  className = ''
}: OptimizedInventoryWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    status: '',
    shopId: shopId || null,
    sortBy: 'name',
    sortOrder: 'asc',
    ...initialFilters,
    // Override with URL params
    page: parseInt(searchParams.get('page') || '1'),
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
  });

  const [activeTab, setActiveTab] = useState('inventory');
  const [isExporting, setIsExporting] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Debounced search for better performance
  const debouncedSearch = useDebounce(filters.search, 300);

  // Memoized filters for the hook
  const optimizedFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch,
  }), [filters, debouncedSearch]);

  // Main inventory hook with optimizations
  const {
    data,
    pagination,
    meta,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
    prefetchNext,
    prefetchPrevious,
    exportData,
    cacheMetrics
  } = useOptimizedInventory({
    filters: optimizedFilters,
    enableRealtime,
    enablePredictiveLoading: true,
    enableOfflineSupport: true,
  });

  // WebSocket connection status
  const { isConnected: wsConnected } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    enabled: enableRealtime,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page > 1) params.set('page', filters.page.toString());
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.status) params.set('status', filters.status);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  // Performance monitoring
  useEffect(() => {
    const timer = performanceMonitor.startTimer('inventory_render');
    return () => {
      const duration = performanceMonitor.endTimer(timer);
      setPerformanceMetrics(prev => ({ ...prev, renderTime: duration }));
    };
  }, [data]);

  // Event handlers
  const handleFilterChange = useCallback((key: keyof InventoryFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset page when other filters change
    }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!enableExport) return;

    setIsExporting(true);
    try {
      const blob = await exportData();
      const filename = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [exportData, enableExport]);

  const handleRefresh = useCallback(() => {
    refetch();
    // Clear cache for fresh data
    inventoryCacheService.invalidateInventoryData();
  }, [refetch]);

  // Prefetch adjacent pages on hover
  const handlePrefetchNext = useCallback(() => {
    if (pagination?.hasNext) {
      prefetchNext();
    }
  }, [pagination?.hasNext, prefetchNext]);

  const handlePrefetchPrevious = useCallback(() => {
    if (pagination?.hasPrev) {
      prefetchPrevious();
    }
  }, [pagination?.hasPrev, prefetchPrevious]);

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load inventory data: {error?.message}
          <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with real-time status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          {enableRealtime && (
            <div className="flex items-center space-x-2">
              {wsConnected ? (
                <><Wifi className="h-4 w-4 text-green-500" /><span className="text-sm text-green-600">Live</span></>
              ) : (
                <><WifiOff className="h-4 w-4 text-gray-400" /><span className="text-sm text-gray-500">Offline</span></>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {meta && (
            <Badge variant="outline" className="text-xs">
              {meta.dataSource} • {meta.responseTime.toFixed(0)}ms
              {meta.cacheHit && ' • cached'}
            </Badge>
          )}

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {enableExport && (
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
              <Download className="h-4 w-4 mr-1" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          {enableAnalytics && (
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </TabsTrigger>
          )}
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-1" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="quantity-asc">Stock (Low-High)</SelectItem>
                    <SelectItem value="quantity-desc">Stock (High-Low)</SelectItem>
                    <SelectItem value="value-asc">Value (Low-High)</SelectItem>
                    <SelectItem value="value-desc">Value (High-Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-0">
              <Suspense fallback={<div className="p-8"><Skeleton className="h-64 w-full" /></div>}>
                <InventoryTable data={data} isLoading={isLoading} />
              </Suspense>
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  onMouseEnter={handlePrefetchPrevious}
                >
                  Previous
                </Button>

                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  onMouseEnter={handlePrefetchNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {enableAnalytics && (
          <TabsContent value="analytics">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <AnalyticsPanel shopId={shopId} />
            </Suspense>
          </TabsContent>
        )}

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Cache Performance</h4>
                  <div className="space-y-2 text-sm">
                    {Array.from(cacheMetrics.entries()).map(([key, metrics]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span>{(metrics.hitRate * 100).toFixed(1)}% hit rate</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Response Times</h4>
                  <div className="space-y-2 text-sm">
                    {meta && (
                      <div className="flex justify-between">
                        <span>Last request:</span>
                        <span>{meta.responseTime.toFixed(0)}ms</span>
                      </div>
                    )}
                    {performanceMetrics?.renderTime && (
                      <div className="flex justify-between">
                        <span>Render time:</span>
                        <span>{performanceMetrics.renderTime.toFixed(0)}ms</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}