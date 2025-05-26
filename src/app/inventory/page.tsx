import { Suspense } from 'react';
import { headers } from 'next/headers';
import MainLayout from '@/components/layout/MainLayout';
// import { Package, Filter, Store, ArrowUpDown, PlusCircle, ShoppingBag } from 'lucide-react'; // Icons seem unused directly here
// import { Button } from '@/components/ui/Button'; // Button seem unused directly here
import InventoryClientWrapper from '@/components/inventory/InventoryClientWrapper';
import InventoryHeaderActions from '@/components/inventory/InventoryHeaderActions';
// import { prisma } from '@/lib/prisma'; // Prisma direct call removed for categories

// Define proper types for our data
interface BranchStock {
    shopId: number;
    shopName: string;
    quantity: number;
}

interface InventoryItem {
    id: number;
    sku: string;
    name: string;
    category: string;
    stock: number;
    retailPrice: number;
    weightedAverageCost: number;
    status: string;
    branchStock: BranchStock[];
}

interface Category {
    id: number;
    name: string;
}

async function fetchCategories(baseUrl: string) {
    try {
        const categoriesResponse = await fetch(`${baseUrl}/api/categories`, {
            next: { revalidate: 3600 } // Revalidate every hour
        });
        if (!categoriesResponse.ok) {
            console.error('Failed to fetch categories:', categoriesResponse.status, await categoriesResponse.text());
            return []; // Return empty array on error
        }
        const categoriesData = await categoriesResponse.json();
        return categoriesData.success ? categoriesData.data : [];
    } catch (error) {
        console.error('Error in fetchCategories:', error);
        return [];
    }
}

export default async function Inventory({
    searchParams: passedSearchParams
}: {
    searchParams: any
}) {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process?.env?.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const searchParams = await passedSearchParams;

    const page = parseInt(searchParams?.page || '1');
    const limit = parseInt(searchParams?.limit || '10');
    const search = searchParams?.search || '';
    const categoryFilter = searchParams?.category || '';
    const statusFilter = searchParams?.status || '';

    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    if (search) queryParams.append('search', search);
    if (categoryFilter) queryParams.append('category', categoryFilter);
    if (statusFilter) queryParams.append('status', statusFilter);

    // Fetch categories from the new API route with caching
    const categories: Category[] = await fetchCategories(baseUrl);

    // Fetch inventory data with pagination and filters
    const inventoryResponse = await fetch(
        `${baseUrl}/api/inventory/summary?${queryParams.toString()}`,
        { next: { revalidate: 60 } } // Revalidate every 60 seconds
    );

    let inventoryItems: InventoryItem[] = [];
    let pagination = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    };

    if (!inventoryResponse.ok) {
        console.error('Failed to fetch inventory data:', inventoryResponse.status, await inventoryResponse.text());
        // Potentially set an error state to display to the user
    } else {
        try {
            const inventoryData = await inventoryResponse.json();
            if (inventoryData.success) {
                inventoryItems = inventoryData.data;
                pagination = inventoryData.pagination || pagination;
            } else {
                console.error('Inventory data API call not successful:', inventoryData.message);
            }
        } catch (e) {
            console.error('Failed to parse inventory data JSON:', e);
        }
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                        <p className="text-gray-500">Manage your product inventory across all shops</p>
                    </div>
                    <InventoryHeaderActions />
                </div>

                <Suspense fallback={<div>Loading inventory...</div>}>
                    <InventoryClientWrapper
                        initialInventoryItems={inventoryItems}
                        initialCategories={categories}
                        initialPagination={pagination}
                        initialSearchTerm={search}
                        initialCategoryFilter={categoryFilter}
                        initialStatusFilter={statusFilter}
                    />
                </Suspense>
            </div>
        </MainLayout>
    );
} 