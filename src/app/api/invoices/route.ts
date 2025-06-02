import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { emitInventoryUpdate } from '@/lib/websocket';
import { sendSMS } from '@/lib/sms';
import { cacheService, CACHE_CONFIG } from '@/lib/cache';
import { measureAsync } from '@/lib/performance';

const prisma = new PrismaClient();
const CACHE_DURATION = 60; // 60 seconds

const ITEMS_PER_PAGE = 15;

export async function GET(request: NextRequest) {
    return measureAsync('invoices-api', async () => {
        try {
            const token = request.headers.get('authorization')?.replace('Bearer ', '');
            if (!token) {
                return NextResponse.json({ error: 'No token provided' }, { status: 401 });
            }

            const decoded = verifyToken(token);
            if (!decoded) {
                return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }

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

            // Build optimized where clause
            let whereClause: any = {};

            if (status) {
                whereClause.status = status;
            }
            if (paymentMethod) {
                whereClause.paymentMethod = paymentMethod;
            }
            if (shopId) {
                whereClause.shopId = parseInt(shopId);
            }
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
}

export async function POST(request: NextRequest) {
    return measureAsync('create-invoice-api', async () => {
        try {
            const token = request.headers.get('authorization')?.replace('Bearer ', '');
            if (!token) {
                return NextResponse.json({ error: 'No token provided' }, { status: 401 });
            }

            const decoded = verifyToken(token);
            if (!decoded) {
                return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }

            const invoiceData = await request.json();
            const { sendSms, ...invoiceDetails } = invoiceData;

            const inventoryUpdatesForEvent: Array<{ productId: number, shopId: number, newQuantity: number, oldQuantity: number }> = [];

            const invoice = await measureAsync('invoice-transaction', () =>
                prisma.$transaction(
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
                                totalProfit: 0, // Will be updated after items are processed
                                profitMargin: 0 // Will be updated after items are processed
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
                            // Get product costs for profit calculation
                            const productIds = invoiceDetails.items.map((item: any) => item.productId);
                            const products = await tx.product.findMany({
                                where: { id: { in: productIds } },
                                select: { id: true, weightedAverageCost: true }
                            });

                            const productCostMap = new Map(products.map(p => [p.id, p.weightedAverageCost || 0]));

                            for (const item of invoiceDetails.items) {
                                const costPrice = productCostMap.get(item.productId) || 0;
                                const totalCost = costPrice * item.quantity;
                                const profit = (item.quantity * item.price) - totalCost;

                                await tx.invoiceItem.create({
                                    data: {
                                        invoiceId: createdInvoice.id,
                                        productId: item.productId,
                                        quantity: item.quantity,
                                        price: item.price,
                                        total: item.quantity * item.price,
                                        costPrice: costPrice,
                                        profit: profit
                                    }
                                });
                            }

                            // Calculate and update total profit and profit margin
                            const totalProfit = invoiceDetails.items.reduce((sum: number, item: any) => {
                                const costPrice = productCostMap.get(item.productId) || 0;
                                const totalCost = costPrice * item.quantity;
                                const profit = (item.quantity * item.price) - totalCost;
                                return sum + profit;
                            }, 0);

                            const profitMargin = invoiceDetails.total > 0 ? (totalProfit / invoiceDetails.total) * 100 : 0;

                            // Update invoice with profit information
                            await tx.invoice.update({
                                where: { id: invoice.id },
                                data: {
                                    totalProfit: totalProfit,
                                    profitMargin: profitMargin
                                }
                            });
                        }

                        // Check and update inventory levels for the selected shop
                        if (invoiceDetails.shopId && invoiceDetails.items && Array.isArray(invoiceDetails.items)) {
                            for (const item of invoiceDetails.items) {
                                // Check inventory only for the selected shop
                                const inventoryItems = await tx.inventoryItem.findMany({
                                    where: {
                                        productId: item.productId,
                                        shopId: invoiceDetails.shopId // Only check inventory for the selected shop
                                    },
                                    orderBy: { updatedAt: 'asc' }
                                });
                                let remainingQuantity = item.quantity;
                                if (inventoryItems.length === 0) {
                                    throw new Error(`No inventory for product ID ${item.productId} in the selected shop`);
                                }
                                const totalInventory = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
                                if (totalInventory < remainingQuantity) {
                                    throw new Error(`Insufficient inventory for product ID ${item.productId} in the selected shop. Available: ${totalInventory}, Required: ${item.quantity}`);
                                }

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
}