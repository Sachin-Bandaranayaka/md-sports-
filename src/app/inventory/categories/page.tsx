'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { PlusCircle, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { authPost, authPut, authDelete } from '@/utils/api';

interface Category {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    parent_name: string | null;
}

export default function CategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formParentId, setFormParentId] = useState<string>('');
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/products/categories');
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Failed to load categories. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setFormName('');
        setFormDescription('');
        setFormParentId('');
        setShowAddForm(true);
        setShowEditForm(false);
    };

    const handleEditClick = (category: Category) => {
        setSelectedCategory(category);
        setFormName(category.name);
        setFormDescription(category.description || '');
        setFormParentId(category.parent_id ? category.parent_id.toString() : '');
        setShowEditForm(true);
        setShowAddForm(false);
    };

    const handleDeleteClick = async (categoryId: number) => {
        if (!confirm('Are you sure you want to delete this category? Products in this category will be set to uncategorized.')) {
            return;
        }

        try {
            setDeleteLoading(categoryId);
            const response = await authDelete(`/api/products/categories/${categoryId}`);
            const data = await response.json();

            if (data.success) {
                // Remove the deleted category from the state
                setCategories(prevCategories => prevCategories.filter(c => c.id !== categoryId));
            } else {
                setError(data.message || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            setError('An error occurred while deleting the category');
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            setError('Category name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const response = await authPost('/api/products/categories', {
                name: formName.trim(),
                description: formDescription.trim() || null,
                parentId: formParentId ? parseInt(formParentId) : null
            });

            const data = await response.json();

            if (data.success) {
                fetchCategories();
                setShowAddForm(false);
                resetForm();
            } else {
                setError(data.message || 'Failed to create category');
            }
        } catch (error) {
            console.error('Error creating category:', error);
            setError('An error occurred while creating the category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || !selectedCategory) {
            setError('Category name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const response = await authPut(`/api/products/categories/${selectedCategory.id}`, {
                name: formName.trim(),
                description: formDescription.trim() || null,
                parentId: formParentId ? parseInt(formParentId) : null
            });

            const data = await response.json();

            if (data.success) {
                fetchCategories();
                setShowEditForm(false);
                resetForm();
            } else {
                setError(data.message || 'Failed to update category');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            setError('An error occurred while updating the category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormName('');
        setFormDescription('');
        setFormParentId('');
        setSelectedCategory(null);
    };

    const cancelForm = () => {
        setShowAddForm(false);
        setShowEditForm(false);
        resetForm();
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
                        <p className="text-gray-500">Manage product categories for your inventory</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/inventory')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Inventory
                        </Button>
                        {!showAddForm && !showEditForm && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAddClick}
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add Category
                            </Button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Add/Edit Category Form */}
                {(showAddForm || showEditForm) && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4">
                            {showAddForm ? 'Add New Category' : 'Edit Category'}
                        </h2>
                        <form onSubmit={showAddForm ? handleAddSubmit : handleEditSubmit}>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Name*
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 mb-1">
                                    Parent Category
                                </label>
                                <select
                                    id="parentCategory"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    value={formParentId}
                                    onChange={(e) => setFormParentId(e.target.value)}
                                    disabled={isSubmitting}
                                >
                                    <option value="">No Parent (Top Level)</option>
                                    {categories
                                        .filter(cat => !showEditForm || (showEditForm && cat.id !== selectedCategory?.id))
                                        .map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelForm}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isSubmitting || !formName.trim()}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {showAddForm ? 'Creating...' : 'Updating...'}
                                        </>
                                    ) : (
                                        showAddForm ? 'Create Category' : 'Update Category'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Categories List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Parent Category</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : categories.length > 0 ? (
                                    categories.map((category) => (
                                        <tr key={category.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{category.name}</td>
                                            <td className="px-6 py-4">{category.description || '-'}</td>
                                            <td className="px-6 py-4">{category.parent_name || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditClick(category)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(category.id)}
                                                        disabled={deleteLoading === category.id}
                                                    >
                                                        {deleteLoading === category.id ? (
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
                                        <td colSpan={4} className="px-6 py-4 text-center">
                                            No categories found. Add your first category to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 