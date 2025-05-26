'use client';

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

interface DashboardChartsProps {
    shopPerformance: ShopPerformance[] | null;
    inventoryDistribution: InventoryCategory[] | null;
    monthlySales: MonthlySales[] | null;
}

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Dummy data for fallbacks
const dummyShopPerformance: ShopPerformance[] = [
    { name: 'Colombo Shop', sales: 125000, stock: 450 },
    { name: 'Kandy Shop', sales: 98500, stock: 320 },
    { name: 'Galle Shop', sales: 75200, stock: 280 },
    { name: 'Jaffna Shop', sales: 62800, stock: 210 },
];

const dummyInventoryDistribution: InventoryCategory[] = [
    { name: 'Cricket', value: 350 },
    { name: 'Football', value: 280 },
    { name: 'Basketball', value: 200 },
    { name: 'Tennis', value: 150 },
    { name: 'Swimming', value: 100 },
];

const dummyMonthlySales: MonthlySales[] = [
    { month: 'Jan', sales: 85000 },
    { month: 'Feb', sales: 92000 },
    { month: 'Mar', sales: 88000 },
    { month: 'Apr', sales: 99000 },
    { month: 'May', sales: 115000 },
    { month: 'Jun', sales: 125000 },
];

export default function DashboardCharts({
    shopPerformance,
    inventoryDistribution,
    monthlySales
}: DashboardChartsProps) {
    // Use provided data or fallback to dummy data
    const shopsData = shopPerformance || dummyShopPerformance;
    const inventoryData = inventoryDistribution || dummyInventoryDistribution;
    const salesData = monthlySales || dummyMonthlySales;

    return (
        <>
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shop Sales Chart */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Shop Sales Performance</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={shopsData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="sales" name="Sales (Rs.)" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Distribution */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Distribution</h3>
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
            </div>

            {/* Monthly Sales Trend */}
            <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Sales Trend</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={salesData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="sales"
                                name="Monthly Sales (Rs.)"
                                stroke="#4ade80"
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Shop Performance Table */}
            <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Shop Performance</h3>
                    <button className="text-sm text-primary hover:text-primary-dark">View All Shops</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales (Last 30 days)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-tertiary divide-y divide-gray-200">
                            {shopsData.map((shop, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shop.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rs. {shop.sales.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.stock} items</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary hover:text-primary-dark"><button>View</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
} 