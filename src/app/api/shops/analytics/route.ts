import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch analytics data for all shops
export async function GET(request: NextRequest) {
    try {
        // Get query parameters
        const url = new URL(request.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const shopId = url.searchParams.get('shopId');

        // Parse dates
        const startDateTime = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDateTime = endDate ? new Date(endDate) : new Date();

        // Build filter conditions
        const whereCondition: any = {
            createdAt: {
                gte: startDateTime,
                lte: endDateTime
            }
        };

        if (shopId) {
            whereCondition.shopId = shopId;
        }

        // Get all shops
        const shops = await prisma.shop.findMany({
            where: shopId ? { id: shopId } : undefined,
            select: {
                id: true,
                name: true,
                location: true,
                is_active: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Get inventory data
        const inventoryByShop = await Promise.all(
            shops.map(async (shop) => {
                const items = await prisma.inventoryItem.findMany({
                    where: {
                        shopId: shop.id
                    }
                });

                return {
                    shopId: shop.id,
                    totalItems: items.length,
                    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
                };
            })
        );

        // Get sales data (from invoices)
        const salesByShop: { shopId: number, total: number }[] = [];

        // Combine data
        const shopAnalytics = shops.map(shop => {
            const inventoryData = inventoryByShop.find(item => item.shopId === shop.id);
            const salesData = salesByShop.find(item => item.shopId === shop.id);

            return {
                ...shop,
                totalInventory: inventoryData?.totalItems || 0,
                totalSales: salesData?.total || 0,
                inventoryValue: 0, // To be calculated in a real implementation with product prices
                performanceMetrics: {
                    inventoryTurnover: 0, // Calculated as COGS / Average Inventory
                    salesGrowth: 0, // Calculated based on previous period
                    avgTicketSize: 0 // Average sale amount
                }
            };
        });

        return NextResponse.json({
            success: true,
            data: shopAnalytics,
            timeRange: {
                startDate: startDateTime,
                endDate: endDateTime
            }
        });
    } catch (error) {
        console.error('Error fetching shop analytics:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch shop analytics' },
            { status: 500 }
        );
    }
}