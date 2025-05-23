import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Compare multiple shops
export async function GET(request: NextRequest) {
    try {
        // Get query parameters
        const url = new URL(request.url);
        const shopIdsParam = url.searchParams.get('shopIds');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        if (!shopIdsParam) {
            return NextResponse.json({
                success: false,
                message: 'Shop IDs are required for comparison'
            }, { status: 400 });
        }

        // Parse shop IDs
        const shopIds = shopIdsParam.split(',').map(id => parseInt(id));

        // Parse dates
        const startDateTime = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDateTime = endDate ? new Date(endDate) : new Date();

        // Get shops data
        const shops = await prisma.shop.findMany({
            where: {
                id: {
                    in: shopIds
                }
            },
            include: {
                inventoryItems: true
            }
        });

        if (shops.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No shops found with the provided IDs'
            }, { status: 404 });
        }

        // Get inventory data
        const inventoryByShop = await Promise.all(
            shops.map(async (shop) => {
                const items = await prisma.inventoryItem.findMany({
                    where: {
                        shopId: shop.id
                    },
                    include: {
                        product: true
                    }
                });

                return {
                    shopId: shop.id,
                    totalItems: items.length,
                    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
                };
            })
        );

        // Prepare comparison data
        const comparisonData = shops.map(shop => {
            const inventoryData = inventoryByShop.find(item => item.shopId === shop.id);

            return {
                id: shop.id,
                name: shop.name,
                location: shop.location,
                is_active: shop.is_active,
                metrics: {
                    inventoryCount: inventoryData?.totalQuantity || 0,
                    totalProducts: shop.inventoryItems.length,
                    sales: 0, // To be calculated with real data
                    revenue: 0, // To be calculated with real data
                    averageTicketSize: 0, // To be calculated with real data
                    customerCount: 0, // To be calculated with real data
                }
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                shops: comparisonData,
                timeRange: {
                    startDate: startDateTime,
                    endDate: endDateTime
                }
            }
        });
    } catch (error) {
        console.error('Error comparing shops:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to compare shops' },
            { status: 500 }
        );
    }
} 