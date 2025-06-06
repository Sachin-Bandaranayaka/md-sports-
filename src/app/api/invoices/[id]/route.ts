import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { smsService } from '@/services/smsService';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';
import { emitInventoryLevelUpdated } from '@/lib/utils/websocket';
import { cacheService } from '@/lib/cache';

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
                shop: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        contact_person: true,
                        phone: true,
                        email: true,
                        address_line1: true,
                        address_line2: true,
                        city: true,
                        state: true,
                        postal_code: true,
                        country: true
                    }
                },
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

        // Check if this is only a status update to "Paid"
        // More specific check: make sure it only has the status field and it's being changed to 'Paid'
        const isOnlyStatusUpdate =
            Object.keys(invoiceData).length === 1 &&
            invoiceData.status !== undefined &&
            ['Paid', 'Pending'].includes(invoiceData.status);

        // If it's only updating status, handle it without affecting inventory
        if (isOnlyStatusUpdate) {
            console.log(`Processing status-only update to ${invoiceData.status} for invoice ${invoiceId}`);
            const updatedInvoice = await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: invoiceData.status },
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

            return NextResponse.json(updatedInvoice);
        }

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
                            items: true // Keep for inventory adjustment if needed, though items will be replaced
                        }
                    });

                    if (!existingInvoice) {
                        throw new Error('Invoice not found');
                    }

                    // --- Inventory Adjustment Logic (existing) --- 
                    // This logic might need review if items are fully replaced, 
                    // as it compares old vs new item quantities. 
                    // For profit, we are deleting and re-creating items.
                    const oldItemsMap = new Map();
                    const newItemsMap = new Map();

                    for (const item of existingInvoice.items) {
                        const existingQuantity = oldItemsMap.get(item.productId) || 0;
                        oldItemsMap.set(item.productId, existingQuantity + item.quantity);
                    }

                    for (const item of invoiceData.items) {
                        const productId = parseInt(item.productId.toString());
                        const existingQuantity = newItemsMap.get(productId) || 0;
                        newItemsMap.set(productId, existingQuantity + item.quantity);
                    }

                    const allProductIds = new Set([
                        ...Array.from(oldItemsMap.keys()),
                        ...Array.from(newItemsMap.keys())
                    ]);

                    console.log('Invoice update - Inventory changes (based on diff):');
                    for (const productId of allProductIds) {
                        const oldQuantity = oldItemsMap.get(productId) || 0;
                        const newQuantity = newItemsMap.get(productId) || 0;
                        const quantityChange = newQuantity - oldQuantity;
                        console.log(`Product ID ${productId}: Old=${oldQuantity}, New=${newQuantity}, Change=${quantityChange}`);
                        if (quantityChange !== 0) {
                            // Ensure affectedShopId is a string if invoiceData.shopId is a string
                            let affectedShopId: string | undefined = invoiceData.shopId ? String(invoiceData.shopId) : undefined;

                            inventoryUpdatesForEvent.push({
                                productId: productId as number,
                                shopId: affectedShopId,
                                quantityChange: quantityChange,
                            });
                            if (quantityChange > 0) { // Deduct (more items sold or added)
                                if (affectedShopId) {
                                    const availableInventory = await tx.inventoryItem.findMany({
                                        where: { productId: parseInt(productId.toString()), shopId: affectedShopId }
                                    });
                                    const totalAvailable = availableInventory.reduce((sum, item) => sum + item.quantity, 0);
                                    if (totalAvailable < quantityChange) {
                                        throw new Error(`Insufficient inventory for product ID ${productId} in shop ${affectedShopId}. Available: ${totalAvailable}, Required increase: ${quantityChange}`);
                                    }
                                    // This should ideally be a more robust way to pick which inventory item to decrement
                                    await tx.inventoryItem.updateMany({
                                        where: { productId: parseInt(productId.toString()), shopId: affectedShopId, quantity: { gte: quantityChange } }, // Simplistic update
                                        data: { quantity: { decrement: quantityChange } }
                                    });
                                } else {
                                    await tx.inventoryItem.updateMany({
                                        where: { productId: parseInt(productId.toString()), quantity: { gte: quantityChange } }, // Simplistic update
                                        data: { quantity: { decrement: quantityChange } }
                                    });
                                }
                            } else { // Add back (fewer items sold or items removed)
                                if (affectedShopId) {
                                    await tx.inventoryItem.updateMany({
                                        where: { productId: parseInt(productId.toString()), shopId: affectedShopId },
                                        data: { quantity: { increment: Math.abs(quantityChange) } }
                                    });
                                } else {
                                    await tx.inventoryItem.updateMany({
                                        where: { productId: parseInt(productId.toString()) },
                                        data: { quantity: { increment: Math.abs(quantityChange) } }
                                    });
                                }
                            }
                        }
                    }
                    // --- End Inventory Adjustment Logic ---

                    // Delete old invoice items before adding new ones for profit recalc
                    await tx.invoiceItem.deleteMany({ where: { invoiceId: invoiceId } });

                    let newCalculatedTotalInvoiceAmount = 0;
                    let newTotalInvoiceProfit = 0;

                    if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
                        const productIdsForNewItems = invoiceData.items.map((item: any) => parseInt(item.productId.toString()));
                        const productsData = await tx.product.findMany({
                            where: { id: { in: productIdsForNewItems } },
                            select: { id: true, weightedAverageCost: true }
                        });
                        const productCostMap = new Map(productsData.map(p => [p.id, p.weightedAverageCost || 0]));

                        for (const item of invoiceData.items) {
                            const productId = parseInt(item.productId.toString());
                            const costPrice = productCostMap.get(productId) || 0;
                            const itemSellingTotal = item.quantity * item.price;
                            const totalItemCost = costPrice * item.quantity;
                            const itemProfit = itemSellingTotal - totalItemCost;

                            await tx.invoiceItem.create({
                                data: {
                                    invoiceId: invoiceId,
                                    productId: productId,
                                    quantity: item.quantity,
                                    price: item.price,
                                    total: itemSellingTotal,
                                    costPrice: costPrice,
                                    profit: itemProfit
                                }
                            });
                            newCalculatedTotalInvoiceAmount += itemSellingTotal;
                            newTotalInvoiceProfit += itemProfit;
                        }
                    }

                    const newProfitMargin = newCalculatedTotalInvoiceAmount > 0 ? (newTotalInvoiceProfit / newCalculatedTotalInvoiceAmount) * 100 : 0;

                    const dataToUpdate: any = {
                        status: invoiceData.status,
                        paymentMethod: invoiceData.paymentMethod,
                        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : undefined,
                        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined,
                        notes: invoiceData.notes,
                        shopId: invoiceData.shopId ? String(invoiceData.shopId) : null, // Ensure shopId is string or null
                        total: newCalculatedTotalInvoiceAmount, // Updated total
                        totalProfit: newTotalInvoiceProfit,   // Updated profit
                        profitMargin: newProfitMargin         // Updated profit margin
                    };

                    if (invoiceData.customerId) {
                        dataToUpdate.customerId = invoiceData.customerId;
                    } else {
                        // If customerId is explicitly null or undefined, disconnect it if your schema allows
                        // dataToUpdate.customer = { disconnect: true }; 
                        // Or ensure it's set to null if the field is optional and you want to clear it.
                        // For now, we assume if not provided, it's not changed or handled by frontend state.
                    }

                    console.log('Updating invoice details with profit:', { invoiceId, dataToUpdate });

                    const finalUpdatedInvoice = await tx.invoice.update({
                        where: { id: invoiceId },
                        data: dataToUpdate,
                        include: {
                            customer: true,
                            items: { include: { product: true } },
                            payments: true
                        }
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
                                // First delete any receipts that reference these payments
                                const paymentIds = existingPayments.map(p => p.id);
                                await tx.receipt.deleteMany({
                                    where: { paymentId: { in: paymentIds } }
                                });
                                
                                // Then delete the payments
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
                                    referenceNumber: `AUTO-UPDATE-${finalUpdatedInvoice.invoiceNumber}`,
                                }
                            });
                        }
                    }

                    return finalUpdatedInvoice;
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
                // Use the new consistent function for inventory updates
                emitInventoryLevelUpdated(update.productId, {
                    shopId: update.shopId,
                    quantityChange: update.quantityChange,
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

        // Invalidate related caches after successful update
        await Promise.all([
            cacheService.invalidateInvoices(),
            cacheService.invalidateInventory(),
            cacheService.del('dashboard:summary') // Invalidate dashboard cache
        ]);

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

        const inventoryUpdatesForEvent: Array<{ productId: number, shopId?: number, quantityChange: number }> = [];

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

        // Invalidate related caches after successful deletion
        await Promise.all([
            cacheService.invalidateInvoices(),
            cacheService.invalidateInventory(),
            cacheService.del('dashboard:summary') // Invalidate dashboard cache
        ]);

        return NextResponse.json({
            success: true,
            message: `Invoice ${deletedInvoiceResult?.invoiceNumber || invoiceId} deleted successfully`,
            data: { id: deletedInvoiceResult?.id }
        });

    } catch (error) {
        console.error('Error deleting invoice:', error);
        const err = error as Error;

        // Check for foreign key constraint violation with receipts
        if (err.message && err.message.includes('Receipt_paymentId_fkey')) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Cannot delete invoice with associated receipts. Please delete the receipts first.',
                    error: err.message
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: err.message || 'Error deleting invoice', error: err.stack },
            { status: 500 }
        );
    }
}