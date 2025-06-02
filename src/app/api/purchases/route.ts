import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';
import { emitInventoryLevelUpdated } from '@/lib/utils/websocket';

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
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: { message: 'Failed to fetch purchase invoices', details: message } },
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
                                price: item.price || 0,
                                total: (item.quantity * item.price) || 0
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
                        const newCost = item.price;

                        // --- BEGIN DEBUG LOGS ---
                        console.log(`[WAC_DEBUG] Product ID: ${item.productId}`);
                        console.log(`[WAC_DEBUG] Current Total Quantity: ${currentTotalQuantity}, Type: ${typeof currentTotalQuantity}`);
                        console.log(`[WAC_DEBUG] Current Cost (WAC from DB): ${currentCost}, Type: ${typeof currentCost}`);
                        console.log(`[WAC_DEBUG] New Quantity (from invoice item): ${newQuantity}, Type: ${typeof newQuantity}`);
                        console.log(`[WAC_DEBUG] New Cost (from invoice item): ${newCost}, Type: ${typeof newCost}`);
                        // --- END DEBUG LOGS ---

                        // Calculate new weighted average cost
                        // (Current Quantity * Current WAC + New Quantity * New Cost) / (Current Quantity + New Quantity)
                        let newWeightedAverageCost = newCost; // Default to new cost if there's no existing inventory

                        if (currentTotalQuantity > 0) {
                            newWeightedAverageCost =
                                ((currentTotalQuantity * currentCost) + (newQuantity * newCost)) /
                                (currentTotalQuantity + newQuantity);
                        }

                        // --- BEGIN DEBUG LOGS ---
                        console.log(`[WAC_DEBUG] Calculated newWeightedAverageCost (before guard): ${newWeightedAverageCost}, Type: ${typeof newWeightedAverageCost}`);
                        // --- END DEBUG LOGS ---

                        // Update product with new weighted average cost
                        await tx.product.update({
                            where: { id: parseInt(item.productId) },
                            data: { weightedAverageCost: newWeightedAverageCost > 0 ? newWeightedAverageCost : 0 }
                        });

                        // Handle distribution across shops
                        if (itemDistribution && Object.keys(itemDistribution).length > 0) {
                            // Distribute to specific shops as specified
                            for (const [shopIdStr, quantity] of Object.entries(itemDistribution)) {
                                const shopId = shopIdStr; // Keep shopId as string
                                const qty = Number(quantity);

                                if (qty <= 0) continue;

                                // Check if inventory exists for this product/shop combination
                                const existingInventory = await tx.inventoryItem.findFirst({
                                    where: {
                                        productId: parseInt(item.productId),
                                        shopId: shopId // shopId is now a string
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
                                            shopId: shopId, // shopId is now a string
                                            quantity: finalQuantity
                                        }
                                    });
                                }
                                inventoryUpdates.push({ productId: parseInt(item.productId), shopId: parseInt(shopId), newQuantity: finalQuantity });
                            }
                        } else {
                            // If no distribution specified, assume a default shop (e.g., shopId '1' or main shop)
                            const defaultShopId = '1'; // Default shopId as string
                            const qty = item.quantity;

                            const existingInventory = await tx.inventoryItem.findFirst({
                                where: {
                                    productId: parseInt(item.productId),
                                    shopId: defaultShopId
                                }
                            });

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
                                        shopId: defaultShopId,
                                        quantity: finalQuantity
                                    }
                                });
                            }
                            inventoryUpdates.push({ productId: parseInt(item.productId), shopId: parseInt(defaultShopId), newQuantity: finalQuantity });
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

                // Fetch the complete invoice with items
                const fullInvoice = await tx.purchaseInvoice.findUnique({
                    where: { id: createdInvoice.id },
                    include: {
                        supplier: true,
                        items: { include: { product: true } }
                    }
                });

                return { invoice: fullInvoice, inventoryUpdates };
            },
            { timeout: 20000 } // 20 seconds timeout
        );

        // Emit WebSocket events
        const io = getSocketIO();
        if (io && purchase && purchase.invoice) {
            io.emit(WEBSOCKET_EVENTS.PURCHASE_INVOICE_CREATED, purchase.invoice);

            // Emit inventory updates
            if (purchase.inventoryUpdates && purchase.inventoryUpdates.length > 0) {
                purchase.inventoryUpdates.forEach(update => {
                    // Assuming emitInventoryLevelUpdated can handle numeric shopId for its own logic
                    // but the critical part is that Prisma queries used string shopId as fixed above.
                    emitInventoryLevelUpdated(update.productId, {
                        shopId: update.shopId, // This might need to be string if emitInventoryLevelUpdated expects it
                        newQuantity: update.newQuantity,
                        source: 'purchase_creation'
                    });
                });
            }
            console.log(`Emitted WebSocket events for new purchase invoice ${purchase.invoice.id}`);
        }

        return NextResponse.json(
            { success: true, message: 'Purchase invoice created successfully', data: purchase.invoice },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating purchase invoice:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: { message: 'Failed to create purchase invoice', details: message } },
            { status: 500 }
        );
    }
} 