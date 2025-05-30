import { NextRequest, NextResponse } from 'next/server';
import { fetchSummaryDataFiltered } from '../summary/route';
import { fetchShopsDataFiltered } from '../shops/route';
import { fetchInventoryDistributionData } from '../inventory/route';
import { fetchSalesDataFiltered } from '../sales/route';
import { fetchTransfersDataFiltered } from '../transfers/route';
import { cacheService } from '@/lib/cache';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Create cache key based on date parameters
        const cacheKey = `dashboard:filtered:${startDate || 'null'}:${endDate || 'null'}`;

        // Check cache first
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            console.log('✅ Filtered dashboard data served from cache');
            return NextResponse.json(cachedData);
        }

        console.log('🔄 Fetching fresh filtered dashboard data', { startDate, endDate });

        // Fetch all dashboard data with date filtering
        const [
            summaryResult,
            shopsResult,
            inventoryResult,
            salesResult,
            transfersResult
        ] = await Promise.all([
            fetchSummaryDataFiltered(startDate, endDate),
            fetchShopsDataFiltered(startDate, endDate),
            fetchInventoryDistributionData(), // Inventory distribution doesn't need date filtering
            fetchSalesDataFiltered(startDate, endDate),
            fetchTransfersDataFiltered(startDate, endDate)
        ]);

        const responseData = {
            success: true,
            summaryData: summaryResult.success ? summaryResult.data : null,
            shopPerformance: shopsResult.success ? shopsResult.data : null,
            inventoryDistribution: inventoryResult.success ? inventoryResult.data : null,
            monthlySales: salesResult.success ? salesResult.data : null,
            recentTransfers: transfersResult.success ? transfersResult.data : null,
            errors: [
                !summaryResult.success ? 'Failed to fetch summary data' : null,
                !shopsResult.success ? 'Failed to fetch shops data' : null,
                !inventoryResult.success ? 'Failed to fetch inventory data' : null,
                !salesResult.success ? 'Failed to fetch sales data' : null,
                !transfersResult.success ? 'Failed to fetch transfers data' : null,
            ].filter(e => e !== null)
        };

        // Cache the response for 2 minutes
        await cacheService.set(cacheKey, responseData, 120);
        console.log('💾 Filtered dashboard data cached for 2 minutes');

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Error fetching filtered dashboard data:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch filtered dashboard data',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}