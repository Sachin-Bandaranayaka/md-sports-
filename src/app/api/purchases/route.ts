import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getToken } from 'next-auth/jwt';
import { cacheService } from '@/lib/cache';

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

                        // Calculate new weighted average cost using proper formula
                        // WAC = (Current Total Value + New Purchase Value) / (Current Quantity + New Quantity)
                        let newWeightedAverageCost = newCost; // Default to new cost if there's no existing inventory

                        if (currentTotalQuantity > 0 && currentCost > 0) {
                            const currentTotalValue = currentTotalQuantity * currentCost;
                            const newPurchaseValue = newQuantity * newCost;
                            const totalValue = currentTotalValue + newPurchaseValue;
                            const totalQuantity = currentTotalQuantity + newQuantity;

                            newWeightedAverageCost = totalValue / totalQuantity;
                        }

                        // Ensure WAC is valid and positive
                        if (newWeightedAverageCost <= 0 || isNaN(newWeightedAverageCost)) {
                            newWeightedAverageCost = newCost;
                        }

                        // Update product with new weighted average cost
                        await tx.product.update({
                            where: { id: parseInt(item.productId) },
                            data: { weightedAverageCost: newWeightedAverageCost }
                        });

                        // Handle distribution across shops
                        if (itemDistribution && Object.keys(itemDistribution).length > 0) {
                            // Process only the current item's distribution object
                            const shopQuantities: Record<string, number> = {};
                            
                            // Process only the distribution object for this specific item (at index i)
                            if (itemDistribution && typeof itemDistribution === 'object') {
                                for (const [shopIdStr, quantity] of Object.entries(itemDistribution)) {
                                    const qty = Number(quantity);
                                    if (qty > 0 && !isNaN(qty)) {
                                        shopQuantities[shopIdStr] = qty; // Use the exact quantity, not accumulated
                                    }
                                }
                            }
                            
                            // Distribute to specific shops as aggregated
                            for (const [shopIdStr, totalQty] of Object.entries(shopQuantities)) {
                                const shopId = shopIdStr; // Keep shopId as string
                                const qty = totalQty;

                                if (qty <= 0) continue;

                                const existingInventory = await tx.inventoryItem.findFirst({
                                    where: {
                                        productId: parseInt(item.productId),
                                        shopId: shopId
                                    }
                                });

                                let finalQuantity = 0;
                                if (existingInventory) {
                                    const currentQuantity = existingInventory.quantity;
                                    const currentCost = existingInventory.shopSpecificCost || 0;
                                    const newTotalQuantity = currentQuantity + qty;
                                    let newShopSpecificCost = newCost; // item.price
                                    if (currentQuantity > 0 && currentCost > 0) { // ensure currentCost is also positive
                                        const currentTotalValue = currentQuantity * currentCost;
                                        const newTotalValue = qty * newCost;
                                        newShopSpecificCost = (currentTotalValue + newTotalValue) / newTotalQuantity;
                                    } else if (currentQuantity === 0 && newTotalQuantity > 0) { // First stock for this item in this shop
                                        newShopSpecificCost = newCost;
                                    }


                                    finalQuantity = newTotalQuantity;
                                    await tx.inventoryItem.update({
                                        where: { id: existingInventory.id },
                                        data: {
                                            quantity: finalQuantity,
                                            shopSpecificCost: newShopSpecificCost >= 0 ? newShopSpecificCost : 0
                                        }
                                    });
                                } else {
                                    finalQuantity = qty;
                                    await tx.inventoryItem.create({
                                        data: {
                                            productId: parseInt(item.productId),
                                            shopId: shopId,
                                            quantity: finalQuantity,
                                            shopSpecificCost: newCost >= 0 ? newCost : 0
                                        }
                                    });
                                }
                                inventoryUpdates.push({ productId: parseInt(item.productId), shopId: parseInt(shopId), newQuantity: finalQuantity });
                            }
                        } else {
                            // No explicit distribution: attempt to infer shop
                            console.warn(`No distribution for product ${item.productId} in purchase. Attempting to infer shop.`);
                            const existingInventoriesForProduct = await tx.inventoryItem.findMany({
                                where: { productId: parseInt(item.productId) }
                            });

                            let inferredShopId: string | null = null;
                            if (existingInventoriesForProduct.length === 1) {
                                inferredShopId = existingInventoriesForProduct[0].shopId;
                                console.log(`Product ${item.productId} found in single shop ${inferredShopId}. Will update there.`);
                            } else if (existingInventoriesForProduct.length === 0) {
                                console.error(`Product ${item.productId} is new to inventory and no shop distribution provided. Cannot automatically assign to a shop. Inventory not updated for this item.`);
                            } else { // More than 1 shop
                                console.error(`Product ${item.productId} exists in multiple shops and no specific distribution provided. Ambiguous. Inventory not updated for this item.`);
                            }

                            if (inferredShopId) {
                                const qty = item.quantity;
                                if (qty > 0) {
                                    const inventoryInInferredShop = await tx.inventoryItem.findFirst({
                                        where: {
                                            productId: parseInt(item.productId),
                                            shopId: inferredShopId
                                        }
                                    });

                                    let finalQuantity = 0;
                                    if (inventoryInInferredShop) {
                                        const currentQuantity = inventoryInInferredShop.quantity;
                                        const currentShopCost = inventoryInInferredShop.shopSpecificCost || 0;
                                        const newTotalQuantity = currentQuantity + qty;
                                        let newShopSpecificCost = newCost; // item.price

                                        if (currentQuantity > 0 && currentShopCost > 0) {
                                            const currentTotalValue = currentQuantity * currentShopCost;
                                            const newTotalValue = qty * newCost;
                                            newShopSpecificCost = (currentTotalValue + newTotalValue) / newTotalQuantity;
                                        } else if (currentQuantity === 0 && newTotalQuantity > 0) {
                                            newShopSpecificCost = newCost;
                                        }

                                        finalQuantity = newTotalQuantity;
                                        await tx.inventoryItem.update({
                                            where: { id: inventoryInInferredShop.id },
                                            data: {
                                                quantity: finalQuantity,
                                                shopSpecificCost: newShopSpecificCost >= 0 ? newShopSpecificCost : 0
                                            }
                                        });
                                    } else {
                                        // This case should ideally not be hit if existingInventoriesForProduct.length === 1
                                        // because it means we found it in that list. But for safety:
                                        finalQuantity = qty;
                                        await tx.inventoryItem.create({
                                            data: {
                                                productId: parseInt(item.productId),
                                                shopId: inferredShopId,
                                                quantity: finalQuantity,
                                                shopSpecificCost: newCost >= 0 ? newCost : 0
                                            }
                                        });
                                    }
                                    inventoryUpdates.push({ productId: parseInt(item.productId), shopId: parseInt(inferredShopId), newQuantity: finalQuantity });
                                } else {
                                    console.warn(`Quantity for product ${item.productId} in inferred shop ${inferredShopId} is zero or negative. No inventory update.`);
                                }
                            }
                        }
                    }
                }

                // If there's a paidAmount, create a payment record
                if (body.paidAmount && body.paidAmount > 0) {
                    await tx.payment.create({
                        data: {
                            amount: parseFloat(body.paidAmount as unknown as string) || 0,
                            paymentMethod: body.paymentMethod || 'cash', // Default or from body
                            invoice: { connect: { id: newInvoice.id } }
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

        // Real-time updates now handled by polling system

        // After successful transaction, invalidate relevant caches
        try {
            await cacheService.invalidateInventory(); // Handles 'inventory:summary:*' and 'products:*'
            await cacheService.del('dashboard:inventory');
            await cacheService.del('dashboard:inventory-value');
            await cacheService.del('dashboard:shops');
            await cacheService.del('dashboard:all');
            await cacheService.del('dashboard:summary'); // As per DASHBOARD_PERFORMANCE_OPTIMIZATIONS.md
            // Invalidate purchases-specific caches
            await cacheService.invalidatePattern('purchases-optimized*');
            await cacheService.invalidatePattern('purchase-stats*');
            console.log('Relevant caches invalidated after purchase creation.');
        } catch (cacheError) {
            console.error('Error invalidating caches after purchase creation:', cacheError);
            // Do not let cache invalidation error fail the main operation
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