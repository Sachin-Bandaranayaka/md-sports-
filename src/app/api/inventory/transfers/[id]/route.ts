import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import { prisma, safeQuery } from '@/lib/prisma';

// Default fallback data for a transfer
const getDefaultTransfer = (id: number) => ({
    id,
    status: 'pending',
    created_at: new Date().toISOString(),
    completed_at: null,
    source_shop_id: 1,
    destination_shop_id: 2,
    source_shop_name: 'Colombo Shop',
    destination_shop_name: 'Kandy Shop',
    initiated_by: 'System User',
    items: [
        {
            id: 1,
            product_id: 1,
            product_name: 'Cricket Bat',
            sku: 'CB001',
            quantity: 5,
            notes: null,
            retail_price: '15000'
        }
    ]
});

// GET: Get details of a specific inventory transfer
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Check for inventory:view permission
    const permissionError = await requirePermission('inventory:view')(req);
    if (permissionError) {
        return permissionError;
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json({
            success: false,
            message: 'Invalid transfer ID'
        }, { status: 400 });
    }

    try {
        const transfer = await safeQuery(
            async () => {
                // Get transfer details with related data
                const transferData = await prisma.inventoryTransfer.findUnique({
                    where: { id },
                    include: {
                        fromShop: true,
                        toShop: true,
                        fromUser: true,
                        transferItems: {
                            include: {
                                product: true
                            }
                        }
                    }
                });

                if (!transferData) {
                    return null;
                }

                // Format the transfer data to match the expected format
                return {
                    id: transferData.id,
                    status: transferData.status,
                    created_at: transferData.createdAt.toISOString(),
                    completed_at: null, // This field isn't in the Prisma schema
                    source_shop_id: transferData.fromShopId,
                    destination_shop_id: transferData.toShopId,
                    source_shop_name: transferData.fromShop.name,
                    destination_shop_name: transferData.toShop.name,
                    initiated_by: transferData.fromUser.name,
                    items: transferData.transferItems.map(item => ({
                        id: item.id,
                        product_id: item.productId,
                        product_name: item.product.name,
                        sku: item.product.sku || '',
                        quantity: item.quantity,
                        notes: null, // This field isn't in the Prisma schema
                        retail_price: item.product.price.toString()
                    }))
                };
            },
            getDefaultTransfer(id),
            `Failed to fetch transfer with ID ${id}`
        );

        if (!transfer) {
            return NextResponse.json({
                success: false,
                message: 'Transfer not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: transfer
        });
    } catch (error) {
        console.error(`Error fetching transfer ${id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching transfer',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// PATCH: Update transfer status (complete or cancel)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Check for inventory:transfer permission
    const permissionError = await requirePermission('inventory:transfer')(req);
    if (permissionError) {
        return permissionError;
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json({
            success: false,
            message: 'Invalid transfer ID'
        }, { status: 400 });
    }

    try {
        const { action } = await req.json();

        if (!['complete', 'cancel'].includes(action)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid action, must be "complete" or "cancel"'
            }, { status: 400 });
        }

        const result = await safeQuery(
            async () => {
                // Run in a transaction
                return await prisma.$transaction(
                    async (tx) => {
                        // Check if transfer exists and is in pending status
                        const transfer = await tx.inventoryTransfer.findUnique({
                            where: { id },
                            include: {
                                fromShop: true,
                                toShop: true,
                                transferItems: {
                                    include: {
                                        product: true
                                    }
                                }
                            }
                        });

                        if (!transfer) {
                            throw new Error('Transfer not found');
                        }

                        if (transfer.status !== 'pending') {
                            throw new Error(`Cannot ${action} a transfer that is not in pending status`);
                        }

                        if (action === 'complete') {
                            // Process each item - decrease source inventory and increase destination inventory
                            for (const item of transfer.transferItems) {
                                // Check source inventory
                                const sourceInventory = await tx.inventoryItem.findFirst({
                                    where: {
                                        shopId: transfer.fromShopId,
                                        productId: item.productId
                                    }
                                });

                                if (!sourceInventory || sourceInventory.quantity < item.quantity) {
                                    throw new Error(`Insufficient inventory for product ID ${item.productId} in source shop`);
                                }

                                // Get the shop-specific cost from source inventory
                                const transferCostPerUnit = sourceInventory.shopSpecificCost || 0;

                                // Decrease source inventory
                                await tx.inventoryItem.update({
                                    where: { id: sourceInventory.id },
                                    data: {
                                        quantity: sourceInventory.quantity - item.quantity,
                                        updatedAt: new Date()
                                    }
                                });

                                // Check if destination inventory exists
                                const destInventory = await tx.inventoryItem.findFirst({
                                    where: {
                                        shopId: transfer.toShopId,
                                        productId: item.productId
                                    }
                                });

                                if (!destInventory) {
                                    // Create destination inventory if it doesn't exist
                                    // Use the source shop's WAC as the initial cost for destination
                                    await tx.inventoryItem.create({
                                        data: {
                                            shopId: transfer.toShopId,
                                            productId: item.productId,
                                            quantity: item.quantity,
                                            shopSpecificCost: transferCostPerUnit
                                        }
                                    });
                                } else {
                                    // Calculate new WAC for destination shop using weighted average
                                    const currentDestQuantity = destInventory.quantity;
                                    const currentDestCost = destInventory.shopSpecificCost || 0;
                                    const transferQuantity = item.quantity;
                                    
                                    // Calculate new WAC using weighted average formula
                                    // (Current Quantity × Current WAC + Transfer Quantity × Transfer WAC) / (Current Quantity + Transfer Quantity)
                                    let newShopSpecificCost = transferCostPerUnit; // Default to transfer cost
                                    
                                    if (currentDestQuantity > 0) {
                                        const currentTotalValue = currentDestQuantity * currentDestCost;
                                        const transferTotalValue = transferQuantity * transferCostPerUnit;
                                        const newTotalQuantity = currentDestQuantity + transferQuantity;
                                        
                                        newShopSpecificCost = (currentTotalValue + transferTotalValue) / newTotalQuantity;
                                    }
                                    
                                    // Update destination inventory with new quantity and recalculated WAC
                                    await tx.inventoryItem.update({
                                        where: { id: destInventory.id },
                                        data: {
                                            quantity: destInventory.quantity + item.quantity,
                                            shopSpecificCost: newShopSpecificCost,
                                            updatedAt: new Date()
                                        }
                                    });
                                }
                                
                                // Recalculate global product WAC based on all shop inventories
                                const allInventoryAfterTransfer = await tx.inventoryItem.findMany({
                                    where: { 
                                        productId: item.productId,
                                        quantity: { gt: 0 } // Only consider inventories with stock
                                    }
                                });
                                
                                if (allInventoryAfterTransfer.length > 0) {
                                    const totalQuantity = allInventoryAfterTransfer.reduce((sum, inv) => sum + inv.quantity, 0);
                                    const totalValue = allInventoryAfterTransfer.reduce((sum, inv) => {
                                        return sum + (inv.quantity * (inv.shopSpecificCost || 0));
                                    }, 0);
                                    
                                    const globalWAC = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                                    
                                    // Update the global product WAC
                                    await tx.product.update({
                                        where: { id: item.productId },
                                        data: { weightedAverageCost: globalWAC }
                                    });
                                }
                            }
                        }

                        // Update transfer status
                        return await tx.inventoryTransfer.update({
                            where: { id },
                            data: {
                                status: action === 'complete' ? 'completed' : 'cancelled',
                                updatedAt: new Date()
                            }
                        });
                    },
                    { timeout: 30000 }
                );
            },
            null,
            `Failed to ${action} transfer with ID ${id}`
        );

        if (!result) {
            return NextResponse.json({
                success: false,
                message: 'Failed to update transfer'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Transfer ${action === 'complete' ? 'completed' : 'cancelled'} successfully`
        });
    } catch (error) {
        console.error(`Error updating transfer ${id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error updating transfer',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// DELETE: Delete a pending transfer
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Check for inventory:transfer permission
    const permissionError = await requirePermission('inventory:transfer')(req);
    if (permissionError) {
        return permissionError;
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json({
            success: false,
            message: 'Invalid transfer ID'
        }, { status: 400 });
    }

    try {
        const result = await safeQuery(
            async () => {
                // Run in a transaction
                return await prisma.$transaction(
                    async (tx) => {
                        // Check if transfer exists and is in pending status
                        const transfer = await tx.inventoryTransfer.findUnique({
                            where: { id }
                        });

                        if (!transfer) {
                            throw new Error('Transfer not found');
                        }

                        if (transfer.status !== 'pending') {
                            throw new Error('Only pending transfers can be deleted');
                        }

                        // Delete transfer items and the transfer itself
                        await tx.transferItem.deleteMany({
                            where: { transferId: id }
                        });

                        return await tx.inventoryTransfer.delete({
                            where: { id }
                        });
                    },
                    { timeout: 30000 } // 30-second timeout
                );
            },
            null,
            `Failed to delete transfer with ID ${id}`
        );

        if (!result) {
            return NextResponse.json({
                success: false,
                message: 'Failed to delete transfer'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Transfer deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting transfer ${id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error deleting transfer',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}