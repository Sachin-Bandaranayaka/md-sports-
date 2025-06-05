import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateTokenPermission } from '@/lib/auth';
import { revalidateTag } from 'next/cache';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';
import { emitInvoiceCreated } from '@/lib/utils/websocket';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { measureAsync } from '@/lib/performance';
import { cacheService, CACHE_CONFIG } from '@/lib/cache';

const prisma = new PrismaClient();
const CACHE_DURATION = 60; // 60 seconds

const ITEMS_PER_PAGE = 15;

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    return measureAsync('invoices-api', async () => {
        try {
            // Validate token and permissions
            const authResult = await validateTokenPermission(request, 'sales:view');
            if (!authResult.isValid) {
                return NextResponse.json({ error: authResult.message }, { status: 401 });
            }

            console.log('Invoices API - Shop context:', {
                shopId: context.shopId,
                isFiltered: context.isFiltered,
                isAdmin: context.isAdmin,
                userShopId: context.userShopId
            });

            const searchParams = request.nextUrl.searchParams;
            const page = parseInt(searchParams.get('page') || '1', 10);
            const limit = Math.min(parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10), 50); // Cap at 50
            const status = searchParams.get('status') || '';
            const paymentMethod = searchParams.get('paymentMethod') || '';
            const searchQuery = searchParams.get('search') || '';
            const shopId = searchParams.get('shopId');

            // Generate cache key
            const cacheKey = cacheService.generateKey(CACHE_CONFIG.KEYS.INVOICES, {
                page,
                limit,
                status,
                paymentMethod,
                search: searchQuery,
                shopId
            });

            // Try to get from cache first
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                const response = NextResponse.json(cachedData);
                response.headers.set('X-Cache', 'HIT');
                response.headers.set('Cache-Control', `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`);
                return response;
            }

            // Build optimized where clause with shop filtering
            let whereClause = ShopAccessControl.buildShopFilter(context);

            if (status) {
                whereClause.status = status;
            }
            if (paymentMethod) {
                whereClause.paymentMethod = paymentMethod;
            }
            if (shopId) {
                whereClause.shopId = parseInt(shopId);
            }

            console.log('Invoices where clause:', JSON.stringify(whereClause, null, 2));
            if (searchQuery) {
                whereClause.OR = [
                    { invoiceNumber: { contains: searchQuery, mode: 'insensitive' } },
                    { customer: { name: { contains: searchQuery, mode: 'insensitive' } } },
                ];

                // Handle numeric search for total amount
                const numericQuery = parseFloat(searchQuery);
                if (!isNaN(numericQuery)) {
                    whereClause.OR.push({ total: numericQuery });
                }
            }

            // Execute queries in parallel for better performance
            const [invoices, totalInvoices, statistics] = await Promise.all([
                measureAsync('invoices-main-query', () =>
                    // Main invoices query with optimized select
                    prisma.invoice.findMany({
                        where: whereClause,
                        select: {
                            id: true,
                            invoiceNumber: true,
                            total: true,
                            status: true,
                            paymentMethod: true,
                            invoiceDate: true,
                            dueDate: true,
                            notes: true,
                            createdAt: true,
                            updatedAt: true,
                            customer: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true
                                }
                            },
                            shop: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            },
                            _count: {
                                select: { items: true }
                            }
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                        skip: (page - 1) * limit,
                        take: limit,
                    })
                ),

                // Total count query
                measureAsync('invoices-count-query', () =>
                    prisma.invoice.count({ where: whereClause })
                ),

                // Statistics queries in parallel
                measureAsync('invoices-stats-query', () =>
                    Promise.all([
                        // Total outstanding (pending invoices)
                        prisma.invoice.aggregate({
                            _sum: { total: true },
                            where: {
                                ...whereClause,
                                status: 'Pending'
                            }
                        }),

                        // Paid this month
                        prisma.invoice.aggregate({
                            _sum: { total: true },
                            where: {
                                ...whereClause,
                                status: 'Paid',
                                createdAt: {
                                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                }
                            }
                        }),

                        // Overdue count
                        prisma.invoice.count({
                            where: {
                                ...whereClause,
                                status: 'Pending',
                                dueDate: {
                                    lt: new Date()
                                }
                            }
                        })
                    ])
                )
            ]);

            const [totalOutstanding, paidThisMonth, overdueCount] = statistics;

            // Format response with optimized data structure
            const formattedInvoices = invoices.map(invoice => {
                const { _count, customer, shop, ...rest } = invoice;
                return {
                    ...rest,
                    customer,
                    shop,
                    customerName: customer?.name || 'Unknown Customer',
                    customerId: customer?.id,
                    itemCount: _count.items,
                };
            });

            const responseData = {
                invoices: formattedInvoices,
                totalPages: Math.ceil(totalInvoices / limit),
                currentPage: page,
                total: totalInvoices,
                statistics: {
                    totalOutstanding: totalOutstanding._sum.total || 0,
                    paidThisMonth: paidThisMonth._sum.total || 0,
                    overdueCount
                },
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId
                }
            };

            // Cache the response
            await cacheService.set(cacheKey, responseData, CACHE_CONFIG.TTL.INVOICES);

            const response = NextResponse.json(responseData);
            response.headers.set('X-Cache', 'MISS');
            response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

            return response;

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
    }, { endpoint: 'invoices' });
});

export const POST = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    return measureAsync('create-invoice-api', async () => {
        try {
            // Validate token and permissions
            const authResult = await validateTokenPermission(request, 'sales:manage');
            if (!authResult.isValid) {
                return NextResponse.json({ error: authResult.message }, { status: 401 });
            }

            const invoiceData = await request.json();
            console.log('Invoice data received:', JSON.stringify(invoiceData, null, 2));
            const { sendSms, invoiceNumber, ...invoiceDetails } = invoiceData;
            console.log('Invoice details after destructuring:', JSON.stringify(invoiceDetails, null, 2));

            // Validate shop access for the target shop
            if (invoiceDetails.shopId) {
                const shopAccessResult = await ShopAccessControl.validateShopAccess(request, invoiceDetails.shopId);
                if (!shopAccessResult.hasAccess) {
                    return ShopAccessControl.createAccessDeniedResponse(shopAccessResult.error);
                }
            }

            const inventoryUpdatesForEvent: Array<{ productId: number, shopId: number, newQuantity: number, oldQuantity: number }> = [];

            const invoice = await measureAsync('invoice-transaction', () =>
                prisma.$transaction(
                    async (tx) => {
                        const createdInvoice = await tx.invoice.create({
                            data: {
                                invoiceNumber: invoiceNumber,
                                customerId: invoiceDetails.customerId,
                                total: 0, // Will be updated after items are processed
                                status: 'Pending',
                                paymentMethod: invoiceDetails.paymentMethod || 'Cash',
                                invoiceDate: invoiceDetails.invoiceDate ? new Date(invoiceDetails.invoiceDate) : new Date(),
                                dueDate: invoiceDetails.dueDate ? new Date(invoiceDetails.dueDate) : null,
                                notes: invoiceDetails.notes || '',
                                shopId: invoiceDetails.shopId || null,
                                totalProfit: 0, // Will be updated after items are processed
                                profitMargin: 0 // Will be updated after items are processed
                            },
                        });

                        if (invoiceDetails.paymentMethod === 'Cash') {
                            await tx.payment.create({
                                data: {
                                    invoiceId: createdInvoice.id,
                                    customerId: invoiceDetails.customerId,
                                    amount: 0, // Will be updated after items are processed
                                    paymentMethod: 'Cash',
                                    referenceNumber: `AUTO-${createdInvoice.invoiceNumber}`,
                                }
                            });
                        }

                        if (invoiceDetails.items && Array.isArray(invoiceDetails.items)) {
                            // Get product costs for profit calculation - optimized with specific field selection
                            const productIds = invoiceDetails.items.map((item: any) => parseInt(item.productId, 10));
                            const products = await tx.product.findMany({
                                where: { id: { in: productIds } },
                                select: { id: true, weightedAverageCost: true }
                            });

                            const productCostMap = new Map(products.map(p => [p.id, p.weightedAverageCost || 0]));

                            let calculatedTotalInvoiceAmount = 0;
                            
                            // Batch create invoice items for better performance
                            const invoiceItemsData = invoiceDetails.items.map((item: any) => {
                                const productId = parseInt(item.productId, 10);
                                const costPrice = productCostMap.get(productId) || 0;
                                const itemSellingTotal = item.quantity * item.price;
                                const totalItemCost = costPrice * item.quantity;
                                const itemProfit = itemSellingTotal - totalItemCost;
                                
                                calculatedTotalInvoiceAmount += itemSellingTotal;
                                
                                return {
                                    invoiceId: createdInvoice.id,
                                    productId: productId,
                                    quantity: item.quantity,
                                    price: item.price,
                                    total: itemSellingTotal,
                                    costPrice: costPrice,
                                    profit: itemProfit
                                };
                            });
                            
                            // Batch insert all invoice items
                            await tx.invoiceItem.createMany({
                                data: invoiceItemsData
                            });

                            // Calculate and update total profit and profit margin
                            const totalProfit = invoiceDetails.items.reduce((sum: number, item: any) => {
                                const productId = parseInt(item.productId, 10);
                                const costPrice = productCostMap.get(productId) || 0;
                                const itemSellingTotal = item.quantity * item.price;
                                const totalItemCost = costPrice * item.quantity;
                                const itemProfit = itemSellingTotal - totalItemCost;
                                return sum + itemProfit;
                            }, 0);

                            const profitMargin = calculatedTotalInvoiceAmount > 0 ? (totalProfit / calculatedTotalInvoiceAmount) * 100 : 0;

                            // Update invoice with profit information
                            await tx.invoice.update({
                                where: { id: createdInvoice.id },
                                data: {
                                    total: calculatedTotalInvoiceAmount, // Use server-calculated total
                                    totalProfit: totalProfit,
                                    profitMargin: profitMargin
                                }
                            });
                        }

                        // Optimized inventory check and update for the selected shop
                        if (invoiceDetails.shopId && invoiceDetails.items && Array.isArray(invoiceDetails.items)) {
                            // Batch fetch all inventory items for all products in one query
                            const productIds = invoiceDetails.items.map((item: any) => parseInt(item.productId, 10));
                            const allInventoryItems = await tx.inventoryItem.findMany({
                                where: {
                                    productId: { in: productIds },
                                    shopId: invoiceDetails.shopId
                                },
                                orderBy: { updatedAt: 'asc' },
                                select: { id: true, productId: true, quantity: true, updatedAt: true }
                            });
                            
                            // Group inventory items by product ID
                            const inventoryByProduct = new Map<number, typeof allInventoryItems>();
                            allInventoryItems.forEach(item => {
                                if (!inventoryByProduct.has(item.productId)) {
                                    inventoryByProduct.set(item.productId, []);
                                }
                                inventoryByProduct.get(item.productId)!.push(item);
                            });
                            
                            // Validate inventory availability for all items first
                            for (const item of invoiceDetails.items) {
                                const productId = parseInt(item.productId, 10);
                                const inventoryItems = inventoryByProduct.get(productId) || [];
                                if (inventoryItems.length === 0) {
                                    throw new Error(`No inventory for product ID ${productId} in the selected shop`);
                                }
                                const totalInventory = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
                                if (totalInventory < item.quantity) {
                                    throw new Error(`Insufficient inventory for product ID ${productId} in the selected shop. Available: ${totalInventory}, Required: ${item.quantity}`);
                                }
                            }
                            
                            // Process inventory updates using FIFO
                            const inventoryUpdates: Array<{ id: number; quantity: number }> = [];
                            
                            for (const item of invoiceDetails.items) {
                                const productId = parseInt(item.productId, 10);
                                const inventoryItems = inventoryByProduct.get(productId) || [];
                                let remainingQuantity = item.quantity;

                                for (const inventoryItem of inventoryItems) {
                                    if (remainingQuantity <= 0) break;
                                    if (inventoryItem.quantity > 0) {
                                        const deductAmount = Math.min(remainingQuantity, inventoryItem.quantity);
                                        const oldShopQuantity = inventoryItem.quantity;
                                        const newShopQuantity = inventoryItem.quantity - deductAmount;

                                        inventoryUpdates.push({
                                            id: inventoryItem.id,
                                            quantity: newShopQuantity
                                        });

                                        inventoryUpdatesForEvent.push({
                                            productId: productId,
                                            shopId: inventoryItem.shopId,
                                            newQuantity: newShopQuantity,
                                            oldQuantity: oldShopQuantity
                                        });
                                        remainingQuantity -= deductAmount;
                                    }
                                }
                            }

                            // Batch update inventory items
                            if (inventoryUpdates.length > 0) {
                                await Promise.all(
                                    inventoryUpdates.map(update =>
                                        tx.inventoryItem.update({
                                            where: { id: update.id },
                                            data: { quantity: update.quantity, updatedAt: new Date() }
                                        })
                                    )
                                );
                            }
                        }
                        return tx.invoice.findUnique({
                            where: { id: createdInvoice.id },
                            include: { customer: true, items: true }
                        });
                    },
                    { timeout: 30000 }
                )
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

            // Invalidate related caches
            await Promise.all([
                cacheService.invalidateInvoices(),
                cacheService.invalidateInventory()
            ]);

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
    }, { endpoint: 'create-invoice' });
});