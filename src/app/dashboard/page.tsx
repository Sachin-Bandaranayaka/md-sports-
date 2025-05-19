'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import {
    Package,
    Truck,
    CreditCard,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Loader2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

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
    id: string;
    source: string;
    destination: string;
    status: string;
    date: string;
    items: number;
}

// Dummy data for backup
const dummySummaryData: SummaryItem[] = [
    { title: 'Total Inventory Value', value: 'Rs. 1,245,800', icon: 'Package', trend: '+5%', trendUp: true },
    { title: 'Pending Transfers', value: '12', icon: 'Truck', trend: '+2', trendUp: true },
    { title: 'Outstanding Invoices', value: 'Rs. 320,450', icon: 'CreditCard', trend: '-8%', trendUp: false },
    { title: 'Low Stock Items', value: '28', icon: 'AlertTriangle', trend: '+5', trendUp: false },
];

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState<SummaryItem[]>(dummySummaryData);
    const [shopPerformance, setShopPerformance] = useState<ShopPerformance[]>([]);
    const [inventoryDistribution, setInventoryDistribution] = useState<InventoryCategory[]>([]);
    const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
    const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Map icon names to components
    const iconMap: Record<string, React.ElementType> = {
        'Package': Package,
        'Truck': Truck,
        'CreditCard': CreditCard,
        'AlertTriangle': AlertTriangle
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch summary data
                const summaryResponse = await fetch('/api/dashboard/summary');
                if (!summaryResponse.ok) {
                    throw new Error('Failed to fetch summary data');
                }
                const summaryData = await summaryResponse.json();
                if (summaryData.success) {
                    setSummaryData(summaryData.data || dummySummaryData);
                }

                // Fetch shop performance
                const shopsResponse = await fetch('/api/dashboard/shops');
                if (!shopsResponse.ok) {
                    throw new Error('Failed to fetch shop data');
                }
                const shopsData = await shopsResponse.json();
                if (shopsData.success) {
                    setShopPerformance(shopsData.data || []);
                }

                // Fetch inventory distribution
                const inventoryResponse = await fetch('/api/dashboard/inventory');
                if (!inventoryResponse.ok) {
                    throw new Error('Failed to fetch inventory data');
                }
                const inventoryData = await inventoryResponse.json();
                if (inventoryData.success) {
                    setInventoryDistribution(inventoryData.data || []);
                }

                // Fetch monthly sales
                const salesResponse = await fetch('/api/dashboard/sales');
                if (!salesResponse.ok) {
                    throw new Error('Failed to fetch sales data');
                }
                const salesData = await salesResponse.json();
                if (salesData.success) {
                    setMonthlySales(salesData.data || []);
                }

                // Fetch recent transfers
                const transfersResponse = await fetch('/api/dashboard/transfers');
                if (!transfersResponse.ok) {
                    throw new Error('Failed to fetch transfers data');
                }
                const transfersData = await transfersResponse.json();
                if (transfersData.success) {
                    setRecentTransfers(transfersData.data || []);
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');

                // Fallback to dummy data
                setShopPerformance([
                    { name: 'Colombo Shop', sales: 125000, stock: 450 },
                    { name: 'Kandy Shop', sales: 98500, stock: 320 },
                    { name: 'Galle Shop', sales: 75200, stock: 280 },
                    { name: 'Jaffna Shop', sales: 62800, stock: 210 },
                ]);

                setInventoryDistribution([
                    { name: 'Cricket', value: 350 },
                    { name: 'Football', value: 280 },
                    { name: 'Basketball', value: 200 },
                    { name: 'Tennis', value: 150 },
                    { name: 'Swimming', value: 100 },
                ]);

                setMonthlySales([
                    { month: 'Jan', sales: 85000 },
                    { month: 'Feb', sales: 92000 },
                    { month: 'Mar', sales: 88000 },
                    { month: 'Apr', sales: 99000 },
                    { month: 'May', sales: 115000 },
                    { month: 'Jun', sales: 125000 },
                ]);

                setRecentTransfers([
                    { id: 'TR-001', source: 'Colombo Shop', destination: 'Kandy Shop', status: 'Completed', date: '2025-05-20', items: 12 },
                    { id: 'TR-002', source: 'Galle Shop', destination: 'Colombo Shop', status: 'Pending', date: '2025-05-19', items: 8 },
                    { id: 'TR-003', source: 'Kandy Shop', destination: 'Jaffna Shop', status: 'In Transit', date: '2025-05-18', items: 15 },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <MainLayout>
                <div className="h-full flex items-center justify-center p-20">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500">Loading dashboard data...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {summaryData.map((item, index) => {
                        // Get the corresponding icon component
                        const IconComponent = iconMap[item.icon] || Package;

                        return (
                            <div
                                key={index}
                                className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{item.title}</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{item.value}</h3>
                                        <div className="flex items-center mt-2">
                                            {item.trendUp ? (
                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-500" />
                                            )}
                                            <span
                                                className={`text-sm ml-1 ${item.trendUp ? 'text-green-500' : 'text-red-500'
                                                    }`}
                                            >
                                                {item.trend}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-100 p-3 rounded-full">
                                        <IconComponent className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Shop Sales Bar Chart */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200 col-span-2">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Shop Sales Performance</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={shopPerformance}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) => `Rs. ${value.toLocaleString()}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="sales" fill="#8884d8" name="Sales (Rs.)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Inventory Distribution Pie Chart */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Distribution</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={inventoryDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {inventoryDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} items`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Monthly Sales Trend */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales Trend</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={monthlySales}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#00C49F"
                                    name="Monthly Sales (Rs.)"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Shop Performance Table */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Shop Performance</h2>
                        <Button variant="outline" size="sm">
                            View All Shops
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Shop Name</th>
                                    <th className="px-4 py-3">Sales (Last 30 days)</th>
                                    <th className="px-4 py-3">Current Stock</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shopPerformance.map((shop, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="px-4 py-3 font-medium text-gray-900">{shop.name}</td>
                                        <td className="px-4 py-3">Rs. {shop.sales.toLocaleString()}</td>
                                        <td className="px-4 py-3">{shop.stock} items</td>
                                        <td className="px-4 py-3">
                                            <Button variant="ghost" size="sm">View</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Transfers */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Transfers</h2>
                        <Button variant="outline" size="sm">
                            View All Transfers
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Transfer ID</th>
                                    <th className="px-4 py-3">Source</th>
                                    <th className="px-4 py-3">Destination</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Items</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransfers.length > 0 ? (
                                    recentTransfers.map((transfer, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="px-4 py-3 font-medium text-primary">{transfer.id}</td>
                                            <td className="px-4 py-3">{transfer.source}</td>
                                            <td className="px-4 py-3">{transfer.destination}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${transfer.status === 'Completed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : transfer.status === 'Pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {transfer.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{transfer.date}</td>
                                            <td className="px-4 py-3">{transfer.items} items</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                            No recent transfers found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 