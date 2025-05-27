import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';

// GET /api/purchases - Get all purchase invoices
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const supplierId = searchParams.get('supplierId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Build the where clause for Prisma
        const whereClause: any = {};

        if (search) {
            // Search across multiple fields: invoiceNumber, supplier name, item product name
            whereClause.OR = [
                {
                    invoiceNumber: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    supplier: {
                        name: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                // Searching by item product name requires a more complex query if we want to keep it efficient.
                // For simplicity now, we'll stick to invoiceNumber and supplier name for the main search.
                // If product name search is critical, it might need a separate handling or different data structure.
            ];
        }

        if (status) {
            whereClause.status = status;
        }

        if (supplierId) {
            whereClause.supplierId = parseInt(supplierId);
        }

        if (startDate && endDate) {
            whereClause.date = { // Assuming filter by invoice date, not createdAt
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (startDate) {
            whereClause.date = {
                gte: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.date = {
                lte: new Date(endDate)
            };
        }

        const [purchases, totalCount] = await prisma.$transaction([
            prisma.purchaseInvoice.findMany({
                where: whereClause,
                include: {
                    supplier: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    date: 'desc' // More common to sort by invoice date
                },
                skip: skip,
                take: limit
            }),
            prisma.purchaseInvoice.count({ where: whereClause })
        ]);

        return NextResponse.json({
            data: purchases,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching purchase invoices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch purchase invoices' },
            { status: 500 }
        );
    }
}

// POST /api/purchases - Create a new purchase invoice
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Generate a more robust invoice number
        if (!body.invoiceNumber) {
            const today = new Date();
            const year = today.getFullYear().toString().slice(-2); // Last 2 digits of year
            const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
            const day = today.getDate().toString().padStart(2, '0'); // Day (01-31)
            // Get count of invoices for today to make it sequential, or use a random part
            // For simplicity, using a timestamp fragment for uniqueness here.
            // In a real app, a dedicated sequence generator per day/month is better.
            const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            body.invoiceNumber = `PI-${year}${month}${day}-${randomPart}`;
        }

        // Extract items and distributions from the request
        const { items, distributions, totalAmount, paidAmount, date, dueDate, notes, ...rest } = body;

        // Only include fields that exist in the Prisma schema
        const invoiceData: any = {
            invoiceNumber: body.invoiceNumber,
            supplierId: parseInt(body.supplierId as unknown as string) || 0,
            total: totalAmount || 0,
            status: body.status || 'unpaid',
            date: date ? new Date(date) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
            distributions: distributions
        };

        // Create the purchase invoice with items in a transaction
        const purchase = await prisma.$transaction(
            async (tx) => {
                // Create the purchase invoice
                const createdInvoice = await tx.purchaseInvoice.create({
                    data: invoiceData
                });

                const inventoryUpdates: Array<{ productId: number, shopId: number, newQuantity: number }> = [];

                // Create the purchase invoice items and update inventory
                if (items && Array.isArray(items)) {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        const itemDistribution = distributions && distributions[i] ? distributions[i] : null;

                        // Create purchase invoice item
                        await tx.purchaseInvoiceItem.create({
                            data: {
                                purchaseInvoiceId: createdInvoice.id,
                                productId: parseInt(item.productId),
                                quantity: item.quantity,
                                price: item.unitPrice || 0,
                                total: (item.quantity * item.unitPrice) || 0
                            }
                        });

                        // Get current product data
                        const product = await tx.product.findUnique({
                            where: { id: parseInt(item.productId) },
                            select: { id: true, weightedAverageCost: true }
                        });

                        // Get current inventory quantity for this product across all shops
                        const inventoryItems = await tx.inventoryItem.findMany({
                            where: { productId: parseInt(item.productId) }
                        });

                        const currentTotalQuantity = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
                        const newQuantity = item.quantity;
                        const currentCost = product?.weightedAverageCost || 0;
                        const newCost = item.unitPrice;

                        // Calculate new weighted average cost
                        // (Current Quantity * Current WAC + New Quantity * New Cost) / (Current Quantity + New Quantity)
                        let newWeightedAverageCost = newCost; // Default to new cost if there's no existing inventory

                        if (currentTotalQuantity > 0) {
                            newWeightedAverageCost =
                                ((currentTotalQuantity * currentCost) + (newQuantity * newCost)) /
                                (currentTotalQuantity + newQuantity);
                        }

                        // Update product with new weighted average cost
                        await tx.product.update({
                            where: { id: parseInt(item.productId) },
                            data: { weightedAverageCost: newWeightedAverageCost }
                        });

                        // Handle distribution across shops
                        if (itemDistribution && Object.keys(itemDistribution).length > 0) {
                            // Distribute to specific shops as specified
                            for (const [shopIdStr, quantity] of Object.entries(itemDistribution)) {
                                const shopId = parseInt(shopIdStr);
                                const qty = Number(quantity);

                                if (qty <= 0) continue;

                                // Check if inventory exists for this product/shop combination
                                const existingInventory = await tx.inventoryItem.findFirst({
                                    where: {
                                        productId: parseInt(item.productId),
                                        shopId: shopId
                                    }
                                });

                                // Update or create inventory
                                let finalQuantity = 0;
                                if (existingInventory) {
                                    finalQuantity = existingInventory.quantity + qty;
                                    await tx.inventoryItem.update({
                                        where: { id: existingInventory.id },
                                        data: { quantity: finalQuantity }
                                    });
                                } else {
                                    finalQuantity = qty;
                                    await tx.inventoryItem.create({
                                        data: {
                                            productId: parseInt(item.productId),
                                            shopId: shopId,
                                            quantity: finalQuantity,
                                        }
                                    });
                                }
                                inventoryUpdates.push({ productId: parseInt(item.productId), shopId, newQuantity: finalQuantity });
                            }
                        } else if (body.defaultShopId) { // Distribute all to a default shop if specified
                            const shopId = parseInt(body.defaultShopId as string);
                            const qty = item.quantity;

                            const existingInventory = await tx.inventoryItem.findFirst({
                                where: {
                                    productId: parseInt(item.productId),
                                    shopId: shopId
                                }
                            });
                            if (existingInventory) {
                                finalQuantity = existingInventory.quantity + qty;
                                await tx.inventoryItem.update({
                                    where: { id: existingInventory.id },
                                    data: { quantity: finalQuantity }
                                });
                            } else {
                                finalQuantity = qty;
                                await tx.inventoryItem.create({
                                    data: {
                                        productId: parseInt(item.productId),
                                        shopId: shopId,
                                        quantity: finalQuantity,
                                    }
                                });
                            }
                            inventoryUpdates.push({ productId: parseInt(item.productId), shopId, newQuantity: finalQuantity });
                        } else {
                            // Fallback: if no distribution and no default shopId, what to do?
                            // Option: Don't update inventory, or add to a predefined main/default shop (e.g. shopId 1)
                            // For now, let's assume if no distribution/defaultShopId, inventory is not managed at shop level here
                            // Or, as a simple fallback, let's attempt to add to shopId 1 if it exists (VERY SIMPLISTIC)
                            const defaultShopIdFallback = 1; // This should be a configurable or better handled default
                            const qty = item.quantity;
                            try {
                                const existingInventory = await tx.inventoryItem.findFirst({
                                    where: {
                                        productId: parseInt(item.productId),
                                        shopId: defaultShopIdFallback
                                    }
                                });
                                if (existingInventory) {
                                    finalQuantity = existingInventory.quantity + qty;
                                    await tx.inventoryItem.update({
                                        where: { id: existingInventory.id },
                                        data: { quantity: finalQuantity }
                                    });
                                } else {
                                    // Check if shopId 1 exists before creating. This is still very basic.
                                    const shopOneExists = await tx.shop.findUnique({ where: { id: defaultShopIdFallback } });
                                    if (shopOneExists) {
                                        finalQuantity = qty;
                                        await tx.inventoryItem.create({
                                            data: {
                                                productId: parseInt(item.productId),
                                                shopId: defaultShopIdFallback,
                                                quantity: finalQuantity,
                                            }
                                        });
                                    }
                                }
                                inventoryUpdates.push({ productId: parseInt(item.productId), shopId: defaultShopIdFallback, newQuantity: finalQuantity });
                            } catch (e) {
                                console.warn(`Could not update inventory for product ${item.productId} in fallback shop ${defaultShopIdFallback}:`, e)
                            }
                        }
                    }
                }

                // If there's a paidAmount, create a payment record
                if (body.paidAmount && body.paidAmount > 0) {
                    await tx.payment.create({
                        data: {
                            purchaseInvoiceId: createdInvoice.id,
                            amount: parseFloat(body.paidAmount as unknown as string) || 0,
                            paymentDate: new Date(), // Or use a date from body if provided
                            paymentMethod: body.paymentMethod || 'cash' // Default or from body
                        }
                    });
                }

                // Return the created invoice along with inventory updates for event emission
                return { createdInvoice, inventoryUpdates };
            },
            { timeout: 30000 }
        );

        // Emit WebSocket events after successful transaction
        const io = getSocketIO();
        if (io && purchase) {
            const fullPurchaseInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: purchase.createdInvoice.id },
                include: { supplier: true, items: { include: { product: true } } }
            });
            io.emit(WEBSOCKET_EVENTS.PURCHASE_INVOICE_CREATED, fullPurchaseInvoice);

            // Emit inventory level updates
            if (purchase.inventoryUpdates && purchase.inventoryUpdates.length > 0) {
                purchase.inventoryUpdates.forEach(update => {
                    io.emit(WEBSOCKET_EVENTS.INVENTORY_LEVEL_UPDATED, {
                        productId: update.productId,
                        shopId: update.shopId,
                        // You might want to send the absolute new quantity or the change
                        // Sending absolute new quantity is often simpler for client to update state
                        newQuantity: update.newQuantity, // Assuming this is the final new quantity
                        source: 'purchase_creation'
                    });
                });
            }
            console.log('Emitted PURCHASE_INVOICE_CREATED and INVENTORY_LEVEL_UPDATED events');
        }

        return NextResponse.json(purchase.createdInvoice, { status: 201 });
    } catch (error) {
        console.error('Error creating purchase invoice:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to create purchase invoice', details: errorMessage },
            { status: 500 }
        );
    }
} 