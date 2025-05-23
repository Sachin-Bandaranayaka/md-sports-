import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/purchases - Get all purchase invoices
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const supplierId = searchParams.get('supplierId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build the where clause for Prisma
        const whereClause: any = {};

        if (search) {
            whereClause.invoiceNumber = {
                contains: search,
                mode: 'insensitive'
            };
        }

        if (status) {
            whereClause.status = status;
        }

        if (supplierId) {
            whereClause.supplierId = parseInt(supplierId);
        }

        if (startDate && endDate) {
            whereClause.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (startDate) {
            whereClause.createdAt = {
                gte: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.createdAt = {
                lte: new Date(endDate)
            };
        }

        const purchases = await prisma.purchaseInvoice.findMany({
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
                createdAt: 'desc'
            }
        });

        return NextResponse.json(purchases);
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

        // Generate an invoice number if not provided
        if (!body.invoiceNumber) {
            body.invoiceNumber = `PI${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        }

        // Extract items and distributions from the request
        const { items, distributions, totalAmount, paidAmount, date, dueDate, notes, ...rest } = body;

        // Only include fields that exist in the Prisma schema
        const invoiceData = {
            invoiceNumber: body.invoiceNumber,
            supplierId: parseInt(body.supplierId as unknown as string) || 0,
            total: totalAmount || 0,
            status: body.status || 'unpaid',
            date: date ? new Date(date) : null,
            dueDate: dueDate ? new Date(dueDate) : null
        };

        // Create the purchase invoice with items in a transaction
        const purchase = await prisma.$transaction(
            async (tx) => {
                // Create the purchase invoice
                const createdInvoice = await tx.purchaseInvoice.create({
                    data: invoiceData
                });

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
                                if (existingInventory) {
                                    await tx.inventoryItem.update({
                                        where: { id: existingInventory.id },
                                        data: { quantity: existingInventory.quantity + qty }
                                    });
                                } else {
                                    await tx.inventoryItem.create({
                                        data: {
                                            productId: parseInt(item.productId),
                                            shopId: shopId,
                                            quantity: qty
                                        }
                                    });
                                }
                            }
                        } else {
                            // Default behavior - add everything to shop 1 if no distribution specified
                            const shopId = 1;
                            const existingInventory = await tx.inventoryItem.findFirst({
                                where: {
                                    productId: parseInt(item.productId),
                                    shopId: shopId
                                }
                            });

                            // Update or create inventory
                            if (existingInventory) {
                                await tx.inventoryItem.update({
                                    where: { id: existingInventory.id },
                                    data: { quantity: existingInventory.quantity + item.quantity }
                                });
                            } else {
                                await tx.inventoryItem.create({
                                    data: {
                                        productId: parseInt(item.productId),
                                        shopId: shopId,
                                        quantity: item.quantity
                                    }
                                });
                            }
                        }
                    }
                }

                // Return the complete invoice with relations
                return tx.purchaseInvoice.findUnique({
                    where: {
                        id: createdInvoice.id
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
            },
            { timeout: 30000 }
        );

        return NextResponse.json(purchase, { status: 201 });
    } catch (error) {
        console.error('Error creating purchase invoice:', error);
        return NextResponse.json(
            { error: 'Failed to create purchase invoice', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 