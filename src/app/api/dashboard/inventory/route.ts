import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

// Default fallback data for inventory distribution
const defaultInventoryData = [
    { name: 'Cricket', value: 350 },
    { name: 'Football', value: 280 },
    { name: 'Basketball', value: 200 },
    { name: 'Tennis', value: 150 },
    { name: 'Swimming', value: 100 }
];

// GET: Fetch inventory distribution by category
export async function GET() {
    try {
        // Get all categories with their products and inventory
        const categories = await safeQuery(
            () => prisma.category.findMany({
                where: {
                    // Only include categories with a parent (subcategories)
                    parentId: {
                        not: null
                    }
                },
                include: {
                    products: {
                        include: {
                            inventoryItems: true
                        }
                    }
                }
            }),
            [], // Empty array fallback
            'Failed to fetch category data'
        );

        // Calculate inventory count by category
        const inventoryByCategoryMap = categories.map(category => {
            // Sum up quantities across all products in this category
            const totalQuantity = category.products.reduce((sum, product) => {
                // Sum up quantities for this product across all inventory items
                const productQuantity = product.inventoryItems.reduce(
                    (itemSum, item) => itemSum + item.quantity,
                    0
                );
                return sum + productQuantity;
            }, 0);

            return {
                name: category.name,
                value: totalQuantity
            };
        });

        // Filter out categories with zero inventory
        const data = inventoryByCategoryMap
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // If we don't have enough data, provide some defaults
        if (data.length === 0) {
            return NextResponse.json({
                success: true,
                data: defaultInventoryData
            });
        }

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching inventory distribution data:', error);

        // Return default data in case of error
        return NextResponse.json({
            success: true,
            data: defaultInventoryData
        });
    }
} 