import { NextRequest, NextResponse } from 'next/server';
import { fetchInventoryData } from '../inventory/route';
import { fetchProductsData } from '../products/route';
import { fetchCustomersData } from '../customers/route';
import { fetchSalesDataFiltered } from '../sales/route';
import { fetchShopsData } from '../shops/route';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_dashboard');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        console.log('🔄 Fetching filtered dashboard data with date range and shop context:', {
            startDate,
            endDate,
            shopId: context.shopId,
            isFiltered: context.isFiltered
        });

        // Fetch all data in parallel with shop context
        const [
            inventoryResult,
            productsResult,
            customersResult,
            salesResult,
            shopsResult
        ] = await Promise.all([
            fetchInventoryData(context.isFiltered ? context.shopId : null),
            fetchProductsData(context.isFiltered ? context.shopId : null),
            fetchCustomersData(context.isFiltered ? context.shopId : null),
            fetchSalesDataFiltered(startDate, endDate, context.isFiltered ? context.shopId : null),
            fetchShopsData(context.isFiltered ? context.shopId : null)
        ]);

        console.log('✅ All filtered dashboard data fetched successfully');

        return NextResponse.json({
            success: true,
            data: {
                monthlyInventory: inventoryResult.success ? inventoryResult.data : null,
                monthlyProducts: productsResult.success ? productsResult.data : null,
                monthlyCustomers: customersResult.success ? customersResult.data : null,
                monthlySales: salesResult.success ? salesResult.data : null,
                monthlyShops: shopsResult.success ? shopsResult.data : null
            },
            dateRange: { startDate, endDate },
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId
            },
            errors: [
                !inventoryResult.success ? 'Failed to fetch inventory data' : null,
                !productsResult.success ? 'Failed to fetch products data' : null,
                !customersResult.success ? 'Failed to fetch customers data' : null,
                !salesResult.success ? 'Failed to fetch sales data' : null,
                !shopsResult.success ? 'Failed to fetch shops data' : null
            ].filter(Boolean)
        });
    } catch (error) {
        console.error('❌ Error in filtered dashboard API:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch filtered dashboard data',
            error: error instanceof Error ? error.message : String(error),
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId
            }
        }, { status: 500 });
    }
});