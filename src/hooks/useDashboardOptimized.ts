/**
 * Optimized dashboard hook with performance enhancements:
 * - Data prefetching
 * - Request deduplication
 * - Smart caching
 * - Progressive loading
 * - Background refresh
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PerformanceMonitor } from '@/lib/performance';

interface SummaryItem {
    title: string;
    value: string;
    icon: string;
    trend: string;
    trendUp: boolean;
}

interface Transfer {
    id: number;
    fromShop: string;
    toShop: string;
    product: string;
    quantity: number;
    status: string;
    date: string;
}

interface DashboardData {
    summaryData: SummaryItem[] | null;
    recentTransfers: Transfer[] | null;
    shopPerformance?: any;
    inventoryDistribution?: any;
    monthlySales?: any;
}

interface UseDashboardOptions {
    enablePrefetch?: boolean;
    enableBackgroundRefresh?: boolean;
    refreshInterval?: number;
    staleTime?: number;
}

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// In-memory cache for client-side caching
const clientCache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

// Performance monitor instance
const perfMonitor = new PerformanceMonitor();

export function useDashboardOptimized(options: UseDashboardOptions = {}) {
    const {
        enablePrefetch = true,
        enableBackgroundRefresh = true,
        refreshInterval = 5 * 60 * 1000, // 5 minutes
        staleTime = 2 * 60 * 1000, // 2 minutes
    } = options;

    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<number>(0);
    const [backgroundLoading, setBackgroundLoading] = useState(false);

    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Generate cache key based on filters
    const generateCacheKey = useCallback((startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `dashboard:${params.toString() || 'default'}`;
    }, []);

    // Check if data is stale
    const isDataStale = useCallback((timestamp: number) => {
        return Date.now() - timestamp > staleTime;
    }, [staleTime]);

    // Get data from client cache
    const getFromCache = useCallback((cacheKey: string) => {
        const cached = clientCache.get(cacheKey);
        if (cached && !isDataStale(cached.timestamp)) {
            return cached.data;
        }
        return null;
    }, [isDataStale]);

    // Set data in client cache
    const setInCache = useCallback((cacheKey: string, data: any) => {
        clientCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            staleTime
        });
    }, [staleTime]);

    // Optimized fetch function with deduplication and caching
    const fetchDashboardData = useCallback(async (
        startDate?: string,
        endDate?: string,
        isBackground = false
    ): Promise<DashboardData> => {
        const cacheKey = generateCacheKey(startDate, endDate);

        // Check client cache first
        const cachedData = getFromCache(cacheKey);
        if (cachedData && !isBackground) {
            perfMonitor.measureSync('dashboard:cache-hit', () => {
                setData(cachedData);
                setLoading(false);
                setError(null);
            });
            return cachedData;
        }

        // Check for pending request (deduplication)
        const pendingKey = `${cacheKey}:${isBackground ? 'bg' : 'fg'}`;
        if (pendingRequests.has(pendingKey)) {
            return pendingRequests.get(pendingKey)!;
        }

        // Create new request
        const requestPromise = perfMonitor.measureAsync(
            'dashboard:fetch',
            async () => {
                // Cancel previous request if exists
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }

                abortControllerRef.current = new AbortController();

                let url = '/api/dashboard/all';
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }

                const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                };

                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                const response = await fetch(url, {
                    headers,
                    signal: abortControllerRef.current.signal,
                    // Add cache headers for better browser caching
                    cache: 'no-store'
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch dashboard data: ${response.status}`);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || 'Failed to load dashboard data');
                }

                const dashboardData: DashboardData = {
                    summaryData: result.summaryData,
                    recentTransfers: result.recentTransfers,
                    shopPerformance: result.shopPerformance,
                    inventoryDistribution: result.inventoryDistribution,
                    monthlySales: result.monthlySales
                };

                // Cache the result
                setInCache(cacheKey, dashboardData);
                setLastFetch(Date.now());

                return dashboardData;
            },
            { cacheKey, isBackground }
        );

        // Store pending request
        pendingRequests.set(pendingKey, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            // Clean up pending request
            pendingRequests.delete(pendingKey);
        }
    }, [generateCacheKey, getFromCache, setInCache]);

    // Refresh data function
    const refreshData = useCallback(async (
        startDate?: string,
        endDate?: string,
        isBackground = false
    ) => {
        try {
            if (!isBackground) {
                setLoading(true);
                setError(null);
            } else {
                setBackgroundLoading(true);
            }

            const result = await fetchDashboardData(startDate, endDate, isBackground);

            setData(result);
            setError(null);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return; // Request was cancelled, ignore
            }

            console.error('Error fetching dashboard data:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';

            if (!isBackground) {
                setError(errorMessage);
            }
        } finally {
            if (!isBackground) {
                setLoading(false);
            } else {
                setBackgroundLoading(false);
            }
        }
    }, [fetchDashboardData]);

    // Setup background refresh
    useEffect(() => {
        if (!enableBackgroundRefresh || !data) return;

        refreshIntervalRef.current = setInterval(() => {
            // Only refresh if data is stale
            if (isDataStale(lastFetch)) {
                refreshData(undefined, undefined, true);
            }
        }, refreshInterval);

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [enableBackgroundRefresh, data, lastFetch, refreshInterval, refreshData, isDataStale]);

    // Initial data fetch
    useEffect(() => {
        refreshData();

        // Cleanup on unmount
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []); // Only run once on mount

    // Prefetch data for common time periods
    useEffect(() => {
        if (!enablePrefetch || loading || !data) return;

        const prefetchTimeouts: NodeJS.Timeout[] = [];

        // Prefetch common time periods after initial load
        const commonPeriods = [
            { days: 7 },
            { days: 30 },
            { months: 3 },
            { months: 6 }
        ];

        commonPeriods.forEach((period, index) => {
            const timeout = setTimeout(() => {
                const now = new Date();
                const endDate = now.toISOString().split('T')[0];
                let startDate: string;

                if ('days' in period) {
                    startDate = new Date(now.setDate(now.getDate() - period.days)).toISOString().split('T')[0];
                } else {
                    startDate = new Date(now.setMonth(now.getMonth() - period.months)).toISOString().split('T')[0];
                }

                const cacheKey = generateCacheKey(startDate, endDate);
                if (!getFromCache(cacheKey)) {
                    // Prefetch in background without updating UI
                    fetchDashboardData(startDate, endDate, true).catch(() => {
                        // Ignore prefetch errors
                    });
                }
            }, (index + 1) * 1000); // Stagger prefetch requests

            prefetchTimeouts.push(timeout);
        });

        return () => {
            prefetchTimeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, [enablePrefetch, loading, data, fetchDashboardData, generateCacheKey, getFromCache]);

    return {
        data,
        loading,
        error,
        backgroundLoading,
        refreshData,
        lastFetch: new Date(lastFetch),
        isStale: isDataStale(lastFetch)
    };
}

// Utility function to clear dashboard cache
export function clearDashboardCache() {
    clientCache.clear();
    pendingRequests.clear();
}

// Utility function to warm up cache
export async function warmupDashboardCache() {
    const commonPeriods = [
        { days: 7 },
        { days: 30 },
        { months: 3 }
    ];

    const promises = commonPeriods.map(period => {
        const now = new Date();
        const endDate = now.toISOString().split('T')[0];
        let startDate: string;

        if ('days' in period) {
            startDate = new Date(now.setDate(now.getDate() - period.days)).toISOString().split('T')[0];
        } else {
            startDate = new Date(now.setMonth(now.getMonth() - period.months)).toISOString().split('T')[0];
        }

        return fetch(`/api/dashboard/all?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('authToken')}`
            }
        }).catch(() => { }); // Ignore errors during warmup
    });

    await Promise.allSettled(promises);
}