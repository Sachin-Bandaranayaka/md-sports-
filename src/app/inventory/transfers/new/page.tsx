'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, Save, XCircle, Plus, ArrowLeftRight, Minus, AlertCircle, FileText, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authFetch, authPost } from '@/utils/api';

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: string;
    available_quantity?: number; // Only for selected source shop
}

interface TransferItem {
    productId: number;
    product: Product;
    quantity: number;
    notes: string;
}

export default function CreateTransferPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shops, setShops] = useState<Shop[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

    // Form state
    const [sourceShopId, setSourceShopId] = useState<number | ''>('');
    const [destinationShopId, setDestinationShopId] = useState<number | ''>('');
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Load shops and products on mount
    useEffect(() => {
        const fetchShopsAndProducts = async () => {
            try {
                // Fetch shops
                const shopsResponse = await authFetch('/api/shops');
                if (!shopsResponse.ok) {
                    throw new Error('Failed to fetch shops');
                }
                const shopsData = await shopsResponse.json();
                console.log('Shops API response:', shopsData);
                if (!shopsData.success) {
                    throw new Error(shopsData.message || 'Failed to fetch shops');
                }
                const shopsArray = Array.isArray(shopsData.data) ? shopsData.data : [];
                console.log('Setting shops to:', shopsArray);
                setShops(shopsArray);

                // Fetch all products (we'll filter them based on selected shop later)
                const productsResponse = await authFetch('/api/products');
                if (!productsResponse.ok) {
                    throw new Error('Failed to fetch products');
                }
                const productsData = await productsResponse.json();
                if (!productsData.success) {
                    throw new Error(productsData.message || 'Failed to fetch products');
                }
                setProducts(productsData.data || []);

            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchShopsAndProducts();
    }, []);

    // When source shop changes, fetch inventory for that shop
    useEffect(() => {
        if (!sourceShopId) {
            setFilteredProducts([]);
            setSelectedProducts([]);
            return;
        }

        const fetchShopInventory = async () => {
            try {
                const response = await authFetch(`/api/inventory/shop/${sourceShopId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch shop inventory');
                }

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch shop inventory');
                }

                // Map inventory data to products with available quantities
                const inventoryMap = new Map();
                data.data.forEach((item: any) => {
                    inventoryMap.set(item.product_id, item.quantity);
                });

                // Filter products that are in stock in this shop
                const productsInStock = products.filter(product =>
                    inventoryMap.has(product.id) && inventoryMap.get(product.id) > 0
                ).map(product => ({
                    ...product,
                    available_quantity: inventoryMap.get(product.id) || 0
                }));

                setFilteredProducts(productsInStock);
                setSelectedProducts(productsInStock);

            } catch (err) {
                console.error('Error fetching shop inventory:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        };

        fetchShopInventory();
    }, [sourceShopId, products]);

    // Filter products based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSelectedProducts(filteredProducts);
            return;
        }

        const lowercasedSearch = searchTerm.toLowerCase();
        const filtered = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(lowercasedSearch) ||
            product.sku.toLowerCase().includes(lowercasedSearch)
        );

        setSelectedProducts(filtered);
    }, [searchTerm, filteredProducts]);

    // Add item to transfer
    const addItemToTransfer = (product: Product) => {
        // Check if product is already added
        const existingItemIndex = transferItems.findIndex(item => item.productId === product.id);

        if (existingItemIndex >= 0) {
            // Update quantity if already exists
            const newItems = [...transferItems];
            const currentQty = newItems[existingItemIndex].quantity;
            const maxQty = product.available_quantity || 0;

            if (currentQty < maxQty) {
                newItems[existingItemIndex].quantity += 1;
                setTransferItems(newItems);
            }
        } else {
            // Add new item
            setTransferItems([
                ...transferItems,
                {
                    productId: product.id,
                    product,
                    quantity: 1,
                    notes: ''
                }
            ]);
        }
    };

    // Remove item from transfer
    const removeItem = (index: number) => {
        const newItems = [...transferItems];
        newItems.splice(index, 1);
        setTransferItems(newItems);
    };

    // Update item quantity
    const updateItemQuantity = (index: number, quantity: number) => {
        const newItems = [...transferItems];
        const maxQty = newItems[index].product.available_quantity || 0;

        // Ensure quantity is within bounds
        if (quantity > 0 && quantity <= maxQty) {
            newItems[index].quantity = quantity;
            setTransferItems(newItems);
        }
    };

    // Update item notes
    const updateItemNotes = (index: number, notes: string) => {
        const newItems = [...transferItems];
        newItems[index].notes = notes;
        setTransferItems(newItems);
    };

    // Submit the transfer
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!sourceShopId || !destinationShopId) {
            setError('Please select both source and destination shops');
            return;
        }

        if (sourceShopId === destinationShopId) {
            setError('Source and destination shops must be different');
            return;
        }

        if (transferItems.length === 0) {
            setError('Please add at least one item to the transfer');
            return;
        }

        if (!user || !user.id) {
            setError('Your user session has expired. Please login again.');
            // Redirect to login after a short delay
            setTimeout(() => {
                localStorage.removeItem('authToken');
                router.push('/login');
            }, 2000);
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await authPost('/api/inventory/transfers', {
                sourceShopId,
                destinationShopId,
                userId: user.id, // Now guaranteed to exist
                items: transferItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    notes: item.notes
                }))
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create transfer');
            }

            // Redirect to the transfers list
            router.push('/inventory/transfers');

        } catch (err) {
            console.error('Error creating transfer:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setSubmitting(false);
        }
    };

    // Calculate total items
    const totalItems = transferItems.reduce((sum, item) => sum + item.quantity, 0);

    if (loading) {
        return (
            <MainLayout>
                <div className="h-full flex items-center justify-center p-20">
                    <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
                            <ArrowLeftRight className="absolute inset-0 m-auto h-8 w-8 text-primary" />
                        </div>
                        <p className="text-gray-900 text-lg font-medium">Loading transfer data...</p>
                        <p className="text-gray-500 mt-1">Please wait while we prepare the inventory transfer screen</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <div className="mr-4 p-3 bg-blue-50 rounded-full">
                            <ArrowLeftRight className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create Inventory Transfer</h1>
                            <p className="text-gray-900">Move products between shops</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/inventory/transfers')}
                            disabled={submitting}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSubmit}
                            disabled={submitting || transferItems.length === 0}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Create Transfer
                        </Button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Shop selection */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Source Shop
                                </label>
                                <select
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={sourceShopId}
                                    onChange={(e) => setSourceShopId(Number(e.target.value) || '')}
                                    disabled={submitting}
                                    required
                                >
                                    <option value="">Select source shop</option>
                                    {(() => {
                                        console.log('Rendering source shops, shops state:', shops, 'isArray:', Array.isArray(shops));
                                        return shops && Array.isArray(shops) && shops.map((shop) => (
                                            <option key={shop.id} value={shop.id}>
                                                {shop.name}
                                            </option>
                                        ));
                                    })()}
                                </select>
                            </div>

                            <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-50 p-3 relative overflow-hidden">
                                    <ArrowLeftRight className="h-6 w-6 text-primary" />
                                    {(sourceShopId && destinationShopId) && (
                                        <div className="absolute inset-0 bg-blue-100 opacity-50 animate-pulse"></div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Transfer</div>
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Destination Shop
                                </label>
                                <select
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={destinationShopId}
                                    onChange={(e) => setDestinationShopId(Number(e.target.value) || '')}
                                    disabled={submitting}
                                    required
                                >
                                    <option value="">Select destination shop</option>
                                    {(() => {
                                        console.log('Rendering destination shops, shops state:', shops, 'isArray:', Array.isArray(shops));
                                        return shops && Array.isArray(shops) && shops.map((shop) => (
                                            <option
                                                key={shop.id}
                                                value={shop.id}
                                                disabled={sourceShopId === shop.id}
                                            >
                                                {shop.name}
                                            </option>
                                        ));
                                    })()}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Available products (only shown when source shop is selected) */}
                    {sourceShopId && (
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-blue-50 rounded-md mr-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Available Products</h2>
                            </div>
                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedProducts.length > 0 ? (
                                    selectedProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium text-gray-900 text-lg">{product.name}</h3>
                                                    <p className="text-xs text-gray-900 mt-1">SKU: {product.sku}</p>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                                                    Rs. {parseFloat(product.price).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-100">
                                                <span className="text-sm text-gray-900 bg-blue-50 px-2 py-1 rounded-md">
                                                    Available: {product.available_quantity}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="xs"
                                                    onClick={() => addItemToTransfer(product)}
                                                    disabled={submitting}
                                                    className="px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 shadow-sm hover:shadow transition-all flex items-center gap-1"
                                                >
                                                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8">
                                        <p className="text-gray-900">
                                            {filteredProducts.length === 0
                                                ? 'No products available in this shop'
                                                : 'No products match your search'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transfer items */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="p-2 bg-blue-50 rounded-md mr-3">
                                <ArrowLeftRight className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Transfer Items</h2>
                            <span className="text-sm text-gray-900 bg-blue-50 px-2 py-1 rounded-md ml-auto">
                                {transferItems.length} products ({totalItems} items total)
                            </span>
                        </div>

                        {transferItems.length > 0 ? (
                            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left text-gray-900">
                                    <thead className="text-xs text-gray-900 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Product</th>
                                            <th className="px-6 py-3">SKU</th>
                                            <th className="px-6 py-3">Quantity</th>
                                            <th className="px-6 py-3">Notes</th>
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transferItems.map((item, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {item.product.name}
                                                </td>
                                                <td className="px-6 py-4 text-gray-900">
                                                    {item.product.sku}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <button
                                                            type="button"
                                                            className="flex items-center justify-center w-7 h-7 text-gray-900 hover:text-white bg-gray-100 hover:bg-red-500 rounded-md transition-colors"
                                                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || submitting}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            className="w-16 mx-2 border border-gray-300 rounded-md text-center p-1 focus:ring-primary focus:border-primary"
                                                            value={item.quantity}
                                                            min={1}
                                                            max={item.product.available_quantity}
                                                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                                            disabled={submitting}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="flex items-center justify-center w-7 h-7 text-gray-900 hover:text-white bg-gray-100 hover:bg-green-500 rounded-md transition-colors"
                                                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                                            disabled={item.quantity >= (item.product.available_quantity || 0) || submitting}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        className="border border-gray-300 rounded-md p-1 w-full focus:ring-primary focus:border-primary"
                                                        value={item.notes}
                                                        onChange={(e) => updateItemNotes(index, e.target.value)}
                                                        placeholder="Optional notes"
                                                        disabled={submitting}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        className="flex items-center justify-center w-8 h-8 text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition-colors"
                                                        onClick={() => removeItem(index)}
                                                        disabled={submitting}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="border border-gray-200 border-dashed rounded-lg p-8 text-center bg-gray-50">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                                    <ArrowLeftRight className="h-8 w-8 text-blue-400" />
                                </div>
                                <p className="text-gray-900 font-medium mb-1">No items added to transfer yet</p>
                                <p className="text-sm text-gray-900">
                                    Select a source shop and add products to begin
                                </p>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}