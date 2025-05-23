import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch a specific shop by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid shop ID'
            }, { status: 400 });
        }

        // Get the shop with its inventory and manager
        const shop = await prisma.shop.findUnique({
            where: { id },
            include: {
                inventoryItems: {
                    include: {
                        product: true
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        if (!shop) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${id} not found`
            }, { status: 404 });
        }

        // Format the inventory data for the response
        const inventory = shop.inventoryItems.map(item => ({
            id: item.id,
            product_id: item.productId,
            product_name: item.product.name,
            product_sku: item.product.sku,
            retail_price: item.product.price,
            quantity: item.quantity,
            reorder_level: 10 // Default reorder level if not in database
        }));

        // Format the response
        const { inventoryItems, ...shopData } = shop;
        const shopWithInventory = {
            ...shopData,
            inventory
        };

        return NextResponse.json({
            success: true,
            data: shopWithInventory
        });
    } catch (error) {
        console.error(`Error fetching shop with ID ${params.id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// PUT: Update a shop by ID
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid shop ID'
            }, { status: 400 });
        }

        // Validate required fields
        if (!body.name) {
            return NextResponse.json({
                success: false,
                message: 'Shop name is required'
            }, { status: 400 });
        }

        // Check if the shop exists
        const existingShop = await prisma.shop.findUnique({
            where: { id }
        });

        if (!existingShop) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${id} not found`
            }, { status: 404 });
        }

        // Update the shop
        const updatedShop = await prisma.shop.update({
            where: { id },
            data: {
                name: body.name,
                location: body.location,
                contact_person: body.contact_person !== undefined ? body.contact_person : existingShop.contact_person,
                phone: body.phone !== undefined ? body.phone : existingShop.phone,
                email: body.email !== undefined ? body.email : existingShop.email,
                is_active: body.is_active !== undefined ? body.is_active : existingShop.is_active,
                opening_time: body.opening_time ? new Date(body.opening_time) : existingShop.opening_time,
                closing_time: body.closing_time ? new Date(body.closing_time) : existingShop.closing_time,
                manager_id: body.manager_id !== undefined ? body.manager_id : existingShop.manager_id,
                opening_date: body.opening_date ? new Date(body.opening_date) : existingShop.opening_date,
                status: body.status || existingShop.status,
                address_line1: body.address_line1 !== undefined ? body.address_line1 : existingShop.address_line1,
                address_line2: body.address_line2 !== undefined ? body.address_line2 : existingShop.address_line2,
                city: body.city !== undefined ? body.city : existingShop.city,
                state: body.state !== undefined ? body.state : existingShop.state,
                postal_code: body.postal_code !== undefined ? body.postal_code : existingShop.postal_code,
                country: body.country !== undefined ? body.country : existingShop.country,
                latitude: body.latitude !== undefined ? body.latitude : existingShop.latitude,
                longitude: body.longitude !== undefined ? body.longitude : existingShop.longitude,
                tax_rate: body.tax_rate !== undefined ? body.tax_rate : existingShop.tax_rate
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Shop updated successfully',
            data: updatedShop
        });
    } catch (error) {
        console.error(`Error updating shop with ID ${params.id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error updating shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// DELETE: Delete a shop by ID (since Prisma doesn't have built-in soft delete)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid shop ID'
            }, { status: 400 });
        }

        // Check if the shop exists
        const existingShop = await prisma.shop.findUnique({
            where: { id }
        });

        if (!existingShop) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${id} not found`
            }, { status: 404 });
        }

        // Delete the shop
        await prisma.shop.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Shop deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting shop with ID ${params.id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error deleting shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 