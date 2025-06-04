/**
 * Cache Warming Script for Dashboard Performance
 * 
 * This script preloads frequently accessed dashboard data into cache
 * to improve initial load times and reduce database load.
 */

import { cache } from '@/lib/cache';
import { PerformanceMonitor } from '@/lib/performance';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const monitor = new PerformanceMonitor();

// Cache warming configuration
const CACHE_WARMING_CONFIG = {
    // How often to run cache warming (in milliseconds)
    interval: 10 * 60 * 1000, // 10 minutes

    // Which data types to warm
    dataTypes: {
        summary: true,
        shops: true,
        inventoryDistribution: true,
        salesPerformance: true,
        transferActivity: true,
        totalRetailValue: true
    },

    // Shop IDs to warm (empty array means all shops)
    shopIds: [] as string[],

    // Time periods to warm
    timePeriods: ['7d', '30d', '90d', 'ytd'] as const
};

type TimePeriod = typeof CACHE_WARMING_CONFIG.timePeriods[number];

/**
 * Get date range for a time period
 */
function getDateRange(period: TimePeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
        case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
        case 'ytd':
            startDate.setMonth(0, 1); // January 1st of current year
            break;
    }

    return { startDate, endDate };
}

/**
 * Warm summary data cache
 */
async function warmSummaryCache(shopId?: string): Promise<void> {
    const cacheKey = shopId ? `dashboard:summary:${shopId}` : 'dashboard:summary:global';

    try {
        const timer = monitor.startTimer('cache-warm-summary');

        // Use materialized view if available, otherwise fallback to regular query
        const summaryData = await prisma.$queryRaw`
            SELECT 
                total_inventory_value,
                pending_transfers,
                outstanding_invoices
            FROM dashboard_summary_mv 
            WHERE scope = ${shopId ? 'shop' : 'global'}
            ${shopId ? prisma.$queryRaw`AND shop_id = ${shopId}` : prisma.$queryRaw`AND shop_id IS NULL`}
            LIMIT 1
        `;

        await cache.set(cacheKey, summaryData, 300); // 5 minutes TTL
        monitor.endTimer(timer);

        console.log(`✓ Warmed summary cache: ${cacheKey}`);
    } catch (error) {
        console.error(`✗ Failed to warm summary cache: ${cacheKey}`, error);
    }
}

/**
 * Warm shops data cache
 */
async function warmShopsCache(): Promise<void> {
    const cacheKey = 'dashboard:shops';

    try {
        const timer = monitor.startTimer('cache-warm-shops');

        const shops = await prisma.shop.findMany({
            select: {
                id: true,
                name: true,
                location: true,
                isActive: true
            },
            where: {
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        await cache.set(cacheKey, shops, 600); // 10 minutes TTL
        monitor.endTimer(timer);

        console.log(`✓ Warmed shops cache: ${shops.length} shops`);
    } catch (error) {
        console.error('✗ Failed to warm shops cache', error);
    }
}

/**
 * Warm inventory distribution cache
 */
async function warmInventoryDistributionCache(shopId?: string): Promise<void> {
    const cacheKey = shopId ? `dashboard:inventory:${shopId}` : 'dashboard:inventory:global';

    try {
        const timer = monitor.startTimer('cache-warm-inventory');

        const distributionData = await prisma.$queryRaw`
            SELECT 
                category,
                SUM(item_count) as item_count,
                SUM(total_quantity) as total_quantity,
                SUM(total_value) as total_value
            FROM inventory_distribution_mv
            ${shopId ? prisma.$queryRaw`WHERE "shopId" = ${shopId}` : prisma.$queryRaw``}
            GROUP BY category
            ORDER BY total_value DESC
        `;

        await cache.set(cacheKey, distributionData, 300); // 5 minutes TTL
        monitor.endTimer(timer);

        console.log(`✓ Warmed inventory distribution cache: ${cacheKey}`);
    } catch (error) {
        console.error(`✗ Failed to warm inventory distribution cache: ${cacheKey}`, error);
    }
}

/**
 * Warm sales performance cache
 */
async function warmSalesPerformanceCache(period: TimePeriod, shopId?: string): Promise<void> {
    const cacheKey = shopId
        ? `dashboard:sales:${period}:${shopId}`
        : `dashboard:sales:${period}:global`;

    try {
        const timer = monitor.startTimer('cache-warm-sales');
        const { startDate, endDate } = getDateRange(period);

        const salesData = await prisma.$queryRaw`
            SELECT 
                sale_date,
                SUM(transaction_count) as transaction_count,
                SUM(total_sales) as total_sales,
                AVG(avg_transaction_value) as avg_transaction_value
            FROM sales_performance_mv
            WHERE sale_date >= ${startDate} AND sale_date <= ${endDate}
            ${shopId ? prisma.$queryRaw`AND "shopId" = ${shopId}` : prisma.$queryRaw``}
            GROUP BY sale_date
            ORDER BY sale_date DESC
        `;

        await cache.set(cacheKey, salesData, 300); // 5 minutes TTL
        monitor.endTimer(timer);

        console.log(`✓ Warmed sales performance cache: ${cacheKey}`);
    } catch (error) {
        console.error(`✗ Failed to warm sales performance cache: ${cacheKey}`, error);
    }
}

/**
 * Warm transfer activity cache
 */
async function warmTransferActivityCache(shopId?: string): Promise<void> {
    const cacheKey = shopId ? `dashboard:transfers:${shopId}` : 'dashboard:transfers:global';

    try {
        const timer = monitor.startTimer('cache-warm-transfers');

        const transferData = await prisma.$queryRaw`
            SELECT 
                direction,
                transfer_date,
                SUM(transfer_count) as transfer_count,
                SUM(total_quantity) as total_quantity
            FROM transfer_activity_mv
            WHERE transfer_date >= CURRENT_DATE - INTERVAL '30 days'
            ${shopId ? prisma.$queryRaw`AND shop_id = ${shopId}` : prisma.$queryRaw``}
            GROUP BY direction, transfer_date
            ORDER BY transfer_date DESC
        `;

        await cache.set(cacheKey, transferData, 300); // 5 minutes TTL
        monitor.endTimer(timer);

        console.log(`✓ Warmed transfer activity cache: ${cacheKey}`);
    } catch (error) {
        console.error(`✗ Failed to warm transfer activity cache: ${cacheKey}`, error);
    }
}

/**
 * Warm total retail value cache
 */
async function warmTotalRetailValueCache(shopId?: string): Promise<void> {
    const cacheKey = shopId ? `dashboard:retail-value:${shopId}` : 'dashboard:retail-value:global';

    try {
        const timer = monitor.startTimer('cache-warm-retail-value');

        const retailValue = await prisma.inventoryItem.aggregate({
            _sum: {
                quantity: true
            },
            where: shopId ? {
                shopId: shopId
            } : undefined
        });

        // Calculate total retail value (simplified calculation)
        const totalRetailValue = {
            totalQuantity: retailValue._sum.quantity || 0,
            estimatedRetailValue: (retailValue._sum.quantity || 0) * 25 // Rough estimate
        };

        await cache.set(cacheKey, totalRetailValue, 300); // 5 minutes TTL
        monitor.endTimer(timer);

        console.log(`✓ Warmed total retail value cache: ${cacheKey}`);
    } catch (error) {
        console.error(`✗ Failed to warm total retail value cache: ${cacheKey}`, error);
    }
}

/**
 * Get list of shop IDs to warm
 */
async function getShopIdsToWarm(): Promise<string[]> {
    if (CACHE_WARMING_CONFIG.shopIds.length > 0) {
        return CACHE_WARMING_CONFIG.shopIds;
    }

    // Get all active shop IDs
    const shops = await prisma.shop.findMany({
        select: { id: true },
        where: { isActive: true }
    });

    return shops.map(shop => shop.id);
}

/**
 * Warm all dashboard caches
 */
export async function warmDashboardCaches(): Promise<void> {
    console.log('🔥 Starting dashboard cache warming...');
    const overallTimer = monitor.startTimer('cache-warm-all');

    try {
        // Get shop IDs to warm
        const shopIds = await getShopIdsToWarm();

        // Warm global data
        const globalPromises: Promise<void>[] = [];

        if (CACHE_WARMING_CONFIG.dataTypes.summary) {
            globalPromises.push(warmSummaryCache());
        }

        if (CACHE_WARMING_CONFIG.dataTypes.shops) {
            globalPromises.push(warmShopsCache());
        }

        if (CACHE_WARMING_CONFIG.dataTypes.inventoryDistribution) {
            globalPromises.push(warmInventoryDistributionCache());
        }

        if (CACHE_WARMING_CONFIG.dataTypes.transferActivity) {
            globalPromises.push(warmTransferActivityCache());
        }

        if (CACHE_WARMING_CONFIG.dataTypes.totalRetailValue) {
            globalPromises.push(warmTotalRetailValueCache());
        }

        // Warm sales performance for different periods
        if (CACHE_WARMING_CONFIG.dataTypes.salesPerformance) {
            for (const period of CACHE_WARMING_CONFIG.timePeriods) {
                globalPromises.push(warmSalesPerformanceCache(period));
            }
        }

        // Wait for global data warming
        await Promise.allSettled(globalPromises);

        // Warm shop-specific data
        const shopPromises: Promise<void>[] = [];

        for (const shopId of shopIds) {
            if (CACHE_WARMING_CONFIG.dataTypes.summary) {
                shopPromises.push(warmSummaryCache(shopId));
            }

            if (CACHE_WARMING_CONFIG.dataTypes.inventoryDistribution) {
                shopPromises.push(warmInventoryDistributionCache(shopId));
            }

            if (CACHE_WARMING_CONFIG.dataTypes.transferActivity) {
                shopPromises.push(warmTransferActivityCache(shopId));
            }

            if (CACHE_WARMING_CONFIG.dataTypes.totalRetailValue) {
                shopPromises.push(warmTotalRetailValueCache(shopId));
            }

            // Warm sales performance for different periods
            if (CACHE_WARMING_CONFIG.dataTypes.salesPerformance) {
                for (const period of CACHE_WARMING_CONFIG.timePeriods) {
                    shopPromises.push(warmSalesPerformanceCache(period, shopId));
                }
            }
        }

        // Wait for shop-specific data warming
        await Promise.allSettled(shopPromises);

        monitor.endTimer(overallTimer);
        console.log(`🎉 Dashboard cache warming completed for ${shopIds.length} shops`);

    } catch (error) {
        monitor.endTimer(overallTimer);
        console.error('❌ Dashboard cache warming failed:', error);
        throw error;
    }
}

/**
 * Start automatic cache warming
 */
export function startCacheWarming(): void {
    console.log(`🚀 Starting automatic cache warming every ${CACHE_WARMING_CONFIG.interval / 1000 / 60} minutes`);

    // Initial warming
    warmDashboardCaches().catch(console.error);

    // Schedule periodic warming
    setInterval(() => {
        warmDashboardCaches().catch(console.error);
    }, CACHE_WARMING_CONFIG.interval);
}

/**
 * CLI interface for manual cache warming
 */
if (require.main === module) {
    const command = process.argv[2];

    switch (command) {
        case 'warm':
            warmDashboardCaches()
                .then(() => {
                    console.log('✅ Cache warming completed');
                    process.exit(0);
                })
                .catch((error) => {
                    console.error('❌ Cache warming failed:', error);
                    process.exit(1);
                });
            break;

        case 'start':
            startCacheWarming();
            break;

        default:
            console.log('Usage:');
            console.log('  npm run cache-warm        # Warm caches once');
            console.log('  npm run cache-warm start  # Start automatic warming');
            break;
    }
}