'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { authPost } from '@/utils/api';

interface Category {
    id: number;
    name: string;
}

interface Shop {
    id: number;
    name: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [shops, setShops] = useState<Shop[]>([]);
    const [shopsLoading, setShopsLoading] = useState(true);
    const [addInventoryAfterCreate, setAddInventoryAfterCreate] = useState(true);

    // Form fields
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [description, setDescription] = useState('');
    const [retailPrice, setRetailPrice] = useState('0');
    const [basePrice, setBasePrice] = useState('0');
    const [categoryId, setCategoryId] = useState('');
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [initialQuantity, setInitialQuantity] = useState<string>('1');

    useEffect(() => {
        fetchCategories();
        fetchShops();
    }, []);

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

    const generateSku = () => {
        // Simple SKU generator: prefix + random alphanumeric
        const prefix = name.slice(0, 2).toUpperCase() || 'PR';
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        setSku(`${prefix}${random}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !sku) {
            setError('Product name and SKU are required');
            return;
        }

        try {
            setIsSubmitting(true);

            // First create the product
            const productResponse = await authPost('/api/products', {
                name,
                sku,
                description,
                retailPrice: parseFloat(retailPrice),
                basePrice: parseFloat(basePrice),
                categoryId: categoryId || null
            });

            const productData = await productResponse.json();

            if (productData.success) {
                if (addInventoryAfterCreate && selectedShopId) {
                    // Add initial inventory
                    const createdProductId = productData.data.id;
                    await addInventoryForProduct(createdProductId);
                }

                // Redirect to inventory page
                router.push('/inventory');
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

    const addInventoryForProduct = async (productId: number) => {
        try {
            const response = await authPost('/api/inventory/add', {
                productId,
                shopId: parseInt(selectedShopId),
                quantity: parseInt(initialQuantity)
            });

            const data = await response.json();
            if (!data.success) {
                console.error('Failed to add initial inventory:', data.message);
                // Don't show error to user since the product was created successfully
            }
        } catch (error) {
            console.error('Error adding initial inventory:', error);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                        <p className="text-gray-500">Create a new product in your inventory</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/inventory')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Inventory
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Product Form */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name*
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
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
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label htmlFor="retailPrice" className="block text-sm font-medium text-gray-700 mb-1">
                                    Retail Price (Rs.)
                                </label>
                                <input
                                    type="number"
                                    id="retailPrice"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={retailPrice}
                                    onChange={(e) => setRetailPrice(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-1">
                                    Base Cost (Rs.)
                                </label>
                                <input
                                    type="number"
                                    id="basePrice"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={basePrice}
                                    onChange={(e) => setBasePrice(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                {categoriesLoading ? (
                                    <div className="flex items-center space-x-2 h-10">
                                        <Loader2 className="animate-spin h-4 w-4 text-gray-500" />
                                        <span className="text-gray-500">Loading categories...</span>
                                    </div>
                                ) : (
                                    <select
                                        id="category"
                                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
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

                            <div></div> {/* Empty div for grid alignment */}

                            {/* Add to inventory section */}
                            <div className="md:col-span-2 p-4 bg-gray-50 rounded-md">
                                <div className="mb-3">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="addInventory"
                                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                                            checked={addInventoryAfterCreate}
                                            onChange={(e) => setAddInventoryAfterCreate(e.target.checked)}
                                            disabled={isSubmitting}
                                        />
                                        <label htmlFor="addInventory" className="ml-2 text-sm font-medium text-gray-700">
                                            Add to inventory after creating
                                        </label>
                                    </div>
                                </div>

                                {addInventoryAfterCreate && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
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
                                                    {shops.map((shop) => (
                                                        <option key={shop.id} value={shop.id}>
                                                            {shop.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                                                Initial Quantity
                                            </label>
                                            <input
                                                type="number"
                                                id="quantity"
                                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                                value={initialQuantity}
                                                onChange={(e) => setInitialQuantity(e.target.value)}
                                                min="1"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/inventory')}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={isSubmitting || !name || !sku || (addInventoryAfterCreate && !selectedShopId)}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Product'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
} 