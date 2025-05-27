import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { smsService } from '@/services/smsService';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        if (!params?.id || isNaN(Number(params.id))) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        const invoiceId = Number(params.id);

        // Fetch invoice with all related data
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                },
                payments: true
            }
        });

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching invoice',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        if (!params?.id || isNaN(Number(params.id))) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        const invoiceId = Number(params.id);
        const requestData = await request.json();
        console.log('Invoice update request data:', { invoiceId, ...requestData });
        const { sendSms, ...invoiceData } = requestData;

        // Ensure invoiceData.items is an array, default to empty if not provided or not an array
        if (!Array.isArray(invoiceData.items)) {
            console.log('invoiceData.items was not an array, defaulting to [] for update.');
            invoiceData.items = [];
        }

        const inventoryUpdatesForEvent: Array<{ productId: number, shopId?: number, newQuantity?: number, oldQuantity?: number, quantityChange: number }> = [];

        // Update invoice with transaction to handle items
        const updatedInvoice = await prisma.$transaction(
            async (tx) => {
                try {
                    const existingInvoice = await tx.invoice.findUnique({
                        where: { id: invoiceId },
                        include: {
                            items: true // Crucial for comparing old and new items
                        }
                    });

                    if (!existingInvoice) {
                        throw new Error('Invoice not found');
                    }

                    // --- Inventory Adjustment Logic --- 
                    const oldItemsMap = new Map();
                    const newItemsMap = new Map();

                    // Aggregate quantities by product ID
                    for (const item of existingInvoice.items) {
                        const existingQuantity = oldItemsMap.get(item.productId) || 0;
                        oldItemsMap.set(item.productId, existingQuantity + item.quantity);
                    }

                    for (const item of invoiceData.items) {
                        const existingQuantity = newItemsMap.get(item.productId) || 0;
                        newItemsMap.set(item.productId, existingQuantity + item.quantity);
                    }

                    // Process unique product IDs from both old and new items
                    const allProductIds = new Set([
                        ...Array.from(oldItemsMap.keys()),
                        ...Array.from(newItemsMap.keys())
                    ]);

                    // Log inventory changes for debugging
                    console.log('Invoice update - Inventory changes:');

                    // Process each unique product
                    for (const productId of allProductIds) {
                        const oldQuantity = oldItemsMap.get(productId) || 0;
                        const newQuantity = newItemsMap.get(productId) || 0;
                        const quantityChange = newQuantity - oldQuantity;

                        console.log(`Product ID ${productId}: Old=${oldQuantity}, New=${newQuantity}, Change=${quantityChange}`);

                        if (quantityChange !== 0) {
                            // Attempt to find specific shop inventory items for this product
                            // This is an important part for emitting granular shop-specific events.
                            // The current logic uses updateMany by productId, which is not shop-specific.
                            // If we want shop-specific events, this part needs to be more intelligent
                            // to determine which shops are affected by quantityChange.

                            // For now, we'll record the change at the product level.
                            // If a shopId can be determined (e.g. if invoice is tied to one shop, or items are from one shop)
                            // then that shopId should be used.
                            // Assuming for now sales invoices can pull from any shop or a primary shop for the product.

                            let affectedShopId: number | undefined = undefined;
                            // If invoiceData.shopId is available, it means the sale is tied to a specific shop
                            // and inventory should ideally be deducted from this shop.
                            // The existing logic does not seem to use invoiceData.shopId for inventory deduction.
                            if (invoiceData.shopId) {
                                affectedShopId = invoiceData.shopId;
                            }

                            // Log the intended change for the event payload
                            // The actual new/old quantities per shop might be complex to get accurately here
                            // without refactoring the inventory update logic itself.
                            inventoryUpdatesForEvent.push({
                                productId: productId as number,
                                shopId: affectedShopId, // This might be undefined if not determinable here
                                quantityChange: quantityChange,
                                // newQuantity/oldQuantity for specific shop would need more info
                            });

                            if (quantityChange > 0) { // Deduct (more items sold)
                                // Current logic: tx.inventoryItem.updateMany({ where: { productId }, data: { quantity: { decrement: quantityChange } } });
                                // This is not shop-specific. To make it shop-specific for event, we'd need to know *which* shop(s) had stock decremented.
                                // If tied to invoiceData.shopId:
                                if (affectedShopId) {
                                    await tx.inventoryItem.updateMany({ where: { productId: productId as number, shopId: affectedShopId }, data: { quantity: { decrement: quantityChange } } });
                                } else {
                                    // Fallback to general decrement if no shop specified or if product can be from any shop
                                    // This is where the original logic might have been:
                                    await tx.inventoryItem.updateMany({ where: { productId: productId as number }, data: { quantity: { decrement: quantityChange } } });
                                }
                            } else { // Add back (fewer items sold or items removed)
                                if (affectedShopId) {
                                    await tx.inventoryItem.updateMany({ where: { productId: productId as number, shopId: affectedShopId }, data: { quantity: { increment: Math.abs(quantityChange) } } });
                                } else {
                                    await tx.inventoryItem.updateMany({ where: { productId: productId as number }, data: { quantity: { increment: Math.abs(quantityChange) } } });
                                }
                            }
                        } else {
                            console.log(`No inventory change needed for product ${productId}`);
                        }
                    }
                    // --- End Inventory Adjustment Logic ---

                    const dataToUpdate = {
                        total: invoiceData.total, // Ensure total is recalculated based on new items on client
                        status: invoiceData.status,
                        paymentMethod: invoiceData.paymentMethod,
                        // Correct way to update customer relationship
                        customer: invoiceData.customerId ? {
                            connect: { id: invoiceData.customerId }
                        } : undefined,
                        // Add date fields directly to the update object
                        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : undefined,
                        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined,
                        notes: invoiceData.notes,
                        shopId: invoiceData.shopId // Ensure shopId is updated on the invoice itself
                    };

                    console.log('Updating invoice details:', { invoiceId, dataToUpdate });

                    // Update basic invoice details
                    const updatedInvoiceDetails = await tx.invoice.update({
                        where: { id: invoiceId },
                        data: dataToUpdate
                    });

                    // Handle cash payment method
                    if (invoiceData.paymentMethod === 'Cash') {
                        // Check if there's already a payment record
                        const existingPayments = await tx.payment.findMany({
                            where: { invoiceId: invoiceId }
                        });

                        const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.amount, 0);

                        // If no payments or total paid doesn't match invoice total, create/update payment
                        if (existingPayments.length === 0 || totalPaid !== invoiceData.total) {
                            // Delete existing payments if any
                            if (existingPayments.length > 0) {
                                await tx.payment.deleteMany({
                                    where: { invoiceId: invoiceId }
                                });
                            }

                            // Create a new payment for the full amount
                            await tx.payment.create({
                                data: {
                                    invoiceId: invoiceId,
                                    customerId: invoiceData.customerId,
                                    amount: invoiceData.total,
                                    paymentMethod: 'Cash',
                                    referenceNumber: `AUTO-UPDATE-${updatedInvoiceDetails.invoiceNumber}`,
                                }
                            });
                        }
                    }

                    console.log('Deleting existing invoice items for invoice:', invoiceId);
                    // Delete existing invoice items and create new ones
                    // This is done after inventory adjustments to ensure data integrity
                    await tx.invoiceItem.deleteMany({
                        where: { invoiceId: invoiceId }
                    });

                    console.log('Creating new invoice items:', invoiceData.items);
                    for (const item of invoiceData.items) {
                        await tx.invoiceItem.create({
                            data: {
                                invoiceId: invoiceId,
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price,
                                total: item.quantity * item.price
                            }
                        });
                    }

                    // Return the complete updated invoice with relations
                    return tx.invoice.findUnique({
                        where: { id: invoiceId },
                        include: {
                            customer: true,
                            items: {
                                include: {
                                    product: true
                                }
                            },
                            payments: true
                        }
                    });
                } catch (txError) {
                    console.error('Transaction error:', txError);
                    throw txError;
                }
            },
            { timeout: 30000 }
        );

        // Emit INVENTORY_LEVEL_UPDATED events
        const io = getSocketIO();
        if (io && inventoryUpdatesForEvent.length > 0) {
            inventoryUpdatesForEvent.forEach(update => {
                // If shopId is not defined here, the client needs to handle this as a general product update
                io.emit(WEBSOCKET_EVENTS.INVENTORY_LEVEL_UPDATED, {
                    productId: update.productId,
                    shopId: update.shopId, // This may be undefined
                    quantityChange: update.quantityChange, // Sending the delta
                    // newQuantity/oldQuantity for specific shop is hard to get without full inventory query here
                    source: 'sales_invoice_update'
                });
            });
            console.log(`Emitted ${inventoryUpdatesForEvent.length} INVENTORY_LEVEL_UPDATED events for updated invoice ${invoiceId}`);
        }

        // Send SMS notification if requested
        if (sendSms && updatedInvoice) {
            try {
                await smsService.init();
                if (smsService.isConfigured()) {
                    // Send SMS notification asynchronously
                    smsService.sendInvoiceUpdateNotification(updatedInvoice.id)
                        .then(result => {
                            if (result.status >= 200 && result.status < 300) {
                                console.log('SMS update notification sent successfully');
                            } else {
                                console.warn('Failed to send SMS update notification:', result.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error sending SMS update notification:', error);
                        });
                }
            } catch (smsError) {
                // Log SMS error but don't fail the request
                console.error('SMS update notification error:', smsError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Invoice updated successfully',
            data: updatedInvoice
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error updating invoice',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        if (!params?.id || isNaN(Number(params.id))) {
            return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
        }
        const invoiceId = Number(params.id);

        const inventoryUpdatesForEvent: Array<{productId: number, shopId?: number, quantityChange: number}> = [];

        // Use Prisma transaction to ensure atomicity
        const deletedInvoiceResult = await prisma.$transaction(async (tx) => {
            const invoiceToDelete = await tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { items: true, customer: true } // Include items for inventory adjustment & customer for context
            });

            if (!invoiceToDelete) {
                throw new Error('Invoice not found for deletion');
            }

            // Adjust inventory for each item deleted from the invoice
            if (invoiceToDelete.items && invoiceToDelete.items.length > 0) {
                for (const item of invoiceToDelete.items) {
                    // Add item quantity back to inventory
                    // Similar to PUT, we need to determine the shopId if possible.
                    // If the invoice had a shopId, we assume items are returned to that shop's inventory.
                    let targetShopId: number | undefined = invoiceToDelete.shopId || undefined;
                    
                    // If no shopId on invoice, this becomes a general increment for the product.
                    // For more precise shop-specific return, the original shop source of item would be needed.
                    await tx.inventoryItem.updateMany({
                        where: { 
                            productId: item.productId,
                            ...(targetShopId && { shopId: targetShopId }) // Conditionally add shopId to where clause
                        },
                        data: { quantity: { increment: item.quantity } }
                    });

                    inventoryUpdatesForEvent.push({
                        productId: item.productId,
                        shopId: targetShopId, // May be undefined
                        quantityChange: item.quantity, // Positive, as it's being added back
                    });
                }
            }

            // Delete related payments first (if any)
            await tx.payment.deleteMany({
                where: { invoiceId: invoiceId }
            });

            // Delete invoice items
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: invoiceId }
            });

            // Finally, delete the invoice itself
            await tx.invoice.delete({
                where: { id: invoiceId }
            });

            return { id: invoiceId, customerId: invoiceToDelete.customerId, invoiceNumber: invoiceToDelete.invoiceNumber }; // Return some info about the deleted invoice
        });

        // Emit INVENTORY_LEVEL_UPDATED events
        const io = getSocketIO();
        if (io && inventoryUpdatesForEvent.length > 0) {
            inventoryUpdatesForEvent.forEach(update => {
                io.emit(WEBSOCKET_EVENTS.INVENTORY_LEVEL_UPDATED, {
                    productId: update.productId,
                    shopId: update.shopId, // May be undefined
                    quantityChange: update.quantityChange, // Positive change (added back)
                    source: 'sales_invoice_deletion' 
                });
            });
            console.log(`Emitted ${inventoryUpdatesForEvent.length} INVENTORY_LEVEL_UPDATED events for deleted invoice ${invoiceId}`);
        }
        
        // Also emit an INVOICE_DELETED event (if you have one defined and need it on client)
        if (io && deletedInvoiceResult) {
             io.emit(WEBSOCKET_EVENTS.INVOICE_DELETE, { id: deletedInvoiceResult.id }); // Assuming INVOICE_DELETE is defined
             console.log(`Emitted INVOICE_DELETE event for invoice ${deletedInvoiceResult.id}`);
        }


        return NextResponse.json({
            success: true,
            message: `Invoice ${deletedInvoiceResult?.invoiceNumber || invoiceId} deleted successfully`,
            data: { id: deletedInvoiceResult?.id }
        });

    } catch (error) {
        console.error('Error deleting invoice:', error);
        const err = error as Error;
        return NextResponse.json(
            { success: false, message: err.message || 'Error deleting invoice', error: err.stack }, 
            { status: 500 }
        );
    }
} 