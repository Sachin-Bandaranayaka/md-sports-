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
        const purchase = await prisma.purchaseInvoice.findUnique({
            where: {
                id: purchaseId
            }
        });

        if (!purchase) {
            return NextResponse.json(
                { error: 'Purchase invoice not found' },
                { status: 404 }
            );
        }

        // Extract items and distributions from the request
        const { items, distributions, ...invoiceData } = body;

        // Remove fields that should not be passed to Prisma's update
        const { id: _, createdAt, updatedAt, supplier, notes, ...dirtyData } = invoiceData;

        // Prepare clean data for Prisma update
        const cleanedInvoiceData: any = {};

        // Copy allowed fields
        if (dirtyData.invoiceNumber) cleanedInvoiceData.invoiceNumber = dirtyData.invoiceNumber;
        if (dirtyData.status) cleanedInvoiceData.status = dirtyData.status;
        if (dirtyData.date) cleanedInvoiceData.date = dirtyData.date;
        if (dirtyData.dueDate !== undefined) cleanedInvoiceData.dueDate = dirtyData.dueDate;
        if (dirtyData.totalAmount !== undefined) cleanedInvoiceData.total = Number(dirtyData.totalAmount);
        if (distributions) cleanedInvoiceData.distributions = distributions;

        // Handle supplier relationship properly
        if (dirtyData.supplierId) {
            cleanedInvoiceData.supplier = {
                connect: { id: Number(dirtyData.supplierId) }
            };
        }

        // Update the purchase invoice in a transaction
        const updatedPurchase = await prisma.$transaction(async (tx) => {
            // Update the purchase invoice
            const updated = await tx.purchaseInvoice.update({
                where: {
                    id: purchaseId
                },
                data: cleanedInvoiceData
            });

            // Handle items update if provided
            if (items && Array.isArray(items)) {
                // Get current items to manage inventory changes
                const currentItems = await tx.purchaseInvoiceItem.findMany({
                    where: {
                        purchaseInvoiceId: purchaseId
                    }
                });

                // Delete existing items
                await tx.purchaseInvoiceItem.deleteMany({
                    where: {
                        purchaseInvoiceId: purchaseId
                    }
                });

                // Create new items
                for (const item of items) {
                    console.log('Processing item:', JSON.stringify(item));

                    // Skip items without a product ID
                    if (!item.productId) {
                        console.log('Skipping item with no productId');
                        continue;
                    }

                    try {
                        await tx.purchaseInvoiceItem.create({
                            data: {
                                purchaseInvoiceId: purchaseId,
                                productId: Number(item.productId),
                                quantity: Number(item.quantity || 0),
                                price: Number(item.price || 0),
                                total: Number(item.total || 0)
                            }
                        });
                    } catch (itemError) {
                        console.error('Error creating purchase item:', itemError);
                        throw itemError;
                    }
                }
            }

            // Return the updated purchase with items
            return tx.purchaseInvoice.findUnique({
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
        });

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
            where: {
                id: purchaseId
            },
            include: {
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

        // Delete in a transaction
        await prisma.$transaction(async (tx) => {
            // For each purchase item, reverse the inventory updates
            for (const item of purchase.items) {
                // First check if this invoice has distribution data
                const distributionData = purchase.distributions &&
                    typeof purchase.distributions === 'object' &&
                    Array.isArray(purchase.distributions) ?
                    purchase.distributions[purchase.items.indexOf(item)] :
                    (purchase.distributions && typeof purchase.distributions === 'object' ?
                        purchase.distributions : null);

                if (distributionData && Object.keys(distributionData).length > 0) {
                    // Distributed to specific shops, reverse each allocation
                    for (const [shopIdStr, quantity] of Object.entries(distributionData)) {
                        const shopId = parseInt(shopIdStr);
                        const qty = Number(quantity);

                        if (qty <= 0 || isNaN(qty) || isNaN(shopId)) continue;

                        // Find inventory for this product/shop combination
                        const inventory = await tx.inventoryItem.findFirst({
                            where: {
                                productId: item.productId,
                                shopId: shopId
                            }
                        });

                        if (inventory) {
                            // Reduce the quantity
                            const newQuantity = Math.max(0, inventory.quantity - qty);

                            if (newQuantity > 0) {
                                await tx.inventoryItem.update({
                                    where: { id: inventory.id },
                                    data: { quantity: newQuantity }
                                });
                            } else {
                                // If quantity would be zero, delete the inventory record
                                await tx.inventoryItem.delete({
                                    where: { id: inventory.id }
                                });
                            }
                        }
                    }
                } else {
                    // Default behavior - everything was added to shop 1
                    const shopId = 1;
                    const inventory = await tx.inventoryItem.findFirst({
                        where: {
                            productId: item.productId,
                            shopId: shopId
                        }
                    });

                    if (inventory) {
                        // Reduce the quantity
                        const newQuantity = Math.max(0, inventory.quantity - item.quantity);

                        if (newQuantity > 0) {
                            await tx.inventoryItem.update({
                                where: { id: inventory.id },
                                data: { quantity: newQuantity }
                            });
                        } else {
                            // If quantity would be zero, delete the inventory record
                            await tx.inventoryItem.delete({
                                where: { id: inventory.id }
                            });
                        }
                    }
                }

                // Update the product's weighted average cost
                // This is a simplification, as calculating the exact reversal of WAC is complex
                // Get all remaining purchase items for this product
                const remainingPurchaseItems = await tx.purchaseInvoiceItem.findMany({
                    where: {
                        productId: item.productId,
                        purchaseInvoiceId: { not: purchaseId }
                    }
                });

                // Calculate new weighted average cost based on remaining purchases
                if (remainingPurchaseItems.length > 0) {
                    const totalQuantity = remainingPurchaseItems.reduce((sum, item) => sum + item.quantity, 0);
                    const weightedTotal = remainingPurchaseItems.reduce(
                        (sum, item) => sum + (item.quantity * item.price), 0
                    );

                    if (totalQuantity > 0) {
                        const newWAC = weightedTotal / totalQuantity;
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { weightedAverageCost: newWAC }
                        });
                    }
                }
            }

            // Delete associated items
            await tx.purchaseInvoiceItem.deleteMany({
                where: {
                    purchaseInvoiceId: purchaseId
                }
            });

            // Delete the purchase invoice
            await tx.purchaseInvoice.delete({
                where: {
                    id: purchaseId
                }
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