'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import {
    Package,
    BarChart4,
    Calendar,
    Store,
    User,
    FileText,
    ArrowLeft,
    TrendingUp,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
    Cell
} from 'recharts';

// Types
interface BranchStock {
    branchId: string;
    branchName: string;
    quantity: number;
}

interface Invoice {
    id: string;
    date: string;
    shopId: string;
    shopName: string;
    cashierName: string;
    quantity: number;
    total: number;
}

interface ProductSales {
    daily: number;
    weekly: number;
    monthly: number;
}

interface ProductDetail {
    id: string;
    name: string;
    category: string;
    stock: number;
    retailPrice: number;
    wholesalePrice: number;
    averageCost: number;
    status: string;
    branchStock: BranchStock[];
    invoices: Invoice[];
    sales: ProductSales;
}

// Mock data function - in a real app, this would fetch data from an API
const fetchProductDetails = (id: string): Promise<ProductDetail> => {
    // This is dummy data - in production this would come from your API
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id,
                name: id === 'MD-001' ? 'Cricket Bat - Professional' : 'Sample Product',
                category: 'Cricket',
                stock: 45,
                retailPrice: 8500,
                wholesalePrice: 7200,
                averageCost: 6500,
                status: 'In Stock',
                branchStock: [
                    { branchId: 'SH001', branchName: 'Main Shop', quantity: 20 },
                    { branchId: 'SH002', branchName: 'City Center', quantity: 15 },
                    { branchId: 'SH003', branchName: 'Stadium Shop', quantity: 10 }
                ],
                invoices: [
                    {
                        id: 'INV-1001',
                        date: '2023-09-01',
                        shopId: 'SH001',
                        shopName: 'Main Shop',
                        cashierName: 'John Doe',
                        quantity: 2,
                        total: 17000
                    },
                    {
                        id: 'INV-1023',
                        date: '2023-09-05',
                        shopId: 'SH002',
                        shopName: 'City Center',
                        cashierName: 'Jane Smith',
                        quantity: 1,
                        total: 8500
                    },
                    {
                        id: 'INV-1045',
                        date: '2023-09-10',
                        shopId: 'SH001',
                        shopName: 'Main Shop',
                        cashierName: 'John Doe',
                        quantity: 3,
                        total: 25500
                    },
                    {
                        id: 'INV-1067',
                        date: '2023-09-15',
                        shopId: 'SH003',
                        shopName: 'Stadium Shop',
                        cashierName: 'Mike Johnson',
                        quantity: 2,
                        total: 17000
                    },
                    {
                        id: 'INV-1089',
                        date: '2023-09-18',
                        shopId: 'SH002',
                        shopName: 'City Center',
                        cashierName: 'Sarah Williams',
                        quantity: 1,
                        total: 8500
                    }
                ],
                sales: {
                    daily: 2,
                    weekly: 8,
                    monthly: 35
                }
            });
        }, 500);
    });
};

// Status badge color function
const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'In Stock':
            return 'bg-green-100 text-green-800';
        case 'Low Stock':
            return 'bg-yellow-100 text-yellow-800';
        case 'Out of Stock':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

// Shop section component for better organization
const ShopSection = ({
    shopName,
    invoices
}: {
    shopName: string,
    invoices: Invoice[]
}) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="mb-6 border rounded-lg overflow-hidden">
            <div
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center">
                    <Store className="w-4 h-4 mr-2 text-gray-600" />
                    <h3 className="font-semibold">{shopName}</h3>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {expanded && (
                <div className="p-4">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left">Invoice ID</th>
                                <th className="px-4 py-2 text-left">Date</th>
                                <th className="px-4 py-2 text-left">Cashier</th>
                                <th className="px-4 py-2 text-left">Quantity</th>
                                <th className="px-4 py-2 text-left">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(invoice => (
                                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2">{invoice.id}</td>
                                    <td className="px-4 py-2">{new Date(invoice.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center">
                                            <User className="w-3 h-3 mr-1 text-gray-500" />
                                            {invoice.cashierName}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">{invoice.quantity}</td>
                                    <td className="px-4 py-2">Rs. {invoice.total.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Sales stat card
const StatCard = ({
    title,
    value,
    icon
}: {
    title: string,
    value: number,
    icon: React.ReactNode
}) => (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-semibold mt-1">{value}</p>
            </div>
            <div className="p-2 rounded-full bg-primary/10 text-primary">
                {icon}
            </div>
        </div>
    </div>
);

export default function ProductDetail() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');

    // Group invoices by shop
    const invoicesByShop: Record<string, Invoice[]> = {};

    if (product) {
        product.invoices.forEach(invoice => {
            if (!invoicesByShop[invoice.shopName]) {
                invoicesByShop[invoice.shopName] = [];
            }
            invoicesByShop[invoice.shopName].push(invoice);
        });
    }

    useEffect(() => {
        if (!params.productId) return;

        const productId = Array.isArray(params.productId)
            ? params.productId[0]
            : params.productId;

        setIsLoading(true);
        fetchProductDetails(productId)
            .then(data => {
                setProduct(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching product details:', error);
                setIsLoading(false);
            });
    }, [params.productId]);

    // Prepare data for charts
    const getSalesDataByLocation = () => {
        if (!product) return [];

        // Count quantity and total sales by shop
        const salesByShop: Record<string, { shopName: string, quantity: number, total: number }> = {};

        product.invoices.forEach(invoice => {
            if (!salesByShop[invoice.shopId]) {
                salesByShop[invoice.shopId] = {
                    shopName: invoice.shopName,
                    quantity: 0,
                    total: 0
                };
            }

            salesByShop[invoice.shopId].quantity += invoice.quantity;
            salesByShop[invoice.shopId].total += invoice.total;
        });

        // Convert to array for Recharts
        return Object.values(salesByShop).map(item => ({
            name: item.shopName,
            quantity: item.quantity,
            sales: item.total
        }));
    };

    // Pie chart data for sales distribution
    const getSalesDistributionData = () => {
        if (!product) return [];

        const salesByShop: Record<string, number> = {};

        product.invoices.forEach(invoice => {
            if (!salesByShop[invoice.shopName]) {
                salesByShop[invoice.shopName] = 0;
            }

            salesByShop[invoice.shopName] += invoice.total;
        });

        return Object.entries(salesByShop).map(([name, value]) => ({
            name,
            value
        }));
    };

    // Colors for pie chart
    const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CD2'];

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading product details...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!product) {
        return (
            <MainLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-700">Product Not Found</h2>
                    <p className="text-gray-500 mt-2">The product you're looking for doesn't exist or has been removed.</p>
                    <Button
                        variant="primary"
                        size="sm"
                        className="mt-4"
                        onClick={() => router.push('/inventory')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Inventory
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Back button and header */}
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4"
                        onClick={() => router.push('/inventory')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Inventory
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center">
                            <div className="p-2 rounded-full bg-primary/10 text-primary mr-3">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                                <p className="text-gray-500">{product.id} &middot; {product.category}</p>
                            </div>
                        </div>
                        <div>
                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeClass(product.status)}`}>
                                {product.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'details'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            onClick={() => setActiveTab('details')}
                        >
                            Product Details
                        </button>
                        <button
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'sales'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            onClick={() => setActiveTab('sales')}
                        >
                            Sales History
                        </button>
                    </nav>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'details' && (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg border shadow-sm p-4">
                                <h3 className="text-sm font-medium text-gray-500">Retail Price</h3>
                                <p className="text-2xl font-bold mt-1">Rs. {product.retailPrice.toLocaleString()}</p>
                                <div className="mt-2 text-sm text-gray-500">Wholesale: Rs. {product.wholesalePrice.toLocaleString()}</div>
                            </div>

                            <div className="bg-white rounded-lg border shadow-sm p-4">
                                <h3 className="text-sm font-medium text-gray-500">Average Cost</h3>
                                <p className="text-2xl font-bold mt-1">Rs. {product.averageCost.toLocaleString()}</p>
                                <div className="mt-2 text-sm text-gray-500">Margin: {Math.round((product.retailPrice - product.averageCost) / product.averageCost * 100)}%</div>
                            </div>

                            <div className="bg-white rounded-lg border shadow-sm p-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Stock</h3>
                                <p className="text-2xl font-bold mt-1">{product.stock} units</p>
                                <div className="mt-2 text-sm text-gray-500">Across {product.branchStock.length} locations</div>
                            </div>
                        </div>

                        {/* Stock by branch */}
                        <div className="bg-white rounded-lg border shadow-sm">
                            <div className="p-4 border-b">
                                <h2 className="font-semibold text-lg">Stock by Location</h2>
                            </div>
                            <div className="p-4">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Branch ID</th>
                                            <th className="px-4 py-2 text-left">Branch Name</th>
                                            <th className="px-4 py-2 text-left">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.branchStock.map((branch) => (
                                            <tr key={branch.branchId} className="border-b">
                                                <td className="px-4 py-2">{branch.branchId}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center">
                                                        <Store className="w-4 h-4 mr-2 text-gray-500" />
                                                        {branch.branchName}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">{branch.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'sales' && (
                    <>
                        {/* Sales stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <StatCard
                                title="Daily Sales"
                                value={product.sales.daily}
                                icon={<Calendar className="w-5 h-5" />}
                            />
                            <StatCard
                                title="Weekly Sales"
                                value={product.sales.weekly}
                                icon={<BarChart4 className="w-5 h-5" />}
                            />
                            <StatCard
                                title="Monthly Sales"
                                value={product.sales.monthly}
                                icon={<TrendingUp className="w-5 h-5" />}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Sales by Location - Bar Chart */}
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-4 border-b">
                                    <h2 className="font-semibold text-lg">Sales by Location</h2>
                                </div>
                                <div className="p-4">
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={getSalesDataByLocation()}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                                <Tooltip />
                                                <Legend />
                                                <Bar yAxisId="left" dataKey="quantity" name="Units Sold" fill="#8884d8" />
                                                <Bar yAxisId="right" dataKey="sales" name="Sales (Rs.)" fill="#82ca9d" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Sales Distribution - Pie Chart */}
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-4 border-b">
                                    <h2 className="font-semibold text-lg">Sales Distribution</h2>
                                </div>
                                <div className="p-4">
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={getSalesDistributionData()}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    nameKey="name"
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {getSalesDistributionData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `Rs. ${Number(value).toLocaleString()}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoices by shop */}
                        <div className="bg-white rounded-lg border shadow-sm">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h2 className="font-semibold text-lg">Sales History by Shop</h2>
                                <div className="text-sm text-gray-500">
                                    <FileText className="w-4 h-4 inline mr-1" />
                                    {product.invoices.length} Invoices
                                </div>
                            </div>
                            <div className="p-4">
                                {Object.keys(invoicesByShop).map(shopName => (
                                    <ShopSection
                                        key={shopName}
                                        shopName={shopName}
                                        invoices={invoicesByShop[shopName]}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
} 