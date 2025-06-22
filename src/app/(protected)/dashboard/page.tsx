'use client';

import { Suspense, useEffect, useState, lazy } from 'react';
import { Loader2, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Lazy load heavy components for better performance
const DashboardTransfers = lazy(() => import('./components/DashboardTransfers'));
const ShopWiseMetrics = lazy(() => import('./components/ShopWiseMetrics'));

// Component loading skeleton
const ComponentSkeleton = ({ className = "h-64" }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
        <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
        </div>
    </div>
);

// Simple dashboard without dual modes or complex optimizations
export default function DashboardPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<{ recentTransfers: any[] } | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7); // Default to 7 days ago
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0]; // Default to today
    });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [componentsLoaded, setComponentsLoaded] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Preload components after initial render for better UX
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            // Preload lazy components
            const preloadComponents = async () => {
                try {
                    await Promise.all([
                        import('./components/DashboardTransfers'),
                        import('./components/ShopWiseMetrics')
                    ]);
                    setComponentsLoaded(true);
                } catch (error) {
                    console.warn('Failed to preload components:', error);
                }
            };
            
            // Delay preloading to not block initial render
            setTimeout(preloadComponents, 100);
        }
    }, [isAuthenticated, isLoading]);

    // Fetch dashboard data with real-time updates
    const fetchDashboardData = async (customStartDate?: string, customEndDate?: string) => {
        if (!isAuthenticated || isLoading) return;

        try {
            setDataLoading(true);
            setError(null);

            const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
            
            const fetchHeaders: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (accessToken) {
                fetchHeaders['Authorization'] = `Bearer ${accessToken}`;
            }

            // Use custom dates or current state dates
            const queryStartDate = customStartDate || startDate;
            const queryEndDate = customEndDate || endDate;

            // Fetch fresh data every time - no caching, with custom date range filter
            const response = await fetch(`/api/dashboard/all?startDate=${queryStartDate}&endDate=${queryEndDate}`, {
                headers: fetchHeaders,
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Failed to load dashboard data: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to load dashboard data');
            }

            setDashboardData({
                recentTransfers: result.recentTransfers || [],
            });
            
            // Trigger refresh for shop-wise metrics
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
        } finally {
            setDataLoading(false);
        }
    };

    // Handle date range change
    const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        fetchDashboardData(newStartDate, newEndDate);
    };

    // Initial data fetch
    useEffect(() => {
        fetchDashboardData();
    }, [isAuthenticated, isLoading]);

    // Show loading while auth is being checked
    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center p-20">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Show loading while data is being fetched
    if (dataLoading) {
        return (
            <div className="h-full flex items-center justify-center p-20">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Show error if data fetch failed
    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-20">
                <div className="text-center">
                    <div className="text-red-500 mb-4">Error loading dashboard</div>
                    <p className="text-gray-500">{error}</p>
                    <button
                        onClick={() => fetchDashboardData()}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Helper function to check permissions
    const hasPermission = (permission: string) => {
        if (!user?.permissions) return false;
        return user.permissions.some((p: string) => 
            p.toLowerCase().includes(permission.toLowerCase())
        );
    };

    // Get user's accessible modules
    const getAccessibleModules = () => {
        const modules = [];
        if (hasPermission('inventory:view')) modules.push('Inventory');
        if (hasPermission('sales:view')) modules.push('Sales');
        if (hasPermission('accounting:view')) modules.push('Accounting');
        if (hasPermission('reports:view')) modules.push('Reports');
        if (hasPermission('users:view')) modules.push('User Management');
        return modules;
    };

    // Show dashboard if data is loaded
    if (dashboardData) {
        const accessibleModules = getAccessibleModules();
        
        return (
            <div className="space-y-6">
                {/* Welcome Section - Critical above-the-fold content */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Welcome back, {user?.fullName || user?.username || 'User'}!
                            </h1>
                            <p className="text-gray-600 mb-3">
                                You have access to {accessibleModules.length} module{accessibleModules.length !== 1 ? 's' : ''}: {accessibleModules.join(', ')}
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <span>System Online</span>
                                </div>
                                <div className="flex items-center text-blue-600">
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    <span>Data Updated</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Last login</p>
                            <p className="text-sm font-medium text-gray-900">
                                {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Date Range:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleDateRangeChange(e.target.value, endDate)}
                                className="border border-gray-300 rounded px-3 py-1 text-sm"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => handleDateRangeChange(startDate, e.target.value)}
                                className="border border-gray-300 rounded px-3 py-1 text-sm"
                            />
                        </div>
                        <button
                            onClick={() => fetchDashboardData()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                            Refresh Data
                        </button>
                    </div>
                </div>

                {/* Lazy-loaded components with Suspense boundaries - Full width containers */}
                <div className="space-y-6">
                    {/* Shop-wise Metrics - Full width container */}
                    <div className="w-full">
                        <Suspense fallback={<ComponentSkeleton className="h-96" />}>
                            <ShopWiseMetrics 
                                startDate={startDate} 
                                endDate={endDate} 
                                refreshTrigger={refreshTrigger}
                            />
                        </Suspense>
                    </div>

                    {/* Recent Transfers - Full width container */}
                    <div className="w-full">
                        <Suspense fallback={<ComponentSkeleton className="h-96" />}>
                            <DashboardTransfers 
                                recentTransfers={dashboardData.recentTransfers || []} 
                            />
                        </Suspense>
                    </div>
                </div>

                {/* Performance indicator for development */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs">
                        Components: {componentsLoaded ? '✅ Loaded' : '⏳ Loading'}
                    </div>
                )}
            </div>
        );
    }

    // Fallback loading state
    return (
        <div className="h-full flex items-center justify-center p-20">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500">Initializing dashboard...</p>
            </div>
        </div>
    );
}