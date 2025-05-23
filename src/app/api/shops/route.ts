import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all shops
export async function GET(request: NextRequest) {
    try {
        const shops = await prisma.shop.findMany({
            orderBy: {
                name: 'asc'
            },
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                inventoryItems: true // Just include the full inventory items
            }
        });

        // Add inventory count to each shop
        const shopsWithCounts = shops.map(shop => {
            return {
                ...shop,
                total_inventory: shop.inventoryItems.length,
                inventoryItems: undefined // Remove the raw inventory items
            };
        });

        return NextResponse.json({
            success: true,
            data: shopsWithCounts
        });
    } catch (error) {
        console.error('Error fetching shops:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch shops' },
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
                location: body.location,
                contact_person: body.contact_person || null,
                phone: body.phone || null,
                email: body.email || null,
                is_active: body.is_active !== undefined ? body.is_active : true,
                opening_time: body.opening_time ? new Date(body.opening_time) : null,
                closing_time: body.closing_time ? new Date(body.closing_time) : null,
                manager_id: body.manager_id || null,
                opening_date: body.opening_date ? new Date(body.opening_date) : null,
                status: body.status || 'open',
                address_line1: body.address_line1 || null,
                address_line2: body.address_line2 || null,
                city: body.city || null,
                state: body.state || null,
                postal_code: body.postal_code || null,
                country: body.country || 'Malaysia',
                latitude: body.latitude || null,
                longitude: body.longitude || null,
                tax_rate: body.tax_rate || 0
            }
        });

        return NextResponse.json({
            success: true,
            data: shop
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating shop:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create shop' },
            { status: 500 }
        );
    }
} 