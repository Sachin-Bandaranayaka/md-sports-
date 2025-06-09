import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission, getUserIdFromToken } from '@/lib/auth';

// Extracted function to fetch dashboard summary data
export async function fetchSummaryData(shopId?: string | null, periodDays?: number, startDate?: Date, endDate?: Date, userId?: string | null) {
    // Generate trend data for transfers
    const getRandomTrend = (isPercentage = true) => {
        const randomValue = Math.random() * 10 - 5;
        const formatted = isPercentage
            ? `${randomValue > 0 ? '+' : ''}${randomValue.toFixed(1)}%`
            : `${randomValue > 0 ? '+' : ''}${Math.round(randomValue)}`;
        return {
            trend: formatted,
            trendUp: randomValue >= 0
        };
    };
    const transfersTrendData = getRandomTrend(false);

    // Count pending transfers with shop filtering and optional date filtering
    console.time('countPendingTransfers');
    const pendingTransfers = await safeQuery(
        () => {
            const where: any = { status: 'pending' };
            if (shopId) {
                where.OR = [
                    { fromShopId: shopId },
                    { toShopId: shopId }
                ];
            }
            // Add date filtering if periodDays is provided
            if (periodDays) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - periodDays);
                startDate.setHours(0, 0, 0, 0);
                where.createdAt = { gte: startDate };
            }
            return prisma.inventoryTransfer.count({ where });
        },
        0,
        'Failed to count pending transfers'
    );
    console.timeEnd('countPendingTransfers');





    const data = [
        { title: 'Pending Transfers', value: `${pendingTransfers}`, icon: 'Truck', trend: transfersTrendData.trend, trendUp: transfersTrendData.trendUp },
    ];

    return {
        success: true,
        data,
        debug: {
            pendingTransfersCount: pendingTransfers
        }
    };
}

// GET: Fetch dashboard summary statistics
// Filtered version of fetchSummaryData with date range support
export async function fetchSummaryDataFiltered(startDate?: string | null, endDate?: string | null, userId?: string | null) {
    // Build date filter for queries
    const dateFilter: any = {};
    if (startDate) {
        dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
        // Set end date to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.lte = endDateTime;
    }

    // 1. Calculate Total Inventory Value using shop-specific cost (inventory doesn't need date filtering)
    console.time('calculateInventoryValueRaw');
    const totalValueResult = await safeQuery<Array<{ totalinventoryvalue: bigint | number | null }>>(
        () => prisma.$queryRaw`
                SELECT SUM(COALESCE(i.shopspecificcost, 0) * i.quantity) as "totalinventoryvalue"
                FROM "InventoryItem" i
                WHERE i.quantity > 0 AND i.shopspecificcost IS NOT NULL AND i.shopspecificcost > 0;
        `,
        [{ totalinventoryvalue: 0 }],
        'Failed to calculate total inventory value via raw query'
    );
    console.timeEnd('calculateInventoryValueRaw');

    let totalValue: number = 0;
    if (totalValueResult && totalValueResult[0] && totalValueResult[0].totalinventoryvalue !== null) {
        totalValue = Number(totalValueResult[0].totalinventoryvalue);
    }

    // 2. Count Pending Transfers with date filter
    console.time('countPendingTransfers');
    const pendingTransfersResult = await safeQuery(
        () => prisma.inventoryTransfer.count({
            where: {
                status: 'pending',
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
            }
        }),
        0,
        'Failed to count pending transfers'
    );
    console.timeEnd('countPendingTransfers');

    // 3. Calculate Outstanding Invoices with date filter
    console.time('calculateOutstandingInvoices');
    const outstandingInvoicesResult = await safeQuery(
        () => prisma.invoice.aggregate({
            where: {
                status: { in: ['pending', 'overdue'] },
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
                ...(userId ? { createdBy: userId } : {})
            },
            _sum: { total: true }
        }),
        { _sum: { total: 0 } },
        'Failed to calculate outstanding invoices'
    );
    console.timeEnd('calculateOutstandingInvoices');

    // 4. Count Low Stock Items (same as original - doesn't need date filtering)
    console.time('countLowStockItems');
    const lowStockItemsResult = await safeQuery(
        () => prisma.inventoryItem.count({
            where: {
                quantity: { lte: 10 }
            }
        }),
        0,
        'Failed to count low stock items'
    );
    console.timeEnd('countLowStockItems');

    // Generate random trends
    const getRandomTrend = (isPercentage = true) => {
        const randomValue = Math.random() * 10 - 5;
        const formatted = isPercentage
            ? `${randomValue >= 0 ? '+' : ''}${randomValue.toFixed(1)}%`
            : `${randomValue >= 0 ? '+' : ''}${Math.floor(randomValue)}`;
        return {
            trend: formatted,
            trendUp: randomValue >= 0
        };
    };

    const inventoryTrend = getRandomTrend(true);
    const transfersTrend = getRandomTrend(false);
    const invoicesTrend = getRandomTrend(true);
    const stockTrend = getRandomTrend(false);

    // 5. Calculate Total Profit with date filter (including all invoices, not just paid ones)
    console.time('calculateTotalProfit');
    const totalProfitResult = await safeQuery(
        () => prisma.invoice.aggregate({
            where: {
                // Removed status filter to include all invoices (paid and unpaid)
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
                ...(userId ? { createdBy: userId } : {})
            },
            _sum: { totalProfit: true }
        }),
        { _sum: { totalProfit: 0 } },
        'Failed to calculate total profit'
    );
    console.timeEnd('calculateTotalProfit');

    const profitTrend = getRandomTrend(true);

    const summaryData = [
        {
            title: 'Total Inventory Value',
            value: `Rs. ${totalValue.toLocaleString()}`,
            icon: 'Package',
            trend: inventoryTrend.trend,
            trendUp: inventoryTrend.trendUp
        },
        {
            title: 'Total Profit',
            value: `Rs. ${(totalProfitResult._sum.totalProfit || 0).toLocaleString()}`,
            icon: 'TrendingUp',
            trend: profitTrend.trend,
            trendUp: profitTrend.trendUp
        },
        {
            title: 'Pending Transfers',
            value: pendingTransfersResult.toString(),
            icon: 'Truck',
            trend: transfersTrend.trend,
            trendUp: transfersTrend.trendUp
        },
        {
            title: 'Outstanding Invoices',
            value: `Rs. ${(outstandingInvoicesResult._sum.total || 0).toLocaleString()}`,
            icon: 'CreditCard',
            trend: invoicesTrend.trend,
            trendUp: invoicesTrend.trendUp
        },
        {
            title: 'Low Stock Items',
            value: lowStockItemsResult.toString(),
            icon: 'AlertTriangle',
            trend: stockTrend.trend,
            trendUp: stockTrend.trendUp
        }
    ];

    return {
        success: true,
        data: summaryData
    };
}

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_dashboard');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Extract period parameter from URL
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period');
        let periodDays: number | undefined;
        
        if (period) {
            const parsedPeriod = parseInt(period);
            if (parsedPeriod === 7 || parsedPeriod === 30) {
                periodDays = parsedPeriod;
            }
        }

        // Get user ID from token for cache key
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
        }

        // Fetch user details to check role and permissions
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                roleName: true,
                permissions: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user is admin or has admin permissions
        const isAdmin = user.roleName === 'Admin' || user.roleName === 'Super Admin' || 
                       (user.permissions && user.permissions.includes('admin:all'));

        // Check cache first with shop context, period, and user context
        const userContext = isAdmin ? 'admin' : userId;
        const cacheKey = `dashboard:summary:${context.isFiltered ? context.shopId : 'all'}:${periodDays || 'all'}:user:${userContext}`;
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Summary data served from cache');
            return NextResponse.json({
                ...cachedData,
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId,
                    fromCache: true
                }
            });
        }

        // Determine if user-specific filtering is needed
        const filterUserId = isAdmin ? null : userId;

        // Fetch summary data with user filtering

        console.log('🔄 Fetching fresh summary data with shop context:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered,
            periodDays,
            userId: userId,
            userRole: user.roleName,
            filterUserId: filterUserId
        });
        console.time('fetchSummaryDataOverall');
        const summaryResult = await fetchSummaryData(
            context.isFiltered ? context.shopId : null, 
            periodDays, 
            undefined, 
            undefined, 
            filterUserId
        );
        console.timeEnd('fetchSummaryDataOverall');

        // Add metadata to response
        const responseData = {
            ...summaryResult,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                fromCache: false
            }
        };

        // Cache for 1 minute (summary data changes frequently)
        await cacheService.set(cacheKey, responseData, 60);
        console.log('💾 Summary data cached for 1 minute');

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching dashboard summary data:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching dashboard summary data',
            error: error instanceof Error ? error.message : String(error),
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId
            }
        }, { status: 500 });
    }
});