import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

// GET: Fetch inventory distribution by category
export async function GET() {
    try {
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

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching inventory distribution:', error);
        return NextResponse.json({
            success: true,
            data: [] // Return empty array on error
        });
    }
} 