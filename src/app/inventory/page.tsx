import { Suspense } from 'react';
import { headers, cookies } from 'next/headers';
import MainLayout from '@/components/layout/MainLayout';
import InventoryClientWrapper from '@/components/inventory/InventoryClientWrapper';
import InventoryHeaderActions from '@/components/inventory/InventoryHeaderActions';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { AccessDenied } from '@/components/ui/AccessDenied';

// Add revalidation - cache inventory page for 5 seconds (reduced from 10)
export const revalidate = 5;

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

interface InventorySearchParams {
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
    status?: string;
}

async function fetchCategories(baseUrl: string, headers?: HeadersInit) {
    try {
        const categoriesResponse = await fetch(`${baseUrl}/api/categories`, {
            headers,
            next: { 
                revalidate: 30, // Revalidate every 30 seconds
                tags: ['categories'] // Add tags for revalidation
            }
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
    searchParams: InventorySearchParams
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

    // Get access token from cookies for authentication
    const cookieStore = await cookies();
    console.log('All cookies received on server component:', cookieStore.getAll());
    const accessToken = cookieStore.get('accessToken')?.value;
    console.log('Access token from cookie:', accessToken ? `${accessToken.substring(0, 10)}...` : 'Not Found');

    // Prepare headers for authenticated requests
    const requestHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    // Fetch categories from the new API route with caching
    const categories: Category[] = await fetchCategories(baseUrl, requestHeaders);

    // Fetch inventory data with pagination and filters
    const inventoryResponse = await fetch(
        `${baseUrl}/api/inventory/summary?${queryParams.toString()}`,
        {
            headers: requestHeaders,
            next: { 
                revalidate: 10, // Revalidate every 10 seconds to match page revalidation time
                tags: ['inventory', 'products'] // Add tags for revalidation
            }
        }
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
            <PermissionGuard
                permission={PERMISSIONS.INVENTORY_VIEW}
                fallback={<AccessDenied message="You do not have permission to view the inventory." />}
            >
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
            </PermissionGuard>
        </MainLayout>
    );
}