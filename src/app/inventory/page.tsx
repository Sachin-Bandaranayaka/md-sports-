'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Package, Filter, Search, Loader2, X } from 'lucide-react';

// Define proper types for our data
interface BranchStock {
    shopId: number;
    shopName: string;
    quantity: number;
}

interface InventoryItem {
    id: number;
    sku: string;
    name: string;
    category: string;
    stock: number;
    retailPrice: number;
    basePrice: number;
    status: string;
    branchStock: BranchStock[];
}

interface Category {
    id: number;
    name: string;
}

// Status badge colors
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

export default function Inventory() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Add these new state variables
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    useEffect(() => {
        const fetchInventoryData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch categories
                const categoriesResponse = await fetch('/api/products/categories');
                if (!categoriesResponse.ok) {
                    throw new Error('Failed to fetch categories');
                }
                const categoriesData = await categoriesResponse.json();
                if (categoriesData.success) {
                    setCategories(categoriesData.data || []);
                }

                // Fetch products with inventory
                const productsResponse = await fetch('/api/products');
                if (!productsResponse.ok) {
                    throw new Error('Failed to fetch products');
                }
                const productsData = await productsResponse.json();

                if (productsData.success) {
                    // Transform the data to match our component's expected format
                    const transformedItems: InventoryItem[] = await Promise.all(productsData.data.map(async (product: any) => {
                        // Fetch inventory levels for this product
                        const inventoryResponse = await fetch(`/api/products/${product.id}`);
                        const inventoryData = await inventoryResponse.json();

                        // Calculate total stock across all shops
                        let totalStock = 0;
                        const branchStock: BranchStock[] = [];

                        if (inventoryData.success && inventoryData.data.inventory) {
                            inventoryData.data.inventory.forEach((inv: any) => {
                                totalStock += inv.quantity;
                                branchStock.push({
                                    shopId: inv.shop_id,
                                    shopName: inv.shop_name,
                                    quantity: inv.quantity
                                });
                            });
                        }

                        // Determine status based on stock levels
                        let status = 'Out of Stock';
                        if (totalStock > 0) {
                            // Consider low stock if any shop has inventory below reorder level
                            const hasLowStock = inventoryData.data.inventory?.some(
                                (inv: any) => inv.quantity > 0 && inv.quantity <= inv.reorder_level
                            );
                            status = hasLowStock ? 'Low Stock' : 'In Stock';
                        }

                        return {
                            id: product.id,
                            sku: product.sku,
                            name: product.name,
                            category: product.category_name || 'Uncategorized',
                            stock: totalStock,
                            retailPrice: parseFloat(product.retail_price),
                            basePrice: parseFloat(product.base_price),
                            status,
                            branchStock
                        };
                    }));

                    setInventoryItems(transformedItems);
                }
            } catch (err) {
                console.error('Error fetching inventory data:', err);
                setError('Failed to load inventory data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchInventoryData();
    }, []);

    // Filter the inventory items based on search term, category, and status
    const filteredItems = inventoryItems.filter(item => {
        const matchesSearch = searchTerm === '' ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === '' ||
            item.category.toLowerCase() === categoryFilter.toLowerCase();

        const matchesStatus = statusFilter === '' ||
            item.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const navigateToProductDetails = (productId: number) => {
        router.push(`/inventory/${productId}`);
    };

    // Add Product handler
    const handleAddProduct = () => {
        // Navigate to product form page
        router.push('/inventory/new');
    };

    // Toggle filter panel
    const toggleFilterPanel = () => {
        setShowFilterPanel(!showFilterPanel);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="space-y-6">
                    {/* Loading header placeholder */}
                    <div className="bg-tertiary p-5 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                                <div className="h-8 bg-gray-200 rounded w-64"></div>
                                <div className="h-4 bg-gray-200 rounded w-48"></div>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-9 bg-gray-200 rounded w-24"></div>
                                <div className="h-9 bg-gray-200 rounded w-32"></div>
                            </div>
                        </div>
                    </div>

                    {/* Loading filters placeholder */}
                    <div className="bg-tertiary p-5 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                            <div className="h-10 bg-gray-200 rounded w-40 md:w-40"></div>
                            <div className="h-10 bg-gray-200 rounded w-40 md:w-40"></div>
                        </div>
                    </div>

                    {/* Loading table placeholder */}
                    <div className="bg-tertiary rounded-xl shadow-sm overflow-hidden border border-gray-200 animate-pulse">
                        <div className="p-5">
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-full"></div>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded w-full"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                        <p className="text-gray-500">Manage your product inventory across all shops</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFilterPanel}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAddProduct}
                        >
                            <Package className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    </div>
                </div>

                {/* Expanded Filter Panel */}
                {showFilterPanel && (
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4 animate-in fade-in-0 slide-in-from-top-5 duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-lg">Advanced Filters</h3>
                            <Button variant="ghost" size="sm" onClick={toggleFilterPanel}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    id="category-filter"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.name}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    id="status-filter"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="In Stock">In Stock</option>
                                    <option value="Low Stock">Low Stock</option>
                                    <option value="Out of Stock">Out of Stock</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        setCategoryFilter('');
                                        setStatusFilter('');
                                        setSearchTerm('');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and filter bar */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                                placeholder="Search inventory..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.name}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="In Stock">In Stock</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Inventory table */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3">Product Name</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Stock</th>
                                    <th className="px-6 py-3">Retail Price</th>
                                    <th className="px-6 py-3">Base Cost</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b hover:bg-gray-50 cursor-pointer"
                                            onClick={() => navigateToProductDetails(item.id)}
                                        >
                                            <td className="px-6 py-4 font-medium text-primary">
                                                {item.sku}
                                            </td>
                                            <td className="px-6 py-4">{item.name}</td>
                                            <td className="px-6 py-4">{item.category}</td>
                                            <td className="px-6 py-4">{item.stock}</td>
                                            <td className="px-6 py-4">Rs. {item.retailPrice.toFixed(2)}</td>
                                            <td className="px-6 py-4">Rs. {item.basePrice.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateToProductDetails(item.id);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                            {error ? 'Error loading inventory data' : 'No inventory items found'}
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