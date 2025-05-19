'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function NewProduct() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        category_id: '',
        retail_price: '',
        base_price: '',
        reorder_level: '10'
    });

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/products/categories');
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data = await response.json();
                if (data.success) {
                    setCategories(data.data || []);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Failed to load categories. Please try again later.');
            }
        };
        fetchCategories();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate form inputs
            if (!formData.sku || !formData.name || !formData.category_id || !formData.retail_price || !formData.base_price) {
                throw new Error('Please fill in all required fields');
            }

            // Convert price strings to numbers
            const productData = {
                ...formData,
                retail_price: parseFloat(formData.retail_price),
                base_price: parseFloat(formData.base_price),
                reorder_level: parseInt(formData.reorder_level)
            };

            // Send request to create product
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to create product');
            }

            setSuccess('Product created successfully!');

            // Redirect back to inventory page after short delay
            setTimeout(() => {
                router.push('/inventory');
            }, 1500);
        } catch (err: any) {
            console.error('Error creating product:', err);
            setError(err.message || 'An error occurred while creating the product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                    </div>
                </div>

                {/* Status messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                        {success}
                    </div>
                )}

                {/* Product Form */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* SKU */}
                            <div>
                                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="sku"
                                    name="sku"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    placeholder="Product SKU"
                                    value={formData.sku}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    placeholder="Product Name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Retail Price */}
                            <div>
                                <label htmlFor="retail_price" className="block text-sm font-medium text-gray-700 mb-1">
                                    Retail Price (Rs.) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="retail_price"
                                    name="retail_price"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={formData.retail_price}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Base Price */}
                            <div>
                                <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-1">
                                    Base Price (Rs.) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="base_price"
                                    name="base_price"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={formData.base_price}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Reorder Level */}
                            <div>
                                <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700 mb-1">
                                    Reorder Level
                                </label>
                                <input
                                    type="number"
                                    id="reorder_level"
                                    name="reorder_level"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    placeholder="10"
                                    min="0"
                                    value={formData.reorder_level}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mt-6">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                placeholder="Product description..."
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Form Actions */}
                        <div className="mt-8 flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="mr-2"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Product
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