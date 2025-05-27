import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { smsService } from '@/services/smsService';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';

const ITEMS_PER_PAGE = 15;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);
    const status = searchParams.get('status') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const searchQuery = searchParams.get('search') || '';

    let whereClause: any = {};

    if (status) {
        whereClause.status = status;
    }
    if (paymentMethod) {
        whereClause.paymentMethod = paymentMethod;
    }
    if (searchQuery) {
        whereClause.OR = [
            { invoiceNumber: { contains: searchQuery, mode: 'insensitive' } },
            { customer: { name: { contains: searchQuery, mode: 'insensitive' } } },
            // Note: Searching by total (number) directly in OR with string fields is tricky.
            // If total search is critical, it might need separate handling or conversion.
        ];
        // If searchQuery is a number, attempt to search by total. This is a simple check.
        const numericQuery = parseFloat(searchQuery);
        if (!isNaN(numericQuery)) {
            // Add to OR or handle as a separate condition if it makes sense for your logic
            // whereClause.OR.push({ total: numericQuery }); 
            // For now, Prisma doesn't directly support OR with mixed types well in this structure.
            // A more robust solution might involve conditional where clauses or raw queries if this is essential.
        }
    }

    try {
        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                customer: true, // Already includes customer data
                _count: {
                    select: { items: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        const totalInvoices = await prisma.invoice.count({ where: whereClause });

        const formattedInvoices = invoices.map(invoice => {
            const { _count, customer, ...rest } = invoice;
            return {
                ...rest,
                customerName: customer?.name || 'Unknown Customer',
                customerId: customer?.id, // ensure customerId is present
                itemCount: _count.items,
                // Keep original date fields, formatting can be done on client or server page component
            };
        });

        return NextResponse.json({
            invoices: formattedInvoices,
            totalPages: Math.ceil(totalInvoices / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching invoices',
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const invoiceData = await request.json();
        const { sendSms, ...invoiceDetails } = invoiceData;

        const inventoryUpdatesForEvent: Array<{ productId: number, shopId: number, newQuantity: number, oldQuantity: number }> = [];

        const invoice = await prisma.$transaction(
            async (tx) => {
                const createdInvoice = await tx.invoice.create({
                    data: {
                        invoiceNumber: invoiceDetails.invoiceNumber,
                        customerId: invoiceDetails.customerId,
                        total: invoiceDetails.total,
                        status: 'Pending',
                        paymentMethod: invoiceDetails.paymentMethod || 'Cash',
                        invoiceDate: invoiceDetails.invoiceDate ? new Date(invoiceDetails.invoiceDate) : new Date(),
                        dueDate: invoiceDetails.dueDate ? new Date(invoiceDetails.dueDate) : null,
                        notes: invoiceDetails.notes || '',
                        shopId: invoiceDetails.shopId,
                    },
                });

                if (invoiceDetails.paymentMethod === 'Cash') {
                    await tx.payment.create({
                        data: {
                            invoiceId: createdInvoice.id,
                            customerId: invoiceDetails.customerId,
                            amount: invoiceDetails.total,
                            paymentMethod: 'Cash',
                            referenceNumber: `AUTO-${createdInvoice.invoiceNumber}`,
                        }
                    });
                }

                if (invoiceDetails.items && Array.isArray(invoiceDetails.items)) {
                    for (const item of invoiceDetails.items) {
                        await tx.invoiceItem.create({
                            data: {
                                invoiceId: createdInvoice.id,
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price,
                                total: item.quantity * item.price
                            }
                        });

                        const inventoryItems = await tx.inventoryItem.findMany({
                            where: { productId: item.productId },
                            orderBy: { updatedAt: 'asc' }
                        });
                        let remainingQuantity = item.quantity;
                        if (inventoryItems.length === 0) throw new Error(`No inventory for product ID ${item.productId}`);
                        const totalInventory = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
                        if (totalInventory < remainingQuantity) throw new Error(`Insufficient inventory for product ID ${item.productId}. Have: ${totalInventory}, Need: ${item.quantity}`);

                        for (const inventoryItem of inventoryItems) {
                            if (remainingQuantity <= 0) break;
                            if (inventoryItem.quantity > 0) {
                                const deductAmount = Math.min(remainingQuantity, inventoryItem.quantity);
                                const oldShopQuantity = inventoryItem.quantity;
                                const newShopQuantity = inventoryItem.quantity - deductAmount;

                                await tx.inventoryItem.update({
                                    where: { id: inventoryItem.id },
                                    data: { quantity: newShopQuantity, updatedAt: new Date() }
                                });

                                inventoryUpdatesForEvent.push({
                                    productId: item.productId,
                                    shopId: inventoryItem.shopId,
                                    newQuantity: newShopQuantity,
                                    oldQuantity: oldShopQuantity
                                });
                                remainingQuantity -= deductAmount;
                            }
                        }
                    }
                }
                return tx.invoice.findUnique({
                    where: { id: createdInvoice.id },
                    include: { customer: true, items: true }
                });
            },
            { timeout: 30000 }
        );

        // Emit INVENTORY_LEVEL_UPDATED events
        const io = getSocketIO();
        if (io && inventoryUpdatesForEvent.length > 0) {
            inventoryUpdatesForEvent.forEach(update => {
                io.emit(WEBSOCKET_EVENTS.INVENTORY_LEVEL_UPDATED, {
                    productId: update.productId,
                    shopId: update.shopId,
                    newQuantity: update.newQuantity,
                    oldQuantity: update.oldQuantity,
                    source: 'sales_invoice_creation'
                });
            });
            console.log(`Emitted ${inventoryUpdatesForEvent.length} INVENTORY_LEVEL_UPDATED events for invoice ${invoice?.id}`);
        }

        if (sendSms) {
            try {
                await smsService.init();
                if (smsService.isConfigured()) {
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
                console.error('SMS notification error:', smsError);
            }
        }

        return NextResponse.json(
            { success: true, message: 'Invoice created successfully', data: invoice },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json(
            { success: false, message: 'Error creating invoice', error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 