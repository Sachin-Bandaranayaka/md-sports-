import { Suspense } from 'react';
import { headers } from 'next/headers';
import MainLayout from '@/components/layout/MainLayout';
import { Package, Filter, Store, ArrowUpDown, PlusCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import InventoryClientWrapper from '@/components/inventory/InventoryClientWrapper';
import InventoryHeaderActions from '@/components/inventory/InventoryHeaderActions';
import { prisma } from '@/lib/prisma';

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

export default async function Inventory({
    searchParams: passedSearchParams
}: {
    // Temporarily using any to test the await pattern
    searchParams: any
}) {
    // Properly await headers in Next.js 14
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process?.env?.NODE_ENV === 'development' ? 'http' : 'https';

    // Attempt to await searchParams as per the error message's implication
    const searchParams = await passedSearchParams;

    // Parse pagination parameters
    const page = parseInt(searchParams?.page || '1');
    const limit = parseInt(searchParams?.limit || '10');
    const search = searchParams?.search || '';
    const categoryFilter = searchParams?.category || '';
    const statusFilter = searchParams?.status || '';

    // Build query parameters
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    // Add filters if they exist
    if (search) queryParams.append('search', search);
    if (categoryFilter) queryParams.append('category', categoryFilter);
    if (statusFilter) queryParams.append('status', statusFilter);

    // Fetch categories
    const categories = await prisma.category.findMany({
        orderBy: {
            name: 'asc'
        }
    });

    // Fetch inventory data with pagination and filters
    const inventoryResponse = await fetch(
        `${protocol}://${host}/api/inventory/summary?${queryParams.toString()}`,
        { cache: 'no-store' }
    );

    if (!inventoryResponse.ok) {
        throw new Error('Failed to fetch inventory data');
    }

    const inventoryData = await inventoryResponse.json();
    const inventoryItems = inventoryData.success ? inventoryData.data : [];
    const pagination = inventoryData.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
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