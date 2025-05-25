import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { smsService } from '@/services/smsService';

export async function GET() {
    try {
        // Fetch invoices from database using Prisma with item count
        const invoices = await prisma.invoice.findMany({
            include: {
                customer: true,
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        productId: true
                    }
                },
                _count: {
                    select: {
                        items: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format the response to include item count
        const formattedInvoices = invoices.map(invoice => {
            const { _count, ...rest } = invoice;
            return {
                ...rest,
                itemCount: _count.items
            };
        });

        return NextResponse.json(formattedInvoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching invoices',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const invoiceData = await request.json();

        // Create new invoice using Prisma within a transaction
        const invoice = await prisma.$transaction(
            async (tx) => {
                // Create the invoice first
                const createdInvoice = await tx.invoice.create({
                    data: {
                        invoiceNumber: invoiceData.invoiceNumber,
                        customerId: invoiceData.customerId,
                        total: invoiceData.total,
                        status: invoiceData.status || 'Pending',
                        paymentMethod: invoiceData.paymentMethod || 'Cash',
                    },
                });

                // Process each item and update inventory
                if (invoiceData.items && Array.isArray(invoiceData.items)) {
                    for (const item of invoiceData.items) {
                        // Create invoice item
                        await tx.invoiceItem.create({
                            data: {
                                invoiceId: createdInvoice.id,
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price,
                                total: item.quantity * item.price
                            }
                        });

                        // Get all inventory items for this product
                        const inventoryItems = await tx.inventoryItem.findMany({
                            where: { productId: item.productId },
                            orderBy: { updatedAt: 'asc' } // Process oldest inventory first
                        });

                        let remainingQuantity = item.quantity;

                        // If there's no inventory, throw an error
                        if (inventoryItems.length === 0) {
                            throw new Error(`No inventory found for product ID ${item.productId}`);
                        }

                        // Check if we have enough inventory across all shops
                        const totalInventory = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
                        if (totalInventory < remainingQuantity) {
                            throw new Error(`Insufficient inventory for product ID ${item.productId}. Available: ${totalInventory}, Requested: ${item.quantity}`);
                        }

                        // Deduct from inventory, shop by shop until fulfilled
                        for (const inventoryItem of inventoryItems) {
                            if (remainingQuantity <= 0) break;

                            if (inventoryItem.quantity > 0) {
                                const deductAmount = Math.min(remainingQuantity, inventoryItem.quantity);

                                // Update inventory
                                await tx.inventoryItem.update({
                                    where: { id: inventoryItem.id },
                                    data: {
                                        quantity: inventoryItem.quantity - deductAmount,
                                        updatedAt: new Date()
                                    }
                                });

                                remainingQuantity -= deductAmount;
                            }
                        }
                    }
                }

                // Return the complete invoice with relations
                return tx.invoice.findUnique({
                    where: { id: createdInvoice.id },
                    include: {
                        customer: true,
                        items: true
                    }
                });
            },
            { timeout: 30000 }
        );

        // Check if SMS notifications are enabled and send invoice notification
        try {
            await smsService.init();
            if (smsService.isConfigured()) {
                // Send SMS notification asynchronously
                smsService.sendInvoiceNotification(invoice.id)
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

        return NextResponse.json(
            {
                success: true,
                message: 'Invoice created successfully',
                data: invoice
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error creating invoice',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 