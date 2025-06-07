'use client';

import { useEffect, useState } from 'react';
import { Store, TrendingUp, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Interface for shop-wise metrics data
interface ShopMetrics {
    shopId: string;
    shopName: string;
    totalInventoryCost: number;
    totalProfit: number;
    outstandingInvoices: number;
    lowStockItems: number;
}

interface ShopWiseData {
    shopMetrics: ShopMetrics[];
    totals: {
        totalInventoryCost: number;
        totalProfit: number;
        outstandingInvoices: number;
        lowStockItems: number;
    };
    dateRange: {
        startDate: string;
        endDate: string;
    };
}

interface ShopWiseMetricsProps {
    startDate?: string;
    endDate?: string;
    refreshTrigger?: number;
}

export default function ShopWiseMetrics({ startDate, endDate, refreshTrigger }: ShopWiseMetricsProps) {
    const { user } = useAuth();
    const [data, setData] = useState<ShopWiseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Fetch shop-wise metrics
    const fetchShopWiseMetrics = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
            
            const fetchHeaders: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (accessToken) {
                fetchHeaders['Authorization'] = `Bearer ${accessToken}`;
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await fetch(`/api/dashboard/shop-wise?${params.toString()}`, {
                headers: fetchHeaders,
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Failed to load shop-wise metrics: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to load shop-wise metrics');
            }

            setData(result.data);
        } catch (error) {
            console.error('Error fetching shop-wise metrics:', error);
            setError(error instanceof Error ? error.message : 'Failed to load shop-wise metrics');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data on component mount and when dependencies change
    useEffect(() => {
        fetchShopWiseMetrics();
    }, [startDate, endDate, refreshTrigger]);

    // Check permissions
    const hasInventoryPermission = user?.permissions?.includes('inventory:view') || false;
    const hasSalesPermission = user?.permissions?.includes('sales:view') || false;

    if (!hasInventoryPermission && !hasSalesPermission) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop-wise Metrics</h3>
                <p className="text-gray-500">You don't have permission to view shop-wise metrics.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop-wise Metrics</h3>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-gray-600">Loading shop-wise metrics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop-wise Metrics</h3>
                <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchShopWiseMetrics}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!data || data.shopMetrics.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop-wise Metrics</h3>
                <p className="text-gray-500 text-center py-8">No shop data available.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Shop-wise Metrics</h3>
                <div className="text-sm text-gray-500">
                    {new Date(data.dateRange.startDate).toLocaleDateString()} - {new Date(data.dateRange.endDate).toLocaleDateString()}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {hasInventoryPermission && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <Store className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-blue-900">Total Inventory</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900 mt-1">
                            {formatCurrency(data.totals.totalInventoryCost)}
                        </p>
                    </div>
                )}
                
                {hasSalesPermission && (
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-900">Total Profit</span>
                        </div>
                        <p className="text-xl font-bold text-green-900 mt-1">
                            {formatCurrency(data.totals.totalProfit)}
                        </p>
                    </div>
                )}
                
                {hasSalesPermission && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <CreditCard className="h-5 w-5 text-orange-600 mr-2" />
                            <span className="text-sm font-medium text-orange-900">Outstanding</span>
                        </div>
                        <p className="text-xl font-bold text-orange-900 mt-1">
                            {formatCurrency(data.totals.outstandingInvoices)}
                        </p>
                    </div>
                )}
                
                {hasInventoryPermission && (
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                            <span className="text-sm font-medium text-red-900">Low Stock Items</span>
                        </div>
                        <p className="text-xl font-bold text-red-900 mt-1">
                            {data.totals.lowStockItems}
                        </p>
                    </div>
                )}
            </div>

            {/* Shop-wise Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Shop Name
                            </th>
                            {hasInventoryPermission && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Inventory Cost
                                </th>
                            )}
                            {hasSalesPermission && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Profit
                                </th>
                            )}
                            {hasSalesPermission && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Outstanding
                                </th>
                            )}
                            {hasInventoryPermission && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Low Stock
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.shopMetrics.map((shop) => (
                            <tr key={shop.shopId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {shop.shopName}
                                </td>
                                {hasInventoryPermission && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(shop.totalInventoryCost)}
                                    </td>
                                )}
                                {hasSalesPermission && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={shop.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {formatCurrency(shop.totalProfit)}
                                        </span>
                                    </td>
                                )}
                                {hasSalesPermission && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(shop.outstandingInvoices)}
                                    </td>
                                )}
                                {hasInventoryPermission && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={shop.lowStockItems > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                            {shop.lowStockItems}
                                        </span>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}