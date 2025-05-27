'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authDelete } from '@/utils/api';
import AddInventoryModal from '@/components/inventory/AddInventoryModal';
import { useInventoryUpdates } from '@/hooks/useWebSocket';
import { WEBSOCKET_EVENTS } from '@/lib/websocket';

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
    weightedAverageCost: number;
    status: string;
    branchStock: BranchStock[];
}

interface Category {
    id: number;
    name: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface InventoryClientWrapperProps {
    initialInventoryItems: InventoryItem[];
    initialCategories: Category[];
    initialPagination: Pagination;
    initialSearchTerm: string;
    initialCategoryFilter: string;
    initialStatusFilter: string;
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
            return 'bg-gray-100 text-black';
    }
};

export default function InventoryClientWrapper({
    initialInventoryItems,
    initialCategories,
    initialPagination,
    initialSearchTerm,
    initialCategoryFilter,
    initialStatusFilter
}: InventoryClientWrapperProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
    const [error, setError] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string } | null>(null);
    const [isWebSocketUpdate, setIsWebSocketUpdate] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(initialPagination.page);
    const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
    const [totalItems, setTotalItems] = useState(initialPagination.total);
    const [itemsPerPage, setItemsPerPage] = useState(initialPagination.limit);

    // Memoized callback for WebSocket updates
    const handleInventoryUpdate = useCallback((eventData: any) => {
        console.log('Received event via useInventoryUpdates (memoized):', eventData);
        setIsWebSocketUpdate(true); // Mark that an update came from WebSocket

        const { type, ...payload } = eventData;

        if (type === WEBSOCKET_EVENTS.INVENTORY_UPDATE && payload.items) {
            setInventoryItems(payload.items);
            if (payload.pagination) {
                setTotalPages(payload.pagination.totalPages);
                setTotalItems(payload.pagination.total);
            }
        } else if (type === WEBSOCKET_EVENTS.INVENTORY_ITEM_UPDATE && payload.item) {
            setInventoryItems(prev =>
                prev.map(item => item.id === payload.item.id ? payload.item : item)
            );
        } else if (type === WEBSOCKET_EVENTS.INVENTORY_ITEM_CREATE && payload.item) {
            setInventoryItems(prevItems => {
                // Add to the beginning if on the first page and not exceeding itemsPerPage
                const newItems = [payload.item, ...prevItems];
                if (currentPage === 1) {
                    return newItems.slice(0, itemsPerPage);
                }
                return prevItems; // If not on page 1, data will be fetched on navigation
            });
            setTotalItems(prev => prev + 1);
            // Recalculate totalPages based on new totalItems and itemsPerPage
            setTotalPages(Math.ceil((totalItems + 1) / itemsPerPage));

        } else if (type === WEBSOCKET_EVENTS.INVENTORY_ITEM_DELETE && payload.itemId) {
            setInventoryItems(prev => prev.filter(item => item.id !== payload.itemId));
            setTotalItems(prev => prev - 1);
            setTotalPages(Math.ceil((totalItems - 1) / itemsPerPage));
        } else if (type === WEBSOCKET_EVENTS.INVENTORY_LEVEL_UPDATED && payload.productId) {
            console.log('Handling INVENTORY_LEVEL_UPDATED (memoized):', payload);
            setInventoryItems(prevItems => {
                return prevItems.map(item => {
                    if (item.id === payload.productId) {
                        let newTotalStock = item.stock;
                        let updatedBranchStock = [...item.branchStock]; // Create a new array

                        if (payload.shopId !== undefined && payload.newQuantity !== undefined) {
                            const branchIndex = updatedBranchStock.findIndex(bs => bs.shopId === payload.shopId);
                            if (branchIndex !== -1) {
                                updatedBranchStock[branchIndex] = { ...updatedBranchStock[branchIndex], quantity: payload.newQuantity };
                            } else {
                                console.warn(`Shop ID ${payload.shopId} not found in branchStock for product ${payload.productId}. Adding with new quantity.`);
                                updatedBranchStock.push({ shopId: payload.shopId, shopName: `Shop ${payload.shopId}`, quantity: payload.newQuantity });
                            }
                            newTotalStock = updatedBranchStock.reduce((sum, bs) => sum + bs.quantity, 0);
                        } else if (payload.newTotalStock !== undefined) {
                            newTotalStock = payload.newTotalStock;
                            // Potentially adjust branchStock if needed, or assume it's implicitly handled
                        } else {
                            console.warn('INVENTORY_LEVEL_UPDATED event missing shopId/newQuantity or newTotalStock.', payload);
                        }

                        return {
                            ...item,
                            branchStock: updatedBranchStock,
                            stock: newTotalStock,
                            status: newTotalStock > 0 ? (newTotalStock < 10 ? 'Low Stock' : 'In Stock') : 'Out of Stock'
                        };
                    }
                    return item;
                });
            });
        } else {
            console.log('Received unhandled WebSocket event type or payload (memoized):', type, payload);
        }
    }, [currentPage, itemsPerPage, totalItems]); // Added dependencies for useCallback

    // Subscribe to inventory updates via WebSocket
    useInventoryUpdates(handleInventoryUpdate);

    // Effect to synchronize state with props when they change (but not for WebSocket updates)
    useEffect(() => {
        if (!isWebSocketUpdate) {
            setInventoryItems(initialInventoryItems);
            setCategories(initialCategories);
            setCurrentPage(initialPagination.page);
            setTotalPages(initialPagination.totalPages);
            setTotalItems(initialPagination.total);
            setItemsPerPage(initialPagination.limit);
            setSearchTerm(initialSearchTerm);
            setCategoryFilter(initialCategoryFilter);
            setStatusFilter(initialStatusFilter);
        }
        setIsWebSocketUpdate(false); // Reset flag after processing or initial load
    }, [
        initialInventoryItems,
        initialCategories,
        initialPagination,
        initialSearchTerm,
        initialCategoryFilter,
        initialStatusFilter,
        isWebSocketUpdate
    ]);

    // Update URL when filters or pagination changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams);

        // Set pagination parameters
        params.set('page', currentPage.toString());
        params.set('limit', itemsPerPage.toString());

        // Set filter parameters
        if (searchTerm) {
            params.set('search', searchTerm);
        } else {
            params.delete('search');
        }

        if (categoryFilter) {
            params.set('category', categoryFilter);
        } else {
            params.delete('category');
        }

        if (statusFilter) {
            params.set('status', statusFilter);
        } else {
            params.delete('status');
        }

        // Update the URL without refreshing the page
        router.push(`${pathname}?${params.toString()}`);
    }, [currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, pathname, router, searchParams]);

    // Listen for filter panel toggle event from header actions
    useEffect(() => {
        const handleToggleFilterPanel = () => {
            setShowFilterPanel(prev => !prev);
        };

        window.addEventListener('toggle-filter-panel', handleToggleFilterPanel);

        return () => {
            window.removeEventListener('toggle-filter-panel', handleToggleFilterPanel);
        };
    }, []);

    // Navigation functions
    const navigateToProductDetails = (productId: number) => {
        router.push(`/inventory/${productId}`);
    };

    // Add Product handler
    const handleAddProduct = () => {
        router.push('/purchases');
    };

    // Add Direct Inventory handler
    const handleAddInventory = () => {
        setSelectedProduct(null);
        setShowAddInventoryModal(true);
    };

    // Toggle filter panel
    const toggleFilterPanel = () => {
        setShowFilterPanel(!showFilterPanel);
    };

    // Handle delete product
    const handleDeleteProduct = async (e: React.MouseEvent, productId: number) => {
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        setDeleteLoading(productId);

        try {
            const response = await authDelete(`/api/products/${productId}`);
            const data = await response.json();

            if (data.success) {
                // Remove the deleted product from the state
                setInventoryItems(prevItems => prevItems.filter(item => item.id !== productId));
            } else {
                setError(data.message || 'Failed to delete product');
            }
        } catch (err) {
            console.error('Error deleting product:', err);
            setError('Failed to delete product. Please try again later.');
        } finally {
            setDeleteLoading(null);
        }
    };

    // Handle inventory added
    const handleInventoryAdded = () => {
        router.refresh(); // Refresh the page to get updated data
    };

    return (
        <>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

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
                            <label htmlFor="category-filter" className="block text-sm font-medium text-black mb-1">
                                Category
                            </label>
                            <select
                                id="category-filter"
                                className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setCurrentPage(1); // Reset to first page when filtering
                                }}
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
                            <label htmlFor="status-filter" className="block text-sm font-medium text-black mb-1">
                                Status
                            </label>
                            <select
                                id="status-filter"
                                className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1); // Reset to first page when filtering
                                }}
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
                                    setCurrentPage(1); // Reset to first page when clearing filters
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
                            <Search className="w-4 h-4 text-black" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                            placeholder="Search inventory..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page when searching
                            }}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setCurrentPage(1); // Reset to first page when filtering
                            }}
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1); // Reset to first page when filtering
                            }}
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
                    <table className="w-full text-sm text-left text-black">
                        <thead className="text-xs text-black uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">SKU</th>
                                <th className="px-6 py-3">Product Name</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Stock</th>
                                <th className="px-6 py-3">Retail Price</th>
                                <th className="px-6 py-3">Weighted Average Cost</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventoryItems.length > 0 ? (
                                inventoryItems.map((item) => (
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
                                        <td className="px-6 py-4">
                                            Rs. {typeof item.retailPrice === 'number' ? item.retailPrice.toFixed(2) : '0.00'}
                                        </td>
                                        <td className="px-6 py-4">
                                            Rs. {typeof item.weightedAverageCost === 'number' ? item.weightedAverageCost.toFixed(2) : '0.00'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
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
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={(e) => handleDeleteProduct(e, item.id)}
                                                    disabled={deleteLoading === item.id}
                                                >
                                                    {deleteLoading === item.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-black">
                                        {error ? 'Error loading inventory data' : 'No inventory items found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage <= 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-black">
                                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                                <span className="font-medium">{totalItems}</span> results
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <label htmlFor="itemsPerPage" className="text-sm text-black">Items per page:</label>
                                <select
                                    id="itemsPerPage"
                                    className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary p-1"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(parseInt(e.target.value));
                                        setCurrentPage(1); // Reset to first page when changing items per page
                                    }}
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px mr-16" aria-label="Pagination">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-l-md"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage <= 1}
                                >
                                    First
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage <= 1}
                                >
                                    Previous
                                </Button>

                                {/* Page numbers */}
                                <div className="flex items-center">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        // Show pages around current page
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className="mx-1"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-r-md"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage >= totalPages}
                                >
                                    Last
                                </Button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Inventory Modal */}
            <AddInventoryModal
                isOpen={showAddInventoryModal}
                onClose={() => setShowAddInventoryModal(false)}
                onSuccess={handleInventoryAdded}
                preselectedProduct={selectedProduct}
            />
        </>
    );
} 