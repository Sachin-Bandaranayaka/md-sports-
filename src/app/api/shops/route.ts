import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all shops
export async function GET() {
    try {
        // Get all active shops with their inventory totals
        const shops = await prisma.shop.findMany({
            where: {
                // Prisma doesn't have a default is_active column in Shop model
            },
            orderBy: {
                name: 'asc'
            },
            include: {
                inventoryItems: true
            }
        });

        // Calculate total inventory for each shop
        const data = shops.map(shop => {
            // Calculate total inventory quantity
            const totalInventory = shop.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

            // Remove the full inventory items array from the response
            const { inventoryItems, ...shopData } = shop;

            return {
                ...shopData,
                total_inventory: totalInventory
            };
        });

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching shops:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching shops',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// POST: Create a new shop
export async function POST(request: Request) {
    try {
        const { name, location } = await request.json();

        // Validate required fields
        if (!name || !location) {
            return NextResponse.json({
                success: false,
                message: 'Shop name and location are required'
            }, { status: 400 });
        }

        // Create the shop using Prisma
        const newShop = await prisma.shop.create({
            data: {
                name,
                location
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Shop created successfully',
            data: newShop
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating shop:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 