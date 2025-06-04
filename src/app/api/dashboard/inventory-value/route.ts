import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
        const cacheKey = `dashboard:inventory-value:${context.isFiltered ? context.shopId : 'all'}`;
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Inventory value served from cache');
            return NextResponse.json({
                ...cachedData,
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId,
                    fromCache: true
                }
            });
        }

        console.log('🔄 Fetching fresh inventory value with shop context:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered
        });

        // Direct SQL query to calculate inventory value with optional shop filtering
        const result = context.isFiltered && context.shopId
            ? await prisma.$queryRaw`
                SELECT SUM(i.quantity * p.weightedaveragecost) as total_value
                FROM "InventoryItem" i
                JOIN "Product" p ON i."productId" = p.id
                WHERE i."shopId" = ${context.shopId}
            `
            : await prisma.$queryRaw`
                SELECT SUM(i.quantity * p.weightedaveragecost) as total_value
                FROM "InventoryItem" i
                JOIN "Product" p ON i."productId" = p.id
            `;

        // Log the raw result
        console.log('Raw inventory value result:', result);

        // Extract the value from the result
        const totalValue = result[0]?.total_value || 0;
        console.log('Extracted total value:', totalValue);

        // Format the value
        const formattedValue = Number(totalValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        const responseData = {
            success: true,
            totalValue,
            formattedValue: `Rs. ${formattedValue}`,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                fromCache: false
            }
        };

        // Cache for 3 minutes (inventory value changes moderately)
        await cacheService.set(cacheKey, responseData, 180);
        console.log('💾 Inventory value cached for 3 minutes');

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error calculating inventory value:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to calculate inventory value',
            error: error instanceof Error ? error.message : String(error),
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId
            }
        }, { status: 500 });
    }
});