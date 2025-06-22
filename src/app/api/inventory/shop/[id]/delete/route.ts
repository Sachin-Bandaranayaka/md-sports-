import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE: Remove all inventory items for a shop
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params before using its properties
        const resolvedParams = await params;
        
        // Get the shop ID safely
        if (!resolvedParams || !resolvedParams.id) {
            return NextResponse.json({
                success: false,
                message: 'Shop ID is required',
            }, { status: 400 });
        }

        const shopId = resolvedParams.id;

        // Check if shop exists
        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
            include: {
                InventoryItem: true
            }
        });

        if (!shop) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${shopId} not found`,
            }, { status: 404 });
        }

        // Get the count of inventory items
        const inventoryCount = shop.InventoryItem.length;

        // Delete all inventory items for this shop
        await prisma.inventoryItem.deleteMany({
            where: { shopId }
        });

        // Create audit log entry
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'DELETE_ALL_INVENTORY',
                    entity: 'Shop',
                    entityId: parseInt(shopId),
                    details: JSON.stringify({
                        shopId,
                        shopName: shop.name,
                        inventoryCount,
                        reason: 'Shop deletion preparation'
                    })
                }
            });
        } catch (auditError) {
            // Log error but don't fail the request
            console.error('Error creating audit log:', auditError);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${inventoryCount} inventory items for shop "${shop.name}"`,
            data: {
                deletedCount: inventoryCount,
                shopId,
                shopName: shop.name
            }
        });
    } catch (error) {
        // Log the error
        console.error(`Error deleting shop inventory:`, error);
        return NextResponse.json({
            success: false,
            message: 'Failed to delete shop inventory',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 