/**
 * Optimized Dashboard Client Wrapper with performance enhancements:
 * - Progressive loading
 * - Smart caching
 * - Background refresh
 * - Request deduplication
 * - Performance monitoring
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, RefreshCw, Zap, Clock } from 'lucide-react';
import DashboardMetrics from './DashboardMetrics';
import DashboardTransfers from './DashboardTransfers';
import { useDashboardOptimized } from '@/hooks/useDashboardOptimized';
import { PerformanceMonitor } from '@/lib/performance';

// Types for our data
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
}

interface DashboardClientWrapperOptimizedProps {
    initialData?: DashboardData;
}

// Predefined time period options
const TIME_PERIODS = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 3 Months', value: '3m' },
    { label: 'Last 6 Months', value: '6m' },
    { label: 'Last Year', value: '1y' },
    { label: 'Custom Range', value: 'custom' }
];

// Helper function to calculate date range based on period
function getDateRange(period: string): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: string;

    switch (period) {
        case '7d':
            startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
            break;
        case '30d':
            startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
            break;
        case '3m':
            startDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
            break;
        case '6m':
            startDate = new Date(now.setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
            break;
        case '1y':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
            break;
        default:
            // Default to last 30 days
            startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    }

    return { startDate, endDate };
}

// Performance monitor instance
const perfMonitor = new PerformanceMonitor();

export default function DashboardClientWrapperOptimized({
    initialData
}: DashboardClientWrapperOptimizedProps) {
    // Use optimized dashboard hook
    const {
        data: dashboardData,
        loading,
        error,
        backgroundLoading,
        refreshData,
        lastFetch,
        isStale
    } = useDashboardOptimized({
        enablePrefetch: true,
        enableBackgroundRefresh: true,
        refreshInterval: 5 * 60 * 1000, // 5 minutes
        staleTime: 2 * 60 * 1000 // 2 minutes
    });

    const [selectedPeriod, setSelectedPeriod] = useState('30d');
    const [customStartDate, setCustomStartDate] = useState(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [customEndDate, setCustomEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [showCustomDates, setShowCustomDates] = useState(false);
    const [progressiveLoadingStage, setProgressiveLoadingStage] = useState(0);

    // Progressive loading stages
    const loadingStages = [
        'Loading summary data...',
        'Loading recent transfers...',
        'Optimizing display...',
        'Ready!'
    ];

    // Handle period change with performance monitoring
    const handlePeriodChange = useCallback((period: string) => {
        perfMonitor.measureSync('dashboard:period-change', () => {
            setSelectedPeriod(period);
            setShowCustomDates(period === 'custom');

            if (period !== 'custom') {
                const { startDate, endDate } = getDateRange(period);
                refreshData(startDate, endDate);
            }
        }, { period });
    }, [refreshData]);

    // Handle custom date range apply
    const handleCustomDateApply = useCallback(() => {
        if (customStartDate && customEndDate) {
            perfMonitor.measureSync('dashboard:custom-date-apply', () => {
                refreshData(customStartDate, customEndDate);
            }, { startDate: customStartDate, endDate: customEndDate });
        }
    }, [customStartDate, customEndDate, refreshData]);

    // Handle refresh with performance monitoring
    const handleRefresh = useCallback(() => {
        perfMonitor.measureSync('dashboard:manual-refresh', () => {
            if (selectedPeriod === 'custom') {
                handleCustomDateApply();
            } else {
                const { startDate, endDate } = getDateRange(selectedPeriod);
                refreshData(startDate, endDate);
            }
        }, { selectedPeriod });
    }, [selectedPeriod, handleCustomDateApply, refreshData]);

    // Progressive loading effect
    useEffect(() => {
        if (loading) {
            setProgressiveLoadingStage(0);
            const interval = setInterval(() => {
                setProgressiveLoadingStage(prev => {
                    if (prev < loadingStages.length - 1) {
                        return prev + 1;
                    }
                    clearInterval(interval);
                    return prev;
                });
            }, 300);

            return () => clearInterval(interval);
        }
    }, [loading]);

    // Memoized components for better performance
    const memoizedMetrics = useMemo(() => {
        if (!dashboardData?.summaryData) return null;
        return <DashboardMetrics summaryData={dashboardData.summaryData} />;
    }, [dashboardData?.summaryData]);

    const memoizedTransfers = useMemo(() => {
        if (!dashboardData?.recentTransfers) return null;
        return <DashboardTransfers transfers={dashboardData.recentTransfers} />;
    }, [dashboardData?.recentTransfers]);

    // Performance indicator component
    const PerformanceIndicator = () => {
        const timeSinceLastFetch = Date.now() - lastFetch.getTime();
        const isDataFresh = timeSinceLastFetch < 60000; // 1 minute

        return (
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${isDataFresh ? 'bg-green-500' : isStale ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                <span>
                    {isDataFresh ? 'Fresh data' : isStale ? 'Stale data' : 'Cached data'}
                </span>
                {backgroundLoading && (
                    <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Updating...</span>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Performance Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-blue-900">Optimized Dashboard</h2>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Enhanced Performance
                        </span>
                    </div>
                    <PerformanceIndicator />
                </div>
                <p className="text-sm text-blue-700 mt-2">
                    Features: Smart Caching • Background Refresh • Request Deduplication • Progressive Loading
                </p>
            </div>

            {/* Time Period Filter Controls */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <h3 className="text-lg font-semibold text-gray-900">Dashboard Time Period</h3>
                        {backgroundLoading && (
                            <div className="flex items-center gap-1 text-sm text-blue-600">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Refreshing...</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Period Selection */}
                        <div className="flex flex-wrap gap-2">
                            {TIME_PERIODS.map((period) => (
                                <button
                                    key={period.value}
                                    onClick={() => handlePeriodChange(period.value)}
                                    disabled={loading}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${selectedPeriod === period.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range */}
                        {showCustomDates && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    disabled={loading}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    disabled={loading}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                />
                                <button
                                    onClick={handleCustomDateApply}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    Apply
                                </button>
                            </div>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Error:</span>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Progressive Loading Overlay */}
            {loading && (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-center">
                        <div className="relative">
                            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-blue-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {loadingStages[progressiveLoadingStage]}
                        </h3>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((progressiveLoadingStage + 1) / loadingStages.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-gray-600 text-sm">
                            Optimized loading with smart caching and background refresh
                        </p>
                    </div>
                </div>
            )}

            {/* Dashboard Components - Only render when data is available */}
            {!loading && dashboardData && (
                <>
                    {memoizedMetrics}
                    {memoizedTransfers}
                </>
            )}

            {/* Data freshness indicator */}
            {!loading && dashboardData && (
                <div className="text-center text-xs text-gray-500 py-4">
                    <div className="flex items-center justify-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Last updated: {lastFetch.toLocaleTimeString()}</span>
                        {isStale && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                                Data may be stale
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}