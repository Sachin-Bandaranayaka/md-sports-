import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';

export async function fetchInventoryDistributionData(shopId?: string | null, periodDays?: number, startDate?: Date, endDate?: Date) {
    // Get all categories
    const categories = await safeQuery(
        () => prisma.category.findMany(),
        [], // Empty array fallback
        'Failed to fetch categories'
    );

    // Get inventory items with their products and categories, with optional shop filtering
    const inventoryItems = await safeQuery(
        () => prisma.inventoryItem.findMany({
            where: shopId ? { shopId } : {},
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        }),
        [], // Empty array fallback
        'Failed to fetch inventory items'
    );

    // Create a map of category ID to aggregate data
    const categoryMap = new Map();

    // Initialize the map with all categories (including those with no inventory)
    categories.forEach(category => {
        categoryMap.set(category.id, {
            name: category.name,
            value: 0 // Start with zero
        });
    });

    // Aggregate items by category
    inventoryItems.forEach(item => {
        if (item.product && item.product.category) {
            const categoryId = item.product.categoryId;
            const categoryData = categoryMap.get(categoryId) || {
                name: item.product.category.name,
                value: 0
            };

            // Increment the count for this category
            categoryData.value += item.quantity;
            categoryMap.set(categoryId, categoryData);
        }
    });

    // Convert the map to an array
    const data = Array.from(categoryMap.values())
        // Filter out categories with no items
        .filter(category => category.value > 0)
        // Sort by count (highest first)
        .sort((a, b) => b.value - a.value);

    return {
        success: true,
        data
    };
}

// GET: Fetch inventory distribution by category
export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'dashboard:view');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Check cache first with shop context
        const cacheKey = `dashboard:inventory:${context.isFiltered ? context.shopId : 'all'}`;
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Inventory data served from cache');
            return NextResponse.json({
                ...cachedData,
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId,
                    fromCache: true
                }
            });
        }

        console.log('🔄 Fetching fresh inventory data with shop context:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered
        });
        const inventoryResult = await fetchInventoryDistributionData(context.isFiltered ? context.shopId : null);

        // Add metadata to response
        const responseData = {
            ...inventoryResult,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                fromCache: false
            }
        };

        // Cache for 3 minutes (inventory changes moderately)
        await cacheService.set(cacheKey, responseData, 180);
        console.log('💾 Inventory data cached for 3 minutes');

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching inventory distribution:', error);
        // Return empty array on error, consistent with original logic
        return NextResponse.json({
            success: true, // Or false, depending on desired error signaling
            data: [],
            message: error instanceof Error ? error.message : 'Unknown error',
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId
            }
        });
    }
});