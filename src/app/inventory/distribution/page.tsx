'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import {
    Package,
    Store,
    Search,
    Loader2,
    ArrowLeft,
    Filter,
    X,
    ArrowUpDown,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Define types
interface ShopStock {
    shopId: number;
    shopName: string;
    quantity: number;
    shopSpecificCost: number;
}

interface ProductStock {
    id: number;
    name: string;
    sku: string;
    category: string;
    retailPrice: number;
    weightedAverageCost: number;
    totalStock: number;
    branchStock: ShopStock[];
}

interface Shop {
    id: number;
    name: string;
}

export default function InventoryDistribution() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [shopList, setShopList] = useState<Shop[]>([]);
    const [products, setProducts] = useState<ProductStock[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [error, setError] = useState<string | null>(null);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [viewMode, setViewMode] = useState<'product' | 'shop'>('product');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch all products with their inventory data
            const productsResponse = await fetch('/api/products');

            if (!productsResponse.ok) {
                throw new Error('Failed to fetch products');
            }

            const productsData = await productsResponse.json();

            if (!productsData.success) {
                throw new Error(productsData.message || 'Failed to fetch products');
            }

            // Transform and collect all products with their inventory data
            const transformedProducts: ProductStock[] = [];
            const shopsMap = new Map<number, Shop>();

            for (const product of productsData.data) {
                // Fetch inventory levels for this product
                const inventoryResponse = await fetch(`/api/products/${product.id}`);
                const inventoryData = await inventoryResponse.json();

                if (inventoryData.success) {
                    const branchStock: ShopStock[] = [];
                    let totalStock = 0;

                    if (inventoryData.data.inventory) {
                        // Build the shop list while processing inventory
                        inventoryData.data.inventory.forEach((inv: any) => {
                            totalStock += inv.quantity;

                            // Add shop to the map if not already present
                            if (!shopsMap.has(inv.shop_id)) {
                                shopsMap.set(inv.shop_id, {
                                    id: inv.shop_id,
                                    name: inv.shop_name
                                });
                            }

                            branchStock.push({
                                shopId: inv.shop_id,
                                shopName: inv.shop_name,
                                quantity: inv.quantity,
                                shopSpecificCost: parseFloat(inv.shop_specific_cost) || 0
                            });
                        });
                    }

                    transformedProducts.push({
                        id: product.id,
                        name: product.name,
                        sku: product.sku || '',
                        category: product.category_name || 'Uncategorized',
                        retailPrice: parseFloat(product.price) || 0,
                        weightedAverageCost: parseFloat(product.weightedAverageCost) || 0,
                        totalStock,
                        branchStock
                    });
                }
            }

            // Convert the shops map to an array and sort by name
            const shopsList = Array.from(shopsMap.values()).sort((a, b) =>
                a.name.localeCompare(b.name)
            );

            setProducts(transformedProducts);
            setShopList(shopsList);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load inventory distribution data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Filter products based on search term and category
    const filteredProducts = products.filter(product => {
        const matchesSearch = searchTerm === '' ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === '' ||
            product.category.toLowerCase() === categoryFilter.toLowerCase();

        return matchesSearch && matchesCategory;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        let compareResult = 0;

        if (sortBy === 'name') {
            compareResult = a.name.localeCompare(b.name);
        } else if (sortBy === 'category') {
            compareResult = a.category.localeCompare(b.category);
        } else if (sortBy === 'totalStock') {
            compareResult = a.totalStock - b.totalStock;
        } else if (sortBy === 'sku') {
            compareResult = a.sku.localeCompare(b.sku);
        }

        return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    // Get unique categories for the filter
    const categories = [...new Set(products.map(product => product.category))];

    // Navigate to product details
    const goToProductDetails = (productId: number) => {
        router.push(`/inventory/${productId}`);
    };

    // Handle sort
    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('');
        setShowFilterPanel(false);
    };

    // Calculate the lowest stock shop for a product
    const getLowestStockShop = (product: ProductStock) => {
        if (product.branchStock.length === 0) return null;

        return product.branchStock.reduce((lowest, current) =>
            (current.quantity < lowest.quantity) ? current : lowest
        );
    };

    // Calculate the highest stock shop for a product
    const getHighestStockShop = (product: ProductStock) => {
        if (product.branchStock.length === 0) return null;

        return product.branchStock.reduce((highest, current) =>
            (current.quantity > highest.quantity) ? current : highest
        );
    };

    // Check if reordering is needed based on simple threshold (can be customized)
    const needsReordering = (product: ProductStock) => {
        // Simple logic: if any shop has less than 10 items or total stock is less than 20
        return product.totalStock < 20 || product.branchStock.some(branch => branch.quantity < 10);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-tertiary p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-0 hover:bg-transparent"
                                    onClick={() => router.push('/inventory')}
                                >
                                    <ArrowLeft className="h-5 w-5 text-black" />
                                </Button>
                                <h1 className="text-xl font-semibold text-black">Product Distribution</h1>
                            </div>
                            <p className="text-sm text-black">View how products are distributed across all shops</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilterPanel(!showFilterPanel)}
                                className="text-black"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                            </Button>
                            <div className="flex">
                                <Button
                                    variant={viewMode === 'product' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('product')}
                                    className={viewMode === 'product' ? 'text-white' : 'text-black'}
                                >
                                    <Package className="h-4 w-4 mr-2" />
                                    By Product
                                </Button>
                                <Button
                                    variant={viewMode === 'shop' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('shop')}
                                    className={viewMode === 'shop' ? 'text-white' : 'text-black'}
                                >
                                    <Store className="h-4 w-4 mr-2" />
                                    By Shop
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilterPanel && (
                    <div className="bg-tertiary p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-black">Filters</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowFilterPanel(false)}>
                                <X className="h-4 w-4 text-black" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">Category</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category, index) => (
                                        <option key={index} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">Sort By</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="name">Product Name</option>
                                    <option value="category">Category</option>
                                    <option value="sku">SKU</option>
                                    <option value="totalStock">Total Stock</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <Button variant="outline" onClick={clearFilters} className="text-black">
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 p-4 rounded-lg border border-red-200 text-red-800">
                        {error}
                    </div>
                )}

                {/* Product-Centric View */}
                {viewMode === 'product' && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Product
                                            {sortBy === 'name' && (
                                                <ArrowUpDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('sku')}
                                    >
                                        <div className="flex items-center">
                                            SKU
                                            {sortBy === 'sku' && (
                                                <ArrowUpDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center">
                                            Category
                                            {sortBy === 'category' && (
                                                <ArrowUpDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('totalStock')}
                                    >
                                        <div className="flex items-center">
                                            Total Stock
                                            {sortBy === 'totalStock' && (
                                                <ArrowUpDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    {shopList.map(shop => (
                                        <th key={shop.id} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="text-center">
                                                <div>{shop.name}</div>
                                                <div className="text-xs text-gray-400 font-normal">Qty / WAC</div>
                                            </div>
                                        </th>
                                    ))}
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reorder Status
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedProducts.map(product => {
                                    const lowestStockShop = getLowestStockShop(product);
                                    const highestStockShop = getHighestStockShop(product);
                                    const reorderNeeded = needsReordering(product);

                                    return (
                                        <tr key={product.id} className={`hover:bg-gray-50 ${reorderNeeded ? 'bg-yellow-50' : ''}`}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">
                                                {product.name}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                {product.sku}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                {product.category}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">
                                                {product.totalStock}
                                            </td>

                                            {/* Dynamic columns for each shop */}
                                            {shopList.map(shop => {
                                                const stockInShop = product.branchStock.find(
                                                    branch => branch.shopId === shop.id
                                                );
                                                const quantity = stockInShop ? stockInShop.quantity : 0;

                                                // Determine if this is the lowest or highest stock for highlighting
                                                const isLowestStock = lowestStockShop && stockInShop &&
                                                    lowestStockShop.shopId === shop.id && product.branchStock.length > 1;
                                                const isHighestStock = highestStockShop && stockInShop &&
                                                    highestStockShop.shopId === shop.id && product.branchStock.length > 1;

                                                return (
                                                    <td
                                                        key={shop.id}
                                                        className={`px-4 py-3 whitespace-nowrap text-sm text-center font-medium
                                                            ${isLowestStock ? 'text-red-600 bg-red-50' : ''}
                                                            ${isHighestStock ? 'text-green-600 bg-green-50' : ''}
                                                            ${!isLowestStock && !isHighestStock ? 'text-black' : ''}
                                                        `}
                                                    >
                                                        <div className="text-center">
                                                            <div className="font-semibold">{quantity}</div>
                                                            <div className="text-xs text-gray-500">
                                                                Rs. {stockInShop ? stockInShop.shopSpecificCost.toLocaleString() : '0'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            {/* Reorder status */}
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                {reorderNeeded ? (
                                                    <div className="flex items-center justify-center text-yellow-600">
                                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                                        <span>Reorder</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-green-600">Good</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => goToProductDetails(product.id)}
                                                    className="text-black"
                                                >
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {sortedProducts.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No products found matching your filters.
                            </div>
                        )}
                    </div>
                )}

                {/* Shop-Centric View */}
                {viewMode === 'shop' && (
                    <div className="space-y-6">
                        {shopList.length > 0 ? (
                            shopList.map(shop => (
                                <div key={shop.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex items-center gap-2 p-2 border-b border-gray-200">
                                        <Store className="h-5 w-5 text-primary" />
                                        <h2 className="font-semibold text-lg text-black">{shop.name}</h2>
                                    </div>

                                    <div className="mt-4 overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Product
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        SKU
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Category
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Quantity
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Retail Price
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Value
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {sortedProducts
                                                    .filter(product => product.branchStock.some(branch => branch.shopId === shop.id))
                                                    .map(product => {
                                                        const shopStock = product.branchStock.find(branch => branch.shopId === shop.id);
                                                        const quantity = shopStock ? shopStock.quantity : 0;
                                                        const value = quantity * product.retailPrice;

                                                        return (
                                                            <tr key={product.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">
                                                                    {product.name}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                    {product.sku}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                    {product.category}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                    {quantity}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                    Rs. {product.retailPrice.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                    Rs. {value.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => goToProductDetails(product.id)}
                                                                        className="text-black"
                                                                    >
                                                                        View
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </table>

                                        {sortedProducts.filter(product =>
                                            product.branchStock.some(branch => branch.shopId === shop.id)
                                        ).length === 0 && (
                                                <div className="text-center py-4 text-gray-500">
                                                    No products found in this shop matching your filters.
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-black mb-2">No shops found</h3>
                                <p className="text-gray-500 mb-4">There are no shops in the system or you don't have access to any shops.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}