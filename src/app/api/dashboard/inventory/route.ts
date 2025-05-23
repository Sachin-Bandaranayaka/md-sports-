import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

// GET: Fetch inventory distribution by category or product name if no categories exist
export async function GET() {
    try {
        // First try to get inventory by category
        const categories = await safeQuery(
            () => prisma.category.findMany({
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
        let inventoryByCategoryMap = categories.map(category => {
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
        inventoryByCategoryMap = inventoryByCategoryMap
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // If we have category data, return it
        if (inventoryByCategoryMap.length > 0) {
            return NextResponse.json({
                success: true,
                data: inventoryByCategoryMap
            });
        }

        // If we don't have category data, group by product name instead
        const products = await safeQuery(
            () => prisma.product.findMany({
                include: {
                    inventoryItems: true
                }
            }),
            [], // Empty array fallback
            'Failed to fetch product data'
        );

        const inventoryByProductMap = products.map(product => {
            // Sum up quantities for this product across all inventory items
            const totalQuantity = product.inventoryItems.reduce(
                (sum, item) => sum + item.quantity,
                0
            );

            return {
                name: product.name,
                value: totalQuantity
            };
        });

        // Filter out products with zero inventory
        const data = inventoryByProductMap
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching inventory distribution data:', error);

        // Return empty data in case of error
        return NextResponse.json({
            success: false,
            message: 'Error fetching inventory distribution data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 