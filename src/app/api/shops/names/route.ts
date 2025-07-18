import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const shops = await prisma.shop.findMany({
            where: {
                is_active: true
            },
            select: {
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        const shopNames = shops.map(shop => shop.name);

        return NextResponse.json({
            success: true,
            shopNames
        });
    } catch (error) {
        console.error('Error fetching shop names:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch shop names' },
            { status: 500 }
        );
    }
} 