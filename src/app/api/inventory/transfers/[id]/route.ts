import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import { prisma, safeQuery } from '@/lib/prisma';
import { transferCacheService, TRANSFER_CACHE_CONFIG } from '@/lib/transferCache';
import { trackTransferOperation } from '@/lib/transferPerformanceMonitor';
import { deduplicateRequest } from '@/lib/request-deduplication';
import { validateTokenPermission, extractToken, verifyToken } from '@/lib/auth';

// Default fallback data for a transfer
function getDefaultTransfer(id: number) {
    return {
        id,
        status: 'pending',
        created_at: new Date().toISOString(),
        completed_at: null,
        source_shop_id: 0,
        destination_shop_id: 0,
        source_shop_name: 'Unknown Shop',
        destination_shop_name: 'Unknown Shop',
        initiated_by: 'Unknown User',
        items: []
    };
}

// Default fallback data for transfers list
const defaultTransfersData = [
    {
        id: 1,
        status: 'pending',
        created_at: new Date().toISOString(),
        completed_at: null,
        source_shop_name: 'Main Store',
        destination_shop_name: 'Branch Store',
        initiated_by: 'System',
        item_count: 0,
        total_items: 0
    }
];

// GET: Fetch a specific inventory transfer by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const operation = trackTransferOperation('detail');

    // Check for inventory:view or inventory:transfer permission
    const viewPermission = await validateTokenPermission(req, 'inventory:view');
    const transferPermission = await validateTokenPermission(req, 'inventory:transfer');

    if (!viewPermission.isValid && !transferPermission.isValid) {
        operation.end(false, 'unauthorized');
        return NextResponse.json({
            success: false,
            message: 'Permission denied'
        }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
        operation.end(false, 'invalid_id');
        return NextResponse.json({
            success: false,
            error: 'Invalid transfer ID'
        }, { status: 400 });
    }

    try {
        // Generate cache key
        const cacheKey = `${TRANSFER_CACHE_CONFIG.KEYS.TRANSFER_DETAIL}:${resolvedParams.id}`;

        // Try to get from cache first
        const cached = await transferCacheService.get(cacheKey);
        if (cached) {
            operation.end(true, undefined, true);
            return NextResponse.json({
                success: true,
                data: cached
            });
        }

        // Use request deduplication
        const transfer = await deduplicateRequest(
            async () => {
                return await safeQuery(
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
                                price: item.product.price.toString()
                            }))
                        };
                    },
                    getDefaultTransfer(id),
                    `Failed to fetch transfer with ID ${id}`
                );
            },
            `/api/inventory/transfers/${resolvedParams.id}`
        );

        if (!transfer) {
            operation.end(false, 'not_found');
            return NextResponse.json({
                success: false,
                error: 'Transfer not found'
            }, { status: 404 });
        }

        // Cache the result
        await transferCacheService.set(cacheKey, transfer);

        operation.end(true, undefined, false);
        return NextResponse.json({
            success: true,
            data: transfer
        });
    } catch (error) {
        console.error(`Error fetching transfer ${id}:`, error);
        operation.end(false, 'fetch_error');
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch transfer'
        }, { status: 500 });
    }
}

// PATCH: Update a transfer (complete, cancel)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const operation = trackTransferOperation('complete');

    // Check for inventory:transfer permission
    const permissionError = await requirePermission('inventory:transfer')(req);
    if (permissionError) {
        operation.end(false, 'unauthorized');
        return permissionError;
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
        operation.end(false, 'invalid_id');
        return NextResponse.json({
            success: false,
            error: 'Invalid transfer ID'
        }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { action } = body;

        if (!action || !['complete', 'cancel'].includes(action)) {
            operation.end(false, 'invalid_action');
            return NextResponse.json({
                success: false,
                error: 'Invalid action. Must be "complete" or "cancel"'
            }, { status: 400 });
        }

        const result = await safeQuery(
            async () => {
                return await prisma.$transaction(
                    async (tx) => {
                        // Declare affectedProductIds before using it
                        const affectedProductIds = new Set<number>();

                        // Get transfer with items
                        const transfer = await tx.inventoryTransfer.findUnique({
                            where: { id },
                            include: {
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

                            // Process each transfer item for completion
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

                                // Update source inventory (decrease quantity)
                                await tx.inventoryItem.update({
                                    where: { id: sourceInventory.id },
                                    data: {
                                        quantity: sourceInventory.quantity - item.quantity,
                                        updatedAt: new Date()
                                    }
                                });

                                // Collect items for batch processing
                                affectedProductIds.add(item.productId);
                            }

                            // Batch process inventory updates
                            const inventoryUpdates: Array<{
                                productId: number;
                                quantity: number;
                                cost: number;
                            }> = [];

                            for (const item of transfer.transferItems) {
                                // Get the shop-specific cost from source inventory
                                const sourceInventory = await tx.inventoryItem.findFirst({
                                    where: {
                                        shopId: transfer.fromShopId,
                                        productId: item.productId
                                    }
                                });
                                const transferCostPerUnit = sourceInventory?.shopSpecificCost || 0;

                                // Check if destination already has this product
                                const destInventory = await tx.inventoryItem.findFirst({
                                    where: {
                                        shopId: transfer.toShopId,
                                        productId: item.productId
                                    }
                                });

                                if (!destInventory) {
                                    // Create new inventory item at destination
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

                                    const currentTotalValue = currentDestQuantity * currentDestCost;
                                    const transferTotalValue = transferQuantity * transferCostPerUnit;
                                    const newTotalQuantity = currentDestQuantity + transferQuantity;

                                    let newShopSpecificCost = 0;
                                    if (newTotalQuantity > 0) {
                                        newShopSpecificCost = (currentTotalValue + transferTotalValue) / newTotalQuantity;
                                    }

                                    inventoryUpdates.push({
                                        productId: item.productId,
                                        quantity: item.quantity,
                                        cost: newShopSpecificCost
                                    });
                                }
                            }

                            // Batch update existing inventory items
                            if (inventoryUpdates.length > 0) {
                                await Promise.all(
                                    inventoryUpdates.map(update =>
                                        tx.inventoryItem.updateMany({
                                            where: {
                                                shopId: transfer.toShopId,
                                                productId: update.productId
                                            },
                                            data: {
                                                quantity: { increment: update.quantity },
                                                shopSpecificCost: update.cost,
                                                updatedAt: new Date()
                                            }
                                        })
                                    )
                                );
                            }

                            // Batch recalculate global weighted average costs
                            const wacUpdates = await Promise.all(
                                Array.from(affectedProductIds).map(async (productId) => {
                                    const allInventoryAfterTransfer = await tx.inventoryItem.findMany({
                                        where: {
                                            productId,
                                            quantity: { gt: 0 } // Only consider inventories with stock
                                        }
                                    });

                                    if (allInventoryAfterTransfer.length > 0) {
                                        const totalQuantity = allInventoryAfterTransfer.reduce((sum, inv) => sum + inv.quantity, 0);
                                        const totalValue = allInventoryAfterTransfer.reduce((sum, inv) => {
                                            return sum + (inv.quantity * (inv.shopSpecificCost || 0));
                                        }, 0);

                                        const globalWAC = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                                        return { productId, globalWAC };
                                    }
                                    return null;
                                })
                            );

                            // Update global WAC for all affected products
                            await Promise.all(
                                wacUpdates
                                    .filter(update => update !== null)
                                    .map(update =>
                                        tx.product.update({
                                            where: { id: update!.productId },
                                            data: { weightedAverageCost: update!.globalWAC }
                                        })
                                    )
                            );
                        } else {
                            // action === 'cancel'
                            // Return reserved inventory in source shop
                            for (const item of transfer.transferItems) {
                                await tx.inventoryItem.updateMany({
                                    where: {
                                        productId: item.productId,
                                        shopId: transfer.fromShopId,
                                    },
                                    data: {
                                        quantity: { increment: item.quantity },
                                        updatedAt: new Date(),
                                    },
                                });
                            }
                            // No further updates required for destination inventory or WAC
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
                    { timeout: 30000 } // 30-second timeout
                );
            },
            null,
            `Failed to ${action} transfer`
        );

        if (!result) {
            operation.end(false, 'update_failed');
            return NextResponse.json({
                success: false,
                error: `Failed to ${action} transfer`
            }, { status: 500 });
        }

        // Invalidate relevant caches
        await transferCacheService.invalidateTransferCache(params.id, [result.fromShopId, result.toShopId]);

        operation.end(true);
        return NextResponse.json({
            success: true,
            message: `Transfer ${action}d successfully`,
            data: result
        });
    } catch (error) {
        console.error(`Error ${body?.action || 'updating'} transfer ${id}:`, error);
        operation.end(false, 'update_error');
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : `Failed to update transfer`
        }, { status: 500 });
    }
}

// PUT: Update a transfer (only if pending)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const operation = trackTransferOperation('update');

    // Token and user role check
    const token = extractToken(req);
    const payload = token ? await verifyToken(token) : null;
    const userRole = payload?.roleName as string ?? '';

    // Check for inventory:transfer permission
    const permissionResult = await validateTokenPermission(req, 'inventory:transfer');
    if (!permissionResult.isValid) {
        operation.end(false, 'unauthorized');
        return NextResponse.json({
            success: false,
            message: permissionResult.message || 'Permission denied'
        }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
        operation.end(false, 'invalid_id');
        return NextResponse.json({
            success: false,
            error: 'Invalid transfer ID'
        }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { sourceShopId, destinationShopId, items } = body;

        // Validate input
        if (sourceShopId == null || destinationShopId == null || !items || !Array.isArray(items)) {
            operation.end(false, 'invalid_input');
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        if (sourceShopId === destinationShopId) {
            operation.end(false, 'same_shop');
            return NextResponse.json({
                success: false,
                error: 'Source and destination shops cannot be the same'
            }, { status: 400 });
        }

        if (items.length === 0) {
            operation.end(false, 'no_items');
            return NextResponse.json({
                success: false,
                error: 'At least one item is required'
            }, { status: 400 });
        }

        // Validate items
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                operation.end(false, 'invalid_item');
                return NextResponse.json({
                    success: false,
                    error: 'Invalid item data'
                }, { status: 400 });
            }
        }

        const result = await safeQuery(
            async () => {
                return await prisma.$transaction(
                    async (tx) => {
                        // Check if transfer exists and is pending
                        const existingTransfer = await tx.inventoryTransfer.findUnique({
                            where: { id }
                        });

                        if (!existingTransfer) {
                            throw new Error('Transfer not found');
                        }

                        if (existingTransfer.status !== 'pending') {
                            throw new Error('Only pending transfers can be edited');
                        }

                        // Verify shops exist
                        const sourceShop = await tx.shop.findUnique({ where: { id: sourceShopId } });
                        const destinationShop = await tx.shop.findUnique({ where: { id: destinationShopId } });

                        if (!sourceShop || !destinationShop) {
                            throw new Error('Invalid shop selection');
                        }

                        // Verify products exist and have sufficient stock
                        for (const item of items) {
                            const inventory = await tx.inventoryItem.findFirst({
                                where: {
                                    productId: item.productId,
                                    shopId: sourceShopId
                                }
                            });

                            if (!inventory) {
                                const product = await tx.product.findUnique({ where: { id: item.productId } });
                                const productName = product ? product.name : `Product ID ${item.productId}`;
                                throw new Error(`Product "${productName}" not found in source shop`);
                            }

                            if (inventory.quantity < item.quantity) {
                                const product = await tx.product.findUnique({ where: { id: item.productId } });
                                const productName = product ? product.name : `Product ID ${item.productId}`;
                                throw new Error(`Insufficient stock for "${productName}". Available: ${inventory.quantity}, Requested: ${item.quantity}`);
                            }
                        }

                        // Update transfer
                        const updatedTransfer = await tx.inventoryTransfer.update({
                            where: { id },
                            data: {
                                fromShopId: sourceShopId,
                                toShopId: destinationShopId,
                                updatedAt: new Date()
                            }
                        });

                        // Delete existing transfer items
                        await tx.transferItem.deleteMany({
                            where: { transferId: id }
                        });

                        // Insert new transfer items
                        const transferItemsData = items.map((item: any) => ({
                            transferId: id,
                            productId: item.productId,
                            quantity: item.quantity
                        }));

                        await tx.transferItem.createMany({
                            data: transferItemsData
                        });

                        return updatedTransfer;
                    },
                    { timeout: 30000 } // 30-second timeout
                );
            },
            null,
            'Failed to update transfer'
        );

        if (!result) {
            operation.end(false, 'update_failed');
            return NextResponse.json({
                success: false,
                error: 'Failed to update transfer'
            }, { status: 500 });
        }

        // Invalidate relevant caches
        await transferCacheService.invalidateTransferCache(id, [result.fromShopId, result.toShopId]);

        operation.end(true);
        return NextResponse.json({
            success: true,
            message: 'Transfer updated successfully',
            data: { id }
        });
    } catch (error) {
        console.error(`Error updating transfer ${id}:`, error);
        operation.end(false, 'update_error');
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update transfer'
        }, { status: 500 });
    }
}

// DELETE: Delete a transfer (only if pending)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const operation = trackTransferOperation('cancel');

    // Token and user role check
    const token = extractToken(req);
    const payload = token ? await verifyToken(token) : null;
    const userRole = payload?.roleName as string ?? '';

    // Check for inventory:transfer permission
    const permissionResult = await validateTokenPermission(req, 'inventory:transfer');
    if (!permissionResult.isValid) {
        operation.end(false, 'unauthorized');
        return NextResponse.json({
            success: false,
            message: permissionResult.message || 'Permission denied'
        }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
        operation.end(false, 'invalid_id');
        return NextResponse.json({
            success: false,
            error: 'Invalid transfer ID'
        }, { status: 400 });
    }

    try {
        const result = await safeQuery(
            async () => {
                return await prisma.$transaction(
                    async (tx) => {
                        // Get transfer to check status
                        const transfer = await tx.inventoryTransfer.findUnique({
                            where: { id }
                        });

                        if (!transfer) {
                            throw new Error('Transfer not found');
                        }

                        if (transfer.status !== 'pending') {
                            throw new Error('Only pending transfers can be deleted');
                        }

                        // Return reserved inventory to source shop before deletion
                        const items = await tx.transferItem.findMany({ where: { transferId: id } });
                        for (const item of items) {
                            await tx.inventoryItem.updateMany({
                                where: {
                                    productId: item.productId,
                                    shopId: transfer.fromShopId
                                },
                                data: { quantity: { increment: item.quantity } }
                            });
                        }

                        // Delete transfer items and the transfer itself
                        await tx.transferItem.deleteMany({ where: { transferId: id } });

                        return await tx.inventoryTransfer.delete({ where: { id } });
                    },
                    { timeout: 30000 } // 30-second timeout
                );
            },
            null,
            'Failed to delete transfer'
        );

        if (!result) {
            operation.end(false, 'delete_failed');
            return NextResponse.json({
                success: false,
                error: 'Failed to delete transfer'
            }, { status: 500 });
        }

        // Invalidate relevant caches
        await transferCacheService.invalidateTransferCache(id, [result.fromShopId, result.toShopId]);

        operation.end(true);
        return NextResponse.json({
            success: true,
            message: 'Transfer deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting transfer ${id}:`, error);
        operation.end(false, 'delete_error');
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete transfer'
        }, { status: 500 });
    }
}