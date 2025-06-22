import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';

const prisma = new PrismaClient();

export async function fetchProductsData(shopId: number | null) {
    try {
        console.log('Fetching products data for dashboard', { shopId });

        // Get monthly product stats - how many products were created each month
        const monthlyProductsStats = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('month', "createdAt") as month,
                COUNT(*) as count
            FROM "Product"
            ${shopId ? prisma.$raw`WHERE EXISTS (
                SELECT 1 FROM "InventoryItem" 
                WHERE "InventoryItem"."productId" = "Product"."id" 
                AND "InventoryItem"."shopId" = ${shopId}
            )` : prisma.$raw``}
            GROUP BY month
            ORDER BY month ASC
            LIMIT 12
        `;

        return {
            success: true,
            data: monthlyProductsStats
        };
    } catch (error) {
        console.error('Error fetching products data for dashboard:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'dashboard:view');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        const result = await fetchProductsData(context.isFiltered ? context.shopId : null);

        return NextResponse.json({
            success: result.success,
            data: result.success ? result.data : null,
            error: result.success ? null : result.error,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId
            }
        });
    } catch (error) {
        console.error('Error in products dashboard API:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch products dashboard data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}); 