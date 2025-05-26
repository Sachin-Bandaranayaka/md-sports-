import { Suspense } from 'react';
import { headers } from 'next/headers';
import MainLayout from '@/components/layout/MainLayout';
import NewPurchaseInvoiceForm from '@/components/purchases/NewPurchaseInvoiceForm';
import { Supplier, Product, Category, Shop } from '@/types'; // Ensure types are available
import { Loader2, ArrowLeft } from 'lucide-react'; // Added ArrowLeft for potential use

async function fetchSuppliers(baseUrl: string): Promise<Supplier[]> {
    try {
        const response = await fetch(`${baseUrl}/api/suppliers`, { next: { revalidate: 3600 } }); // Cache for 1 hour
        if (!response.ok) {
            console.error(`Failed to fetch suppliers: ${response.status} ${await response.text()}`);
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : (data.success && Array.isArray(data.data) ? data.data : []);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return [];
    }
}

async function fetchProducts(baseUrl: string): Promise<Product[]> {
    try {
        const response = await fetch(`${baseUrl}/api/products`, { cache: 'no-store' });
        if (!response.ok) {
            console.error(`Failed to fetch products: ${response.status} ${await response.text()}`);
            return [];
        }
        const data = await response.json();
        // Adjust based on actual API response structure for products
        return Array.isArray(data) ? data :
            (data.success && Array.isArray(data.data)) ? data.data :
                (Array.isArray(data.products)) ? data.products : // Common pattern { products: [] }
                    [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function fetchCategories(baseUrl: string): Promise<Category[]> {
    try {
        const response = await fetch(`${baseUrl}/api/products/categories`, { next: { revalidate: 3600 } });
        if (!response.ok) {
            console.error(`Failed to fetch categories: ${response.status} ${await response.text()}`);
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : (data.success && Array.isArray(data.data) ? data.data : []);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

async function fetchShops(baseUrl: string): Promise<Shop[]> {
    try {
        const response = await fetch(`${baseUrl}/api/shops`, { next: { revalidate: 3600 } });
        if (!response.ok) {
            console.error(`Failed to fetch shops: ${response.status} ${await response.text()}`);
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : (data.success && Array.isArray(data.data) ? data.data : []);
    } catch (error) {
        console.error('Error fetching shops:', error);
        return [];
    }
}

export default async function NewPurchaseInvoicePage() {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const [suppliers, products, categories, shops] = await Promise.all([
        fetchSuppliers(baseUrl),
        fetchProducts(baseUrl),
        fetchCategories(baseUrl),
        fetchShops(baseUrl)
    ]);

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    {/* A client component would be needed for router.back() or use a Link component */}
                    {/* <Link href="/purchases" className="p-2 rounded-md hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link> */}
                    <h1 className="text-2xl font-bold text-gray-800">Create New Purchase Invoice</h1>
                </div>
                <Suspense fallback={
                    <div className="flex flex-col justify-center items-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-gray-600">Loading form essentials...</p>
                    </div>
                }>
                    <NewPurchaseInvoiceForm
                        initialSuppliers={suppliers}
                        initialProducts={products}
                        initialCategories={categories}
                        initialShops={shops}
                    />
                </Suspense>
            </div>
        </MainLayout>
    );
} 