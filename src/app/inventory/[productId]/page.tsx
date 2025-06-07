'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
    ChevronUp,
    Info,
    ShoppingCart,
    Tag,
    Repeat,
    Edit3
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

interface ProductHistoryEvent {
    timestamp: string;
    type: string;
    description: string;
    quantityChange?: number;
    shopId?: number;
    shopName?: string;
    userId?: number;
    userName?: string;
    relatedDocumentId?: string;
    details?: any;
}

interface ProductDetail {
    id: string;
    name: string;
    category: string;
    stock: number;
    retailPrice: number;
    wholesalePrice: number;
    weightedAverageCost: number;
    status: string;
    branchStock: BranchStock[];
    invoices: Invoice[];
    sales: ProductSales;
}

// Mock data function - in a real app, this would fetch data from an API
const fetchProductDetails = async (id: string): Promise<ProductDetail> => {
    // Make a real API call to the product endpoint
    const response = await fetch(`/api/products/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch product details');
    }

    const responseData = await response.json();

    if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to fetch product details');
    }

    const productData = responseData.data;

    // Get total stock quantity across all locations
    const totalStock = productData.inventory.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
    );

    // Prepare branch stock data from inventory items
    const branchStock: BranchStock[] = productData.inventory.map((item: any) => ({
        branchId: item.shop_id.toString(),
        branchName: item.shop_name,
        quantity: item.quantity
    }));

    // Fetch sales history data from the API
    const salesResponse = await fetch(`/api/products/${id}/sales`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    let invoices: Invoice[] = [];
    let salesMetrics = {
        daily: 0,
        weekly: 0,
        monthly: 0
    };

    // If the sales history API is successful, use the data; otherwise use default values
    if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        if (salesData.success) {
            invoices = salesData.data.invoices;
            salesMetrics = {
                daily: salesData.data.metrics.daily,
                weekly: salesData.data.metrics.weekly,
                monthly: salesData.data.metrics.monthly
            };
        }
    }

    // Transform the API response to match our ProductDetail interface
    return {
        id: productData.id.toString(),
        name: productData.name,
        category: productData.category_name || 'Uncategorized',
        stock: totalStock,
        retailPrice: productData.price,
        wholesalePrice: productData.wholesalePrice || productData.price * 0.85, // Default calculation if not available
        weightedAverageCost: productData.weightedAverageCost || 0,
        status: totalStock > 0 ? (totalStock < 10 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
        branchStock,
        invoices,
        sales: salesMetrics
    };
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

// Function to render clickable reference links
const renderClickableReference = (event: ProductHistoryEvent) => {
    const { relatedDocumentId, type, details } = event;
    
    if (!relatedDocumentId) return null;
    
    // Extract invoice number or ID from relatedDocumentId
    if (type === 'Purchase' && details?.invoiceNumber) {
        // For purchase invoices, link to purchases page with search
        // This will filter the purchases list to show the specific invoice
        return (
            <Link 
                href={`/purchases?search=${details.invoiceNumber}`}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                title={`View Purchase Invoice ${details.invoiceNumber}`}
            >
                {relatedDocumentId}
            </Link>
        );
    } else if (type === 'Sale' && details?.invoiceNumber) {
        // For sales invoices, link to invoices page with search
        // This will filter the invoices list to show the specific invoice
        return (
            <Link 
                href={`/invoices?search=${details.invoiceNumber}`}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                title={`View Sales Invoice ${details.invoiceNumber}`}
            >
                {relatedDocumentId}
            </Link>
        );
    } else if (type.includes('Transfer') && details) {
        // For transfers, we could link to a transfers page if it exists
        // For now, we'll just show the text without a link but with a different style
        return (
            <span 
                className="text-gray-600 font-medium"
                title="Transfer details"
            >
                {relatedDocumentId}
            </span>
        );
    }
    
    // Default case - just show the text
    return (
        <span 
            className="text-gray-600"
            title="Reference ID"
        >
            {relatedDocumentId}
        </span>
    );
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
                    <Store className="w-4 h-4 mr-2 text-black" />
                    <h3 className="font-semibold text-black">{shopName}</h3>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-black" /> : <ChevronDown className="w-4 h-4 text-black" />}
            </div>

            {expanded && (
                <div className="p-4">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-black uppercase bg-gray-50">
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
                                    <td className="px-4 py-2 text-black">{invoice.id}</td>
                                    <td className="px-4 py-2 text-black">{new Date(invoice.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center text-black">
                                            <User className="w-3 h-3 mr-1 text-black" />
                                            {invoice.cashierName}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-black">{invoice.quantity}</td>
                                    <td className="px-4 py-2 text-black">Rs. {invoice.total.toLocaleString()}</td>
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
                <p className="text-sm text-black">{title}</p>
                <p className="text-2xl font-semibold mt-1 text-black">{value}</p>
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
    const [productHistory, setProductHistory] = useState<ProductHistoryEvent[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // New filter states for Product History
    const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
    const [historyStartDate, setHistoryStartDate] = useState<string>('');
    const [historyEndDate, setHistoryEndDate] = useState<string>('');

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

        const loadProductData = async () => {
            try {
                const data = await fetchProductDetails(productId);
                setProduct(data);
            } catch (error) {
                console.error('Error fetching product details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProductData();
    }, [params.productId]);

    // useEffect to fetch product history when activeTab is 'history' or productId changes
    useEffect(() => {
        if (!params.productId || activeTab !== 'history') {
            // Clear history if not on history tab or no product
            // setProductHistory([]); // Optional: clear if you want fresh load every time tab is clicked
            return;
        }

        const productIdStr = Array.isArray(params.productId) ? params.productId[0] : params.productId;

        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            const queryParams = new URLSearchParams();
            if (selectedEventTypes.length > 0) {
                queryParams.append('eventTypes', selectedEventTypes.join(','));
            }
            if (historyStartDate) {
                queryParams.append('startDate', historyStartDate);
            }
            if (historyEndDate) {
                queryParams.append('endDate', historyEndDate);
            }

            try {
                const response = await fetch(`/api/products/${productIdStr}/history?${queryParams.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch product history');
                }
                const historyData = await response.json();
                if (historyData.success) {
                    setProductHistory(historyData.data);
                } else {
                    console.error('Error in history API response:', historyData.message);
                    setProductHistory([]);
                }
            } catch (error) {
                console.error('Error fetching product history:', error);
                setProductHistory([]);
            } finally {
                setIsLoadingHistory(false);
                // If all initial data is loaded, set main loading to false
                if (product) setIsLoading(false);
            }
        };

        if (productIdStr) {
            fetchHistory();
        }

    }, [params.productId, activeTab, product, selectedEventTypes, historyStartDate, historyEndDate]); // Add filter states to dependency array

    // Helper to get an icon based on history event type
    const getHistoryIcon = (type: string) => {
        switch (type) {
            case 'Purchase': return <ShoppingCart className="w-5 h-5 text-blue-500" />;
            case 'Sale': return <Tag className="w-5 h-5 text-green-500" />;
            case 'Transfer In':
            case 'Transfer Out': return <Repeat className="w-5 h-5 text-purple-500" />;
            case 'Product Update': return <Edit3 className="w-5 h-5 text-orange-500" />;
            case 'Stock Added': return <ArrowLeft className="w-5 h-5 text-teal-500 transform rotate-45" />; // Example icon
            default: return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

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
                        <p className="mt-2 text-black">Loading product details...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!product) {
        return (
            <MainLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-black">Product Not Found</h2>
                    <p className="text-black mt-2">The product you're looking for doesn't exist or has been removed.</p>
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
                                <h1 className="text-2xl font-bold text-black">{product.name}</h1>
                                <p className="text-black">{product.id} &middot; {product.category}</p>
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
                                : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                                }`}
                            onClick={() => setActiveTab('details')}
                        >
                            Product Details
                        </button>
                        <button
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'sales'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                                }`}
                            onClick={() => setActiveTab('sales')}
                        >
                            Sales History
                        </button>
                        <button
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                                }`}
                            onClick={() => setActiveTab('history')}
                        >
                            Product History
                        </button>
                    </nav>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'details' && (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-black">Retail Price</h3>
                                <p className="text-2xl font-bold mt-1 text-black">Rs. {product.retailPrice.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-black">Weighted Average Cost</h3>
                                <p className="text-2xl font-bold mt-1 text-black">Rs. {product.weightedAverageCost.toLocaleString()}</p>
                                <div className="mt-2 text-sm text-black">Margin: {product.weightedAverageCost > 0 ? Math.round(((product.retailPrice - product.weightedAverageCost) / product.weightedAverageCost) * 100) : 'N/A'}%</div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-black">Total Stock</h3>
                                <p className="text-2xl font-bold mt-1 text-black">{product.stock} units</p>
                                <div className="mt-2 text-sm text-black">Across {product.branchStock.length} locations</div>
                            </div>
                        </div>

                        {/* Stock by branch */}
                        <div className="bg-white rounded-lg border shadow-sm">
                            <div className="p-4 border-b">
                                <h2 className="font-semibold text-lg text-black">Stock by Location</h2>
                            </div>
                            <div className="p-4">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-black uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Branch ID</th>
                                            <th className="px-4 py-2 text-left">Branch Name</th>
                                            <th className="px-4 py-2 text-left">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.branchStock.map((branch) => (
                                            <tr key={branch.branchId} className="border-b">
                                                <td className="px-4 py-2 text-black">{branch.branchId}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center text-black">
                                                        <Store className="w-4 h-4 mr-2 text-black" />
                                                        {branch.branchName}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-black">{branch.quantity}</td>
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
                                    <h2 className="font-semibold text-lg text-black">Sales by Location</h2>
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
                                    <h2 className="font-semibold text-lg text-black">Sales Distribution</h2>
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
                                <h2 className="font-semibold text-lg text-black">Sales History by Shop</h2>
                                <div className="text-sm text-black">
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

                {activeTab === 'history' && (
                    <div className="bg-white rounded-lg border shadow-sm p-6">
                        <h2 className="font-semibold text-lg text-black mb-4">Product Event History</h2>

                        {/* Filter Controls */}
                        <div className="mb-6 p-4 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label htmlFor="event-type-filter" className="block text-sm font-medium text-gray-700 mb-1">Event Type(s)</label>
                                <select
                                    id="event-type-filter"
                                    multiple
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 h-32"
                                    value={selectedEventTypes}
                                    onChange={(e) => setSelectedEventTypes(Array.from(e.target.selectedOptions, option => option.value))}
                                >
                                    <option value="Purchase">Purchase</option>
                                    <option value="Sale">Sale</option>
                                    <option value="Transfer In">Transfer In</option>
                                    <option value="Transfer Out">Transfer Out</option>
                                    <option value="Product Update">Product Update</option>
                                    <option value="Stock Added">Stock Added</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                            </div>
                            <div>
                                <label htmlFor="history-start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    id="history-start-date"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={historyStartDate}
                                    onChange={(e) => setHistoryStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="history-end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    id="history-end-date"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={historyEndDate}
                                    onChange={(e) => setHistoryEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {isLoadingHistory ? (
                            <div className="text-center py-4">
                                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-2 text-black">Loading history...</p>
                            </div>
                        ) : productHistory.length > 0 ? (
                            <ul className="space-y-4">
                                {productHistory.map((event, index) => (
                                    <li key={index} className="flex items-start space-x-3 p-3 border-b last:border-b-0">
                                        <div className="flex-shrink-0 pt-1">
                                            {getHistoryIcon(event.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-semibold text-black">{event.type}</p>
                                                <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                                            </div>
                                            <p className="mt-1 text-sm text-black whitespace-pre-line">{event.description}</p>
                                            {event.quantityChange !== undefined && (
                                                <p className="text-xs mt-1 font-medium text-black">
                                                    Quantity Change: <span className={event.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}>{event.quantityChange > 0 ? '+' : ''}{event.quantityChange} units</span>
                                                </p>
                                            )}
                                            {event.shopName && <p className="text-xs mt-1 text-gray-600">Shop: {event.shopName}</p>}
                                            {event.userName && <p className="text-xs mt-1 text-gray-600">User: {event.userName}</p>}
                                            {event.relatedDocumentId && (
                                                <p className="text-xs mt-1 text-gray-600">
                                                    Ref: {renderClickableReference(event)}
                                                </p>
                                            )}
                                            {/* Optionally, add a way to view raw event.details if needed */}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-black text-center py-4">No history events found for this product.</p>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}