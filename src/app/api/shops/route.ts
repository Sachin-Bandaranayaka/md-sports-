import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all shops
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const simpleList = searchParams.get('simple') === 'true';

        if (simpleList) {
            console.log('Fetching simple list of shops (id and name only)...');
            const shops = await prisma.shop.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true }
            });
            console.log(`Successfully fetched ${shops.length} shops for simple list.`);
            return NextResponse.json({ success: true, data: shops });
        }

        // Existing logic for detailed shop list
        console.log('Fetching shops with inventory items...');
        const shops = await prisma.shop.findMany({
            orderBy: {
                name: 'asc'
            },
            include: {
                InventoryItem: true
            }
        });

        console.log(`Successfully fetched ${shops.length} shops`);

        // Add inventory count and remove the full inventory items array
        const shopsWithCounts = shops.map(shop => {
            const inventoryCount = shop.InventoryItem ? shop.InventoryItem.length : 0;
            console.log(`Shop ${shop.id} (${shop.name}) has ${inventoryCount} inventory items`);

            return {
                ...shop,
                total_inventory: inventoryCount,
                InventoryItem: undefined
            };
        });

        return NextResponse.json({
            success: true,
            data: shopsWithCounts
        });
    } catch (error) {
        console.error('Error fetching shops:', error);

        // Check if it's a Prisma-specific error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorName = error instanceof Error ? error.name : 'Unknown error type';

        console.error(`Error details - Name: ${errorName}, Message: ${errorMessage}`);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch shops',
                error: errorMessage
            },
            { status: 500 }
        );
    }
}

// POST: Create a new shop
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newShop = await prisma.shop.create({
            data: {
                name: body.name,
                location: body.location,
                is_active: body.is_active,
                status: body.status,
            },
        });

        return NextResponse.json({
            success: true,
            data: newShop
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating shop:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create shop' },
            { status: 500 }
        );
    }
}