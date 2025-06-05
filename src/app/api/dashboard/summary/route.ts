import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';

// Extracted function to fetch dashboard summary data
export async function fetchSummaryData(shopId?: string | null, periodDays?: number, startDate?: Date, endDate?: Date) {
    // 1. Calculate Total Inventory Value using Prisma Raw Query
    console.time('calculateInventoryValueRaw');
    const totalValueResult = await safeQuery<Array<{ totalinventoryvalue: bigint | number | null }>>(
        () => {
            if (shopId) {
                return prisma.$queryRaw`
                    SELECT SUM(p.weightedaveragecost * i.quantity) as "totalinventoryvalue"
                    FROM "InventoryItem" i
                    JOIN "Product" p ON i."productId" = p.id
                    WHERE i.quantity > 0 AND p.weightedaveragecost IS NOT NULL AND p.weightedaveragecost > 0
                    AND i."shopId" = ${shopId};
                `;
            } else {
                return prisma.$queryRaw`
                    SELECT SUM(p.weightedaveragecost * i.quantity) as "totalinventoryvalue"
                    FROM "InventoryItem" i
                    JOIN "Product" p ON i."productId" = p.id
                    WHERE i.quantity > 0 AND p.weightedaveragecost IS NOT NULL AND p.weightedaveragecost > 0;
                `;
            }
        },
        [{ totalinventoryvalue: 0 }], // Fallback with regular number 0
        'Failed to calculate total inventory value via raw query'
    );
    console.timeEnd('calculateInventoryValueRaw');

    // Ensure totalValue is a number. Result from raw query might be BigInt.
    let totalValue: number = 0;
    if (totalValueResult && totalValueResult[0] && totalValueResult[0].totalinventoryvalue !== null) {
        totalValue = Number(totalValueResult[0].totalinventoryvalue);
    }
    console.log(`Calculated total inventory value (as number): ${totalValue}`);

    // 2. Generate Random Trends (remains the same)
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
    const inventoryTrendData = getRandomTrend(true);
    const transfersTrendData = getRandomTrend(false);
    const lowStockTrendData = getRandomTrend(false);

    // 3. Count pending transfers with shop filtering and optional date filtering
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

    // 4. Calculate Outstanding Invoices Value & Trend with shop filtering
    console.time('calculateOutstandingInvoices');
    const outstandingInvoices = await safeQuery(
        () => {
            const where: any = { status: { not: 'Paid' } };
            if (shopId) {
                where.shopId = shopId;
            }
            return prisma.invoice.aggregate({
                where,
                _sum: { total: true }
            });
        },
        { _sum: { total: null } },
        'Failed to calculate outstanding invoices'
    );
    const totalOutstanding = outstandingInvoices._sum.total || 0;

    let invoiceTrend = '0%';
    let invoiceTrendUp = false;
    if (totalOutstanding > 0) {
        const previousMonthStart = new Date();
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
        previousMonthStart.setDate(1);
        previousMonthStart.setHours(0, 0, 0, 0);
        const previousMonthEnd = new Date();
        previousMonthEnd.setDate(0);
        previousMonthEnd.setHours(23, 59, 59, 999);

        const previousMonthInvoices = await safeQuery(
            () => {
                const where: any = {
                    status: { not: 'Paid' },
                    createdAt: { gte: previousMonthStart, lte: previousMonthEnd }
                };
                if (shopId) {
                    where.shopId = shopId;
                }
                return prisma.invoice.aggregate({
                    where,
                    _sum: { total: true }
                });
            },
            { _sum: { total: null } },
            'Failed to calculate previous month invoices'
        );
        const previousTotal = previousMonthInvoices._sum.total || 0;
        if (previousTotal > 0) {
            const percentChange = ((totalOutstanding - previousTotal) / previousTotal) * 100;
            invoiceTrend = `${percentChange > 0 ? '+' : ''}${Math.round(percentChange)}%`;
            invoiceTrendUp = percentChange > 0;
        } else if (totalOutstanding > 0) {
            invoiceTrend = '+100%';
            invoiceTrendUp = true;
        }
    }
    console.timeEnd('calculateOutstandingInvoices');

    // 5. Count Low Stock Items with shop filtering
    console.time('countLowStockItems');
    const lowStockItems = await safeQuery(
        () => {
            const where: any = { quantity: { lte: 10 } };
            if (shopId) {
                where.shopId = shopId;
            }
            return prisma.inventoryItem.count({ where });
        },
        0,
        'Failed to count low stock items'
    );
    console.timeEnd('countLowStockItems');

    const formattedValue = totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // 6. Calculate Total Profit from Invoices with shop filtering and optional date filtering
    console.time('calculateTotalProfit');
    const totalProfitResult = await safeQuery(
        () => {
            const where: any = {};
            if (shopId) {
                where.shopId = shopId;
            }
            // Add date filtering if periodDays is provided
            if (periodDays) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - periodDays);
                startDate.setHours(0, 0, 0, 0);
                where.createdAt = { gte: startDate };
            }
            return prisma.invoice.aggregate({
                where,
                _sum: { totalProfit: true }
            });
        },
        { _sum: { totalProfit: null } },
        'Failed to calculate total profit'
    );
    const totalProfit = totalProfitResult._sum.totalProfit || 0;

    // Calculate profit trend (comparing with previous month)
    let profitTrend = '0%';
    let profitTrendUp = false;
    if (totalProfit > 0) {
        const previousMonthStart = new Date();
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
        previousMonthStart.setDate(1);
        previousMonthStart.setHours(0, 0, 0, 0);
        const previousMonthEnd = new Date();
        previousMonthEnd.setDate(0);
        previousMonthEnd.setHours(23, 59, 59, 999);

        const previousMonthProfit = await safeQuery(
            () => {
                const where: any = {
                    createdAt: { gte: previousMonthStart, lte: previousMonthEnd }
                };
                if (shopId) {
                    where.shopId = shopId;
                }
                return prisma.invoice.aggregate({
                    where,
                    _sum: { totalProfit: true }
                });
            },
            { _sum: { totalProfit: null } },
            'Failed to calculate previous month profit'
        );
        const previousTotal = previousMonthProfit._sum.totalProfit || 0;
        if (previousTotal > 0) {
            const percentChange = ((totalProfit - previousTotal) / previousTotal) * 100;
            profitTrend = `${percentChange > 0 ? '+' : ''}${Math.round(percentChange)}%`;
            profitTrendUp = percentChange > 0;
        } else if (totalProfit > 0) {
            profitTrend = '+100%';
            profitTrendUp = true;
        }
    }
    console.timeEnd('calculateTotalProfit');

    const data = [
        { title: 'Total Inventory Value', value: `Rs. ${formattedValue}`, icon: 'Package', trend: inventoryTrendData.trend, trendUp: inventoryTrendData.trendUp },
        { title: 'Total Retail Value', value: 'Loading...', icon: 'Tag', trend: '+0%', trendUp: false },
        { title: 'Total Profit', value: `Rs. ${Number(totalProfit).toLocaleString()}`, icon: 'TrendingUp', trend: profitTrend, trendUp: profitTrendUp },
        { title: 'Pending Transfers', value: `${pendingTransfers}`, icon: 'Truck', trend: transfersTrendData.trend, trendUp: transfersTrendData.trendUp },
        { title: 'Outstanding Invoices', value: `Rs. ${Number(totalOutstanding).toLocaleString()}`, icon: 'CreditCard', trend: invoiceTrend, trendUp: invoiceTrendUp },
        { title: 'Low Stock Items', value: `${lowStockItems}`, icon: 'AlertTriangle', trend: lowStockTrendData.trend, trendUp: lowStockTrendData.trendUp },
    ];

    return {
        success: true,
        data,
        debug: {
            calculatedValueViaRaw: totalValue
        }
    };
}

// GET: Fetch dashboard summary statistics
// Filtered version of fetchSummaryData with date range support
export async function fetchSummaryDataFiltered(startDate?: string | null, endDate?: string | null) {
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

    // 1. Calculate Total Inventory Value (same as original - inventory doesn't need date filtering)
    console.time('calculateInventoryValueRaw');
    const totalValueResult = await safeQuery<Array<{ totalinventoryvalue: bigint | number | null }>>(
        () => prisma.$queryRaw`
            SELECT SUM(p.weightedaveragecost * i.quantity) as "totalinventoryvalue"
            FROM "InventoryItem" i
            JOIN "Product" p ON i."productId" = p.id
            WHERE i.quantity > 0 AND p.weightedaveragecost IS NOT NULL AND p.weightedaveragecost > 0;
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
                status: 'Pending',
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
                status: { in: ['Pending', 'Overdue'] },
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
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
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
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

        // Check cache first with shop context and period
        const cacheKey = `dashboard:summary:${context.isFiltered ? context.shopId : 'all'}:${periodDays || 'all'}`;
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

        console.log('🔄 Fetching fresh summary data with shop context:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered,
            periodDays
        });
        console.time('fetchSummaryDataOverall');
        const summaryResult = await fetchSummaryData(context.isFiltered ? context.shopId : null, periodDays);
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