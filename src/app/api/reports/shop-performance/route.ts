import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const shops = await prisma.shop.findMany({
            where: {
                is_active: true, // Consider only active shops
            },
            include: {
                invoices: {
                    where: {
                        status: 'PAID',
                        createdAt: {
                            gte: firstDayOfMonth,
                            lte: lastDayOfMonth,
                        },
                    },
                    include: {
                        items: true, // To sum quantity sold
                    }
                },
            },
        });

        if (shops.length === 0) {
            return NextResponse.json({
                success: true,
                details: [],
                summary: { month: now.toLocaleString('default', { month: 'long' }), year: now.getFullYear(), totalShopsAnalyzed: 0 },
                generatedAt: new Date().toISOString(),
                message: 'No active shops found to analyze.'
            });
        }

        const reportDetails = shops.map(shop => {
            const totalSalesAmount = shop.invoices.reduce((sum, inv) => sum + inv.total, 0);
            const numberOfTransactions = shop.invoices.length;
            const totalQuantitySold = shop.invoices.reduce((sum, inv) =>
                sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
                0);
            const averageTransactionValue = numberOfTransactions > 0 ? totalSalesAmount / numberOfTransactions : 0;

            return {
                shopId: shop.id,
                shopName: shop.name,
                location: shop.location,
                totalSalesAmount,
                numberOfTransactions,
                totalQuantitySold,
                averageTransactionValue,
            };
        }).sort((a, b) => b.totalSalesAmount - a.totalSalesAmount); // Sort by sales amount desc

        return NextResponse.json({
            success: true,
            details: reportDetails,
            summary: {
                month: now.toLocaleString('default', { month: 'long' }),
                year: now.getFullYear(),
                totalShopsAnalyzed: reportDetails.length,
                // Could add overall totals here if needed
            },
            generatedAt: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('Error fetching shop performance report:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch shop performance report', error: error.message },
            { status: 500 }
        );
    }
} 