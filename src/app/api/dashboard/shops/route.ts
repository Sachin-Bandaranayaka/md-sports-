import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

// Default fallback data for shops
const defaultShopsData = [
    { name: 'Colombo Shop', sales: 125000, stock: 450 },
    { name: 'Kandy Shop', sales: 98500, stock: 320 },
    { name: 'Galle Shop', sales: 75200, stock: 280 },
    { name: 'Jaffna Shop', sales: 62800, stock: 210 }
];

// GET: Fetch shop performance data
export async function GET() {
    try {
        // Get all shops with their inventory items
        const shops = await safeQuery(
            () => prisma.shop.findMany({
                include: {
                    inventoryItems: {
                        include: {
                            product: true
                        }
                    }
                }
            }),
            [], // Empty array as fallback
            'Failed to fetch shops data'
        );

        // Format the data as needed by the frontend
        const data = shops.map(shop => {
            // Calculate total inventory quantity for this shop
            const totalStock = shop.inventoryItems.reduce(
                (sum, item) => sum + item.quantity,
                0
            );

            // Calculate total inventory value (price * quantity) for this shop
            // This gives us a real metric based on actual data
            const totalValue = shop.inventoryItems.reduce(
                (sum, item) => {
                    const price = item.product?.price || 0;
                    return sum + (price * item.quantity);
                },
                0
            );

            return {
                name: shop.name,
                sales: totalValue, // Use inventory value as a proxy for sales
                stock: totalStock
            };
        });

        // Filter out shops with no inventory
        const shopsWithInventory = data.filter(shop => shop.stock > 0);

        // If we don't have any shops with inventory data, return empty array
        if (shopsWithInventory.length === 0) {
            return NextResponse.json({
                success: true,
                data: []
            });
        }

        return NextResponse.json({
            success: true,
            data: shopsWithInventory
        });
    } catch (error) {
        console.error('Error fetching shop performance data:', error);

        // Return empty array instead of an error
        return NextResponse.json({
            success: true,
            data: []
        });
    }
} 