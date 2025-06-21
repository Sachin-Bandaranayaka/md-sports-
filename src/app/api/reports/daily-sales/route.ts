import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');
        
        // Use provided date or default to today
        const targetDate = dateParam ? new Date(dateParam) : new Date();
        
        // Set to start and end of the day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get all shops
        const shops = await prisma.shop.findMany({
            select: {
                id: true,
                name: true,
                location: true
            }
        });

        // Get daily sales data for each shop
        const shopSalesData = await Promise.all(
            shops.map(async (shop) => {
                // Get aggregated sales data for the shop (all invoices)
                const salesAggregate = await prisma.invoice.aggregate({
                    _sum: {
                        total: true,
                    },
                    _count: {
                        id: true,
                    },
                    where: {
                        shopId: shop.id,
                        createdAt: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                        // Remove status filter to include all invoices
                    },
                });

                // Get status-specific aggregates
                const paidAggregate = await prisma.invoice.aggregate({
                    _sum: { total: true },
                    _count: { id: true },
                    where: {
                        shopId: shop.id,
                        createdAt: { gte: startOfDay, lte: endOfDay },
                        status: 'paid',
                    },
                });

                const pendingAggregate = await prisma.invoice.aggregate({
                    _sum: { total: true },
                    _count: { id: true },
                    where: {
                        shopId: shop.id,
                        createdAt: { gte: startOfDay, lte: endOfDay },
                        status: 'pending',
                    },
                });

                const partialAggregate = await prisma.invoice.aggregate({
                    _sum: { total: true },
                    _count: { id: true },
                    where: {
                        shopId: shop.id,
                        createdAt: { gte: startOfDay, lte: endOfDay },
                        status: 'partial',
                    },
                });

                // Get detailed invoice data for the shop (all statuses)
                const invoices = await prisma.invoice.findMany({
                    where: {
                        shopId: shop.id,
                        createdAt: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                        // Remove status filter to include all invoices
                    },
                    include: {
                        customer: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        },
                        items: {
                            include: {
                                product: {
                                    select: {
                                        name: true,
                                        sku: true,
                                        category: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });

                // Calculate total quantity sold
                const totalQuantity = invoices.reduce((total, invoice) => {
                    return total + invoice.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
                }, 0);

                return {
                    shopId: shop.id,
                    shopName: shop.name,
                    location: shop.location,
                    totalSales: salesAggregate._sum.total || 0,
                    numberOfInvoices: salesAggregate._count.id || 0,
                    totalQuantitySold: totalQuantity,
                    averageTransactionValue: salesAggregate._count.id > 0 
                        ? (salesAggregate._sum.total || 0) / salesAggregate._count.id 
                        : 0,
                    // Status breakdown
                    paidSales: paidAggregate._sum.total || 0,
                    paidInvoices: paidAggregate._count.id || 0,
                    pendingSales: pendingAggregate._sum.total || 0,
                    pendingInvoices: pendingAggregate._count.id || 0,
                    partialSales: partialAggregate._sum.total || 0,
                    partialInvoices: partialAggregate._count.id || 0,
                    invoices: invoices
                };
            })
        );

        // Calculate overall totals
        const overallTotals = shopSalesData.reduce(
            (totals, shop) => ({
                totalSales: totals.totalSales + shop.totalSales,
                totalInvoices: totals.totalInvoices + shop.numberOfInvoices,
                totalQuantity: totals.totalQuantity + shop.totalQuantitySold
            }),
            { totalSales: 0, totalInvoices: 0, totalQuantity: 0 }
        );

        return NextResponse.json({
            success: true,
            reportDate: targetDate.toISOString().split('T')[0],
            summary: {
                date: targetDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                totalSales: overallTotals.totalSales,
                totalInvoices: overallTotals.totalInvoices,
                totalQuantitySold: overallTotals.totalQuantity,
                numberOfShops: shops.length,
                averagePerShop: shops.length > 0 ? overallTotals.totalSales / shops.length : 0
            },
            shopData: shopSalesData,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching daily sales report:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch daily sales report' },
            { status: 500 }
        );
    }
}