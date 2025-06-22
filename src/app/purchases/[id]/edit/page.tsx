import { Suspense } from 'react';
import { headers } from 'next/headers';
import MainLayout from '@/components/layout/MainLayout';
import EditPurchaseInvoiceForm from '@/components/purchases/EditPurchaseInvoiceForm';
import { PurchaseInvoice, Supplier } from '@/types';

// Local interfaces for this page
interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
    sku?: string;
    weightedAverageCost?: number;
}

interface Category {
    id: string;
    name: string;
}

interface Shop {
    id: string;
    name: string;
}

interface PurchaseInvoiceItem {
    id?: number;
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    total: number;
    product?: {
        id: number;
        name: string;
        sku?: string;
    };
}
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Helper function to get base URL (can be in a shared utils file)
function getBaseUrl() {
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    return `${protocol}://${host}`;
}

interface PurchaseInvoiceWithDetails {
    id: number;
    invoiceNumber: string;
    supplierId: number;
    total: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    distributions?: any;
    date?: string;
    dueDate?: string;
    supplier?: {
        id: number;
        name: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    items: {
        id: number;
        productId: number;
        quantity: number;
        price: number;
        total: number;
        product?: {
            id: number;
            name: string;
            sku?: string;
        };
    }[];
}

async function fetchPurchaseInvoice(id: string, baseUrl: string): Promise<PurchaseInvoiceWithDetails | null> {
    try {
        const response = await fetch(`${baseUrl}/api/purchases/${id}`, { 
            next: { 
                tags: ['purchase-invoices', `purchase-${id}`],
                revalidate: 0 // Always fetch fresh data but use tags for revalidation
            }
        });
        if (!response.ok) {
            if (response.status === 404) return null; // Not found
            console.error(`Failed to fetch invoice ${id}: ${response.status} ${await response.text()}`);
            return null;
        }
        const data = await response.json();
        // Ensure the data matches the expected structure, especially items and distributions
        return data.success && data.data ? data.data : data; // Adjust based on actual API response for a single invoice
    } catch (error) {
        console.error(`Error fetching invoice ${id}:`, error);
        return null;
    }
}

async function fetchSuppliers(baseUrl: string): Promise<Supplier[]> {
    try {
        const response = await fetch(`${baseUrl}/api/suppliers`, { 
            next: { revalidate: 60, tags: ['suppliers'] },
            cache: 'force-cache'
        });
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
        const response = await fetch(`${baseUrl}/api/products`, { next: { revalidate: 30 } }); // Cache for 30 seconds
        if (!response.ok) {
            console.error(`Failed to fetch products: ${response.status} ${await response.text()}`);
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : (data.success && Array.isArray(data.data)) ? data.data : (Array.isArray(data.products)) ? data.products : [];
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
        const response = await fetch(`${baseUrl}/api/shops`, { 
            next: { revalidate: 3600 },
            headers: {
                'Authorization': 'Bearer dev-token'
            }
        });
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

interface EditPurchaseInvoicePageProps {
    params: { id: string };
}

export default async function EditPurchaseInvoicePage({ params }: EditPurchaseInvoicePageProps) {
    const { id } = params;
    const baseUrl = getBaseUrl();

    const [invoice, suppliers, products, categories, shops] = await Promise.all([
        fetchPurchaseInvoice(id, baseUrl),
        fetchSuppliers(baseUrl),
        fetchProducts(baseUrl),
        fetchCategories(baseUrl),
        fetchShops(baseUrl)
    ]);

    if (!invoice) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-8 text-center">
                    <div className="inline-flex items-center bg-red-100 text-red-700 p-4 rounded-md">
                        <AlertTriangle className="h-6 w-6 mr-3" />
                        <p className="text-xl">Purchase Invoice not found or could not be loaded.</p>
                    </div>
                    <Link href="/purchases" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Go back to Purchases
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <Link href="/purchases" className="p-2 rounded-md hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Purchase Invoice</h1>
                </div>
                <Suspense fallback={
                    <div className="flex flex-col justify-center items-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-gray-600">Loading form essentials...</p>
                    </div>
                }>
                    <EditPurchaseInvoiceForm
                        initialInvoice={invoice} // API should return items and distributions correctly
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
