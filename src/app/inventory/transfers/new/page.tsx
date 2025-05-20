'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, Save, XCircle, Plus, ArrowLeftRight, Minus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    retail_price: string;
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
                const shopsResponse = await fetch('/api/shops');
                if (!shopsResponse.ok) {
                    throw new Error('Failed to fetch shops');
                }
                const shopsData = await shopsResponse.json();
                if (!shopsData.success) {
                    throw new Error(shopsData.message || 'Failed to fetch shops');
                }
                setShops(shopsData.data || []);

                // Fetch all products (we'll filter them based on selected shop later)
                const productsResponse = await fetch('/api/products');
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
                const response = await fetch(`/api/inventory/shop/${sourceShopId}`);
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

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/inventory/transfers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceShopId,
                    destinationShopId,
                    userId: user?.id,
                    items: transferItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        notes: item.notes
                    }))
                })
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
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500">Loading data...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Inventory Transfer</h1>
                        <p className="text-gray-500">Move products between shops</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/inventory/transfers')}
                            disabled={submitting}
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSubmit}
                            disabled={submitting || transferItems.length === 0}
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>
                                        {shop.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                {shops.map((shop) => (
                                    <option
                                        key={shop.id}
                                        value={shop.id}
                                        disabled={sourceShopId === shop.id}
                                    >
                                        {shop.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Available products (only shown when source shop is selected) */}
                    {sourceShopId && (
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Available Products</h2>
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
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
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium">{product.name}</h3>
                                                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                                </div>
                                                <span className="text-sm font-semibold">
                                                    Rs. {parseFloat(product.retail_price).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-4">
                                                <span className="text-xs text-gray-600">
                                                    Available: {product.available_quantity}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="xs"
                                                    onClick={() => addItemToTransfer(product)}
                                                    disabled={submitting}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8">
                                        <p className="text-gray-500">
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
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-semibold">Transfer Items</h2>
                            <span className="text-sm text-gray-600">
                                {transferItems.length} products ({totalItems} items total)
                            </span>
                        </div>

                        {transferItems.length > 0 ? (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
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
                                            <tr key={index} className="border-b">
                                                <td className="px-6 py-4 font-medium">
                                                    {item.product.name}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {item.product.sku}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <button
                                                            type="button"
                                                            className="text-gray-500 hover:text-red-500"
                                                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || submitting}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            className="w-16 mx-2 border border-gray-300 rounded-md text-center p-1"
                                                            value={item.quantity}
                                                            min={1}
                                                            max={item.product.available_quantity}
                                                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                                            disabled={submitting}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="text-gray-500 hover:text-green-500"
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
                                                        className="border border-gray-300 rounded-md p-1 w-full"
                                                        value={item.notes}
                                                        onChange={(e) => updateItemNotes(index, e.target.value)}
                                                        placeholder="Optional notes"
                                                        disabled={submitting}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        className="text-red-500 hover:text-red-700"
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
                            <div className="border border-gray-200 border-dashed rounded-lg p-8 text-center">
                                <ArrowLeftRight className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 mb-1">No items added to transfer yet</p>
                                <p className="text-sm text-gray-400">
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