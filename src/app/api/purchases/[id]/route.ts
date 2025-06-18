import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getToken } from 'next-auth/jwt';
import { cacheService } from '@/lib/cache';

// GET /api/purchases/[id] - Get a specific purchase invoice
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id; // Store params.id early to avoid async issues
    try {
        const purchaseId = parseInt(id);

        if (isNaN(purchaseId)) {
            return NextResponse.json(
                { error: { message: 'Invalid purchase ID format' } },
                { status: 400 }
            );
        }

        const purchase = await prisma.purchaseInvoice.findUnique({
            where: {
                id: purchaseId
            },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!purchase) {
            return NextResponse.json(
                { error: { message: 'Purchase invoice not found' } },
                { status: 404 }
            );
        }

        return NextResponse.json(purchase);
    } catch (error) {
        console.error(`Error fetching purchase invoice ${id}:`, error);
        const details = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: { message: 'Failed to fetch purchase invoice', details: details } },
            { status: 500 }
        );
    }
}

// PUT /api/purchases/[id] - Update a purchase invoice
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    try {
        const purchaseId = parseInt(id);
        if (isNaN(purchaseId)) {
            return NextResponse.json(
                { error: { message: 'Invalid purchase ID format' } },
                { status: 400 });
        }
        const body = await request.json();
        const originalPurchase = await prisma.purchaseInvoice.findUnique({
            where: { id: purchaseId },
            include: { items: { include: { product: true } } },
        });
        if (!originalPurchase) {
            return NextResponse.json(
                { error: { message: 'Purchase invoice not found to update' } },
                { status: 404 });
        }
        const { items: newItemsData, distributions: newDistributionsData, ...invoiceData } = body;
        const { id: _, createdAt, updatedAt, supplier, notes, ...dirtyData } = invoiceData;
        const cleanedInvoiceData: any = {};
        if (dirtyData.invoiceNumber) cleanedInvoiceData.invoiceNumber = dirtyData.invoiceNumber;
        if (dirtyData.status) cleanedInvoiceData.status = dirtyData.status;
        if (dirtyData.date) cleanedInvoiceData.date = new Date(dirtyData.date);
        if (dirtyData.dueDate !== undefined) cleanedInvoiceData.dueDate = dirtyData.dueDate ? new Date(dirtyData.dueDate) : null;
        if (dirtyData.totalAmount !== undefined) cleanedInvoiceData.total = Number(dirtyData.totalAmount);
        else if (dirtyData.total !== undefined) cleanedInvoiceData.total = Number(dirtyData.total);
        cleanedInvoiceData.distributions = newDistributionsData !== undefined ? newDistributionsData : originalPurchase.distributions;
        if (dirtyData.supplierId) cleanedInvoiceData.supplier = { connect: { id: Number(dirtyData.supplierId) } };
        else if (dirtyData.supplierId === null && originalPurchase.supplierId) cleanedInvoiceData.supplier = { disconnect: true };

        const result = await prisma.$transaction(async (tx) => {
            const inventoryUpdates: Array<{ productId: number, shopId: number, newQuantity: number, oldQuantity?: number }> = [];

            if (originalPurchase.items && originalPurchase.items.length > 0) {
                for (const oldItem of originalPurchase.items) {
                    const productToUpdate = await tx.product.findUnique({ where: { id: oldItem.productId } });
                    if (!productToUpdate) continue;

                    const oldItemDistribution = originalPurchase.distributions && Array.isArray(originalPurchase.distributions) && originalPurchase.items.indexOf(oldItem) < originalPurchase.distributions.length
                        ? originalPurchase.distributions[originalPurchase.items.indexOf(oldItem)]
                        : (originalPurchase.distributions && typeof originalPurchase.distributions === 'object' && !Array.isArray(originalPurchase.distributions) ? originalPurchase.distributions : null);

                    if (oldItemDistribution && Object.keys(oldItemDistribution).length > 0) {
                        for (const [shopIdStr, quantityInShop] of Object.entries(oldItemDistribution as any)) {
                            const shopId = shopIdStr;
                            const qtyToRemove = Number(quantityInShop);
                            if (qtyToRemove <= 0 || isNaN(qtyToRemove)) continue;
                            const inventory = await tx.inventoryItem.findFirst({ where: { productId: oldItem.productId, shopId: shopId } });
                            if (inventory) {
                                const oldShopQuantity = inventory.quantity;
                                const newQuantity = Math.max(0, inventory.quantity - qtyToRemove);
                                await tx.inventoryItem.update({
                                    where: { id: inventory.id },
                                    data: {
                                        quantity: newQuantity,
                                        // If new quantity is 0, reset shopSpecificCost, else keep existing
                                        shopSpecificCost: newQuantity === 0 ? 0 : inventory.shopSpecificCost
                                    }
                                });
                                inventoryUpdates.push({ productId: oldItem.productId, shopId: Number(shopId), newQuantity, oldQuantity: oldShopQuantity });
                            }
                        }
                    } else {
                        // oldItemDistribution is missing. Attempt to infer shop for stock reversal.
                        console.warn(`Old item ${oldItem.productId} in purchase ${purchaseId} has no distribution. Attempting to infer shop for stock reversal.`);
                        const existingInventoriesForOldItem = await tx.inventoryItem.findMany({
                            where: { productId: oldItem.productId }
                        });
                        if (existingInventoriesForOldItem.length === 1) {
                            const shopIdToReverseFrom = existingInventoriesForOldItem[0].shopId;
                            const inventory = existingInventoriesForOldItem[0]; // Already fetched
                            const oldShopQuantity = inventory.quantity;
                            const newQuantity = Math.max(0, inventory.quantity - oldItem.quantity); // Use total oldItem.quantity
                            await tx.inventoryItem.update({
                                where: { id: inventory.id },
                                data: {
                                    quantity: newQuantity,
                                    // If new quantity is 0, reset shopSpecificCost, else keep existing
                                    shopSpecificCost: newQuantity === 0 ? 0 : inventory.shopSpecificCost
                                }
                            });
                            inventoryUpdates.push({ productId: oldItem.productId, shopId: Number(shopIdToReverseFrom), newQuantity, oldQuantity: oldShopQuantity });
                            console.log(`Reversed ${oldItem.quantity} from product ${oldItem.productId} in inferred shop ${shopIdToReverseFrom}.`);
                        } else if (existingInventoriesForOldItem.length === 0) {
                            console.error(`Old item ${oldItem.productId} not found in any inventory. Cannot reverse stock for this item line from a specific shop.`);
                        } else { // Multiple shops
                            console.error(`Old item ${oldItem.productId} exists in multiple shops and no specific distribution for reversal. Ambiguous. Stock not reversed from a specific shop for this item line.`);
                        }
                    }

                    let currentTotalProductQuantity = 0;
                    const allInventoryForProductAfterReversal = await tx.inventoryItem.findMany({ where: { productId: oldItem.productId } });
                    currentTotalProductQuantity = allInventoryForProductAfterReversal.reduce((sum, inv) => sum + inv.quantity, 0);

                    // Recalculate WAC based on remaining purchase history after removing this item
                    const remainingPurchaseItems = await tx.purchaseInvoiceItem.findMany({
                        where: {
                            productId: oldItem.productId,
                            purchaseInvoiceId: { not: purchaseId } // Exclude current invoice being updated
                        }
                    });

                    let totalRemainingQuantity = 0;
                    let totalRemainingValue = 0;

                    remainingPurchaseItems.forEach(purchaseItem => {
                        totalRemainingQuantity += purchaseItem.quantity;
                        totalRemainingValue += purchaseItem.quantity * purchaseItem.price;
                    });

                    let newWAC = 0;
                    if (totalRemainingQuantity > 0) {
                        newWAC = totalRemainingValue / totalRemainingQuantity;
                    }

                    await tx.product.update({
                        where: { id: oldItem.productId },
                        data: { weightedAverageCost: newWAC >= 0 ? newWAC : 0 }
                    });
                }
            }

            await tx.purchaseInvoiceItem.deleteMany({ where: { purchaseInvoiceId: purchaseId } });

            // Recalculate totalAmount for the invoice based on new/updated items
            let newTotalInvoiceAmount = 0;
            if (newItemsData && Array.isArray(newItemsData)) {
                newItemsData.forEach(item => {
                    newTotalInvoiceAmount += Number(item.quantity) * Number(item.price || 0);
                });
            }
            cleanedInvoiceData.total = newTotalInvoiceAmount; // Ensure this is assigned to the correct field for DB update

            const updatedInvoice = await tx.purchaseInvoice.update({ where: { id: purchaseId }, data: cleanedInvoiceData });

            if (newItemsData && Array.isArray(newItemsData)) {
                for (let i = 0; i < newItemsData.length; i++) {
                    const newItem = newItemsData[i];
                    if (!newItem.productId || !newItem.quantity || newItem.quantity <= 0) continue;
                    await tx.purchaseInvoiceItem.create({
                        data: {
                            purchaseInvoiceId: purchaseId, productId: Number(newItem.productId),
                            quantity: Number(newItem.quantity), price: Number(newItem.price || 0),
                            total: Number(newItem.quantity) * Number(newItem.price || 0)
                        }
                    });
                    const productToUpdate = await tx.product.findUnique({ where: { id: Number(newItem.productId) } });
                    if (!productToUpdate) continue;

                    const newItemDistribution = newDistributionsData && Array.isArray(newDistributionsData) && newDistributionsData[i]
                        ? newDistributionsData[i]
                        : (newDistributionsData && typeof newDistributionsData === 'object' && !Array.isArray(newDistributionsData) ? newDistributionsData : null);

                    const itemQuantityTotal = Number(newItem.quantity);

                    if (newItemDistribution && Object.keys(newItemDistribution).length > 0) {
                        for (const [shopIdStr, quantityInShop] of Object.entries(newItemDistribution as any)) {
                            const shopId = shopIdStr;
                            const qtyToAdd = Number(quantityInShop);
                            if (qtyToAdd <= 0 || isNaN(qtyToAdd)) continue;

                            const inventory = await tx.inventoryItem.findFirst({ where: { productId: Number(newItem.productId), shopId: shopId } });
                            let finalQuantity = 0;
                            const oldInvQty = inventory?.quantity || 0;
                            let newShopSpecificCostValue = 0;
                            const itemPrice = Number(newItem.price || 0);

                            if (inventory) {
                                finalQuantity = inventory.quantity + qtyToAdd;
                                const oldShopTotalValue = (inventory.quantity || 0) * (inventory.shopSpecificCost || 0);
                                const valueOfThisBatch = qtyToAdd * itemPrice;
                                if (finalQuantity > 0) {
                                    newShopSpecificCostValue = (oldShopTotalValue + valueOfThisBatch) / finalQuantity;
                                } else {
                                    newShopSpecificCostValue = 0;
                                }
                                await tx.inventoryItem.update({
                                    where: { id: inventory.id },
                                    data: { quantity: finalQuantity, shopSpecificCost: newShopSpecificCostValue >= 0 ? newShopSpecificCostValue : 0 }
                                });
                            } else {
                                finalQuantity = qtyToAdd;
                                newShopSpecificCostValue = itemPrice;
                                await tx.inventoryItem.create({
                                    data: {
                                        productId: Number(newItem.productId),
                                        shopId: shopId,
                                        quantity: finalQuantity,
                                        shopSpecificCost: newShopSpecificCostValue >= 0 ? newShopSpecificCostValue : 0
                                    }
                                });
                            }
                            inventoryUpdates.push({ productId: Number(newItem.productId), shopId: Number(shopId), newQuantity: finalQuantity, oldQuantity: oldInvQty });
                        }
                    } else {
                        // newItemDistribution is missing or empty. Try to infer shop or log error.
                        console.warn(`Purchase item with productId ${newItem.productId} in invoice ${purchaseId} does not have explicit shop distribution data. Attempting to infer target shop.`);
                        const existingInventoryItems = await tx.inventoryItem.findMany({
                            where: { productId: Number(newItem.productId) }
                        });

                        let targetShopId: string | null = null;

                        if (existingInventoryItems.length === 1) {
                            targetShopId = existingInventoryItems[0].shopId;
                            console.log(`Product ${newItem.productId} exists in one shop (${targetShopId}). Attributing new stock there.`);
                        } else if (existingInventoryItems.length === 0) {
                            console.error(`Product ${newItem.productId} is new to inventory and no shop distribution provided. Cannot automatically assign to a shop. Inventory not updated for this item.`);
                        } else { // existingInventoryItems.length > 1
                            console.error(`Product ${newItem.productId} exists in multiple shops and no specific distribution provided. Ambiguous. Inventory not updated for this item.`);
                        }

                        if (targetShopId) {
                            const qtyToAdd = itemQuantityTotal; // The total quantity for this newItem.
                            if (qtyToAdd > 0) {
                                const inventory = await tx.inventoryItem.findFirst({ where: { productId: Number(newItem.productId), shopId: targetShopId } });
                                let finalQuantity = 0;
                                const oldInvQty = inventory?.quantity || 0;
                                let newShopSpecificCostValue = 0;
                                const itemPrice = Number(newItem.price || 0);

                                if (inventory) {
                                    finalQuantity = inventory.quantity + qtyToAdd;
                                    const oldShopTotalValue = (inventory.quantity || 0) * (inventory.shopSpecificCost || 0);
                                    const valueOfThisBatch = qtyToAdd * itemPrice;
                                    if (finalQuantity > 0) {
                                        newShopSpecificCostValue = (oldShopTotalValue + valueOfThisBatch) / finalQuantity;
                                    } else {
                                        newShopSpecificCostValue = 0;
                                    }
                                    await tx.inventoryItem.update({
                                        where: { id: inventory.id },
                                        data: { quantity: finalQuantity, shopSpecificCost: newShopSpecificCostValue >= 0 ? newShopSpecificCostValue : 0 }
                                    });
                                } else {
                                    finalQuantity = qtyToAdd;
                                    newShopSpecificCostValue = itemPrice;
                                    console.warn(`InventoryItem for product ${newItem.productId} in targetShopId ${targetShopId} not found during update, attempting create.`);
                                    await tx.inventoryItem.create({
                                        data: {
                                            productId: Number(newItem.productId),
                                            shopId: targetShopId,
                                            quantity: finalQuantity,
                                            shopSpecificCost: newShopSpecificCostValue >= 0 ? newShopSpecificCostValue : 0
                                        }
                                    });
                                }
                                inventoryUpdates.push({ productId: Number(newItem.productId), shopId: Number(targetShopId), newQuantity: finalQuantity, oldQuantity: oldInvQty });
                            } else {
                                console.warn(`Quantity for product ${newItem.productId} is zero or negative. No inventory update performed for this item.`);
                            }
                        }
                    }

                    // Recalculate WAC based on all purchase history for this product
                    // This ensures accuracy regardless of update order
                    const allPurchaseItems = await tx.purchaseInvoiceItem.findMany({
                        where: { productId: Number(newItem.productId) }
                    });

                    let totalPurchaseQuantity = 0;
                    let totalPurchaseValue = 0;

                    allPurchaseItems.forEach(purchaseItem => {
                        totalPurchaseQuantity += purchaseItem.quantity;
                        totalPurchaseValue += purchaseItem.quantity * purchaseItem.price;
                    });

                    let newWeightedAverageCost = 0;
                    if (totalPurchaseQuantity > 0) {
                        newWeightedAverageCost = totalPurchaseValue / totalPurchaseQuantity;
                    }

                    // Ensure WAC is valid
                    if (newWeightedAverageCost <= 0 || isNaN(newWeightedAverageCost)) {
                        newWeightedAverageCost = Number(newItem.price);
                    }

                    await tx.product.update({
                        where: { id: Number(newItem.productId) },
                        data: { weightedAverageCost: newWeightedAverageCost }
                    });
                }
            }
            const fullUpdatedInvoice = await tx.purchaseInvoice.findUnique({
                where: { id: purchaseId },
                include: { supplier: true, items: { include: { product: true } } }
            });
            return { fullUpdatedInvoice, inventoryUpdates };
        }, { timeout: 30000 });

        // Real-time updates now handled by polling system
        if (result && result.fullUpdatedInvoice) {
            console.log('Purchase invoice updated successfully');
        }

        // After successful transaction, invalidate relevant caches
        try {
            await cacheService.invalidateInventory(); // Handles 'inventory:summary:*' and 'products:*'
            await cacheService.del('dashboard:inventory');
            await cacheService.del('dashboard:inventory-value');
            await cacheService.del('dashboard:shops');
            await cacheService.del('dashboard:all');
            await cacheService.del('dashboard:summary');
            // Invalidate purchases-specific caches
            await cacheService.invalidatePattern('purchases-optimized*');
            await cacheService.invalidatePattern('purchase-stats*');
            console.log('Relevant caches invalidated after purchase update.');
        } catch (cacheError) {
            console.error('Error invalidating caches after purchase update:', cacheError);
            // Do not let cache invalidation error fail the main operation
        }

        return NextResponse.json({
            message: 'Purchase invoice updated successfully',
            data: result.fullUpdatedInvoice
        });
    } catch (error) {
        console.error(`Error updating purchase invoice ${id}:`, error);
        const details = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: { message: 'Failed to update purchase invoice', details: details } },
            { status: 500 });
    }
}

// DELETE /api/purchases/[id] - Delete a purchase invoice
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const purchaseIdStr = params.id;
    try {
        const purchaseId = parseInt(purchaseIdStr);
        if (isNaN(purchaseId)) {
            return NextResponse.json(
                { error: { message: 'Invalid purchase ID format' } },
                { status: 400 });
        }

        const purchaseToDelete = await prisma.purchaseInvoice.findUnique({
            where: { id: purchaseId },
            include: {
                items: { include: { product: true } },
                // Ensure 'distributions' is included if it's a relation,
                // or directly accessible if it's a JSON field on PurchaseInvoice
            },
        });

        if (!purchaseToDelete) {
            return NextResponse.json(
                { error: { message: 'Purchase invoice not found to delete' } },
                { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const inventoryUpdates: Array<{ productId: number, shopId: number, newQuantity: number, oldQuantity?: number }> = [];

            if (purchaseToDelete.items && purchaseToDelete.items.length > 0) {
                for (const item of purchaseToDelete.items) {
                    if (!item.product) {
                        console.warn(`Item ${item.id} for purchase ${purchaseId} is missing product data. Skipping stock adjustment.`);
                        continue;
                    }

                    const productId = item.productId;
                    const quantityToRemoveForItemTotal = item.quantity; // Total quantity for this item line

                    let itemDistributionInfo: { [shopId: string]: number } | null = null;
                    const distributionsOnInvoice = (purchaseToDelete as any).distributions;

                    // Attempt to get specific distribution for this item
                    if (
                        distributionsOnInvoice &&
                        Array.isArray(distributionsOnInvoice) &&
                        purchaseToDelete.items.indexOf(item) < distributionsOnInvoice.length
                    ) {
                        const distData = distributionsOnInvoice[purchaseToDelete.items.indexOf(item)];
                        if (distData && typeof distData === 'object' && Object.keys(distData).length > 0) {
                            itemDistributionInfo = distData as { [shopId: string]: number };
                        }
                    }

                    if (itemDistributionInfo) {
                        // Case 1: Explicit distribution data found for the item
                        console.log(`Reversing item-specific distribution for product ${productId}, purchase ${purchaseId}`);
                        for (const [shopIdStr, distributedQuantityStr] of Object.entries(itemDistributionInfo)) {
                            const shopId = shopIdStr;
                            const qtyInShopToRemove = Number(distributedQuantityStr);

                            if (isNaN(qtyInShopToRemove) || qtyInShopToRemove <= 0) continue;

                            const inventoryItem = await tx.inventoryItem.findFirst({ where: { productId, shopId: shopId } });
                            if (inventoryItem) {
                                const oldShopQuantity = inventoryItem.quantity;
                                const newShopQuantity = Math.max(0, inventoryItem.quantity - qtyInShopToRemove);
                                const updateData = {
                                    quantity: newShopQuantity,
                                    shopSpecificCost: newShopQuantity === 0 ? 0 : inventoryItem.shopSpecificCost
                                };
                                await tx.inventoryItem.update({
                                    where: { id: inventoryItem.id },
                                    data: updateData,
                                });
                                inventoryUpdates.push({ productId, shopId: Number(shopId), newQuantity: newShopQuantity, oldQuantity: oldShopQuantity });
                                console.log(`  - Reduced inventory for product ${productId} in shop ${shopId} by ${qtyInShopToRemove}. Old: ${oldShopQuantity}, New: ${newShopQuantity}`);
                            } else {
                                console.warn(`  - Inventory item not found for product ${productId} in shop ${shopId} during purchase deletion with explicit distribution. Stock may be inaccurate.`);
                            }
                        }
                    } else {
                        // Case 2: No explicit distribution for this item. Attempt to infer.
                        console.warn(`No specific distribution found for item ${productId} in deleted purchase ${purchaseId}. Attempting to infer shop(s) for stock reversal of total quantity ${quantityToRemoveForItemTotal}.`);
                        const existingInventoriesForItem = await tx.inventoryItem.findMany({
                            where: { productId: productId }
                        });

                        if (existingInventoriesForItem.length === 1) {
                            const singleShopInventory = existingInventoriesForItem[0];
                            const shopIdToDeductFrom = singleShopInventory.shopId;

                            console.log(`Product ${productId} found in single shop ${shopIdToDeductFrom}. Deducting total item quantity ${quantityToRemoveForItemTotal}.`);
                            const oldShopQuantity = singleShopInventory.quantity;
                            const newShopQuantity = Math.max(0, singleShopInventory.quantity - quantityToRemoveForItemTotal);
                            const updateDataInferred = {
                                quantity: newShopQuantity,
                                shopSpecificCost: newShopQuantity === 0 ? 0 : singleShopInventory.shopSpecificCost
                            };
                            await tx.inventoryItem.update({
                                where: { id: singleShopInventory.id },
                                data: updateDataInferred,
                            });
                            inventoryUpdates.push({ productId, shopId: Number(shopIdToDeductFrom), newQuantity: newShopQuantity, oldQuantity: oldShopQuantity });
                            console.log(`  - Reduced inventory for product ${productId} in inferred shop ${shopIdToDeductFrom} by ${quantityToRemoveForItemTotal}. Old: ${oldShopQuantity}, New: ${newShopQuantity}`);
                        } else if (existingInventoriesForItem.length === 0) {
                            console.error(`Product ${productId} (from deleted purchase ${purchaseId}) not found in any inventory. Cannot reverse stock for this item.`);
                        } else { // Product exists in multiple shops
                            console.error(`Product ${productId} (from deleted purchase ${purchaseId}) exists in multiple shops, but no specific distribution data was found on the invoice for reversal. Ambiguous. Stock not automatically reversed for this item. Manual adjustment may be needed.`);
                        }
                    }

                    // ---- BEGIN WAC Recalculation for the deleted item ----
                    const remainingPurchaseItems = await tx.purchaseInvoiceItem.findMany({
                        where: {
                            productId: productId,
                            purchaseInvoiceId: { not: purchaseId }
                        }
                    });

                    let totalRemainingQuantity = 0;
                    let totalRemainingValue = 0;
                    remainingPurchaseItems.forEach(pItem => {
                        totalRemainingQuantity += pItem.quantity;
                        totalRemainingValue += pItem.quantity * pItem.price;
                    });

                    let newCalculatedWAC = 0;
                    if (totalRemainingQuantity > 0) {
                        newCalculatedWAC = totalRemainingValue / totalRemainingQuantity;
                    }
                    await tx.product.update({
                        where: { id: productId },
                        data: { weightedAverageCost: newCalculatedWAC >= 0 ? newCalculatedWAC : 0 }
                    });
                    // ---- END WAC Recalculation ----
                }
            }

            await tx.purchaseInvoiceItem.deleteMany({ where: { purchaseInvoiceId: purchaseId } });
            await tx.purchaseInvoice.delete({ where: { id: purchaseId } });

            return { deletedInvoiceId: purchaseId, inventoryUpdates };
        });

        // Real-time updates now handled by polling system
        if (result && result.deletedInvoiceId) {
            console.log(`Purchase invoice ${result.deletedInvoiceId} deleted successfully`);
        }

        // After successful transaction, invalidate relevant caches
        try {
            await cacheService.invalidateInventory(); // Handles 'inventory:summary:*' and 'products:*'
            await cacheService.del('dashboard:inventory');
            await cacheService.del('dashboard:inventory-value');
            await cacheService.del('dashboard:shops');
            await cacheService.del('dashboard:all');
            await cacheService.del('dashboard:summary');
            // Invalidate purchases-specific caches
            await cacheService.invalidatePattern('purchases-optimized*');
            await cacheService.invalidatePattern('purchase-stats*');
            console.log('Relevant caches invalidated after purchase deletion.');
        } catch (cacheError) {
            console.error('Error invalidating caches after purchase deletion:', cacheError);
            // Do not let cache invalidation error fail the main operation
        }

        return NextResponse.json({ message: 'Purchase invoice deleted successfully' });

    } catch (error) {
        console.error(`Error deleting purchase invoice ${purchaseIdStr}:`, error);
        const details = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: { message: 'Failed to delete purchase invoice', details: details } },
            { status: 500 });
    }
}