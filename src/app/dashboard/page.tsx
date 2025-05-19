'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import {
    BarChart2,
    Package,
    Truck,
    CreditCard,
    AlertTriangle,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

// Dummy data for demonstration
const summaryData = [
    { title: 'Total Inventory Value', value: 'Rs. 1,245,800', icon: Package, trend: '+5%', trendUp: true },
    { title: 'Pending Transfers', value: '12', icon: Truck, trend: '+2', trendUp: true },
    { title: 'Outstanding Invoices', value: 'Rs. 320,450', icon: CreditCard, trend: '-8%', trendUp: false },
    { title: 'Low Stock Items', value: '28', icon: AlertTriangle, trend: '+5', trendUp: false },
];

// Dummy data for chart
const shopPerformance = [
    { name: 'Colombo Shop', sales: 125000, stock: 450 },
    { name: 'Kandy Shop', sales: 98500, stock: 320 },
    { name: 'Galle Shop', sales: 75200, stock: 280 },
    { name: 'Jaffna Shop', sales: 62800, stock: 210 },
];

// Dummy data for recent transfers
const recentTransfers = [
    { id: 'TR-001', source: 'Colombo Shop', destination: 'Kandy Shop', status: 'Completed', date: '2025-05-20', items: 12 },
    { id: 'TR-002', source: 'Galle Shop', destination: 'Colombo Shop', status: 'Pending', date: '2025-05-19', items: 8 },
    { id: 'TR-003', source: 'Kandy Shop', destination: 'Jaffna Shop', status: 'In Transit', date: '2025-05-18', items: 15 },
];

export default function Dashboard() {
    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {summaryData.map((item, index) => (
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
                                    <item.icon className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </div>
                    ))}
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
                                {recentTransfers.map((transfer, index) => (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 