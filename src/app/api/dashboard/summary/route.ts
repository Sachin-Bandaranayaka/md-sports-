import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission, getUserIdFromToken } from '@/lib/auth';
import { permissionService } from '@/lib/services/PermissionService';
import { withApiOptimization } from '@/lib/middleware/api-optimizer';

export async function fetchSummaryData(shopId?: string | null, periodDays?: number, startDate?: Date, endDate?: Date, userId?: string | null) {
    // Build date filter for queries
    const dateFilter: any = {};
    if (startDate && endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter.gte = startDate;
        dateFilter.lte = endOfDay;
    } else if (periodDays) {
        const now = new Date();
        dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - periodDays);
    }
    
    // Build where clauses
    const shopFilter = shopId ? { shopId } : {};
    const shopFilterForOR = shopId ? [{ fromShopId: shopId }, { toShopId: shopId }] : [];

    // 1. Calculate Total Inventory Value (does not use date filtering)
    const totalValueResult = await safeQuery<Array<{ totalinventoryvalue: bigint | number | null }>>(
        () => prisma.$queryRaw`
                SELECT SUM(COALESCE(i.shopspecificcost, 0) * i.quantity) as "totalinventoryvalue"
                FROM "InventoryItem" i
                WHERE i.quantity > 0 AND i.shopspecificcost IS NOT NULL AND i.shopspecificcost > 0
                ${shopId ? Prisma.sql`AND i."shopId" = ${shopId}` : Prisma.empty}
        `,
        [{ totalinventoryvalue: 0 }],
        'Failed to calculate total inventory value via raw query'
    );
    const totalValue = Number(totalValueResult[0]?.totalinventoryvalue || 0);

    // 2. Count Pending Transfers
    const pendingTransfersResult = await safeQuery(
        () => prisma.inventoryTransfer.count({
            where: {
                status: 'pending',
                ...(shopFilterForOR.length > 0 && { OR: shopFilterForOR }),
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
            }
        }),
        0,
        'Failed to count pending transfers'
    );

    // 3. Calculate Outstanding Invoices
    const outstandingInvoicesResult = await safeQuery(
        () => prisma.invoice.aggregate({
            where: {
                status: { in: ['pending', 'overdue'] },
                ...shopFilter,
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
                ...(userId ? { createdBy: userId } : {})
            },
            _sum: { total: true }
        }),
        { _sum: { total: 0 } },
        'Failed to calculate outstanding invoices'
    );

    // 4. Count Low Stock Items
    const lowStockItemsResult = await safeQuery(
        () => prisma.inventoryItem.count({
            where: {
                ...shopFilter,
                quantity: { lte: 10 }, // Using hardcoded value to fix complex query issue
            }
        }),
        0,
        'Failed to count low stock items'
    );

    // 5. Calculate Total Profit
    const totalProfitResult = await safeQuery(
        () => prisma.invoice.aggregate({
            where: {
                ...shopFilter,
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
                ...(userId ? { createdBy: userId } : {})
            },
            _sum: { totalProfit: true }
        }),
        { _sum: { totalProfit: 0 } },
        'Failed to calculate total profit'
    );
    
    // NOTE: Trends are placeholders
    const getRandomTrend = (isPercentage = true) => {
        const randomValue = Math.random() * 10 - 5;
        const formatted = isPercentage
            ? `${randomValue >= 0 ? '+' : ''}${randomValue.toFixed(1)}%`
            : `${randomValue >= 0 ? '+' : ''}${Math.floor(randomValue)}`;
        return { trend: formatted, trendUp: randomValue >= 0 };
    };

    const summaryData = [
        {
            title: 'Total Inventory Value',
            value: `Rs. ${totalValue.toLocaleString()}`,
            icon: 'Package',
            ...getRandomTrend(true)
        },
        {
            title: 'Total Profit',
            value: `Rs. ${(totalProfitResult._sum.totalProfit || 0).toLocaleString()}`,
            icon: 'TrendingUp',
            ...getRandomTrend(true)
        },
        {
            title: 'Pending Transfers',
            value: pendingTransfersResult.toString(),
            icon: 'Truck',
            ...getRandomTrend(false)
        },
        {
            title: 'Outstanding Invoices',
            value: `Rs. ${(outstandingInvoicesResult._sum.total || 0).toLocaleString()}`,
            icon: 'CreditCard',
            ...getRandomTrend(true)
        },
        {
            title: 'Low Stock Items',
            value: lowStockItemsResult.toString(),
            icon: 'AlertTriangle',
            ...getRandomTrend(false)
        }
    ];

    return {
        success: true,
        data: summaryData
    };
}

// Original handler function
async function dashboardSummaryHandler(request: NextRequest) {
    return ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
        try {
            // Validate token and permissions
            const authResult = await validateTokenPermission(request, 'dashboard:view');
            if (!authResult.isValid) {
                return NextResponse.json({ error: authResult.message }, { status: 401 });
            }

            const { searchParams } = new URL(request.url);
            const startDateParam = searchParams.get('startDate');
            const endDateParam = searchParams.get('endDate');
            
            const shopId = context.isFiltered ? context.shopId : null;

            const endDate = endDateParam ? new Date(endDateParam) : new Date();
            const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            // Get user ID from token
            const userId = await getUserIdFromToken(request);
            if (!userId) {
                return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
            }
            
            // NOTE: User-specific filtering for summary data not fully implemented in cache key yet.
            const dateRangeKey = `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
            const cacheKey = `dashboard:summary:${shopId || 'all'}:${dateRangeKey}`;
            const cachedData = await cacheService.get(cacheKey);

            if (cachedData) {
                console.log('✅ Summary data served from cache');
                return NextResponse.json({ ...cachedData, meta: { fromCache: true } });
            }

            const result = await fetchSummaryData(shopId, undefined, startDate, endDate, userId);

            if (result.success) {
                await cacheService.set(cacheKey, result, 120);
            }

            return NextResponse.json({ ...result, meta: { fromCache: false } });

        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            return NextResponse.json({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            }, { status: 500 });
        }
    })(request);
}

// Apply API optimization middleware
export const GET = withApiOptimization(dashboardSummaryHandler, {
    cacheTTL: 300, // 5 minutes cache
    enableCompression: true,
    enableCaching: true
});