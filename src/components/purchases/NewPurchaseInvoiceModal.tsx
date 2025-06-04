'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Supplier, Product, Category, Shop } from '@/types';
import NewPurchaseInvoiceForm from '@/components/purchases/NewPurchaseInvoiceForm';

interface NewPurchaseInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    suppliers: Supplier[];
}

export default function NewPurchaseInvoiceModal({
    isOpen,
    onClose,
    onSuccess,
    suppliers
}: NewPurchaseInvoiceModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Format suppliers to ensure IDs are strings
    const formattedSuppliers = suppliers.map(supplier => ({
        ...supplier,
        id: supplier.id ? supplier.id.toString() : ''
    }));

    // Fetch necessary data when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch products, categories, and shops in parallel
            const [productsRes, categoriesRes, shopsRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/products/categories'),
                fetch('/api/shops')
            ]);

            if (!productsRes.ok) throw new Error('Failed to fetch products');
            if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
            if (!shopsRes.ok) throw new Error('Failed to fetch shops');

            const productsData = await productsRes.json();
            const categoriesData = await categoriesRes.json();
            const shopsData = await shopsRes.json();

            // Format product IDs as strings
            const formattedProducts = (productsData.data || []).map((product: any) => ({
                ...product,
                id: product.id ? product.id.toString() : ''
            }));

            // Format category IDs as strings
            const formattedCategories = (categoriesData.data || []).map((category: any) => ({
                ...category,
                id: category.id ? category.id.toString() : ''
            }));

            // Format shop IDs as strings
            const formattedShops = (shopsData.data || []).map((shop: any) => ({
                ...shop,
                id: shop.id ? shop.id.toString() : ''
            }));

            setProducts(formattedProducts);
            setCategories(formattedCategories);
            setShops(formattedShops);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
                <div className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Create New Purchase Invoice</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                            <p className="text-gray-600">Loading form data...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                            <p className="font-medium">Error loading data</p>
                            <p>{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchData}
                                className="mt-2"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <NewPurchaseInvoiceForm
                            initialSuppliers={formattedSuppliers}
                            initialProducts={products}
                            initialCategories={categories}
                            initialShops={shops}
                            isModal={true}
                            onSuccess={onSuccess}
                            onCancel={onClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
} 