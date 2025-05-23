'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AddInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preselectedProduct?: { id: number, name: string } | null;
}

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
}

export default function AddInventoryModal({ isOpen, onClose, onSuccess, preselectedProduct }: AddInventoryModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shops, setShops] = useState<Shop[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('1');
    const [shopsLoading, setShopsLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);

    // Set preselected product when it changes
    useEffect(() => {
        if (preselectedProduct) {
            setSelectedProductId(preselectedProduct.id.toString());
        }
    }, [preselectedProduct]);

    // Fetch shops and products when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchShops();
            fetchProducts();
        }
    }, [isOpen]);

    const fetchShops = async () => {
        try {
            setShopsLoading(true);
            const response = await fetch('/api/shops');
            if (!response.ok) {
                throw new Error('Failed to fetch shops');
            }
            const data = await response.json();
            if (data.success) {
                setShops(data.data);
                if (data.data.length > 0) {
                    setSelectedShopId(data.data[0].id.toString());
                }
            }
        } catch (error) {
            console.error('Error fetching shops:', error);
            setError('Failed to load shops. Please try again.');
        } finally {
            setShopsLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setProductsLoading(true);
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
                if (data.data.length > 0) {
                    setSelectedProductId(data.data[0].id.toString());
                }
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products. Please try again.');
        } finally {
            setProductsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedProductId || !selectedShopId || !quantity) {
            setError('Please fill out all fields');
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetch('/api/inventory/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: selectedProductId,
                    shopId: selectedShopId,
                    quantity: parseInt(quantity)
                }),
            });

            const data = await response.json();

            if (data.success) {
                onSuccess();
                resetForm();
                onClose();
            } else {
                setError(data.message || 'Failed to add inventory. Please try again.');
            }
        } catch (error) {
            console.error('Error adding inventory:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedProductId(products.length > 0 ? products[0].id.toString() : '');
        setSelectedShopId(shops.length > 0 ? shops[0].id.toString() : '');
        setQuantity('1');
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {preselectedProduct
                            ? `Add "${preselectedProduct.name}" to Inventory`
                            : "Add to Inventory"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                            Product
                        </label>
                        {productsLoading ? (
                            <div className="flex items-center space-x-2 h-10">
                                <Loader2 className="animate-spin h-4 w-4 text-gray-500" />
                                <span className="text-gray-500">Loading products...</span>
                            </div>
                        ) : (
                            <select
                                id="product"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                disabled={isSubmitting || !!preselectedProduct}
                            >
                                {products.length === 0 ? (
                                    <option value="">No products available</option>
                                ) : (
                                    products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.sku} - {product.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        )}
                        {preselectedProduct && (
                            <p className="mt-1 text-xs text-gray-500">
                                This newly created product is preselected for you.
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-1">
                            Shop
                        </label>
                        {shopsLoading ? (
                            <div className="flex items-center space-x-2 h-10">
                                <Loader2 className="animate-spin h-4 w-4 text-gray-500" />
                                <span className="text-gray-500">Loading shops...</span>
                            </div>
                        ) : (
                            <select
                                id="shop"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                value={selectedShopId}
                                onChange={(e) => setSelectedShopId(e.target.value)}
                                disabled={isSubmitting}
                            >
                                {shops.length === 0 ? (
                                    <option value="">No shops available</option>
                                ) : (
                                    shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                        </label>
                        <input
                            type="number"
                            id="quantity"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex justify-end space-x-2 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting || !selectedProductId || !selectedShopId}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add to Inventory'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 