'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Define the ShopAnalytics type
type ShopAnalytics = {
    id: number;
    name: string;
    location: string;
    is_active: boolean;
    totalInventory: number;
    totalSales: number;
    inventoryValue: number;
    performanceMetrics: {
        inventoryTurnover: number;
        salesGrowth: number;
        avgTicketSize: number;
    };
};

export default function ShopAnalytics() {
    const [analytics, setAnalytics] = useState<ShopAnalytics[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedShopId, setSelectedShopId] = useState<string>('');

    // Fetch analytics data
    useEffect(() => {
        fetchAnalytics();
    }, [startDate, endDate, selectedShopId]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            let url = `/api/shops/analytics?startDate=${startDate}&endDate=${endDate}`;
            if (selectedShopId) {
                url += `&shopId=${selectedShopId}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch shop analytics');
            }

            const data = await response.json();
            if (data.success) {
                setAnalytics(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch shop analytics');
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching shop analytics:', err);
            setError('Failed to load analytics. Please try again later.');
            setAnalytics([]);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const inventoryData = analytics.map(shop => ({
        name: shop.name,
        value: shop.totalInventory
    }));

    const salesData = analytics.map(shop => ({
        name: shop.name,
        sales: shop.totalSales,
        inventory: shop.totalInventory
    }));

    // Colors for pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Shop Analytics</h1>
                        <p className="text-gray-500">View performance metrics for all your shops</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="shopId" className="block text-sm font-medium text-gray-700">Shop</label>
                            <select
                                id="shopId"
                                value={selectedShopId}
                                onChange={(e) => setSelectedShopId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            >
                                <option value="">All Shops</option>
                                {analytics.map(shop => (
                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button variant="primary" size="sm" onClick={fetchAnalytics}>
                                Update
                            </Button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <p>Loading analytics data...</p>
                    </div>
                ) : error ? (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-8 text-center text-red-500">
                        <p>{error}</p>
                    </div>
                ) : analytics.length === 0 ? (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <p>No analytics data available for the selected period.</p>
                    </div>
                ) : (
                    <>
                        {/* Analytics Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Inventory Distribution */}
                            <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Distribution</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={inventoryData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {inventoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Sales vs Inventory */}
                            <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales vs Inventory</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={salesData}
                                            margin={{
                                                top: 5,
                                                right: 30,
                                                left: 20,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                                            <Bar dataKey="inventory" fill="#82ca9d" name="Inventory" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Shop Performance Table */}
                        <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Shop Performance</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Shop
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Inventory
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sales
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Inventory Value
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Turnover
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {analytics.map((shop) => (
                                            <tr key={shop.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                                                            <div className="text-sm text-gray-500">{shop.location}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{shop.totalInventory} items</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">Rs. {shop.totalSales.toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">Rs. {shop.inventoryValue.toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{shop.performanceMetrics.inventoryTurnover.toFixed(2)}x</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
} 