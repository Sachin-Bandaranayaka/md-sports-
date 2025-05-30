import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

export async function fetchInventoryDistributionData() {
    // Get all categories
    const categories = await safeQuery(
        () => prisma.category.findMany(),
        [], // Empty array fallback
        'Failed to fetch categories'
    );

    // Get all inventory items with their products and categories
    const inventoryItems = await safeQuery(
        () => prisma.inventoryItem.findMany({
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
export async function GET() {
    try {
        // Check cache first
        const cacheKey = 'dashboard:inventory';
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Inventory data served from cache');
            return NextResponse.json(cachedData);
        }

        console.log('🔄 Fetching fresh inventory data');
        const inventoryResult = await fetchInventoryDistributionData();

        // Cache for 3 minutes (inventory changes moderately)
        await cacheService.set(cacheKey, inventoryResult, 180);
        console.log('💾 Inventory data cached for 3 minutes');

        return NextResponse.json(inventoryResult);
    } catch (error) {
        console.error('Error fetching inventory distribution:', error);
        // Return empty array on error, consistent with original logic
        return NextResponse.json({
            success: true, // Or false, depending on desired error signaling
            data: [],
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}