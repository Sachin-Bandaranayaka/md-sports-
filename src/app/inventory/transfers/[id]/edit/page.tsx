'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, Save, XCircle, Plus, ArrowLeftRight, Minus, AlertCircle, FileText, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authFetch } from '@/utils/api';

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: string;
    available_quantity?: number;
}

interface TransferItem {
    id?: number;
    productId: number;
    product: Product;
    quantity: number;
    notes: string;
}

interface Transfer {
    id: number;
    status: string;
    source_shop_id: number;
    destination_shop_id: number;
    source_shop_name: string;
    destination_shop_name: string;
    items: TransferItem[];
}

export default function EditTransferPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shops, setShops] = useState<Shop[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [transfer, setTransfer] = useState<Transfer | null>(null);

    // Form state
    const [sourceShopId, setSourceShopId] = useState<string>('');
    const [destinationShopId, setDestinationShopId] = useState<string>('');
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const transferId = parseInt(params.id);

    // Load transfer data, shops and products on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch transfer details
                const transferResponse = await authFetch(`/api/inventory/transfers/${transferId}`);
                if (!transferResponse.ok) {
                    throw new Error('Failed to fetch transfer details');
                }
                const transferData = await transferResponse.json();
                
                if (!transferData.success) {
                    throw new Error(transferData.error || 'Failed to fetch transfer details');
                }

                const transferInfo = transferData.data;
                setTransfer(transferInfo);

                // Check if transfer can be edited (only pending transfers)
                if (transferInfo.status !== 'pending') {
                    setError('Only pending transfers can be edited');
                    return;
                }

                // Set form values
                setSourceShopId(transferInfo.source_shop_id.toString());
                setDestinationShopId(transferInfo.destination_shop_id.toString());
                
                // Transform API items to match expected format
                const transformedItems = (transferInfo.items || []).map(item => ({
                    id: item.id,
                    productId: item.product_id,
                    product: {
                        id: item.product_id,
                        name: item.product_name,
                        sku: item.sku,
                        price: item.price,
                        available_quantity: 0 // Will be updated when products are fetched
                    },
                    quantity: item.quantity,
                    notes: item.notes || ''
                }));
                setTransferItems(transformedItems);

                // Fetch shops
                const shopsResponse = await authFetch('/api/shops');
                if (!shopsResponse.ok) {
                    throw new Error('Failed to fetch shops');
                }
                const shopsData = await shopsResponse.json();
                setShops(shopsData.success ? shopsData.data : []);

                // Fetch products for source shop
                if (transferInfo.source_shop_id) {
                    const productsResponse = await authFetch(`/api/inventory?shopId=${transferInfo.source_shop_id}`);
                    if (productsResponse.ok) {
                        const productsData = await productsResponse.json();
                        if (productsData.success) {
                            setProducts(productsData.data);
                            setFilteredProducts(productsData.data);
                            
                            // Update available quantities in transfer items
                            setTransferItems(prevItems => 
                                prevItems.map(item => {
                                    const product = productsData.data.find(p => p.id === item.productId);
                                    if (product) {
                                        return {
                                            ...item,
                                            product: {
                                                ...item.product,
                                                available_quantity: product.available_quantity || 0
                                            }
                                        };
                                    }
                                    return item;
                                })
                            );
                        }
                    }
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [transferId]);

    // Filter products based on search term
    useEffect(() => {
        if (searchTerm) {
            const filtered = products.filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    // Fetch products when source shop changes
    useEffect(() => {
        const fetchProducts = async () => {
            if (sourceShopId) {
                try {
                    const response = await authFetch(`/api/inventory?shopId=${sourceShopId}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            setProducts(data.data);
                            setFilteredProducts(data.data);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching products:', err);
                }
            } else {
                setProducts([]);
                setFilteredProducts([]);
            }
        };

        // Only fetch if source shop changed from initial load
        if (transfer && sourceShopId !== transfer.source_shop_id.toString()) {
            fetchProducts();
            // Clear transfer items when source shop changes
            setTransferItems([]);
        }
    }, [sourceShopId, transfer]);

    // Add product to transfer
    const addProductToTransfer = (product: Product) => {
        const existingItem = transferItems.find(item => item.productId === product.id);
        if (existingItem) {
            setError('Product already added to transfer');
            return;
        }

        const newItem: TransferItem = {
            productId: product.id,
            product,
            quantity: 1,
            notes: ''
        };

        setTransferItems([...transferItems, newItem]);
        setSelectedProducts([...selectedProducts, product]);
        setError(null);
    };

    // Remove product from transfer
    const removeProductFromTransfer = (productId: number) => {
        setTransferItems(transferItems.filter(item => item.productId !== productId));
        setSelectedProducts(selectedProducts.filter(product => product.id !== productId));
    };

    // Update transfer item quantity
    const updateTransferItemQuantity = (productId: number, quantity: number) => {
        setTransferItems(transferItems.map(item => 
            item.productId === productId ? { ...item, quantity } : item
        ));
    };

    // Update transfer item notes
    const updateTransferItemNotes = (productId: number, notes: string) => {
        setTransferItems(transferItems.map(item => 
            item.productId === productId ? { ...item, notes } : item
        ));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!sourceShopId || !destinationShopId) {
            setError('Please select both source and destination shops');
            return;
        }

        if (sourceShopId === destinationShopId) {
            setError('Source and destination shops cannot be the same');
            return;
        }

        if (transferItems.length === 0) {
            setError('Please add at least one product to the transfer');
            return;
        }

        // Validate quantities
        for (const item of transferItems) {
            if (item.quantity <= 0) {
                setError(`Please enter a valid quantity for ${item.product.name}`);
                return;
            }
            if (item.product.available_quantity && item.quantity > item.product.available_quantity) {
                setError(`Quantity for ${item.product.name} exceeds available stock (${item.product.available_quantity})`);
                return;
            }
        }

        try {
            setSubmitting(true);
            setError(null);

            const transferData = {
                sourceShopId: parseInt(sourceShopId),
                destinationShopId: parseInt(destinationShopId),
                items: transferItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    notes: item.notes
                }))
            };

            const response = await authFetch(`/api/inventory/transfers/${transferId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transferData)
            });

            const data = await response.json();
            
            if (data.success) {
                router.push(`/inventory/transfers/${transferId}`);
            } else {
                throw new Error(data.error || 'Failed to update transfer');
            }
        } catch (err) {
            console.error('Error updating transfer:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-gray-600">Loading transfer details...</span>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error && !transfer) {
        return (
            <MainLayout>
                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/inventory/transfers')}
                        >
                            Back to Transfers
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-50 p-2 rounded-lg">
                            <ArrowLeftRight className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Transfer #{transfer?.id}</h1>
                            <p className="text-gray-600">Modify inventory transfer between shops</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/inventory/transfers')}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Transfer Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Shop Selection */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900">Transfer Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Source Shop *
                                </label>
                                <select
                                    value={sourceShopId}
                                    onChange={(e) => setSourceShopId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    required
                                >
                                    <option value="">Select source shop</option>
                                    {shops.map(shop => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Destination Shop *
                                </label>
                                <select
                                    value={destinationShopId}
                                    onChange={(e) => setDestinationShopId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    required
                                >
                                    <option value="">Select destination shop</option>
                                    {shops.filter(shop => shop.id.toString() !== sourceShopId).map(shop => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Product Selection */}
                    {sourceShopId && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold mb-4 text-gray-900">Add Products</h2>
                            
                            {/* Search */}
                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Search products by name or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Products Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                                {filteredProducts.map(product => {
                                    const isSelected = selectedProducts.some(p => p.id === product.id);
                                    return (
                                        <div
                                            key={product.id}
                                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                                isSelected 
                                                    ? 'border-primary-300 bg-primary-50' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => !isSelected && addProductToTransfer(product)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                                                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                                    <p className="text-xs text-gray-600">Available: {product.available_quantity || 0}</p>
                                                </div>
                                                {!isSelected && (
                                                    <Plus className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Transfer Items */}
                    {transferItems.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold mb-4 text-gray-900">Transfer Items</h2>
                            <div className="space-y-4">
                                {transferItems.map(item => (
                                    <div key={item.productId} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                                                <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                                                <p className="text-sm text-gray-600">Available: {item.product.available_quantity || 0}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Quantity *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.product.available_quantity || undefined}
                                                        value={item.quantity}
                                                        onChange={(e) => updateTransferItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                                                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Notes
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.notes}
                                                        onChange={(e) => updateTransferItemNotes(item.productId, e.target.value)}
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                        placeholder="Optional notes..."
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeProductFromTransfer(item.productId)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/inventory/transfers')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || transferItems.length === 0}
                            className="min-w-[120px]"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Update Transfer
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}