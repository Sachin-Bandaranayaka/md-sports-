import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { validateTokenPermission } from '@/lib/auth';

// Interface for shop-wise metrics
interface ShopWiseMetrics {
    shopId: string;
    shopName: string;
    totalInventoryCost: number;
    totalProfit: number;
    outstandingInvoices: number;
    lowStockItems: number;
}

export async function GET(request: NextRequest) {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_dashboard');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Extract date range from query parameters
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        
        // Default to current month if no dates provided
        const endDate = endDateParam ? new Date(endDateParam) : new Date();
        const startDate = startDateParam ? new Date(startDateParam) : (() => {
            const date = new Date();
            date.setDate(date.getDate() - 30); // Default to last 30 days
            return date;
        })();

        console.log('Fetching shop-wise metrics for date range:', { startDate, endDate });

        // 1. Get all active shops
        const shops = await safeQuery(
            () => prisma.shop.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true
                }
            }),
            [],
            'Failed to fetch shops'
        );

        if (!shops || shops.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'No active shops found'
            });
        }

        // 2. Calculate metrics for each shop
        const shopMetrics: ShopWiseMetrics[] = await Promise.all(
            shops.map(async (shop) => {
                // Calculate total inventory cost for this shop using shop-specific cost
                const inventoryCostResult = await safeQuery<Array<{ totalinventorycost: bigint | number | null }>>(
                    () => prisma.$queryRaw`
                        SELECT SUM(COALESCE(i.shopspecificcost, 0) * i.quantity) as "totalinventorycost"
                        FROM "InventoryItem" i
                        WHERE i.quantity > 0 
                        AND i.shopspecificcost IS NOT NULL 
                        AND i.shopspecificcost > 0
                        AND i."shopId" = ${shop.id}
                    `,
                    [{ totalinventorycost: 0 }],
                    `Failed to calculate inventory cost for shop ${shop.id}`
                );

                const totalInventoryCost = inventoryCostResult && inventoryCostResult[0] && inventoryCostResult[0].totalinventorycost !== null
                    ? Number(inventoryCostResult[0].totalinventorycost)
                    : 0;

                // Calculate total profit for this shop (from invoices in the date range)
                const profitResult = await safeQuery(
                    () => prisma.invoice.aggregate({
                        where: {
                            shopId: shop.id,
                            status: { not: 'Cancelled' },
                            invoiceDate: {
                                gte: startDate,
                                lte: endDate
                            }
                        },
                        _sum: {
                            totalProfit: true
                        }
                    }),
                    { _sum: { totalProfit: null } },
                    `Failed to calculate profit for shop ${shop.id}`
                );

                const totalProfit = profitResult._sum.totalProfit || 0;

                // Calculate outstanding invoices for this shop
                const outstandingResult = await safeQuery(
                    () => prisma.invoice.aggregate({
                        where: {
                            shopId: shop.id,
                            status: { notIn: ['paid', 'cancelled', 'void'] }
                        },
                        _sum: {
                            total: true
                        }
                    }),
                    { _sum: { total: null } },
                    `Failed to calculate outstanding invoices for shop ${shop.id}`
                );

                const outstandingInvoices = outstandingResult._sum.total || 0;

                // Count low stock items for this shop (quantity <= 10)
                const lowStockCount = await safeQuery(
                    () => prisma.inventoryItem.count({
                        where: {
                            shopId: shop.id,
                            quantity: { lte: 10 }
                        }
                    }),
                    0,
                    `Failed to count low stock items for shop ${shop.id}`
                );

                return {
                    shopId: shop.id,
                    shopName: shop.name,
                    totalInventoryCost,
                    totalProfit,
                    outstandingInvoices,
                    lowStockItems: lowStockCount
                };
            })
        );

        // 3. Calculate totals across all shops
        const totals = shopMetrics.reduce(
            (acc, shop) => ({
                totalInventoryCost: acc.totalInventoryCost + shop.totalInventoryCost,
                totalProfit: acc.totalProfit + shop.totalProfit,
                outstandingInvoices: acc.outstandingInvoices + shop.outstandingInvoices,
                lowStockItems: acc.lowStockItems + shop.lowStockItems
            }),
            {
                totalInventoryCost: 0,
                totalProfit: 0,
                outstandingInvoices: 0,
                lowStockItems: 0
            }
        );

        return NextResponse.json({
            success: true,
            data: {
                shopMetrics,
                totals,
                dateRange: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            },
            meta: {
                shopsCount: shops.length,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error fetching shop-wise dashboard metrics:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch shop-wise dashboard metrics',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}