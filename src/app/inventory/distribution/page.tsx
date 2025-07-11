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
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

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
    const { hasPermission, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shopList, setShopList] = useState<Shop[]>([]);
    const [products, setProducts] = useState<ProductStock[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [sortBy, setSortBy] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedShopForSort, setSelectedShopForSort] = useState<number | null>(null);
    
    // Check if user can view cost data
    const canViewCosts = hasPermission('shop:view_costs');
    // Check if user is Shop Staff
    const isShopStaff = user?.roleName?.toLowerCase() === 'shop staff';
    const [error, setError] = useState<string | null>(null);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [viewMode, setViewMode] = useState<'product' | 'shop'>('product');

    // Toggle to hide SKU columns throughout the page
    const showSkuColumn = false;
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        fetchData();
    }, []); // Fetch once - all data comes in one optimized call

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Use the optimized inventory distribution endpoint (ONE API call!)
            const response = await fetch('/api/inventory/distribution');

            if (!response.ok) {
                throw new Error('Failed to fetch inventory distribution data');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch inventory distribution data');
            }

            // Data is already transformed by the backend - just set it!
            setProducts(data.data.products);
            setShopList(data.data.shops);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load inventory distribution data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Filter products based on search term - supports multiple words in any order
    const filteredProducts = products.filter(product => {
        if (searchTerm === '') return true;
        
        const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
        const productName = product.name.toLowerCase();
        const productSku = product.sku.toLowerCase();
        
        // Each word must appear somewhere in the product name or SKU
        return searchWords.every(word => 
            productName.includes(word) || productSku.includes(word)
        );
    });

    // Calculate total shop cost for a product in a specific shop
    const getTotalShopCost = (product: ProductStock, shopId: number) => {
        const shopStock = product.branchStock.find(branch => branch.shopId === shopId);
        if (!shopStock) return 0;
        return shopStock.quantity * shopStock.shopSpecificCost;
    };

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        let compareResult = 0;

        if (sortBy === 'name') {
            compareResult = a.name.localeCompare(b.name);
        } else if (sortBy === 'totalStock') {
            compareResult = a.totalStock - b.totalStock;
        } else if (sortBy === 'sku') {
            compareResult = a.sku.localeCompare(b.sku);
        } else if (sortBy === 'shopStock' && selectedShopForSort !== null) {
            const aShopStock = a.branchStock.find(branch => branch.shopId === selectedShopForSort);
            const bShopStock = b.branchStock.find(branch => branch.shopId === selectedShopForSort);
            const aQuantity = aShopStock ? aShopStock.quantity : 0;
            const bQuantity = bShopStock ? bShopStock.quantity : 0;
            compareResult = aQuantity - bQuantity;
        } else if (sortBy === 'shopTotalCost' && selectedShopForSort !== null) {
            const aTotalCost = getTotalShopCost(a, selectedShopForSort);
            const bTotalCost = getTotalShopCost(b, selectedShopForSort);
            compareResult = aTotalCost - bTotalCost;
        }

        return sortDirection === 'asc' ? compareResult : -compareResult;
    });



    // Navigate to product details
    const goToProductDetails = (productId: number) => {
        router.push(`/inventory/${productId}`);
    };

    // Handle sort
    const handleSort = (column: string, shopId?: number) => {
        if (sortBy === column && (selectedShopForSort ?? null) === (shopId ?? null)) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
            if (shopId) {
                setSelectedShopForSort(shopId);
            }
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setSortBy('name');
        setSortDirection('asc');
        setSelectedShopForSort(null);
        setShowFilterPanel(false);
        setCurrentPage(1); // Reset to first page when clearing filters
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

    // Pagination logic for product-centric view
    const totalItems = sortedProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = sortedProducts.slice(startIndex, endIndex);

    // Pagination logic for shop-centric view (paginate shops, not products)
    const shopsPerPage = 5; // Show 5 shops per page
    const totalShops = shopList.length;
    const totalShopPages = Math.ceil(totalShops / shopsPerPage);
    const shopStartIndex = (currentPage - 1) * shopsPerPage;
    const shopEndIndex = shopStartIndex + shopsPerPage;
    const currentShops = shopList.slice(shopStartIndex, shopEndIndex);

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handle items per page change
    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    // Reset pagination when filters change or view mode changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, sortDirection, selectedShopForSort, viewMode]);

    // Pagination component for product-centric view
    const ProductPaginationControls = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">
                            {itemsPerPage >= totalItems ? 
                                `Showing all ${totalItems} products` : 
                                `Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} products`
                            }
                        </span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                            <option value={99999}>Show All</option>
                        </select>
                    </div>
                    
                    {itemsPerPage < totalItems && (
                        <div className="flex items-center space-x-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="text-gray-700"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            
                            {startPage > 1 && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(1)}
                                        className="text-gray-700"
                                    >
                                        1
                                    </Button>
                                    {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
                                </>
                            )}
                            
                            {pageNumbers.map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className={currentPage === page ? "text-white" : "text-gray-700"}
                                >
                                    {page}
                                </Button>
                            ))}
                            
                            {endPage < totalPages && (
                                <>
                                    {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(totalPages)}
                                        className="text-gray-700"
                                    >
                                        {totalPages}
                                    </Button>
                                </>
                            )}
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="text-gray-700"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Pagination component for shop-centric view
    const ShopPaginationControls = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalShopPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">
                            Showing {shopStartIndex + 1} to {Math.min(shopEndIndex, totalShops)} of {totalShops} shops
                        </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="text-gray-700"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        
                        {startPage > 1 && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(1)}
                                    className="text-gray-700"
                                >
                                    1
                                </Button>
                                {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
                            </>
                        )}
                        
                        {pageNumbers.map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={currentPage === page ? "text-white" : "text-gray-700"}
                            >
                                {page}
                            </Button>
                        ))}
                        
                        {endPage < totalShopPages && (
                            <>
                                {endPage < totalShopPages - 1 && <span className="px-2 text-gray-500">...</span>}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(totalShopPages)}
                                    className="text-gray-700"
                                >
                                    {totalShopPages}
                                </Button>
                            </>
                        )}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalShopPages}
                            className="text-gray-700"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        );
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">Sort By</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        if (!['shopStock', 'shopTotalCost'].includes(e.target.value) || (e.target.value === 'shopTotalCost' && !canViewCosts)) {
                                            setSelectedShopForSort(null);
                                        }
                                    }}
                                >
                                    <option value="name">Product Name</option>
                                    {showSkuColumn && (<option value="sku">SKU</option>)}
                                    <option value="totalStock">Total Stock</option>
                                    <option value="shopStock">Shop Stock Quantity</option>
                                    {canViewCosts && (
                                        <option value="shopTotalCost">Shop Total Cost</option>
                                    )}
                                </select>
                            </div>
                            {(sortBy === 'shopStock' || (sortBy === 'shopTotalCost' && canViewCosts)) && (
                                <div>
                                    <label className="block text-sm font-medium text-black mb-1">Select Shop</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
                                        value={selectedShopForSort || ''}
                                        onChange={(e) => setSelectedShopForSort(Number(e.target.value))}
                                    >
                                        <option value="">Select a shop</option>
                                        {shopList.map(shop => (
                                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex items-end mt-4">
                            <Button variant="outline" onClick={clearFilters} className="text-black">
                                Clear Filters
                            </Button>
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
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/2 min-w-[200px]"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Product
                                            {sortBy === 'name' && (
                                                <ArrowUpDown className="ml-1 h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    {showSkuColumn && (
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
                                    )}

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
                                                <div className="flex flex-col items-center gap-1">
                                                    <div>{shop.name}</div>
                                                    <div className="flex gap-2 text-xs">
                                                        <button
                                                            onClick={() => handleSort('shopStock', shop.id)}
                                                            className="text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
                                                            title="Sort by quantity"
                                                        >
                                                            Qty
                                                            {sortBy === 'shopStock' && selectedShopForSort === shop.id && (
                                                                <ArrowUpDown className="ml-1 h-3 w-3" />
                                                            )}
                                                        </button>
                                                        {canViewCosts && (
                                                            <>
                                                                <span className="text-gray-400">|</span>
                                                                <button
                                                                    onClick={() => handleSort('shopTotalCost', shop.id)}
                                                                    className="text-green-600 hover:text-green-800 cursor-pointer flex items-center"
                                                                    title="Sort by total cost"
                                                                >
                                                                    Cost
                                                                    {sortBy === 'shopTotalCost' && selectedShopForSort === shop.id && (
                                                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </th>
                                    ))}

                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentProducts.map(product => {
                                    const lowestStockShop = getLowestStockShop(product);
                                    const highestStockShop = getHighestStockShop(product);

                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black w-1/2 min-w-[200px]">
                                                {product.name}
                                            </td>
                                            {showSkuColumn && (
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                    {product.sku}
                                                </td>
                                            )}

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
                                                            <div className="font-semibold text-blue-600">{quantity}</div>
                                                            {canViewCosts && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    WAC: Rs. {product.weightedAverageCost.toLocaleString()}
                                                                </div>
                                                            )}
                                                            {canViewCosts && stockInShop && stockInShop.shopSpecificCost > 0 && (
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    Unit Cost: Rs. {stockInShop.shopSpecificCost.toLocaleString()}
                                                                </div>
                                                            )}
                                                            {canViewCosts && stockInShop && stockInShop.shopSpecificCost > 0 && (
                                                                <div className="text-xs font-semibold text-green-600 mt-1 border-t border-gray-200 pt-1">
                                                                    Total: Rs. {getTotalShopCost(product, shop.id).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}



                                            {/* Actions */}
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                {!isShopStaff && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => goToProductDetails(product.id)}
                                                        className="text-black"
                                                    >
                                                        View
                                                    </Button>
                                                )}
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

                {/* Pagination for Product-Centric View */}
                {viewMode === 'product' && sortedProducts.length > 0 && (
                    <ProductPaginationControls />
                )}

                {/* Shop-Centric View */}
                {viewMode === 'shop' && (
                    <div className="space-y-6">
                        {shopList.length > 0 ? (
                            currentShops.map(shop => (
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
                                                    {showSkuColumn && (
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            SKU
                                                        </th>
                                                    )}

                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Quantity
                                                    </th>
                                                    {canViewCosts && (
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Cost Info
                                                        </th>
                                                    )}
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Retail Price
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Retail Value
                                                    </th>
                                                    {canViewCosts && (
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Total Shop Cost
                                                        </th>
                                                    )}
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
                                                        const retailValue = quantity * product.retailPrice;
                                                        const totalShopCost = getTotalShopCost(product, shop.id);

                                                        return (
                                                            <tr key={product.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">
                                                                    {product.name}
                                                                </td>
                                                                {showSkuColumn && (
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                        {product.sku}
                                                                    </td>
                                                                )}

                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                    {quantity}
                                                                </td>
                                                                {canViewCosts && (
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                        <div className="space-y-1">
                                                                            <div className="text-xs text-gray-600">
                                                                                WAC: Rs. {product.weightedAverageCost.toLocaleString()}
                                                                            </div>
                                                                            {shopStock && shopStock.shopSpecificCost > 0 && (
                                                                                <div className="text-xs text-blue-600">
                                                                                    Shop Cost: Rs. {shopStock.shopSpecificCost.toLocaleString()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                    Rs. {product.retailPrice.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                                                    Rs. {retailValue.toLocaleString()}
                                                                </td>
                                                                {canViewCosts && (
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                                                                        Rs. {totalShopCost.toLocaleString()}
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                                    {!isShopStaff && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => goToProductDetails(product.id)}
                                                                            className="text-black"
                                                                        >
                                                                            View
                                                                        </Button>
                                                                    )}
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
                        
                        {/* Pagination for Shop-Centric View */}
                        {shopList.length > 0 && totalShopPages > 1 && (
                            <ShopPaginationControls />
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}