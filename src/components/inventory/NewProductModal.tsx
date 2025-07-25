'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/context/QueryProvider';
import { useAuth } from '@/hooks/useAuth';

interface NewProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onAddToInventory?: (productId: number, productName: string) => void;
    cloneData?: {
        name: string;
        sku: string;
        description?: string;
        retailPrice: number;
        categoryId?: number;
        minStockLevel: number;
    };
}

interface Category {
    id: number;
    name: string;
}

interface Shop {
    id: number;
    name: string;
}

export default function NewProductModal({ isOpen, onClose, onSuccess, onAddToInventory, cloneData }: NewProductModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const queryClient = useQueryClient();
    const { accessToken } = useAuth();

    // Form fields
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [description, setDescription] = useState('');
    const [retailPrice, setRetailPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [minStockLevel, setMinStockLevel] = useState('10');

    // Initialize form with clone data if provided
    useEffect(() => {
        if (isOpen && cloneData) {
            setName(cloneData.name + ' (Copy)');
            setSku(''); // Clear SKU so user can generate a new one
            setDescription(cloneData.description || '');
            setRetailPrice(cloneData.retailPrice.toString());
            setCategoryId(cloneData.categoryId ? cloneData.categoryId.toString() : '');
            setMinStockLevel(cloneData.minStockLevel.toString());
        } else if (isOpen && !cloneData) {
            resetForm();
        }
    }, [isOpen, cloneData]);

    // Fetch categories when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const response = await fetch('/api/products/categories');
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
                if (data.data.length > 0) {
                    setCategoryId(data.data[0].id.toString());
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Failed to load categories. Please try again.');
        } finally {
            setCategoriesLoading(false);
        }
    };

    const generateSku = () => {
        // Simple SKU generator: prefix + random alphanumeric
        const prefix = name.slice(0, 2).toUpperCase() || 'PR';
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        setSku(`${prefix}${random}`);
    };

    // Auto-generate SKU when the product name is provided and SKU is still empty
    useEffect(() => {
        if (name && sku === '') {
            generateSku();
        }
    }, [name, sku]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !sku) {
            setError('Product name and SKU are required');
            return;
        }

        if (!accessToken) {
            setError('Please log in to create products');
            return;
        }

        try {
            setIsSubmitting(true);

            // Create the product using authPost for proper authentication
            const productResponse = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    name,
                    sku,
                    description,
                    retailPrice: parseFloat(retailPrice),
                    categoryId: categoryId || null,
                    minStockLevel: parseInt(minStockLevel)
                }),
            });

            const productData = await productResponse.json();

            if (productData.success) {
                // Invalidate relevant queries to force a refresh
                queryClient.invalidateQueries({ queryKey: queryKeys.products });
                queryClient.invalidateQueries({ queryKey: queryKeys.productsList() });
                queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
                queryClient.invalidateQueries({ queryKey: queryKeys.inventoryList() });

                // Product created successfully - no longer automatically opening Add Inventory Modal
                // Users can manually add inventory if needed

                resetForm();
                onSuccess();
                onClose();
            } else {
                setError(productData.message || 'Failed to create product. Please try again.');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setSku('');
        setDescription('');
        setRetailPrice('');
        setCategoryId(categories.length > 0 ? categories[0].id.toString() : '');
        setMinStockLevel('10');
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-black">
                        {cloneData ? 'Clone Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="text-black hover:text-gray-600">
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
                        <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                            Product Name*
                        </label>
                        <input
                            type="text"
                            id="name"
                            className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="sku" className="block text-sm font-medium text-black">
                                SKU*
                            </label>
                            <button
                                type="button"
                                className="text-xs text-primary hover:text-primary-dark"
                                onClick={generateSku}
                                disabled={!name || isSubmitting}
                            >
                                Generate SKU
                            </button>
                        </div>
                        <input
                            type="text"
                            id="sku"
                            className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-black mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="retailPrice" className="block text-sm font-medium text-black mb-1">
                            Retail Price (Rs.)
                        </label>
                        <input
                            type="number"
                            id="retailPrice"
                            className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            value={retailPrice}
                            onChange={(e) => setRetailPrice(e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="category" className="block text-sm font-medium text-black mb-1">
                            Category
                        </label>
                        {categoriesLoading ? (
                            <div className="flex items-center space-x-2 h-10">
                                <Loader2 className="animate-spin h-4 w-4 text-black" />
                                <span className="text-black">Loading categories...</span>
                            </div>
                        ) : (
                            <select
                                id="category"
                                className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                disabled={isSubmitting}
                            >
                                <option value="">No Category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="minStockLevel" className="block text-sm font-medium text-black mb-1">
                            Low Stock Threshold
                        </label>
                        <input
                            type="number"
                            id="minStockLevel"
                            className="bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            value={minStockLevel}
                            onChange={(e) => setMinStockLevel(e.target.value)}
                            min="1"
                            disabled={isSubmitting}
                            placeholder="Enter minimum stock level"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Products will be marked as "Low Stock" when quantity falls below this threshold
                        </p>
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
                            disabled={isSubmitting || !name || !sku}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {cloneData ? 'Cloning...' : 'Creating...'}
                                </>
                            ) : (
                                cloneData ? 'Clone Product' : 'Create Product'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}