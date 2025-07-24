import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auditService } from '@/services/auditService';
import { verifyToken, extractToken } from '@/lib/auth';

// GET: Fetch a specific shop by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params before using its properties
        const resolvedParams = await params;
        const id = resolvedParams.id;

        // Get the shop with its inventory and manager
        const shop = await prisma.shop.findUnique({
            where: { id },
            include: {
                InventoryItem: {
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
        const inventory = shop.InventoryItem.map((item: any) => ({
            id: item.id,
            product_id: item.productId,
            product_name: item.product.name,
            product_sku: item.product.sku,
            retail_price: item.product.price,
            quantity: item.quantity,
            reorder_level: 10 // Default reorder level if not in database
        }));

        // Format the response
        const { InventoryItem, ...shopData } = shop;
        const shopWithInventory = {
            ...shopData,
            inventory
        };

        return NextResponse.json({
            success: true,
            data: shopWithInventory
        });
    } catch (error) {
        console.error(`Error fetching shop:`, error);
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params before using its properties
        const resolvedParams = await params;
        const id = resolvedParams.id;
        const body = await request.json();

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

        // Log audit trail for shop update
        try {
            const token = extractToken(request as NextRequest);
            if (token) {
                const decoded = verifyToken(token);
                if (decoded?.userId) {
                    await auditService.logAction({
                        action: 'UPDATE',
                        entityType: 'shop',
                        entityId: id,
                        userId: decoded.userId,
                        details: {
                            name: updatedShop.name,
                            location: updatedShop.location,
                            contact_person: updatedShop.contact_person,
                            phone: updatedShop.phone,
                            email: updatedShop.email,
                            is_active: updatedShop.is_active,
                            manager_id: updatedShop.manager_id,
                            status: updatedShop.status
                        }
                    });
                }
            }
        } catch (auditError) {
            console.error('Failed to log audit trail for shop update:', auditError);
        }

        return NextResponse.json({
            success: true,
            message: 'Shop updated successfully',
            data: updatedShop
        });
    } catch (error) {
        console.error(`Error updating shop:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error updating shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// DELETE: Delete a shop by ID (since Prisma doesn't have built-in soft delete)
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Await params before using its properties
        const resolvedParams = await context.params;
        const id = resolvedParams.id;

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

        // Check for related inventory items
        const inventoryItemCount = await prisma.inventoryItem.count({
            where: { shopId: id }
        });

        // Check for related users
        const userCount = await prisma.user.count({
            where: { shopId: id }
        });

        // Check for related inventory transfers
        const transfersCount = await prisma.inventoryTransfer.count({
            where: {
                OR: [
                    { fromShopId: id },
                    { toShopId: id }
                ]
            }
        });

        // Check for related products
        const productsCount = await prisma.product.count({
            where: { shopId: id }
        });

        // If there are related records, return an error
        if (inventoryItemCount > 0 || userCount > 0 || transfersCount > 0 || productsCount > 0) {
            const relatedRecords = [];

            if (inventoryItemCount > 0) relatedRecords.push(`${inventoryItemCount} inventory items`);
            if (userCount > 0) relatedRecords.push(`${userCount} users`);
            if (transfersCount > 0) relatedRecords.push(`${transfersCount} inventory transfers`);
            if (productsCount > 0) relatedRecords.push(`${productsCount} products`);

            return NextResponse.json({
                success: false,
                message: `Cannot delete shop. It has related records: ${relatedRecords.join(', ')}. Please remove or reassign these records first.`,
                relatedRecords: {
                    inventoryItems: inventoryItemCount,
                    users: userCount,
                    transfers: transfersCount,
                    products: productsCount
                }
            }, { status: 409 }); // 409 Conflict
        }

        // Soft delete shop using audit service
        try {
            const token = extractToken(request);
            if (token) {
                const decoded = verifyToken(token);
                if (decoded?.userId) {
                    await auditService.softDelete({
                        entityType: 'shop',
                        entityId: id,
                        userId: decoded.userId,
                        originalData: existingShop
                    });
                }
            }
        } catch (auditError) {
            console.error('Failed to log audit trail for shop deletion:', auditError);
        }

        // Hard delete shop from database
        await prisma.shop.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Shop deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting shop:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error deleting shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}