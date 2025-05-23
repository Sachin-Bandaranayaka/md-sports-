'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Define the Shop type for comparison
type ShopComparison = {
    id: number;
    name: string;
    location: string;
    is_active: boolean;
    metrics: {
        inventoryCount: number;
        totalProducts: number;
        sales: number;
        revenue: number;
        averageTicketSize: number;
        customerCount: number;
    };
};

export default function ShopComparison() {
    const [shops, setShops] = useState<ShopComparison[]>([]);
    const [allShops, setAllShops] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);

    // Fetch all shops for selection
    useEffect(() => {
        const fetchAllShops = async () => {
            try {
                const response = await fetch('/api/shops');
                if (!response.ok) {
                    throw new Error('Failed to fetch shops');
                }
                const data = await response.json();
                if (data.success) {
                    setAllShops(data.data.map((shop: any) => ({ id: shop.id, name: shop.name })));
                    // Select first two shops by default if available
                    if (data.data.length >= 2) {
                        setSelectedShopIds([data.data[0].id, data.data[1].id]);
                    } else if (data.data.length === 1) {
                        setSelectedShopIds([data.data[0].id]);
                    }
                } else {
                    throw new Error(data.message || 'Failed to fetch shops');
                }
            } catch (err) {
                console.error('Error fetching shops:', err);
                setError('Failed to load shops. Please try again later.');
            }
        };

        fetchAllShops();
    }, []);

    // Fetch comparison data when selected shops change
    useEffect(() => {
        if (selectedShopIds.length > 0) {
            fetchComparisonData();
        }
    }, [selectedShopIds, startDate, endDate]);

    const fetchComparisonData = async () => {
        try {
            setLoading(true);
            const shopIdsParam = selectedShopIds.join(',');
            const url = `/api/shops/compare?shopIds=${shopIdsParam}&startDate=${startDate}&endDate=${endDate}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch comparison data');
            }

            const data = await response.json();
            if (data.success) {
                setShops(data.data.shops);
            } else {
                throw new Error(data.message || 'Failed to fetch comparison data');
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching comparison data:', err);
            setError('Failed to load comparison data. Please try again later.');
            setShops([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle shop selection
    const handleShopSelection = (shopId: number) => {
        if (selectedShopIds.includes(shopId)) {
            setSelectedShopIds(selectedShopIds.filter(id => id !== shopId));
        } else {
            setSelectedShopIds([...selectedShopIds, shopId]);
        }
    };

    // Prepare chart data
    const barChartData = shops.map(shop => ({
        name: shop.name,
        inventory: shop.metrics.inventoryCount,
        sales: shop.metrics.sales,
        revenue: shop.metrics.revenue
    }));

    // Prepare radar chart data
    const prepareRadarData = () => {
        const metrics = ['inventoryCount', 'totalProducts', 'sales', 'revenue', 'averageTicketSize', 'customerCount'];
        const metricNames = {
            inventoryCount: 'Inventory',
            totalProducts: 'Products',
            sales: 'Sales',
            revenue: 'Revenue',
            averageTicketSize: 'Avg Ticket',
            customerCount: 'Customers'
        };

        return metrics.map(metric => {
            const data: any = { metric: metricNames[metric as keyof typeof metricNames] };
            shops.forEach(shop => {
                data[shop.name] = shop.metrics[metric as keyof typeof shop.metrics];
            });
            return data;
        });
    };

    const radarData = prepareRadarData();

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Shop Comparison</h1>
                        <p className="text-gray-500">Compare performance metrics between shops</p>
                    </div>
                </div>

                {/* Selection and Filters */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="mb-4">
                        <h3 className="text-md font-medium text-gray-900 mb-2">Select Shops to Compare</h3>
                        <div className="flex flex-wrap gap-2">
                            {allShops.map(shop => (
                                <button
                                    key={shop.id}
                                    onClick={() => handleShopSelection(shop.id)}
                                    className={`px-3 py-1 rounded-full text-sm ${selectedShopIds.includes(shop.id)
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    {shop.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="flex items-end">
                            <Button variant="primary" size="sm" onClick={fetchComparisonData}>
                                Compare
                            </Button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <p>Loading comparison data...</p>
                    </div>
                ) : error ? (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-8 text-center text-red-500">
                        <p>{error}</p>
                    </div>
                ) : selectedShopIds.length === 0 ? (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <p>Please select at least one shop to compare.</p>
                    </div>
                ) : shops.length === 0 ? (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <p>No comparison data available for the selected shops and period.</p>
                    </div>
                ) : (
                    <>
                        {/* Comparison Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Bar Chart Comparison */}
                            <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory & Sales Comparison</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={barChartData}
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
                                            <Bar dataKey="inventory" fill="#8884d8" name="Inventory" />
                                            <Bar dataKey="sales" fill="#82ca9d" name="Sales" />
                                            <Bar dataKey="revenue" fill="#ffc658" name="Revenue" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Radar Chart Comparison */}
                            <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart outerRadius={90} data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="metric" />
                                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                            {shops.map((shop, index) => (
                                                <Radar
                                                    key={shop.id}
                                                    name={shop.name}
                                                    dataKey={shop.name}
                                                    stroke={index === 0 ? '#8884d8' : '#82ca9d'}
                                                    fill={index === 0 ? '#8884d8' : '#82ca9d'}
                                                    fillOpacity={0.6}
                                                />
                                            ))}
                                            <Legend />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Detailed Comparison</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Metric
                                            </th>
                                            {shops.map(shop => (
                                                <th key={shop.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {shop.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Inventory Count</td>
                                            {shops.map(shop => (
                                                <td key={`${shop.id}-inventory`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {shop.metrics.inventoryCount}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Products</td>
                                            {shops.map(shop => (
                                                <td key={`${shop.id}-products`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {shop.metrics.totalProducts}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sales</td>
                                            {shops.map(shop => (
                                                <td key={`${shop.id}-sales`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {shop.metrics.sales}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Revenue</td>
                                            {shops.map(shop => (
                                                <td key={`${shop.id}-revenue`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    Rs. {shop.metrics.revenue.toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Avg Ticket Size</td>
                                            {shops.map(shop => (
                                                <td key={`${shop.id}-ticket`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    Rs. {shop.metrics.averageTicketSize.toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Customer Count</td>
                                            {shops.map(shop => (
                                                <td key={`${shop.id}-customers`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {shop.metrics.customerCount}
                                                </td>
                                            ))}
                                        </tr>
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