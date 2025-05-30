import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

// Extracted function to fetch dashboard summary data
export async function fetchSummaryData() {
    // 1. Calculate Total Inventory Value using Prisma Raw Query
    console.time('calculateInventoryValueRaw');
    const totalValueResult = await safeQuery<Array<{ totalinventoryvalue: bigint | number | null }>>(
        () => prisma.$queryRaw`
            SELECT SUM(p.weightedaveragecost * i.quantity) as "totalinventoryvalue"
            FROM "InventoryItem" i
            JOIN "Product" p ON i."productId" = p.id
            WHERE i.quantity > 0 AND p.weightedaveragecost IS NOT NULL AND p.weightedaveragecost > 0;
        `,
        [{ totalinventoryvalue: 0n }], // Fallback with BigInt 0
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

    // 3. Count pending transfers (remains the same)
    console.time('countPendingTransfers');
    const pendingTransfers = await safeQuery(
        () => prisma.inventoryTransfer.count({
            where: { status: 'pending' }
        }),
        0,
        'Failed to count pending transfers'
    );
    console.timeEnd('countPendingTransfers');

    // 4. Calculate Outstanding Invoices Value & Trend (remains the same)
    console.time('calculateOutstandingInvoices');
    const outstandingInvoices = await safeQuery(
        () => prisma.invoice.aggregate({
            where: { status: { not: 'Paid' } },
            _sum: { total: true }
        }),
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
            () => prisma.invoice.aggregate({
                where: {
                    status: { not: 'Paid' },
                    createdAt: { gte: previousMonthStart, lte: previousMonthEnd }
                },
                _sum: { total: true }
            }),
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

    // 5. Count Low Stock Items (remains the same)
    console.time('countLowStockItems');
    const lowStockItems = await safeQuery(
        () => prisma.inventoryItem.count({
            where: { quantity: { lte: 10 } }
        }),
        0,
        'Failed to count low stock items'
    );
    console.timeEnd('countLowStockItems');

    const formattedValue = totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const data = [
        { title: 'Total Inventory Value', value: `Rs. ${formattedValue}`, icon: 'Package', trend: inventoryTrendData.trend, trendUp: inventoryTrendData.trendUp },
        { title: 'Total Retail Value', value: 'Loading...', icon: 'Tag', trend: '+0%', trendUp: false },
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
        [{ totalinventoryvalue: 0n }],
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

    const summaryData = [
        {
            title: 'Total Inventory Value',
            value: `Rs. ${totalValue.toLocaleString()}`,
            icon: 'Package',
            trend: inventoryTrend.trend,
            trendUp: inventoryTrend.trendUp
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

export async function GET() {
    try {
        // Check cache first
        const cacheKey = 'dashboard:summary';
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Summary data served from cache');
            return NextResponse.json(cachedData);
        }

        console.log('🔄 Fetching fresh summary data');
        console.time('fetchSummaryDataOverall');
        const summaryResult = await fetchSummaryData();
        console.timeEnd('fetchSummaryDataOverall');

        // Cache for 1 minute (summary data changes frequently)
        await cacheService.set(cacheKey, summaryResult, 60);
        console.log('💾 Summary data cached for 1 minute');

        return NextResponse.json(summaryResult);
    } catch (error) {
        console.error('Error fetching dashboard summary data:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching dashboard summary data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}