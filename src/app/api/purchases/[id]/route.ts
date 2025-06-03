import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';
import { emitInventoryLevelUpdated } from '@/lib/utils/websocket';

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

                    const oldItemDistribution = originalPurchase.distributions && Array.isArray(originalPurchase.distributions) && originalPurchase.distributions[originalPurchase.items.indexOf(oldItem)]
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
                                await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantity: newQuantity } });
                                inventoryUpdates.push({ productId: oldItem.productId, shopId: Number(shopId), newQuantity, quantityChange: newQuantity - oldShopQuantity, source: 'purchase_update' });
                            }
                        }
                    } else {
                        const shopId = '1';
                        const inventory = await tx.inventoryItem.findFirst({ where: { productId: oldItem.productId, shopId: shopId } });
                        if (inventory) {
                            const oldShopQuantity = inventory.quantity;
                            const newQuantity = Math.max(0, inventory.quantity - oldItem.quantity);
                            await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantity: newQuantity } });
                            inventoryUpdates.push({ productId: oldItem.productId, shopId: Number(shopId), newQuantity, quantityChange: newQuantity - oldShopQuantity, source: 'purchase_update' });
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
                            if (inventory) {
                                finalQuantity = inventory.quantity + qtyToAdd;
                                await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantity: finalQuantity } });
                            } else {
                                finalQuantity = qtyToAdd;
                                await tx.inventoryItem.create({ data: { productId: Number(newItem.productId), shopId: shopId, quantity: finalQuantity } });
                            }
                            inventoryUpdates.push({ productId: Number(newItem.productId), shopId: Number(shopId), newQuantity: finalQuantity, quantityChange: finalQuantity - oldInvQty, source: 'purchase_update' });
                        }
                    } else {
                        const shopId = '1';
                        const inventory = await tx.inventoryItem.findFirst({ where: { productId: Number(newItem.productId), shopId: shopId } });
                        let finalQuantity = 0;
                        const oldInvQty = inventory?.quantity || 0;
                        if (inventory) {
                            finalQuantity = inventory.quantity + itemQuantityTotal;
                            await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantity: finalQuantity } });
                        } else {
                            finalQuantity = itemQuantityTotal;
                            await tx.inventoryItem.create({ data: { productId: Number(newItem.productId), shopId: shopId, quantity: finalQuantity } });
                        }
                        inventoryUpdates.push({ productId: Number(newItem.productId), shopId: Number(shopId), newQuantity: finalQuantity, quantityChange: finalQuantity - oldInvQty, source: 'purchase_update' });
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

        const io = getSocketIO();
        if (io && result && result.fullUpdatedInvoice) {
            io.emit(WEBSOCKET_EVENTS.PURCHASE_INVOICE_UPDATED, result.fullUpdatedInvoice);
            result.inventoryUpdates.forEach(upd => {
                emitInventoryLevelUpdated(upd.productId, {
                    shopId: upd.shopId,
                    newQuantity: upd.newQuantity,
                    quantityChange: upd.quantityChange,
                    source: upd.source
                });
            });
            console.log('Emitted PURCHASE_INVOICE_UPDATED and INVENTORY_LEVEL_UPDATED events');
        }
        return NextResponse.json(result.fullUpdatedInvoice);
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
                // No 'distributions' field is explicitly included here, relies on it being on purchaseToDelete if it exists
            },
        });

        if (!purchaseToDelete) {
            return NextResponse.json(
                { error: { message: 'Purchase invoice not found to delete' } },
                { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const inventoryUpdates: Array<{ productId: number, shopId: number, newQuantity: number, oldQuantity: number }> = [];

            if (purchaseToDelete.items && purchaseToDelete.items.length > 0) {
                for (const item of purchaseToDelete.items) {
                    if (!item.product) {
                        console.warn(`Item ${item.id} for purchase ${purchaseId} is missing product data. Skipping stock adjustment.`);
                        continue;
                    }

                    const productId = item.productId;
                    const quantityToRemoveForItem = item.quantity;

                    let itemDistributionInfo: { [shopId: string]: number } | null = null;
                    // Assuming purchaseToDelete.distributions might be an array of objects or a single object.
                    // This part needs to align with how distributions are actually structured on PurchaseInvoice model.
                    // The provided file content for PurchaseInvoice creation (POST route) uses `distributions`
                    // as potentially an array of distribution objects per item or a general one.
                    // Let's assume it's an array parallel to items for this logic.
                    const distributionsOnInvoice = (purchaseToDelete as any).distributions; // Accessing potentially dynamic field

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
                        console.log(`Reversing item-specific distribution for product ${productId}, purchase ${purchaseId}`);
                        for (const [shopIdStr, distributedQuantityStr] of Object.entries(itemDistributionInfo)) {
                            const shopId = shopIdStr;
                            const qtyInShopToRemove = Number(distributedQuantityStr);

                            if (isNaN(qtyInShopToRemove) || qtyInShopToRemove <= 0) continue;

                            const inventoryItem = await tx.inventoryItem.findFirst({ where: { productId, shopId: shopId } });
                            if (inventoryItem) {
                                const oldShopQuantity = inventoryItem.quantity;
                                const newShopQuantity = Math.max(0, inventoryItem.quantity - qtyInShopToRemove);
                                await tx.inventoryItem.update({
                                    where: { id: inventoryItem.id },
                                    data: { quantity: newShopQuantity },
                                });
                                inventoryUpdates.push({ productId, shopId: Number(shopId), newQuantity: newShopQuantity, quantityChange: newShopQuantity - oldShopQuantity, source: 'purchase_delete' });
                                console.log(`  - Reduced inventory for product ${productId} in shop ${shopId} by ${qtyInShopToRemove}. Old: ${oldShopQuantity}, New: ${newShopQuantity}`);
                            } else {
                                console.warn(`  - Inventory item not found for product ${productId} in shop ${shopId} during purchase deletion.`);
                            }
                        }
                    } else if ((purchaseToDelete as any).defaultShopId) {
                        const defaultShopId = String((purchaseToDelete as any).defaultShopId);
                        if (defaultShopId) {
                            console.log(`Reversing stock for product ${productId} from defaultShopId ${defaultShopId} on purchase ${purchaseId}`);
                            const inventoryItem = await tx.inventoryItem.findFirst({ where: { productId, shopId: defaultShopId } });
                            if (inventoryItem) {
                                const oldShopQuantity = inventoryItem.quantity;
                                const newShopQuantity = Math.max(0, inventoryItem.quantity - quantityToRemoveForItem);
                                await tx.inventoryItem.update({
                                    where: { id: inventoryItem.id },
                                    data: { quantity: newShopQuantity },
                                });
                                inventoryUpdates.push({ productId, shopId: Number(defaultShopId), newQuantity: newShopQuantity, quantityChange: newShopQuantity - oldShopQuantity, source: 'purchase_delete' });
                                console.log(`  - Reduced inventory for product ${productId} in shop ${defaultShopId} by ${quantityToRemoveForItem}. Old: ${oldShopQuantity}, New: ${newShopQuantity}`);
                            } else {
                                console.warn(`  - Inventory item not found for product ${productId} in default shop ${defaultShopId}.`);
                            }
                        }
                    } else {
                        const FALLBACK_SHOP_ID = '1';
                        console.warn(`No specific distribution or defaultShopId. Attempting fallback to shop ${FALLBACK_SHOP_ID} for product ${productId}, purchase ${purchaseId}.`);
                        const inventoryItem = await tx.inventoryItem.findFirst({ where: { productId, shopId: FALLBACK_SHOP_ID } });
                        if (inventoryItem) {
                            const oldShopQuantity = inventoryItem.quantity;
                            const newShopQuantity = Math.max(0, inventoryItem.quantity - quantityToRemoveForItem);
                            await tx.inventoryItem.update({
                                where: { id: inventoryItem.id },
                                data: { quantity: newShopQuantity },
                            });
                            inventoryUpdates.push({ productId, shopId: Number(FALLBACK_SHOP_ID), newQuantity: newShopQuantity, quantityChange: newShopQuantity - oldShopQuantity, source: 'purchase_delete' });
                            console.log(`  - Reduced inventory for product ${productId} in fallback shop ${FALLBACK_SHOP_ID} by ${quantityToRemoveForItem}. Old: ${oldShopQuantity}, New: ${newShopQuantity}`);
                        } else {
                            console.error(`  - FALLBACK FAILED: Inventory item not found for product ${productId} in fallback shop ${FALLBACK_SHOP_ID}.`);
                        }
                    }

                    // ---- BEGIN WAC Recalculation for the deleted item ----
                    // Recalculate WAC based on remaining purchase history after deleting this invoice
                    const remainingPurchaseItems = await tx.purchaseInvoiceItem.findMany({
                        where: {
                            productId: productId,
                            purchaseInvoiceId: { not: purchaseId } // Exclude the invoice being deleted
                        }
                    });

                    let totalRemainingQuantity = 0;
                    let totalRemainingValue = 0;

                    remainingPurchaseItems.forEach(purchaseItem => {
                        totalRemainingQuantity += purchaseItem.quantity;
                        totalRemainingValue += purchaseItem.quantity * purchaseItem.price;
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

            // Payment deletion - uncommented to delete associated payments
            // await tx.payment.deleteMany({ where: { purchaseInvoiceId: purchaseId } });

            await tx.purchaseInvoiceItem.deleteMany({ where: { purchaseInvoiceId: purchaseId } });
            console.log(`Deleted items for purchase invoice ${purchaseId}`);

            await tx.purchaseInvoice.delete({ where: { id: purchaseId } });
            console.log(`Deleted purchase invoice ${purchaseId}`);

            return { deletedInvoiceId: purchaseId, inventoryUpdates };
        });

        const io = getSocketIO();
        if (io) {
            io.emit(WEBSOCKET_EVENTS.PURCHASE_INVOICE_DELETED, { id: purchaseId });

            // Emit inventory updates
            if (result.inventoryUpdates && result.inventoryUpdates.length > 0) {
                result.inventoryUpdates.forEach(update => {
                    emitInventoryLevelUpdated(update.productId, {
                        shopId: update.shopId,
                        newQuantity: update.newQuantity,
                        quantityChange: update.quantityChange,
                        source: update.source
                    });
                });
            }

            console.log(`Emitted WebSocket events for purchase invoice deletion ${purchaseId}`);
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