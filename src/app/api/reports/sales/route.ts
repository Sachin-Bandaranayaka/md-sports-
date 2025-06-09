import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming you have prisma configured

export async function GET(request: Request) {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const salesData = await prisma.invoice.aggregate({
            _sum: {
                total: true,
            },
            _count: {
                id: true,
            },
            where: {
                createdAt: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
                },
                status: 'paid',
            },
        });

        const invoices = await prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
                },
                status: 'paid',
            },
            include: {
                customer: true,
                shop: true,
                items: {
                    include: {
                        product: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            success: true,
            summary: {
                totalSales: salesData._sum.total || 0,
                numberOfInvoices: salesData._count.id || 0,
                month: now.toLocaleString('default', { month: 'long' }),
                year: now.getFullYear(),
            },
            details: invoices, // For "View" action and CSV export
        });

    } catch (error) {
        console.error('Error fetching monthly sales report:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch monthly sales report' },
            { status: 500 }
        );
    }
}