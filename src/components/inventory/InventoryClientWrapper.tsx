'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authDelete, authFetch } from '@/utils/api';
import AddInventoryModal from '@/components/inventory/AddInventoryModal';
import { useInventoryUpdates } from '@/hooks/useWebSocket';
import { WEBSOCKET_EVENTS } from '@/lib/websocket';
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

    // Memoize formatted inventory data
    const formattedInventoryData = useMemo(() => {
        return inventoryItems.map(item => ({
            ...item,
            statusColor: item.status === 'In Stock' ? 'text-green-600' :
                item.status === 'Low Stock' ? 'text-yellow-600' : 'text-red-600',
            formattedRetailPrice: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(item.retailPrice || 0),
            formattedWeightedCost: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(item.weightedAverageCost || 0)
        }));
    }, [inventoryItems]);

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

    // Auto-refresh settings
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(60); // seconds - increased from 30 to 60
    const [pendingOperations, setPendingOperations] = useState(new Set<string>()); // Track pending operations
    const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    // Debounce mechanism for WebSocket updates
    const pendingUpdatesRef = useRef<Map<number, any>>(new Map());
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(initialPagination.page);
    const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
    const [totalItems, setTotalItems] = useState(initialPagination.total);
    const [itemsPerPage, setItemsPerPage] = useState(initialPagination.limit);

    // Process pending updates with debounce
    const processPendingUpdates = useCallback(() => {
        if (pendingUpdatesRef.current.size === 0) return;

        console.log(`Processing ${pendingUpdatesRef.current.size} pending inventory updates`);

        setInventoryItems(prevItems => {
            return prevItems.map(item => {
                const pendingUpdate = pendingUpdatesRef.current.get(item.id);
                if (pendingUpdate) {
                    // Apply the pending update
                    return {
                        ...item,
                        ...pendingUpdate,
                        status: pendingUpdate.stock > 0
                            ? (pendingUpdate.stock < 10 ? 'Low Stock' : 'In Stock')
                            : 'Out of Stock'
                    };
                }
                return item;
            });
        });

        // Clear pending updates after processing
        pendingUpdatesRef.current.clear();
    }, []);

    // Set up debounce effect
    useEffect(() => {
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
        }

        if (pendingUpdatesRef.current.size > 0) {
            updateTimerRef.current = setTimeout(() => {
                processPendingUpdates();
                updateTimerRef.current = null;
            }, 300); // 300ms debounce delay
        }

        return () => {
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
            }
        };
    }, [processPendingUpdates, pendingUpdatesRef.current.size]);

    // Memoized callback for WebSocket updates with improved reliability
    const handleInventoryUpdate = useCallback((eventData: any) => {
        console.log('Received event via useInventoryUpdates (memoized):', eventData);
        setIsWebSocketUpdate(true);

        const { type, ...payload } = eventData;

        try {
            if (type === WEBSOCKET_EVENTS.INVENTORY_UPDATE && payload.items) {
                // Full inventory update - only apply if no pending operations
                if (pendingOperations.size === 0) {
                    setInventoryItems(payload.items);
                    if (payload.pagination) {
                        setTotalPages(payload.pagination.totalPages);
                        setTotalItems(payload.pagination.total);
                    }
                } else {
                    console.log('Skipping full inventory update due to pending operations');
                }
            } else if (type === WEBSOCKET_EVENTS.INVENTORY_ITEM_UPDATE && payload.item) {
                // Single item update - only apply if no pending operations for this item
                const hasRelatedPendingOp = Array.from(pendingOperations).some(op => 
                    op.includes(`-${payload.item.id}`)
                );
                if (!hasRelatedPendingOp) {
                    setInventoryItems(prev =>
                        prev.map(item => item.id === payload.item.id ? payload.item : item)
                    );
                } else {
                    console.log(`Skipping item update for ${payload.item.id} due to pending operation`);
                }
            } else if (type === WEBSOCKET_EVENTS.INVENTORY_ITEM_CREATE && payload.item) {
                // Item creation - no debounce needed
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
            } else if (type === WEBSOCKET_EVENTS.INVENTORY_ITEM_DELETE && (payload.itemId || payload.productId)) {
                // Item deletion - only apply if no pending operations for this item
                const idToRemove = payload.itemId || payload.productId;
                const hasRelatedPendingOp = Array.from(pendingOperations).some(op => 
                    op.includes(`-${idToRemove}`)
                );
                if (!hasRelatedPendingOp) {
                    setInventoryItems(prev => prev.filter(item => item.id !== idToRemove));
                    setTotalItems(prev => prev - 1);
                    setTotalPages(Math.ceil((totalItems - 1) / itemsPerPage));
                } else {
                    console.log(`Skipping item deletion for ${idToRemove} due to pending operation`);
                }
            } else if (type === WEBSOCKET_EVENTS.INVENTORY_LEVEL_UPDATED && payload.productId) {
            console.log('Handling INVENTORY_LEVEL_UPDATED (memoized):', payload);

            // Use the updater function for setInventoryItems to access the latest inventoryItems
            setInventoryItems(prevInventoryItems => {
                const currentItem = prevInventoryItems.find(item => item.id === payload.productId);
                if (!currentItem) {
                    console.warn(`Item with ID ${payload.productId} not found in current inventory items.`);
                    return prevInventoryItems; // Return previous state if item not found
                }

                // Get or create pending update for this product
                // Note: pendingUpdatesRef.current still refers to the ref, which is stable.
                const existingUpdate = pendingUpdatesRef.current.get(payload.productId) || {
                    ...currentItem,
                    branchStock: [...currentItem.branchStock]
                };

                // Update the pending update with new data
                if (payload.shopId !== undefined && payload.newQuantity !== undefined) {
                    const branchIndex = existingUpdate.branchStock.findIndex(
                        (bs: any) => bs.shopId === payload.shopId
                    );

                    if (branchIndex !== -1) {
                        existingUpdate.branchStock[branchIndex] = {
                            ...existingUpdate.branchStock[branchIndex],
                            quantity: payload.newQuantity
                        };
                    } else {
                        existingUpdate.branchStock.push({
                            shopId: payload.shopId,
                            shopName: `Shop ${payload.shopId}`, // Consider fetching actual shop name if available
                            quantity: payload.newQuantity
                        });
                    }

                    // Recalculate total stock
                    existingUpdate.stock = existingUpdate.branchStock.reduce(
                        (sum: number, bs: any) => sum + bs.quantity, 0
                    );
                } else if (payload.newTotalStock !== undefined) {
                    existingUpdate.stock = payload.newTotalStock;
                } else if (payload.quantityChange !== undefined) {
                    // Ensure stock does not go below zero due to quantityChange
                    existingUpdate.stock = Math.max(0, existingUpdate.stock + payload.quantityChange);
                }

                // Store the pending update
                pendingUpdatesRef.current.set(payload.productId, existingUpdate);
                return prevInventoryItems; // Return previous state, debounce will handle the actual update
            });

            } else {
                console.log('Received unhandled WebSocket event type or payload (memoized):', type, payload);
            }
        } catch (error) {
            console.error('Error handling WebSocket event:', error, eventData);
            // Don't crash the component on WebSocket errors
        }
    }, [currentPage, itemsPerPage, totalItems, WEBSOCKET_EVENTS, processPendingUpdates, pendingOperations]);

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

        // Trigger a data refresh when pagination or filters change
        refreshInventory();
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
            const originalItems = inventoryItems;
            setInventoryItems(prevItems => prevItems.filter(item => item.id !== productId));
            
            const response = await authDelete(`/api/products/${productId}`);
            const data = await response.json();

            if (data.success) {
                // Success - keep the item removed
                console.log(`Product ${productId} deleted successfully`);
                
                // Wait a bit before re-enabling auto-refresh to ensure DB consistency
                setTimeout(() => {
                    setAutoRefreshEnabled(wasAutoRefreshEnabled);
                }, 2000);
            } else {
                // Rollback optimistic update on failure
                setInventoryItems(originalItems);
                setError(data.message || 'Failed to delete product');
                setAutoRefreshEnabled(wasAutoRefreshEnabled); // Re-enable immediately on error
            }
        } catch (err) {
            console.error('Error deleting product:', err);
            // Rollback optimistic update on error
            setInventoryItems(inventoryItems);
            setError('Failed to delete product. Please try again later.');
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
        router.refresh(); // Refresh the page to get updated data
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
            setError(null);

            // Build query parameters
            const params = new URLSearchParams();
            params.set('page', currentPage.toString());
            params.set('limit', itemsPerPage.toString());
            if (searchTerm) params.set('search', searchTerm);
            if (categoryFilter) params.set('category', categoryFilter);
            if (statusFilter) params.set('status', statusFilter);

            // Add a timestamp to bust cache
            params.set('_t', Date.now().toString());

            console.log('Refreshing inventory data...', {
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                category: categoryFilter,
                status: statusFilter,
                pendingOperations: Array.from(pendingOperations),
                forced: force,
                queryParams: params.toString()
            });

            const response = await authFetch(`/api/inventory/summary?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to refresh inventory: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                console.log('Inventory refresh successful:', {
                    itemCount: data.data.length,
                    pagination: data.pagination
                });

                // Only update if no pending operations or if forced
                if (force || pendingOperations.size === 0) {
                    setInventoryItems(data.data);
                    if (data.pagination) {
                        setTotalPages(data.pagination.totalPages);
                        setTotalItems(data.pagination.total);
                    }
                }

                // Update last refreshed timestamp
                setLastRefreshed(new Date());
            } else {
                throw new Error(data.message || 'Failed to refresh inventory');
            }
        } catch (err) {
            console.error('Error refreshing inventory:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh inventory');
        }
    }, [currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, pendingOperations]);

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
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
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
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                            pendingOperations.size > 0 ? 'bg-yellow-500 animate-pulse' :
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
                            {formattedInventoryData.length > 0 ? (
                                formattedInventoryData.map((item) => (
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
                            onClick={() => {
                                setCurrentPage(prev => Math.max(prev - 1, 1));
                                setTimeout(() => refreshInventory(), 100);
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
                                setTimeout(() => refreshInventory(), 100);
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

                                        // Update URL and refresh data
                                        router.push(`${pathname}?${params.toString()}`);

                                        // Add a small delay to ensure state is updated before refresh
                                        setTimeout(() => {
                                            refreshInventory();
                                        }, 100);
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
                                        setTimeout(() => refreshInventory(), 100);
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
                                        setTimeout(() => refreshInventory(), 100);
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
                                                    setTimeout(() => refreshInventory(), 100);
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
                                        setTimeout(() => refreshInventory(), 100);
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
                                        setTimeout(() => refreshInventory(), 100);
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