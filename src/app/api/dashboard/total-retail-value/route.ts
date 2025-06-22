import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';

export async function fetchTotalRetailValueData(shopId?: string | null) {
    // Get inventory items with optional shop filtering
    const inventoryItems = await prisma.inventoryItem.findMany({
        where: shopId ? { shopId } : {}
    });

    // Get all products to access their retail prices
    const productIds = inventoryItems.map(item => item.productId);
    const products = await prisma.product.findMany({
        where: {
            id: {
                in: productIds
            }
        },
        select: {
            id: true,
            name: true,
            price: true  // This is the retail price
        }
    });

    // Create a map of product ID to product data for easy lookup
    const productMap = new Map();
    products.forEach(product => {
        productMap.set(product.id, product);
    });

    // Calculate total retail value
    let totalRetailValue = 0;
    
    // Process each inventory item
    inventoryItems.forEach(item => {
        const product = productMap.get(item.productId);
        if (product && item.quantity > 0) {
            const retailPrice = product.price || 0;
            const itemRetailValue = retailPrice * item.quantity;
            totalRetailValue += itemRetailValue;
        }
    });

    // NOTE: Trend calculation is a placeholder as historical data is not available.
    // For demo purposes, let's assume previous value was 5% less
    const previousPeriodValue = totalRetailValue * 0.95;

    // Calculate trend
    const difference = totalRetailValue - previousPeriodValue;
    // Handle division by zero if previousPeriodValue is 0
    const percentChange = previousPeriodValue === 0 ? (totalRetailValue > 0 ? 100 : 0) : (difference / previousPeriodValue) * 100;

    // Format the value for display
    const formattedValue = `Rs. ${totalRetailValue.toLocaleString()}`;

    return {
        success: true,
        formattedValue,
        rawValue: totalRetailValue,
        trend: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(0)}%`,
        trendUp: percentChange >= 0
    };
}

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'dashboard:view');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        const shopId = context.isFiltered ? context.shopId : null;

        // Check cache first with shop context.
        // This metric is current, so it doesn't depend on a date range.
        const cacheKey = `dashboard:total-retail-value:${shopId || 'all'}`;
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Total retail value served from cache');
            return NextResponse.json({
                ...cachedData,
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId,
                    fromCache: true
                }
            });
        }

        console.log('🔄 Fetching fresh total retail value with shop context:', {
            shopId: shopId,
            isFiltered: context.isFiltered
        });
        const retailValueData = await fetchTotalRetailValueData(shopId);

        // Add metadata to response
        const responseData = {
            ...retailValueData,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                fromCache: false
            }
        };

        // Cache for 3 minutes (retail value changes moderately)
        await cacheService.set(cacheKey, responseData, 180);
        console.log('💾 Total retail value cached for 3 minutes');

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error calculating total retail value:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to calculate total retail value',
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId
            }
        }, { status: 500 });
    }
});