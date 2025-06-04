import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Placeholder for your shop data structure
interface Shop {
    id: string | number;
    name: string;
}

// Placeholder for fetching shops from a database or service
async function getShopsFromDataSource(): Promise<Shop[]> {
    // In a real application, you would fetch this data from your database
    // For example: return await db.select('*').from('shops');
    return [
        { id: 'shop1', name: 'Main Street Boutique' },
        { id: 'shop2', name: 'Downtown Emporium' },
        { id: 'shop3', name: 'Warehouse Outlet' },
        { id: 'all', name: 'All Shops Access' }, // Example for a global access option
    ];
}

// GET: Fetch all shops
export async function GET(req: NextRequest) {
    try {
        // --- Authentication/Authorization (Placeholder) ---
        // In a real application, you would implement proper authentication.
        // For example, verify a JWT token, check session, or API key.
        const authorizationHeader = req.headers.get('Authorization');
        if (authorizationHeader !== 'Bearer dev-token') { // Replace dev-token with your actual auth mechanism
            // console.warn('Unauthorized attempt to fetch shops');
            // return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
            // For now, allowing access without strict auth for easier development.
            // Remove or secure this properly in production.
        }
        // --- End Authentication/Authorization ---

        // Fetch shops from the database with proper numeric IDs
        const shops = await prisma.shop.findMany({
            orderBy: {
                name: 'asc'
            },
            select: {
                id: true,
                name: true,
                location: true,
                contact_person: true,
                phone: true,
                email: true,
                is_active: true,
                opening_time: true,
                closing_time: true,
                manager_id: true,
                opening_date: true,
                status: true,
                address_line1: true,
                address_line2: true,
                city: true,
                state: true,
                postal_code: true,
                country: true,
                latitude: true,
                longitude: true,
                tax_rate: true,
                createdAt: true,
                updatedAt: true,
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                _count: {
                    select: {
                        InventoryItem: true
                    }
                }
            }
        });

        // Transform the data to include total_inventory count
        const shopsWithInventory = shops.map(shop => {
            const { _count, ...restOfShop } = shop;
            return {
                ...restOfShop,
                total_inventory: _count.InventoryItem
            };
        });

        if (!shopsWithInventory || shopsWithInventory.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        return NextResponse.json({ success: true, data: shopsWithInventory });

    } catch (error) {
        console.error('[API/SHOPS_GET] Error fetching shops:', error);
        // It's good practice to avoid sending detailed internal error messages to the client.
        let errorMessage = 'An unexpected error occurred while fetching shops.';
        if (error instanceof Error) {
            errorMessage = error.message;
            // You could log error.message for server-side debugging
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
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