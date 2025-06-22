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

export async function fetchTransfersData(shopId?: string | null, periodDays?: number, startDate?: Date, endDate?: Date) {
    // Build where clause for shop and date filtering
    const whereClause: any = {};
    
    // Add shop filtering
    if (shopId) {
        whereClause.OR = [
            { fromShopId: shopId },
            { toShopId: shopId }
        ];
    }
    
    // Add date filtering based on provided dates
    if (startDate && endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause.createdAt = {
            gte: startDate,
            lte: endOfDay
        };
    } else if (periodDays) { // Fallback to periodDays if dates not provided
        const calculatedStartDate = new Date();
        calculatedStartDate.setDate(calculatedStartDate.getDate() - periodDays);
        calculatedStartDate.setHours(0, 0, 0, 0);
        
        whereClause.createdAt = {
            gte: calculatedStartDate
        };
    }

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
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            orderBy: {
                createdAt: 'desc'
            },
            take: 10 // Show more transfers when filtering by date
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

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_transfers');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const shopId = context.isFiltered ? context.shopId : null;
        
        // Determine date range
        const endDate = endDateParam ? new Date(endDateParam) : new Date();
        const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Check cache first with shop context and date range
        const dateRangeKey = `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
        const cacheKey = `dashboard:transfers:${shopId || 'all'}:${dateRangeKey}`;
        
        console.time('cache check');
        const cachedData = await cacheService.get(cacheKey);
        console.timeEnd('cache check');

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
            shopId: shopId,
            isFiltered: context.isFiltered,
            startDate,
            endDate
        });

        // Fetch transfers data with date filtering
        const result = await fetchTransfersData(shopId, undefined, startDate, endDate);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to fetch transfers data',
                    data: [],
                    meta: {
                        shopFiltered: context.isFiltered,
                        shopId: context.shopId
                    }
                },
                { status: 500 }
            );
        }

        const responseData = {
            success: true,
            data: result.data,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                fromCache: false
            }
        };

        // Cache the response for 2 minutes
        console.time('cache set');
        await cacheService.set(cacheKey, responseData, 120);
        console.timeEnd('cache set');
        console.log('💾 Transfers data cached for 2 minutes');

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Error fetching transfers data:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load transfers data',
                error: error instanceof Error ? error.message : String(error),
                data: [], // Return empty array on error
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId
                }
            },
            { status: 500 }
        );
    }
});