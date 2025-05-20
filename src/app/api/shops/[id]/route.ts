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

        // Get the shop with its inventory
        const shop = await prisma.shop.findUnique({
            where: { id },
            include: {
                inventoryItems: {
                    include: {
                        product: true
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
        const { name, location } = await request.json();

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid shop ID'
            }, { status: 400 });
        }

        // Validate required fields
        if (!name || !location) {
            return NextResponse.json({
                success: false,
                message: 'Shop name and location are required'
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
                name,
                location
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