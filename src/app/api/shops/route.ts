import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all shops
export async function GET(request: NextRequest) {
    try {
        const shops = await prisma.shop.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(shops);
    } catch (error) {
        console.error('Error fetching shops:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shops' },
            { status: 500 }
        );
    }
}

// POST: Create a new shop
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const shop = await prisma.shop.create({
            data: {
                name: body.name,
                location: body.location
            }
        });

        return NextResponse.json(shop, { status: 201 });
    } catch (error) {
        console.error('Error creating shop:', error);
        return NextResponse.json(
            { error: 'Failed to create shop' },
            { status: 500 }
        );
    }
} 