import { NextRequest, NextResponse } from 'next/server';
import { fetchSummaryData } from '../summary/route';
import { fetchTotalRetailValueData } from '../total-retail-value/route';
import { fetchShopsData } from '../shops/route';
import { fetchInventoryDistributionData } from '../inventory/route';
import { fetchSalesData } from '../sales/route';
import { fetchTransfersData } from '../transfers/route';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission, getUserIdFromToken } from '@/lib/auth';
import { prisma, safeQuery } from '@/lib/prisma';
import { permissionService } from '@/lib/services/PermissionService';

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_dashboard');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Extract date range from query parameters
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        
        // Default to last 7 days if no dates provided
        const endDate = endDateParam ? new Date(endDateParam) : new Date();
        const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        // Calculate period days for backward compatibility with existing functions
        const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Validate period parameter
        if (![7, 30].includes(periodDays)) {
            return NextResponse.json({ 
                success: false, 
                message: 'Invalid period. Must be 7 or 30 days.' 
            }, { status: 400 });
        }

        // Create cache key based on shop and date range
        const dateRangeKey = `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
        const cacheKey = `dashboard:all:${context.isFiltered ? context.shopId : 'all'}:${dateRangeKey}`;
        console.time('cache check');
        const cachedData = await cacheService.get(cacheKey);
        console.timeEnd('cache check');

        if (cachedData) {
            console.log('✅ Dashboard data served from cache for period:', periodDays, 'days');
            return NextResponse.json({
                ...cachedData,
                meta: {
                    ...cachedData.meta,
                    period: periodDays,
                    fromCache: true
                }
            });
        }

        console.log('🔄 Fetching fresh dashboard data with shop context and period:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered,
            period: periodDays
        });

        const shopId = context.isFiltered ? context.shopId : null;

        // Get user ID from token
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
        }

        // Fetch user details to check role and permissions
        const user = await safeQuery(
            () => prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    roleName: true,
                    permissions: true
                }
            }),
            null,
            'Failed to fetch user details'
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user is admin or has admin permissions
        const isAdmin = user.roleName === 'Admin' || user.roleName === 'Super Admin' || 
                       await permissionService.hasPermission(user, 'admin:all') || 
                       await permissionService.hasPermission(user, 'ALL');

        // Determine user filtering
        let filterUserId: string | null = null;
        if (!isAdmin) {
            filterUserId = userId;
        }

        console.time('Promise.all dashboard data');
        const [
            summaryResult,
            totalRetailValueResult,
            shopsResult,
            inventoryResult,
            salesResult,
            transfersResult
        ] = await Promise.all([
             fetchSummaryData(context.shopId, periodDays, startDate, endDate, filterUserId),
             fetchTotalRetailValueData(context.shopId, periodDays, startDate, endDate),
             fetchShopsData(context.shopId, periodDays, startDate, endDate),
             fetchInventoryDistributionData(context.shopId, periodDays, startDate, endDate),
             fetchSalesData(context.shopId, periodDays, startDate, endDate, filterUserId),
             fetchTransfersData(context.shopId, periodDays, startDate, endDate)
         ]);
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
                period: periodDays,
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

        // Cache the response for 2 minutes with period-specific key
        console.time('cache set');
        await cacheService.set(cacheKey, responseData, 120);
        console.timeEnd('cache set');
        console.log('💾 Dashboard data cached for 2 minutes with date range:', dateRangeKey);

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