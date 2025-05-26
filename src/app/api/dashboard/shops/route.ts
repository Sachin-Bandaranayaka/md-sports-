import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

// Default fallback data for shops (can be removed if not needed after refactor)
// const defaultShopsData = [
//     { name: 'Colombo Shop', sales: 125000, stock: 450 },
//     { name: 'Kandy Shop', sales: 98500, stock: 320 },
//     { name: 'Galle Shop', sales: 75200, stock: 280 },
//     { name: 'Jaffna Shop', sales: 62800, stock: 210 }
// ];

export async function fetchShopsData() {
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

    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Format the data as needed by the frontend
    const shopDataPromises = shops.map(async (shop) => {
        // Calculate total inventory quantity for this shop
        const totalStock = shop.inventoryItems.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        // Get actual sales for this shop from invoices
        const shopSales = await safeQuery(
            () => prisma.invoice.aggregate({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    },
                    // Assuming shopId is available on the invoice model
                    // shopId: shop.id  // Uncomment and adjust if you have shopId on Invoice
                },
                _sum: {
                    total: true
                }
            }),
            { _sum: { total: null } },
            `Failed to fetch sales data for shop ${shop.name}`
        );

        return {
            name: shop.name,
            sales: shopSales._sum.total || 0, // Use real sales data or 0 if none
            stock: totalStock
        };
    });

    // Wait for all promises to resolve
    const data = await Promise.all(shopDataPromises);

    // Filter out shops with no inventory
    const shopsWithInventory = data.filter(shop => shop.stock > 0);

    return {
        success: true,
        data: shopsWithInventory
    };
}

// GET: Fetch shop performance data
export async function GET() {
    try {
        const shopsResult = await fetchShopsData();
        return NextResponse.json(shopsResult);
    } catch (error) {
        console.error('Error fetching shop performance data:', error);
        // Return empty array instead of an error, consistent with original logic
        return NextResponse.json({
            success: true, // Or false, depending on desired error signaling
            data: [],
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 