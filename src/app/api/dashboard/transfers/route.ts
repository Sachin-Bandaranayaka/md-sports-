import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';

// Filtered version of fetchTransfersData with date range support
export async function fetchTransfersDataFiltered(startDate?: string | null, endDate?: string | null, shopId?: string | null) {
    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
        dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.lte = endDateTime;
    }

    // Build where clause with date and shop filtering
    const whereClause: any = {};
    if (Object.keys(dateFilter).length > 0) {
        whereClause.createdAt = dateFilter;
    }
    if (shopId) {
        whereClause.OR = [
            { fromShopId: shopId },
            { toShopId: shopId }
        ];
    }

    // Fetch inventory transfers with date and shop filtering
    const transfers = await safeQuery(
        () => prisma.inventoryTransfer.findMany({
            select: {
                id: true,
                status: true,
                createdAt: true,
                fromShop: {
                    select: { name: true }
                },
                toShop: {
                    select: { name: true }
                },
                transferItems: {
                    select: { id: true }
                }
            },
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            orderBy: {
                createdAt: 'desc'
            },
            take: 10 // Show more transfers when filtering by date
        }),
        [],
        'Failed to fetch filtered transfers data'
    );

    // Format the data for the frontend
    const data = transfers.map(transfer => ({
        id: `TR-${String(transfer.id).padStart(3, '0')}`,
        source: transfer.fromShop.name,
        destination: transfer.toShop.name,
        status: transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1),
        date: transfer.createdAt.toISOString().split('T')[0],
        items: transfer.transferItems.length
    }));

    return {
        success: true,
        data
    };
}

export async function fetchTransfersData(shopId?: string | null) {
    // Build where clause for shop filtering
    const whereClause = shopId ? {
        OR: [
            { fromShopId: shopId },
            { toShopId: shopId }
        ]
    } : undefined;

    // Fetch recent inventory transfers using Prisma
    const transfers = await safeQuery(
        () => prisma.inventoryTransfer.findMany({
            select: {
                id: true,
                status: true,
                createdAt: true,
                fromShop: {
                    select: { name: true }
                },
                toShop: {
                    select: { name: true }
                },
                transferItems: {
                    select: { id: true } // Selecting id to count items
                }
            },
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            take: 5 // Limit to 5 most recent transfers
        }),
        [], // Empty array fallback
        'Failed to fetch transfers data'
    );

    // Format the data for the frontend
    const data = transfers.map(transfer => ({
        id: `TR-${String(transfer.id).padStart(3, '0')}`,
        source: transfer.fromShop.name,
        destination: transfer.toShop.name,
        status: transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1),
        date: transfer.createdAt.toISOString().split('T')[0],
        items: transfer.transferItems.length
    }));

    return {
        success: true,
        data
    };
}

// GET: Fetch recent inventory transfers
export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_dashboard');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Check cache first with shop context
        const cacheKey = `dashboard:transfers:${context.isFiltered ? context.shopId : 'all'}`;
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Transfers data served from cache');
            return NextResponse.json({
                ...cachedData,
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId,
                    fromCache: true
                }
            });
        }

        console.log('🔄 Fetching fresh transfers data with shop context:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered
        });
        const transfersResult = await fetchTransfersData(context.isFiltered ? context.shopId : null);

        // Add metadata to response
        const responseData = {
            ...transfersResult,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                fromCache: false
            }
        };

        // Cache for 2 minutes (transfers change frequently)
        await cacheService.set(cacheKey, responseData, 120);
        console.log('💾 Transfers data cached for 2 minutes');

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching transfer data:', error);
        // Return empty array instead of error, consistent with original
        return NextResponse.json({
            success: true, // Or false
            data: [],
            message: error instanceof Error ? error.message : 'Unknown error',
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId
            }
        });
    }
});