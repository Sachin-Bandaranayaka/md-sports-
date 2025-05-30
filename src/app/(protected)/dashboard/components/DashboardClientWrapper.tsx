'use client';

import { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import DashboardMetrics from './DashboardMetrics';
import DashboardCharts from './DashboardCharts';
import DashboardTransfers from './DashboardTransfers';

// Types for our data
interface SummaryItem {
    title: string;
    value: string;
    icon: string;
    trend: string;
    trendUp: boolean;
}

interface ShopPerformance {
    name: string;
    sales: number;
    stock: number;
}

interface InventoryCategory {
    name: string;
    value: number;
}

interface MonthlySales {
    month: string;
    sales: number;
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
    shopPerformance: ShopPerformance[] | null;
    inventoryDistribution: InventoryCategory[] | null;
    monthlySales: MonthlySales[] | null;
    recentTransfers: Transfer[] | null;
}

interface DashboardClientWrapperProps {
    initialData: DashboardData;
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

export default function DashboardClientWrapper({ initialData }: DashboardClientWrapperProps) {
    const [dashboardData, setDashboardData] = useState<DashboardData>(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('30d');
    const [customStartDate, setCustomStartDate] = useState(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [customEndDate, setCustomEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [showCustomDates, setShowCustomDates] = useState(false);

    // Fetch dashboard data with date filtering
    const fetchDashboardData = async (startDate?: string, endDate?: string) => {
        try {
            setLoading(true);
            setError(null);

            let url = '/api/dashboard/filtered';
            const params = new URLSearchParams();

            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const result = await response.json();
            if (result.success) {
                setDashboardData({
                    summaryData: result.summaryData,
                    shopPerformance: result.shopPerformance,
                    inventoryDistribution: result.inventoryDistribution,
                    monthlySales: result.monthlySales,
                    recentTransfers: result.recentTransfers
                });
            } else {
                throw new Error(result.message || 'Failed to load dashboard data');
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Handle period change
    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period);
        setShowCustomDates(period === 'custom');

        if (period !== 'custom') {
            const { startDate, endDate } = getDateRange(period);
            fetchDashboardData(startDate, endDate);
        }
    };

    // Handle custom date range apply
    const handleCustomDateApply = () => {
        if (customStartDate && customEndDate) {
            fetchDashboardData(customStartDate, customEndDate);
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        if (selectedPeriod === 'custom') {
            handleCustomDateApply();
        } else {
            const { startDate, endDate } = getDateRange(selectedPeriod);
            fetchDashboardData(startDate, endDate);
        }
    };

    return (
        <div className="space-y-8">
            {/* Time Period Filter Controls */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <h3 className="text-lg font-semibold text-gray-900">Dashboard Time Period</h3>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Period Selection */}
                        <div className="flex flex-wrap gap-2">
                            {TIME_PERIODS.map((period) => (
                                <button
                                    key={period.value}
                                    onClick={() => handlePeriodChange(period.value)}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${selectedPeriod === period.value
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
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleCustomDateApply}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
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
                    {error}
                </div>
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="relative">
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                        <div className="text-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                            <p className="text-gray-600">Loading dashboard data...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Components */}
            <DashboardMetrics summaryData={dashboardData.summaryData} />

            <DashboardCharts
                shopPerformance={dashboardData.shopPerformance}
                inventoryDistribution={dashboardData.inventoryDistribution}
                monthlySales={dashboardData.monthlySales}
            />

            <DashboardTransfers transfers={dashboardData.recentTransfers} />
        </div>
    );
}