/**
 * Optimized Dashboard API Route with performance enhancements:
 * - Materialized views simulation
 * - Improved caching strategies
 * - Parallel query optimization
 * - Smart cache warming
 * - Performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchSummaryData } from '../summary/route';
import { fetchTotalRetailValueData } from '../total-retail-value/route';
import { fetchShopsData } from '../shops/route';
import { fetchInventoryDistributionData } from '../inventory/route';
import { fetchSalesData } from '../sales/route';
import { fetchTransfersData } from '../transfers/route';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';
import { PerformanceMonitor } from '@/lib/performance';
import { prisma } from '@/lib/prisma';

// Performance monitor instance
const perfMonitor = new PerformanceMonitor();

// Cache configuration for optimized dashboard
const CACHE_CONFIG = {
    // Longer TTLs for better performance
    DASHBOARD_ALL: 300, // 5 minutes
    DASHBOARD_FILTERED: 180, // 3 minutes
    MATERIALIZED_SUMMARY: 600, // 10 minutes
    QUICK_STATS: 120, // 2 minutes
};

// Materialized view simulation for frequently accessed data
interface MaterializedDashboardData {
    totalInventoryValue: number;
    totalProducts: number;
    totalShops: number;
    pendingTransfers: number;
    lastUpdated: Date;
}

// Cache key generators
function generateCacheKey(type: string, shopId?: number | null, filters?: any): string {
    const shopKey = shopId ? `shop:${shopId}` : 'all';
    const filterKey = filters ? `:${JSON.stringify(filters)}` : '';
    return `dashboard:optimized:${type}:${shopKey}${filterKey}`;
}

// Materialized view data fetcher
async function fetchMaterializedData(shopId?: number | null): Promise<MaterializedDashboardData> {
    const cacheKey = generateCacheKey('materialized', shopId);

    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch fresh data with optimized queries
    const data = await perfMonitor.measureAsync(
        'dashboard:materialized-fetch',
        async () => {
            const queries = [];

            // Total inventory value - optimized query
            queries.push(
                prisma.$queryRaw`
                    SELECT COALESCE(SUM(ii.quantity * COALESCE(ii.shopspecificcost, 0)), 0) as total_value
                    FROM "InventoryItem" ii
                    WHERE ii.quantity > 0 AND ii.shopspecificcost IS NOT NULL AND ii.shopspecificcost > 0
                    ${shopId ? prisma.$queryRaw`AND ii."shopId" = ${shopId}` : prisma.$queryRaw``}
                `.then((result: any) => Number(result[0]?.total_value || 0))
            );

            // Total products count
            queries.push(
                prisma.inventoryItem.count({
                    where: shopId ? { shopId } : undefined
                })
            );

            // Total shops count (only if not filtered by shop)
            if (!shopId) {
                queries.push(prisma.shop.count());
            } else {
                queries.push(Promise.resolve(1));
            }

            // Pending transfers count
            queries.push(
                prisma.inventoryTransfer.count({
                    where: {
                        status: 'pending',
                        ...(shopId && {
                            OR: [
                                { fromShopId: shopId },
                                { toShopId: shopId }
                            ]
                        })
                    }
                })
            );

            const [totalInventoryValue, totalProducts, totalShops, pendingTransfers] = await Promise.all(queries);

            return {
                totalInventoryValue,
                totalProducts,
                totalShops,
                pendingTransfers,
                lastUpdated: new Date()
            };
        },
        { shopId }
    );

    // Cache for longer period
    await cacheService.set(cacheKey, data, CACHE_CONFIG.MATERIALIZED_SUMMARY);

    return data;
}

// Quick stats fetcher for immediate response
async function fetchQuickStats(shopId?: number | null) {
    const cacheKey = generateCacheKey('quick-stats', shopId);

    const cached = await cacheService.get(cacheKey);
    if (cached) {
        return cached;
    }

    const stats = await perfMonitor.measureAsync(
        'dashboard:quick-stats',
        async () => {
            // Fetch only essential data for quick response
            const materializedData = await fetchMaterializedData(shopId);

            return {
                totalValue: materializedData.totalInventoryValue,
                totalProducts: materializedData.totalProducts,
                pendingTransfers: materializedData.pendingTransfers,
                lastUpdated: materializedData.lastUpdated
            };
        },
        { shopId }
    );

    await cacheService.set(cacheKey, stats, CACHE_CONFIG.QUICK_STATS);
    return stats;
}

// Optimized data fetcher with intelligent batching
async function fetchOptimizedDashboardData(
    shopId?: number | null,
    startDate?: string,
    endDate?: string,
    quickMode = false
) {
    const filters = { startDate, endDate };
    const cacheKey = generateCacheKey('full', shopId, filters);

    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
        return { ...cached, fromCache: true };
    }

    if (quickMode) {
        // Return quick stats for immediate response
        const quickStats = await fetchQuickStats(shopId);
        return {
            quickStats,
            isQuickMode: true,
            fromCache: false
        };
    }

    // Fetch full data with optimized parallel execution
    const result = await perfMonitor.measureAsync(
        'dashboard:optimized-full-fetch',
        async () => {
            // Group queries by priority for better resource utilization
            const highPriorityQueries = [
                fetchSummaryData(shopId),
                fetchTransfersData(shopId)
            ];

            const mediumPriorityQueries = [
                fetchTotalRetailValueData(shopId),
                fetchShopsData(shopId)
            ];

            const lowPriorityQueries = [
                fetchInventoryDistributionData(shopId),
                fetchSalesData(shopId)
            ];

            // Execute high priority queries first
            console.time('high-priority-queries');
            const [summaryResult, transfersResult] = await Promise.all(highPriorityQueries);
            console.timeEnd('high-priority-queries');

            // Execute medium priority queries
            console.time('medium-priority-queries');
            const [totalRetailValueResult, shopsResult] = await Promise.all(mediumPriorityQueries);
            console.timeEnd('medium-priority-queries');

            // Execute low priority queries
            console.time('low-priority-queries');
            const [inventoryResult, salesResult] = await Promise.all(lowPriorityQueries);
            console.timeEnd('low-priority-queries');

            // Merge total retail value into summary data
            if (summaryResult.success && summaryResult.data && totalRetailValueResult.success) {
                summaryResult.data = summaryResult.data.map(item => {
                    if (item.title === 'Total Retail Value') {
                        return {
                            ...item,
                            value: totalRetailValueResult.formattedValue,
                            trend: totalRetailValueResult.trend,
                            trendUp: totalRetailValueResult.trendUp
                        };
                    }
                    return item;
                });
            }

            return {
                success: true,
                summaryData: summaryResult.success ? summaryResult.data : null,
                shopPerformance: shopsResult.success ? shopsResult.data : null,
                inventoryDistribution: inventoryResult.success ? inventoryResult.data : null,
                monthlySales: salesResult.success ? salesResult.data : null,
                recentTransfers: transfersResult.success ? transfersResult.data : null,
                errors: [
                    !summaryResult.success ? 'Failed to fetch summary data' : null,
                    !totalRetailValueResult.success ? 'Failed to fetch total retail value' : null,
                    !shopsResult.success ? 'Failed to fetch shops data' : null,
                    !inventoryResult.success ? 'Failed to fetch inventory data' : null,
                    !salesResult.success ? 'Failed to fetch sales data' : null,
                    !transfersResult.success ? 'Failed to fetch transfers data' : null,
                ].filter(e => e !== null),
                fromCache: false
            };
        },
        { shopId, filters }
    );

    // Cache with appropriate TTL
    const ttl = startDate || endDate ? CACHE_CONFIG.DASHBOARD_FILTERED : CACHE_CONFIG.DASHBOARD_ALL;
    await cacheService.set(cacheKey, result, ttl);

    return result;
}

// Cache warming function
async function warmCache(shopId?: number | null) {
    const warmupPromises = [];

    // Warm up materialized data
    warmupPromises.push(fetchMaterializedData(shopId));

    // Warm up quick stats
    warmupPromises.push(fetchQuickStats(shopId));

    // Warm up common time periods
    const commonPeriods = [
        { days: 7 },
        { days: 30 },
        { months: 3 }
    ];

    commonPeriods.forEach(period => {
        const now = new Date();
        const endDate = now.toISOString().split('T')[0];
        let startDate: string;

        if ('days' in period) {
            startDate = new Date(now.setDate(now.getDate() - period.days)).toISOString().split('T')[0];
        } else {
            startDate = new Date(now.setMonth(now.getMonth() - period.months)).toISOString().split('T')[0];
        }

        warmupPromises.push(
            fetchOptimizedDashboardData(shopId, startDate, endDate).catch(() => { })
        );
    });

    await Promise.allSettled(warmupPromises);
}

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_dashboard');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const quickMode = searchParams.get('quick') === 'true';
        const warmup = searchParams.get('warmup') === 'true';

        const shopId = context.isFiltered ? context.shopId : null;

        // Handle cache warming request
        if (warmup) {
            await warmCache(shopId);
            return NextResponse.json({
                success: true,
                message: 'Cache warmed successfully',
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId
                }
            });
        }

        console.log('🚀 Fetching optimized dashboard data:', {
            shopId,
            isFiltered: context.isFiltered,
            startDate,
            endDate,
            quickMode
        });

        const result = await fetchOptimizedDashboardData(shopId, startDate, endDate, quickMode);

        // Start cache warming in background for next requests
        if (!result.fromCache) {
            setImmediate(() => {
                warmCache(shopId).catch(console.error);
            });
        }

        return NextResponse.json({
            ...result,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                optimized: true,
                quickMode,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error in optimized dashboard API:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load optimized dashboard data',
                error: error instanceof Error ? error.message : String(error),
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId,
                    optimized: true
                }
            },
            { status: 500 }
        );
    }
});

// Cache invalidation endpoint
export const DELETE = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        const authResult = await validateTokenPermission(request, 'manage_dashboard');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        const shopId = context.isFiltered ? context.shopId : null;
        const pattern = `dashboard:optimized:*${shopId ? `:shop:${shopId}` : ''}*`;

        await cacheService.invalidatePattern(pattern);

        return NextResponse.json({
            success: true,
            message: 'Dashboard cache invalidated successfully',
            pattern
        });
    } catch (error) {
        console.error('Error invalidating dashboard cache:', error);
        return NextResponse.json(
            { error: 'Failed to invalidate cache' },
            { status: 500 }
        );
    }
});