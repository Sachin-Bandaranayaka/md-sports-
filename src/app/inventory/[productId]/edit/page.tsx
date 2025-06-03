'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    price: number;
    weightedAverageCost: number;
    categoryId?: number;
    category?: {
        id: number;
        name: string;
    };
}

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        retailPrice: '',
        basePrice: '',
        categoryId: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch product details
                const productResponse = await fetch(`/api/products/${productId}`);
                if (!productResponse.ok) {
                    throw new Error('Failed to fetch product details');
                }
                const productData = await productResponse.json();
                
                if (!productData.success) {
                    throw new Error(productData.message || 'Failed to fetch product');
                }

                const productInfo = productData.data;
                setProduct(productInfo);
                
                // Set form data
                setFormData({
                    name: productInfo.name || '',
                    sku: productInfo.sku || '',
                    barcode: productInfo.barcode || '',
                    description: productInfo.description || '',
                    retailPrice: productInfo.price?.toString() || '',
                    basePrice: productInfo.weightedAverageCost?.toString() || '',
                    categoryId: productInfo.categoryId?.toString() || ''
                });

                // Fetch categories
                const categoriesResponse = await fetch('/api/categories');
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    if (categoriesData.success && Array.isArray(categoriesData.data)) {
                        setCategories(categoriesData.data);
                    }
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load product data');
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchData();
        }
    }, [productId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const updateData = {
                name: formData.name,
                sku: formData.sku,
                barcode: formData.barcode || null,
                description: formData.description || null,
                retailPrice: parseFloat(formData.retailPrice) || 0,
                basePrice: parseFloat(formData.basePrice) || 0,
                categoryId: formData.categoryId ? parseInt(formData.categoryId) : null
            };

            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to update product');
            }

            // Redirect back to product details or inventory page
            router.push(`/inventory/${productId}`);
        } catch (err) {
            console.error('Error updating product:', err);
            setError(err instanceof Error ? err.message : 'Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex flex-col justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-gray-600">Loading product details...</p>
                </div>
            </MainLayout>
        );
    }

    if (error && !product) {
        return (
            <MainLayout>
                <div className="flex flex-col justify-center items-center h-64">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link href="/inventory">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Inventory
                        </Button>
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <Link href={`/inventory/${productId}`} className="p-2 rounded-md hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Edit Form */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder="Enter product name"
                                />
                            </div>

                            {/* SKU */}
                            <div>
                                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                                    SKU *
                                </label>
                                <input
                                    type="text"
                                    id="sku"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder="Enter SKU"
                                />
                            </div>

                            {/* Barcode */}
                            <div>
                                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                                    Barcode
                                </label>
                                <input
                                    type="text"
                                    id="barcode"
                                    name="barcode"
                                    value={formData.barcode}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder="Enter barcode"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    id="categoryId"
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Retail Price */}
                            <div>
                                <label htmlFor="retailPrice" className="block text-sm font-medium text-gray-700 mb-2">
                                    Retail Price (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    id="retailPrice"
                                    name="retailPrice"
                                    value={formData.retailPrice}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Base Price / Weighted Average Cost */}
                            <div>
                                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-2">
                                    Base Price (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    id="basePrice"
                                    name="basePrice"
                                    value={formData.basePrice}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="Enter product description"
                            />
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <Link href={`/inventory/${productId}`}>
                                <Button type="button" variant="outline" disabled={saving}>
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" variant="primary" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}