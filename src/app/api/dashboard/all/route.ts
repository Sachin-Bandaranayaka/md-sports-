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

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_dashboard');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Check cache first with shop context
        const cacheKey = `dashboard:all:${context.isFiltered ? context.shopId : 'all'}`;
        console.time('cache check');
        const cachedData = await cacheService.get(cacheKey);
        console.timeEnd('cache check');

        if (cachedData) {
            console.log('✅ Dashboard data served from cache');
            return NextResponse.json({
                ...cachedData,
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId,
                    fromCache: true
                }
            });
        }

        console.log('🔄 Fetching fresh dashboard data with shop context:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered
        });

        const shopId = context.isFiltered ? context.shopId : null;

        console.time('fetchSummaryData');
        const p1 = fetchSummaryData(shopId).finally(() => console.timeEnd('fetchSummaryData'));

        console.time('fetchTotalRetailValueData');
        const p2 = fetchTotalRetailValueData(shopId).finally(() => console.timeEnd('fetchTotalRetailValueData'));

        console.time('fetchShopsData');
        const p3 = fetchShopsData(shopId).finally(() => console.timeEnd('fetchShopsData'));

        console.time('fetchInventoryDistributionData');
        const p4 = fetchInventoryDistributionData(shopId).finally(() => console.timeEnd('fetchInventoryDistributionData'));

        console.time('fetchSalesData');
        const p5 = fetchSalesData(shopId).finally(() => console.timeEnd('fetchSalesData'));

        console.time('fetchTransfersData');
        const p6 = fetchTransfersData(shopId).finally(() => console.timeEnd('fetchTransfersData'));

        console.time('Promise.all dashboard data');
        const [
            summaryResult,
            totalRetailValueResult,
            shopsResult,
            inventoryResult,
            salesResult,
            transfersResult
        ] = await Promise.all([p1, p2, p3, p4, p5, p6]);
        console.timeEnd('Promise.all dashboard data');

        // The summaryData expects totalRetailValue to be part of its structure.
        // Let's merge it here.
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

        const responseData = {
            success: true, // Overall success
            summaryData: summaryResult.success ? summaryResult.data : null,
            // totalRetailValue: totalRetailValueResult.success ? totalRetailValueResult : null, // No longer needed separately
            shopPerformance: shopsResult.success ? shopsResult.data : null,
            inventoryDistribution: inventoryResult.success ? inventoryResult.data : null,
            monthlySales: salesResult.success ? salesResult.data : null,
            recentTransfers: transfersResult.success ? transfersResult.data : null,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                fromCache: false
            },
            // You might want to include individual success statuses or error messages if needed
            errors: [
                !summaryResult.success ? 'Failed to fetch summary data' : null,
                !totalRetailValueResult.success ? 'Failed to fetch total retail value' : null,
                !shopsResult.success ? 'Failed to fetch shops data' : null,
                !inventoryResult.success ? 'Failed to fetch inventory data' : null,
                !salesResult.success ? 'Failed to fetch sales data' : null,
                !transfersResult.success ? 'Failed to fetch transfers data' : null,
            ].filter(e => e !== null)
        };

        // Cache the response for 2 minutes
        console.time('cache set');
        await cacheService.set(cacheKey, responseData, 120);
        console.timeEnd('cache set');
        console.log('💾 Dashboard data cached for 2 minutes');

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Error fetching all dashboard data:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load all dashboard data',
                error: error instanceof Error ? error.message : String(error),
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId
                }
            },
            { status: 500 }
        );
    }
});