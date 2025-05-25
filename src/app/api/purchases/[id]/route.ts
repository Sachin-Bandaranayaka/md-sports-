import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
                { error: 'Invalid purchase ID' },
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
                { error: 'Purchase invoice not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(purchase);
    } catch (error) {
        console.error(`Error fetching purchase invoice ${id}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch purchase invoice' },
            { status: 500 }
        );
    }
}

// PUT /api/purchases/[id] - Update a purchase invoice
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id; // Store params.id early to avoid async issues
    try {
        const purchaseId = parseInt(id);

        if (isNaN(purchaseId)) {
            return NextResponse.json(
                { error: 'Invalid purchase ID' },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Fetch the original purchase invoice with its items and distributions
        const originalPurchase = await prisma.purchaseInvoice.findUnique({
            where: { id: purchaseId },
            include: {
                items: { include: { product: true } },
            }
        });

        if (!originalPurchase) {
            return NextResponse.json(
                { error: 'Purchase invoice not found' },
                { status: 404 }
            );
        }

        // Extract items and distributions from the request
        const { items: newItemsData, distributions: newDistributionsData, ...invoiceData } = body;

        // Remove fields that should not be passed to Prisma's update for the invoice itself
        const { id: _, createdAt, updatedAt, supplier, notes, ...dirtyData } = invoiceData;

        // Prepare clean data for Prisma update
        const cleanedInvoiceData: any = {};
        if (dirtyData.invoiceNumber) cleanedInvoiceData.invoiceNumber = dirtyData.invoiceNumber;
        if (dirtyData.status) cleanedInvoiceData.status = dirtyData.status;
        if (dirtyData.date) cleanedInvoiceData.date = new Date(dirtyData.date);
        if (dirtyData.dueDate !== undefined) cleanedInvoiceData.dueDate = dirtyData.dueDate ? new Date(dirtyData.dueDate) : null;
        if (dirtyData.totalAmount !== undefined) cleanedInvoiceData.total = Number(dirtyData.totalAmount);

        // Store new distributions if provided, otherwise keep original or set to null
        cleanedInvoiceData.distributions = newDistributionsData !== undefined ? newDistributionsData : originalPurchase.distributions;


        // Handle supplier relationship properly
        if (dirtyData.supplierId) {
            cleanedInvoiceData.supplier = {
                connect: { id: Number(dirtyData.supplierId) }
            };
        } else if (dirtyData.supplierId === null && originalPurchase.supplierId) {
            cleanedInvoiceData.supplier = {
                disconnect: true
            };
        }


        // Update the purchase invoice in a transaction
        const updatedPurchase = await prisma.$transaction(async (tx) => {
            // 1. Reverse inventory and WAC for original items
            if (originalPurchase.items && originalPurchase.items.length > 0) {
                for (const oldItem of originalPurchase.items) {
                    const productToUpdate = await tx.product.findUnique({ where: { id: oldItem.productId } });
                    if (!productToUpdate) continue;

                    let currentTotalProductQuantity = 0;
                    const allInventoryForProduct = await tx.inventoryItem.findMany({ where: { productId: oldItem.productId } });
                    currentTotalProductQuantity = allInventoryForProduct.reduce((sum, inv) => sum + inv.quantity, 0);

                    // Determine shop distributions for this old item
                    const oldItemDistribution = originalPurchase.distributions && Array.isArray(originalPurchase.distributions) && originalPurchase.distributions[originalPurchase.items.indexOf(oldItem)]
                        ? originalPurchase.distributions[originalPurchase.items.indexOf(oldItem)]
                        : (originalPurchase.distributions && typeof originalPurchase.distributions === 'object' && !Array.isArray(originalPurchase.distributions) ? originalPurchase.distributions : null);


                    if (oldItemDistribution && Object.keys(oldItemDistribution).length > 0) {
                        for (const [shopIdStr, quantityInShop] of Object.entries(oldItemDistribution)) {
                            const shopId = parseInt(shopIdStr);
                            const qtyToRemove = Number(quantityInShop);
                            if (qtyToRemove <= 0 || isNaN(qtyToRemove) || isNaN(shopId)) continue;

                            const inventory = await tx.inventoryItem.findFirst({
                                where: { productId: oldItem.productId, shopId: shopId }
                            });
                            if (inventory) {
                                const newQuantity = Math.max(0, inventory.quantity - qtyToRemove);
                                await tx.inventoryItem.update({
                                    where: { id: inventory.id },
                                    data: { quantity: newQuantity }
                                });
                            }
                        }
                    } else { // Default to shop 1 if no distribution
                        const shopId = 1;
                        const inventory = await tx.inventoryItem.findFirst({
                            where: { productId: oldItem.productId, shopId: shopId }
                        });
                        if (inventory) {
                            const newQuantity = Math.max(0, inventory.quantity - oldItem.quantity);
                            await tx.inventoryItem.update({
                                where: { id: inventory.id },
                                data: { quantity: newQuantity }
                            });
                        }
                    }

                    // Recalculate WAC after reversing this item
                    // (Total Value - Item Value) / (Total Quantity - Item Quantity)
                    const remainingTotalQuantity = currentTotalProductQuantity - oldItem.quantity;
                    if (remainingTotalQuantity > 0 && productToUpdate.weightedAverageCost !== null) {
                        const currentTotalValue = currentTotalProductQuantity * productToUpdate.weightedAverageCost;
                        const oldItemValue = oldItem.quantity * oldItem.price;
                        const newWAC = (currentTotalValue - oldItemValue) / remainingTotalQuantity;
                        await tx.product.update({
                            where: { id: oldItem.productId },
                            data: { weightedAverageCost: newWAC > 0 ? newWAC : 0 }
                        });
                    } else if (remainingTotalQuantity <= 0) {
                        await tx.product.update({ // No items left or only this one, WAC becomes 0 or based on other logic
                            where: { id: oldItem.productId },
                            data: { weightedAverageCost: 0 }
                        });
                    }
                }
            }

            // Delete existing purchase invoice items
            await tx.purchaseInvoiceItem.deleteMany({
                where: { purchaseInvoiceId: purchaseId }
            });

            // Update the purchase invoice itself
            const updatedInvoice = await tx.purchaseInvoice.update({
                where: { id: purchaseId },
                data: cleanedInvoiceData
            });

            // 3. Add new items to inventory and calculate new WAC
            if (newItemsData && Array.isArray(newItemsData)) {
                for (let i = 0; i < newItemsData.length; i++) {
                    const newItem = newItemsData[i];
                    if (!newItem.productId || !newItem.quantity || newItem.quantity <= 0) continue;

                    await tx.purchaseInvoiceItem.create({
                        data: {
                            purchaseInvoiceId: purchaseId,
                            productId: Number(newItem.productId),
                            quantity: Number(newItem.quantity),
                            price: Number(newItem.price || 0),
                            total: Number(newItem.quantity) * Number(newItem.price || 0)
                        }
                    });

                    const productToUpdate = await tx.product.findUnique({ where: { id: Number(newItem.productId) } });
                    if (!productToUpdate) continue;

                    let currentTotalProductQuantityBeforeNewItem = 0;
                    const allInventoryForProduct = await tx.inventoryItem.findMany({ where: { productId: Number(newItem.productId) } });
                    currentTotalProductQuantityBeforeNewItem = allInventoryForProduct.reduce((sum, inv) => sum + inv.quantity, 0);

                    const currentWAC = productToUpdate.weightedAverageCost || 0;
                    const newItemQuantity = Number(newItem.quantity);
                    const newItemCost = Number(newItem.price);

                    let newWeightedAverageCost = newItemCost;
                    if (currentTotalProductQuantityBeforeNewItem > 0) {
                        newWeightedAverageCost =
                            ((currentTotalProductQuantityBeforeNewItem * currentWAC) + (newItemQuantity * newItemCost)) /
                            (currentTotalProductQuantityBeforeNewItem + newItemQuantity);
                    } else if (newItemQuantity > 0) { // This is the first stock for this item
                        newWeightedAverageCost = newItemCost;
                    }


                    await tx.product.update({
                        where: { id: Number(newItem.productId) },
                        data: { weightedAverageCost: newWeightedAverageCost }
                    });

                    // Handle distribution for the new item
                    const newItemDistribution = newDistributionsData && Array.isArray(newDistributionsData) && newDistributionsData[i]
                        ? newDistributionsData[i]
                        : (newDistributionsData && typeof newDistributionsData === 'object' && !Array.isArray(newDistributionsData) ? newDistributionsData : null);

                    if (newItemDistribution && Object.keys(newItemDistribution).length > 0) {
                        for (const [shopIdStr, quantityInShop] of Object.entries(newItemDistribution)) {
                            const shopId = parseInt(shopIdStr);
                            const qtyToAdd = Number(quantityInShop);
                            if (qtyToAdd <= 0 || isNaN(qtyToAdd) || isNaN(shopId)) continue;

                            const inventory = await tx.inventoryItem.findFirst({
                                where: { productId: Number(newItem.productId), shopId: shopId }
                            });
                            if (inventory) {
                                await tx.inventoryItem.update({
                                    where: { id: inventory.id },
                                    data: { quantity: inventory.quantity + qtyToAdd }
                                });
                            } else {
                                await tx.inventoryItem.create({
                                    data: {
                                        productId: Number(newItem.productId),
                                        shopId: shopId,
                                        quantity: qtyToAdd
                                    }
                                });
                            }
                        }
                    } else { // Default to shop 1
                        const shopId = 1;
                        const inventory = await tx.inventoryItem.findFirst({
                            where: { productId: Number(newItem.productId), shopId: shopId }
                        });
                        if (inventory) {
                            await tx.inventoryItem.update({
                                where: { id: inventory.id },
                                data: { quantity: inventory.quantity + newItemQuantity }
                            });
                        } else {
                            await tx.inventoryItem.create({
                                data: {
                                    productId: Number(newItem.productId),
                                    shopId: shopId,
                                    quantity: newItemQuantity
                                }
                            });
                        }
                    }
                }
            }

            // Return the updated purchase with items
            return tx.purchaseInvoice.findUnique({
                where: { id: purchaseId },
                include: {
                    supplier: true,
                    items: { include: { product: true } }
                }
            });
        }, { timeout: 30000 }); // Increased timeout for complex transaction

        return NextResponse.json(updatedPurchase);
    } catch (error) {
        console.error(`Error updating purchase invoice ${id}:`, error);

        // Return a more detailed error message
        let errorMessage = 'Failed to update purchase invoice';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { error: errorMessage, details: error instanceof Error ? error.stack : String(error) },
            { status: 500 }
        );
    }
}

// DELETE /api/purchases/[id] - Delete a purchase invoice
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id; // Store params.id early to avoid async issues
    try {
        const purchaseId = parseInt(id);

        if (isNaN(purchaseId)) {
            return NextResponse.json(
                { error: 'Invalid purchase ID' },
                { status: 400 }
            );
        }

        // First get the purchase invoice with its items to know what needs to be reversed
        const purchase = await prisma.purchaseInvoice.findUnique({
            where: { id: purchaseId },
            include: {
                items: { include: { product: true } },
            }
        });

        if (!purchase) {
            return NextResponse.json(
                { error: 'Purchase invoice not found' },
                { status: 404 }
            );
        }

        // Delete in a transaction
        await prisma.$transaction(async (tx) => {
            // For each purchase item, reverse the inventory updates and WAC
            for (const item of purchase.items) {
                const productToUpdate = await tx.product.findUnique({ where: { id: item.productId } });
                if (!productToUpdate) continue;

                let currentTotalProductQuantity = 0;
                const allInventoryForProduct = await tx.inventoryItem.findMany({ where: { productId: item.productId } });
                currentTotalProductQuantity = allInventoryForProduct.reduce((sum, inv) => sum + inv.quantity, 0);

                // Determine shop distributions for this item
                const itemDistribution = purchase.distributions && Array.isArray(purchase.distributions) && purchase.distributions[purchase.items.indexOf(item)]
                    ? purchase.distributions[purchase.items.indexOf(item)]
                    : (purchase.distributions && typeof purchase.distributions === 'object' && !Array.isArray(purchase.distributions) ? purchase.distributions : null);

                if (itemDistribution && Object.keys(itemDistribution).length > 0) {
                    for (const [shopIdStr, quantityInShop] of Object.entries(itemDistribution)) {
                        const shopId = parseInt(shopIdStr);
                        const qtyToRemove = Number(quantityInShop);
                        if (qtyToRemove <= 0 || isNaN(qtyToRemove) || isNaN(shopId)) continue;

                        const inventory = await tx.inventoryItem.findFirst({
                            where: { productId: item.productId, shopId: shopId }
                        });
                        if (inventory) {
                            const newQuantity = Math.max(0, inventory.quantity - qtyToRemove);
                            // Only update if quantity changes, delete if it becomes zero
                            if (newQuantity !== inventory.quantity) {
                                if (newQuantity > 0) {
                                    await tx.inventoryItem.update({
                                        where: { id: inventory.id },
                                        data: { quantity: newQuantity }
                                    });
                                } else {
                                    // If quantity is zero after reduction, consider deleting the inventory item
                                    // For now, we'll just set it to 0. Deletion might be too aggressive.
                                    await tx.inventoryItem.update({
                                        where: { id: inventory.id },
                                        data: { quantity: 0 }
                                    });
                                }
                            }
                        }
                    }
                } else { // Default to shop 1 if no distribution
                    const shopId = 1;
                    const inventory = await tx.inventoryItem.findFirst({
                        where: { productId: item.productId, shopId: shopId }
                    });
                    if (inventory) {
                        const newQuantity = Math.max(0, inventory.quantity - item.quantity);
                        if (newQuantity !== inventory.quantity) {
                            if (newQuantity > 0) {
                                await tx.inventoryItem.update({
                                    where: { id: inventory.id },
                                    data: { quantity: newQuantity }
                                });
                            } else {
                                await tx.inventoryItem.update({
                                    where: { id: inventory.id },
                                    data: { quantity: 0 }
                                });
                            }
                        }
                    }
                }

                // Recalculate WAC
                // (Total Value - Item Value) / (Total Quantity - Item Quantity)
                const remainingTotalQuantity = currentTotalProductQuantity - item.quantity;
                if (remainingTotalQuantity > 0 && productToUpdate.weightedAverageCost !== null) {
                    const currentTotalValue = currentTotalProductQuantity * productToUpdate.weightedAverageCost;
                    const itemValue = item.quantity * item.price;
                    const newWAC = (currentTotalValue - itemValue) / remainingTotalQuantity;
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { weightedAverageCost: newWAC > 0 ? newWAC : 0 }
                    });
                } else if (remainingTotalQuantity <= 0) { // No items left or this was the only one
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { weightedAverageCost: 0 } // Set WAC to 0 if no stock remaining from purchases
                    });
                }
            }

            // Delete associated items
            await tx.purchaseInvoiceItem.deleteMany({
                where: { purchaseInvoiceId: purchaseId }
            });

            // Delete the purchase invoice
            await tx.purchaseInvoice.delete({
                where: { id: purchaseId }
            });
        });

        return NextResponse.json(
            { message: 'Purchase invoice deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error(`Error deleting purchase invoice ${id}:`, error);
        return NextResponse.json(
            { error: 'Failed to delete purchase invoice' },
            { status: 500 }
        );
    }
} 