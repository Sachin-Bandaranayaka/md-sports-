import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * API endpoint to fetch sales history for a specific product
 * GET /api/products/[id]/sales
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const productId = parseInt(params.id);

        if (isNaN(productId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid product ID' },
                { status: 400 }
            );
        }

        // Get all invoice items for this product
        const invoiceItems = await prisma.invoiceItem.findMany({
            where: {
                productId: productId
            },
            include: {
                invoice: {
                    include: {
                        shop: true,
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format the data for the frontend
        const salesData = invoiceItems.map(item => ({
            id: item.invoice.invoiceNumber || `INV-${item.invoiceId}`,
            date: item.invoice.createdAt,
            shopId: item.invoice.shopId.toString(),
            shopName: item.invoice.shop?.name || 'Unknown Shop',
            cashierName: item.invoice.user?.name || 'Unknown User',
            quantity: item.quantity,
            total: item.total
        }));

        // Calculate sales metrics
        const totalQuantitySold = invoiceItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalSalesValue = invoiceItems.reduce((sum, item) => sum + item.total, 0);

        // Calculate daily, weekly and monthly sales (using date filtering)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const dailySales = invoiceItems.filter(item =>
            item.invoice.createdAt >= oneDayAgo
        ).reduce((sum, item) => sum + item.quantity, 0);

        const weeklySales = invoiceItems.filter(item =>
            item.invoice.createdAt >= oneWeekAgo
        ).reduce((sum, item) => sum + item.quantity, 0);

        const monthlySales = invoiceItems.filter(item =>
            item.invoice.createdAt >= oneMonthAgo
        ).reduce((sum, item) => sum + item.quantity, 0);

        return NextResponse.json({
            success: true,
            data: {
                invoices: salesData,
                metrics: {
                    totalQuantitySold,
                    totalSalesValue,
                    daily: dailySales,
                    weekly: weeklySales,
                    monthly: monthlySales
                }
            }
        });
    } catch (error) {
        console.error(`Error fetching sales history for product ${params.id}:`, error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch sales history',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 