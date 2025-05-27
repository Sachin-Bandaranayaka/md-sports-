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

        // Handle total amount field with proper priority
        if (dirtyData.totalAmount !== undefined) {
            cleanedInvoiceData.total = Number(dirtyData.totalAmount);
        } else if (dirtyData.total !== undefined) {
            cleanedInvoiceData.total = Number(dirtyData.total);
        }

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

            // Return the full updated invoice with all related data
            return await tx.purchaseInvoice.findUnique({
                where: { id: purchaseId },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
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
    const purchaseIdStr = params.id;
    try {
        const purchaseId = parseInt(purchaseIdStr);
        if (isNaN(purchaseId)) {
            return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 });
        }

        // Fetch the purchase invoice with its items and potentially distribution info
        const purchaseToDelete = await prisma.purchaseInvoice.findUnique({
            where: { id: purchaseId },
            include: {
                items: {
                    include: {
                        product: true, // Needed for product ID
                    },
                },
                // supplier: true, // Not strictly needed for stock reversal but good for context if debugging
                // Ensure your PurchaseInvoice model actually has a 'distributions' field if you use it below,
                // or a 'defaultShopId' or similar field if that's how undistributed items were handled.
            },
        });

        if (!purchaseToDelete) {
            return NextResponse.json({ error: 'Purchase invoice not found' }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Adjust inventory for each item
            if (purchaseToDelete.items && purchaseToDelete.items.length > 0) {
                for (const item of purchaseToDelete.items) {
                    if (!item.product) {
                        console.warn(`Item ${item.id} for purchase ${purchaseId} is missing product data. Skipping stock adjustment for this item.`);
                        continue;
                    }

                    const productId = item.productId;
                    const quantityToRemoveForItem = item.quantity; // Total quantity of this item on the invoice

                    // Logic to determine how this item's quantity was distributed to shops
                    // This is the most complex part and needs to match your data model and POST logic for purchases.

                    // Attempt 1: Check for item-specific distribution from 'distributions' field (if it's an array)
                    // Assumes 'distributions' is an array on PurchaseInvoice, parallel to 'items'.
                    // Each element of 'distributions' is an object like { shopId1: quantity, shopId2: quantity }
                    let itemDistributionInfo: { [shopId: string]: number } | null = null;
                    if (
                        purchaseToDelete.distributions &&
                        Array.isArray(purchaseToDelete.distributions) &&
                        purchaseToDelete.items.indexOf(item) < purchaseToDelete.distributions.length
                    ) {
                        const distData = purchaseToDelete.distributions[purchaseToDelete.items.indexOf(item)];
                        if (distData && typeof distData === 'object' && Object.keys(distData).length > 0) {
                            itemDistributionInfo = distData as { [shopId: string]: number };
                        }
                    }

                    if (itemDistributionInfo) {
                        console.log(`Reversing item-specific distribution for product ${productId}, purchase ${purchaseId}`);
                        for (const [shopIdStr, distributedQuantityStr] of Object.entries(itemDistributionInfo)) {
                            const shopId = parseInt(shopIdStr);
                            const qtyInShopToRemove = Number(distributedQuantityStr);

                            if (isNaN(shopId) || isNaN(qtyInShopToRemove) || qtyInShopToRemove <= 0) {
                                console.warn(`Invalid shop distribution data for product ${productId} in purchase ${purchaseId}: shopId='${shopIdStr}', quantity='${distributedQuantityStr}'. Skipping.`);
                                continue;
                            }

                            const inventoryItem = await tx.inventoryItem.findFirst({
                                where: { productId, shopId },
                            });

                            if (inventoryItem) {
                                await tx.inventoryItem.update({
                                    where: { id: inventoryItem.id },
                                    data: { quantity: Math.max(0, inventoryItem.quantity - qtyInShopToRemove) },
                                });
                                console.log(`  - Reduced inventory for product ${productId} in shop ${shopId} by ${qtyInShopToRemove}`);
                            } else {
                                console.warn(`  - Inventory item not found for product ${productId} in shop ${shopId} during purchase deletion. Stock may be inconsistent.`);
                            }
                        }
                    } else if ((purchaseToDelete as any).defaultShopId) {
                        // Attempt 2: Check for a 'defaultShopId' on the purchase invoice itself.
                        // Replace '(purchaseToDelete as any).defaultShopId' with the actual field name if it exists.
                        const defaultShopId = parseInt((purchaseToDelete as any).defaultShopId);
                        if (!isNaN(defaultShopId)) {
                            console.log(`Reversing stock for product ${productId} from defaultShopId ${defaultShopId} on purchase ${purchaseId}`);
                            const inventoryItem = await tx.inventoryItem.findFirst({
                                where: { productId, shopId: defaultShopId },
                            });
                            if (inventoryItem) {
                                await tx.inventoryItem.update({
                                    where: { id: inventoryItem.id },
                                    data: { quantity: Math.max(0, inventoryItem.quantity - quantityToRemoveForItem) },
                                });
                                console.log(`  - Reduced inventory for product ${productId} in shop ${defaultShopId} by ${quantityToRemoveForItem}`);
                            } else {
                                console.warn(`  - Inventory item not found for product ${productId} in default shop ${defaultShopId} during purchase deletion.`);
                            }
                        } else {
                            console.warn(`defaultShopId on purchase ${purchaseId} is invalid. Cannot determine shop for product ${productId}.`);
                        }
                    } else {
                        // Attempt 3: Fallback to a system-wide default shop (e.g., shopId 1)
                        // This is a last resort and indicates that distribution tracking might be insufficient.
                        const FALLBACK_SHOP_ID = 1; // Define your system's absolute fallback shop ID
                        console.warn(`No specific distribution or defaultShopId found for product ${productId} on purchase ${purchaseId}. Attempting fallback to shop ${FALLBACK_SHOP_ID}.`);

                        const inventoryItem = await tx.inventoryItem.findFirst({
                            where: { productId, shopId: FALLBACK_SHOP_ID },
                        });

                        if (inventoryItem) {
                            await tx.inventoryItem.update({
                                where: { id: inventoryItem.id },
                                data: { quantity: Math.max(0, inventoryItem.quantity - quantityToRemoveForItem) },
                            });
                            console.log(`  - Reduced inventory for product ${productId} in fallback shop ${FALLBACK_SHOP_ID} by ${quantityToRemoveForItem}`);
                        } else {
                            console.error(`  - FALLBACK FAILED: Inventory item not found for product ${productId} in fallback shop ${FALLBACK_SHOP_ID}. Stock not adjusted for this item for purchase ${purchaseId}.`);
                        }
                    }
                }
            }

            // 2. Delete associated payments (IF APPLICABLE - Verify Payment model schema)
            // If your Payment model does not have a direct purchaseInvoiceId field,
            // this will cause an error. Commenting out for now.
            /*
            await tx.payment.deleteMany({
                where: { purchaseInvoiceId: purchaseId }, 
            });
            console.log(`Deleted payments for purchase invoice ${purchaseId}`);
            */

            // 3. Delete purchase invoice items
            await tx.purchaseInvoiceItem.deleteMany({
                where: { purchaseInvoiceId: purchaseId },
            });
            console.log(`Deleted items for purchase invoice ${purchaseId}`);

            // 4. Delete the purchase invoice itself
            await tx.purchaseInvoice.delete({
                where: { id: purchaseId },
            });
            console.log(`Deleted purchase invoice ${purchaseId}`);

        }); // End of transaction

        return NextResponse.json({ message: 'Purchase invoice deleted successfully' });

    } catch (error) {
        console.error(`Error deleting purchase invoice ${purchaseIdStr}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete purchase invoice';
        // It's good practice to not expose raw error details to the client in production
        // For debugging, error.toString() or specific fields might be okay in dev.
        return NextResponse.json({ error: 'Failed to delete purchase invoice. Check server logs for details.' }, { status: 500 });
    }
} 