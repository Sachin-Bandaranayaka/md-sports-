import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { smsService } from '@/services/smsService';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        // Fetch invoice with all related data
        const invoice = await prisma.invoice.findUnique({
            where: { id },
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
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        const requestData = await request.json();
        const { sendSms, ...invoiceData } = requestData;

        // Update invoice with transaction to handle items
        const updatedInvoice = await prisma.$transaction(
            async (tx) => {
                const existingInvoice = await tx.invoice.findUnique({
                    where: { id },
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

                    if (quantityChange > 0) { // Deduct additional items from inventory
                        const inventoryItem = await tx.inventoryItem.findFirst({
                            where: { productId }
                        });

                        if (!inventoryItem || inventoryItem.quantity < quantityChange) {
                            const product = await tx.product.findUnique({ where: { id: productId } });
                            throw new Error(`Not enough stock for product: ${product?.name || 'Unknown Product'}. Required: ${quantityChange}, Available: ${inventoryItem?.quantity || 0}`);
                        }

                        console.log(`Deducting ${quantityChange} from inventory for product ${productId}`);
                        await tx.inventoryItem.updateMany({
                            where: { productId },
                            data: { quantity: { decrement: quantityChange } }
                        });
                    } else if (quantityChange < 0) { // Add items back to inventory
                        console.log(`Adding ${Math.abs(quantityChange)} to inventory for product ${productId}`);
                        await tx.inventoryItem.updateMany({
                            where: { productId },
                            data: { quantity: { increment: Math.abs(quantityChange) } }
                        });
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
                    notes: invoiceData.notes
                };

                // Update basic invoice details
                const updatedInvoiceDetails = await tx.invoice.update({
                    where: { id },
                    data: dataToUpdate
                });

                // Delete existing invoice items and create new ones
                // This is done after inventory adjustments to ensure data integrity
                await tx.invoiceItem.deleteMany({
                    where: { invoiceId: id }
                });

                for (const item of invoiceData.items) {
                    await tx.invoiceItem.create({
                        data: {
                            invoiceId: id,
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            total: item.quantity * item.price
                        }
                    });
                }

                // Return the complete updated invoice with relations
                return tx.invoice.findUnique({
                    where: { id },
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
            },
            { timeout: 30000 }
        );

        // Send SMS notification if requested
        if (sendSms) {
            try {
                await smsService.init();
                if (smsService.isConfigured()) {
                    // Send SMS notification asynchronously
                    smsService.sendInvoiceNotification(id)
                        .then(result => {
                            if (result.status >= 200 && result.status < 300) {
                                console.log('SMS notification sent successfully');
                            } else {
                                console.warn('Failed to send SMS notification:', result.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error sending SMS notification:', error);
                        });
                }
            } catch (smsError) {
                // Log SMS error but don't fail the request
                console.error('SMS notification error:', smsError);
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
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        await prisma.$transaction(async (tx) => {
            // 1. Get all items from the invoice
            const invoiceItems = await tx.invoiceItem.findMany({
                where: { invoiceId: id },
                select: { productId: true, quantity: true }
            });

            // 2. For each item, update inventory
            for (const item of invoiceItems) {
                // Find an inventory item for the product.
                // This assumes that if a product was sold, an inventory item for it must exist.
                // If products can exist in multiple shops, this will add to the first one found.
                // A more specific shopId might be needed if inventory is shop-specific for restocking.
                const inventoryItem = await tx.inventoryItem.findFirst({
                    where: { productId: item.productId }
                });

                if (inventoryItem) {
                    await tx.inventoryItem.update({
                        where: { id: inventoryItem.id },
                        data: { quantity: { increment: item.quantity } }
                    });
                } else {
                    // This case should ideally not happen if an invoice item was created.
                    // Log an error or handle as per business logic (e.g., create a new inventory entry)
                    console.error(`Inventory item not found for productId: ${item.productId} while trying to restock from deleted invoice ${id}.`);
                    // Optionally, throw an error to rollback the transaction if this is critical
                    // throw new Error(`Failed to restock: Inventory item not found for product ID ${item.productId}`);
                }
            }

            // 3. Delete related invoice items
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: id }
            });

            // 4. Delete related payments
            await tx.payment.deleteMany({
                where: { invoiceId: id }
            });

            // 5. Delete the invoice itself
            await tx.invoice.delete({
                where: { id }
            });
        });

        return NextResponse.json({
            success: true,
            message: 'Invoice deleted successfully and inventory restocked'
        });
    } catch (error) {
        console.error('Error deleting invoice and restocking inventory:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error deleting invoice and restocking inventory',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 