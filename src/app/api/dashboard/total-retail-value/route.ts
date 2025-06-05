import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';

export async function fetchTotalRetailValueData(shopId?: string | null, periodDays?: number) {
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
    let previousPeriodValue = 0;  // For comparison with previous period

    // Process each inventory item
    inventoryItems.forEach(item => {
        const product = productMap.get(item.productId);
        if (product && item.quantity > 0) {
            const retailPrice = product.price || 0;
            const itemRetailValue = retailPrice * item.quantity;
            totalRetailValue += itemRetailValue;
        }
    });

    // For demo purposes, let's assume previous value was 5% less
    // In a real app, you would fetch historical data
    previousPeriodValue = totalRetailValue * 0.95;

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
        const authResult = await validateTokenPermission(request, 'view_dashboard');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Extract period parameter from URL
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period');
        let periodDays: number | undefined;
        
        if (period) {
            const parsedPeriod = parseInt(period);
            if (parsedPeriod === 7 || parsedPeriod === 30) {
                periodDays = parsedPeriod;
            }
        }

        // Check cache first with shop context and period
        const cacheKey = `dashboard:total-retail-value:${context.isFiltered ? context.shopId : 'all'}:${periodDays || 'all'}`;
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
            shopId: context.shopId,
            isFiltered: context.isFiltered,
            periodDays
        });
        const retailValueData = await fetchTotalRetailValueData(context.isFiltered ? context.shopId : null, periodDays);

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