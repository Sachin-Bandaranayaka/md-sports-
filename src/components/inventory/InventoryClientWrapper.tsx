'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authDelete, authFetch } from '@/utils/api';
import AddInventoryModal from '@/components/inventory/AddInventoryModal';
import { useInventory } from '@/hooks/useQueries';
import { useRealtime } from '@/hooks/useRealtime';
import { debounce } from '@/lib/utils';

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
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string } | null>(null);
    const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
    // Local error state for manual operations
    const [localError, setLocalError] = useState<string | null>(null);
    // Add state for inventory items if needed for manual updates
    const [localInventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems);
    const [totalPagesState, setTotalPages] = useState<number>(initialPagination.totalPages);
    const [totalItemsState, setTotalItems] = useState<number>(initialPagination.total);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(initialPagination.page);
    const [itemsPerPage, setItemsPerPage] = useState(initialPagination.limit);

    // React Query for data fetching
    const {
        data: inventoryData,
        isLoading,
        error,
        refetch
    } = useInventory({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter
    });

    const inventoryItems = inventoryData?.data || initialInventoryItems;
    const totalPages = inventoryData?.pagination?.totalPages || initialPagination.totalPages;
    const totalItems = inventoryData?.pagination?.total || initialPagination.total;
    const categories = initialCategories;

    // Auto-refresh settings
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(60); // seconds
    const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    // Real-time updates integration
    useRealtime({
        types: ['inventory'],
        onUpdate: (data) => {
            console.log('Received inventory update via polling:', data);
            // Refresh data when inventory changes
            console.log('Refreshing inventory due to real-time update');
            refetch();
            setLastRefreshed(new Date());
        }
    });

    // Refetch when filters change
    useEffect(() => {
        refetch();
        setLastRefreshed(new Date());
    }, [searchTerm, categoryFilter, statusFilter, currentPage, refetch]);

    // Set up auto-refresh timer
    useEffect(() => {
        if (autoRefreshEnabled) {
            autoRefreshTimerRef.current = setInterval(() => {
                console.log('Auto-refreshing inventory data...');
                refetch();
                setLastRefreshed(new Date());
            }, autoRefreshInterval * 1000);
        }

        return () => {
            if (autoRefreshTimerRef.current) {
                clearInterval(autoRefreshTimerRef.current);
            }
        };
    }, [autoRefreshEnabled, autoRefreshInterval, refetch]);

    // Memoize filter options
    const filterOptions = useMemo(() => ({
        categories: categories.map(cat => ({ value: cat.name, label: cat.name })),
        statuses: [
            { value: '', label: 'All Status' },
            { value: 'In Stock', label: 'In Stock' },
            { value: 'Low Stock', label: 'Low Stock' },
            { value: 'Out of Stock', label: 'Out of Stock' }
        ]
    }), [categories]);

    // Update URL when filters or pagination changes
    useEffect(() => {
        const params = new URLSearchParams();

        // Set pagination parameters
        params.set('page', currentPage.toString());
        params.set('limit', itemsPerPage.toString());

        // Set filter parameters
        if (searchTerm) {
            params.set('search', searchTerm);
        }

        if (categoryFilter) {
            params.set('category', categoryFilter);
        }

        if (statusFilter) {
            params.set('status', statusFilter);
        }

        // Update the URL without refreshing the page - use replace to avoid navigation interference
        const newUrl = `${pathname}?${params.toString()}`;
        if (window.location.pathname + window.location.search !== newUrl) {
            router.replace(newUrl);
        }

        // Note: Data refresh is handled by the separate useEffect that watches filter changes
    }, [currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, pathname, router]);

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

    // Handle delete product with race condition prevention
    const handleDeleteProduct = async (e: React.MouseEvent, productId: number) => {
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        const operationId = `delete-product-${productId}`;
        setDeleteLoading(productId);
        setPendingOperations(prev => new Set(prev).add(operationId));

        // Temporarily disable auto-refresh during deletion
        const wasAutoRefreshEnabled = autoRefreshEnabled;
        setAutoRefreshEnabled(false);

        try {
            // Optimistic update - immediately remove from UI
            const originalItems = localInventoryItems;
            setInventoryItems(prevItems => prevItems.filter(item => item.id !== productId));

            const response = await authDelete(`/api/products/${productId}`);
            const data = await response.json();

            if (response.ok && data.success) {
                // Success - keep the item removed
                console.log(`Product ${productId} deleted successfully`);

                // Wait a bit before re-enabling auto-refresh to ensure DB consistency
                setTimeout(() => {
                    setAutoRefreshEnabled(wasAutoRefreshEnabled);
                }, 2000);
            } else {
                // Rollback optimistic update on failure
                setInventoryItems(originalItems);
                
                // Enhanced error message for related records
                let errorMessage = data.message || 'Failed to delete product';
                
                if (data.relatedRecords) {
                    const { purchaseInvoiceItems, salesInvoiceItems, quotationItems } = data.relatedRecords;
                    const details = [];
                    
                    if (purchaseInvoiceItems > 0) {
                        details.push(`${purchaseInvoiceItems} purchase invoice(s)`);
                    }
                    if (salesInvoiceItems > 0) {
                        details.push(`${salesInvoiceItems} sales invoice(s)`);
                    }
                    if (quotationItems > 0) {
                        details.push(`${quotationItems} quotation(s)`);
                    }
                    
                    if (details.length > 0) {
                        errorMessage += `\n\nThis product is currently used in:\n• ${details.join('\n• ')}`;
                        errorMessage += '\n\nPlease remove these references before deleting the product.';
                    }
                }
                
                setLocalError(errorMessage);
                setAutoRefreshEnabled(wasAutoRefreshEnabled); // Re-enable immediately on error
            }
        } catch (err) {
            console.error('Error deleting product:', err);
            // Rollback optimistic update on error
            setInventoryItems(inventoryItems);
            setLocalError('Failed to delete product. Please try again later.');
            setAutoRefreshEnabled(wasAutoRefreshEnabled); // Re-enable immediately on error
        } finally {
            setDeleteLoading(null);
            setPendingOperations(prev => {
                const newSet = new Set(prev);
                newSet.delete(operationId);
                return newSet;
            });
        }
    };

    // Handle inventory added
    const handleInventoryAdded = () => {
        console.log('Inventory added, refreshing data');
        refetch();
        setLastRefreshed(new Date());
    };

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((searchValue: string) => {
            setCurrentPage(1);
            // Trigger refresh with new search term
            const params = new URLSearchParams(searchParams);
            params.set('page', '1');
            params.set('limit', itemsPerPage.toString());
            if (searchValue) {
                params.set('search', searchValue);
            } else {
                params.delete('search');
            }
            if (categoryFilter) params.set('category', categoryFilter);
            if (statusFilter) params.set('status', statusFilter);
            router.push(`${pathname}?${params.toString()}`);
        }, 300),
        [categoryFilter, statusFilter, itemsPerPage, pathname, router, searchParams]
    );

    // Optimized search handler
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        debouncedSearch(value);
    }, [debouncedSearch]);

    // Function to manually refresh inventory data with smart refresh logic
    const refreshInventory = useCallback(async (force = false) => {
        // Smart refresh logic - don't refresh if there are pending operations (unless forced)
        if (!force && pendingOperations.size > 0) {
            console.log('Skipping refresh due to pending operations:', Array.from(pendingOperations));
            return;
        }

        try {
            setLocalError(null);

            console.log('Refreshing inventory data...', {
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                category: categoryFilter,
                status: statusFilter,
                pendingOperations: Array.from(pendingOperations),
                forced: force
            });

            // Use React Query's refetch function instead of manual fetching
            await refetch();

            // Update last refreshed timestamp
            setLastRefreshed(new Date());

        } catch (err) {
            console.error('Error refreshing inventory:', err);
            setLocalError(err instanceof Error ? err.message : 'Failed to refresh inventory');
        }
    }, [currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, pendingOperations, refetch]);

    // Optimized auto-refresh with exponential backoff
    useEffect(() => {
        if (!autoRefreshEnabled) return;

        let retryCount = 0;
        const maxRetries = 3;
        const baseInterval = autoRefreshInterval * 1000;

        const scheduleRefresh = () => {
            const interval = baseInterval * Math.pow(2, Math.min(retryCount, 2));

            const timeoutId = setTimeout(async () => {
                try {
                    console.log('Auto-refreshing inventory data...');
                    await refreshInventory();
                    retryCount = 0; // Reset on success
                    scheduleRefresh();
                } catch (error) {
                    console.error('Auto-refresh failed:', error);
                    retryCount = Math.min(retryCount + 1, maxRetries);
                    if (retryCount < maxRetries) {
                        console.log(`Retrying auto-refresh in ${interval * Math.pow(2, retryCount) / 1000} seconds...`);
                        scheduleRefresh();
                    } else {
                        console.error('Auto-refresh disabled after max retries');
                        setAutoRefreshEnabled(false);
                    }
                }
            }, interval);

            autoRefreshTimerRef.current = timeoutId;
            return timeoutId;
        };

        // Perform an immediate refresh when auto-refresh is enabled
        refreshInventory().then(() => {
            scheduleRefresh();
        }).catch(() => {
            retryCount = 1;
            scheduleRefresh();
        });

        // Cleanup on unmount
        return () => {
            if (autoRefreshTimerRef.current) {
                clearTimeout(autoRefreshTimerRef.current);
                autoRefreshTimerRef.current = null;
            }
        };
    }, [autoRefreshEnabled, autoRefreshInterval, refreshInventory]);

    // Expose the refresh function to parent components
    useEffect(() => {
        // Create a custom event listener for inventory refresh
        const handleRefreshRequest = () => {
            refreshInventory();
        };

        window.addEventListener('refresh-inventory', handleRefreshRequest);

        return () => {
            window.removeEventListener('refresh-inventory', handleRefreshRequest);
        };
    }, [refreshInventory]);

    // Initial data refresh when component mounts
    useEffect(() => {
        console.log('Component mounted, performing initial data refresh');
        refreshInventory();
    }, []);

    return (
        <>
            {(localError || error) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {localError ?? (error instanceof Error ? error.message : String(error))}
                </div>
            )}

            {/* Auto-refresh controls */}
            <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={autoRefreshEnabled}
                                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                                className="rounded border-gray-300 text-primary focus:ring-primary mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Auto-refresh</span>
                        </label>
                        <select
                            value={autoRefreshInterval}
                            onChange={(e) => setAutoRefreshInterval(parseInt(e.target.value))}
                            disabled={!autoRefreshEnabled}
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary p-1"
                        >
                            <option value="30">Every 30 seconds</option>
                            <option value="60">Every minute</option>
                            <option value="120">Every 2 minutes</option>
                            <option value="300">Every 5 minutes</option>
                        </select>
                    </div>
                    <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${pendingOperations.size > 0 ? 'bg-yellow-500 animate-pulse' :
                            autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                            }`}></div>
                        <div className="text-xs text-gray-500">
                            {pendingOperations.size > 0 ? (
                                <span className="text-yellow-600 font-medium">
                                    {pendingOperations.size} operation(s) in progress...
                                </span>
                            ) : autoRefreshEnabled ? (
                                `Auto-refreshing every ${autoRefreshInterval} seconds`
                            ) : (
                                'Auto-refresh is disabled'
                            )}
                            {lastRefreshed && (
                                <span className="ml-2">
                                    · Last refreshed: {lastRefreshed.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                    </div>
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
                            onChange={(e) => handleSearchChange(e.target.value)}
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
                            {filterOptions.categories.map((category) => (
                                <option key={category.value} value={category.value}>
                                    {category.label}
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
                            {filterOptions.statuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
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
                            {(inventoryData?.data || localInventoryItems).length > 0 ? (
                                (inventoryData?.data || localInventoryItems).map((item) => (
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
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/inventory/${item.id}/edit`);
                                                    }}
                                                >
                                                    Edit
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
                            onClick={() => {
                                setCurrentPage(prev => Math.max(prev - 1, 1));
                            }}
                            disabled={currentPage <= 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setCurrentPage(prev => Math.min(prev + 1, totalPages));
                            }}
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
                                        const newItemsPerPage = parseInt(e.target.value);
                                        setItemsPerPage(newItemsPerPage);
                                        setCurrentPage(1); // Reset to first page when changing items per page

                                        // Update URL and trigger refresh immediately
                                        const params = new URLSearchParams(searchParams);
                                        params.set('page', '1'); // Reset to page 1
                                        params.set('limit', newItemsPerPage.toString());
                                        if (searchTerm) params.set('search', searchTerm);
                                        if (categoryFilter) params.set('category', categoryFilter);
                                        if (statusFilter) params.set('status', statusFilter);

                                        // Update URL
                                        router.push(`${pathname}?${params.toString()}`);
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
                                    onClick={() => {
                                        setCurrentPage(1);
                                    }}
                                    disabled={currentPage <= 1}
                                >
                                    First
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setCurrentPage(prev => Math.max(prev - 1, 1));
                                    }}
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
                                                onClick={() => {
                                                    setCurrentPage(pageNum);
                                                }}
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
                                    onClick={() => {
                                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                    }}
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-r-md"
                                    onClick={() => {
                                        setCurrentPage(totalPages);
                                    }}
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