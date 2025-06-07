'use client';

import { Suspense, useEffect, useState } from 'react';
import { Loader2, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import DashboardMetrics from './components/DashboardMetrics';
import DashboardTransfers from './components/DashboardTransfers';
import ShopWiseMetrics from './components/ShopWiseMetrics';

// Simple dashboard without dual modes or complex optimizations
export default function DashboardPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState(null);
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

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

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
                summaryData: result.summaryData,
                recentTransfers: result.recentTransfers,
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

    // Quick date range presets
    const setQuickRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        
        const newStartDate = start.toISOString().split('T')[0];
        const newEndDate = end.toISOString().split('T')[0];
        
        handleDateRangeChange(newStartDate, newEndDate);
    };

    // Initial data fetch
    useEffect(() => {
        fetchDashboardData();
    }, [isAuthenticated, isLoading]);

    // Auto-refresh removed - using manual refresh button instead
    // useEffect(() => {
    //     if (!isAuthenticated || isLoading) return;

    //     const interval = setInterval(() => {
    //         fetchDashboardData();
    //     }, 30000); // 30 seconds

    //     return () => clearInterval(interval);
    // }, [isAuthenticated, isLoading, startDate, endDate]);

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
        if (hasPermission('inventory')) modules.push('Inventory');
        if (hasPermission('sales')) modules.push('Sales');
        if (hasPermission('accounting')) modules.push('Accounting');
        if (hasPermission('reports')) modules.push('Reports');
        if (hasPermission('user')) modules.push('User Management');
        return modules;
    };

    // Show dashboard if data is loaded
    if (dashboardData) {
        const accessibleModules = getAccessibleModules();
        
        return (
            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Welcome back, {user?.name || 'User'}!
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
                            <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Header with date range filters and refresh button */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Quick Date Range Presets */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Quick:</span>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setQuickRange(7)}
                                    className="px-3 py-1 text-sm rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                >
                                    7 Days
                                </button>
                                <button
                                    onClick={() => setQuickRange(30)}
                                    className="px-3 py-1 text-sm rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                >
                                    30 Days
                                </button>
                                <button
                                    onClick={() => setQuickRange(90)}
                                    className="px-3 py-1 text-sm rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                                >
                                    90 Days
                                </button>
                            </div>
                        </div>
                        
                        {/* Custom Date Range */}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">From:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleDateRangeChange(e.target.value, endDate)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">To:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => handleDateRangeChange(startDate, e.target.value)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        {/* Refresh Button */}
                        <button
                            onClick={() => fetchDashboardData()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            <Loader2 className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <Suspense fallback={
                    <div className="h-full flex items-center justify-center p-20">
                        <div className="text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-gray-500">Loading dashboard...</p>
                        </div>
                    </div>
                }>
                    <DashboardMetrics summaryData={dashboardData.summaryData} />
                    <ShopWiseMetrics 
                        startDate={startDate} 
                        endDate={endDate} 
                        refreshTrigger={refreshTrigger} 
                    />
                    <DashboardTransfers recentTransfers={dashboardData.recentTransfers} />
                    
                    {/* Permission-based Quick Actions */}
                    {accessibleModules.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {hasPermission('inventory') && (
                                    <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                                        <div className="text-blue-600 font-medium">Add Inventory</div>
                                        <div className="text-sm text-gray-500 mt-1">Create new inventory items</div>
                                    </button>
                                )}
                                {hasPermission('transfer') && (
                                    <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                                        <div className="text-green-600 font-medium">New Transfer</div>
                                        <div className="text-sm text-gray-500 mt-1">Transfer items between shops</div>
                                    </button>
                                )}
                                {hasPermission('sales') && (
                                    <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                                        <div className="text-purple-600 font-medium">Create Sale</div>
                                        <div className="text-sm text-gray-500 mt-1">Process new sales order</div>
                                    </button>
                                )}
                                {hasPermission('reports') && (
                                    <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
                                        <div className="text-orange-600 font-medium">View Reports</div>
                                        <div className="text-sm text-gray-500 mt-1">Generate business reports</div>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </Suspense>
            </div>
        );
    }

    return null;
}