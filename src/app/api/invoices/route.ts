import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateTokenPermission, getUserIdFromToken } from '@/lib/auth';
import { revalidateTag } from 'next/cache';


import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { measureAsync } from '@/lib/performance';
import { cacheService, CACHE_CONFIG } from '@/lib/cache';
// Note: smsService import commented out as it may not be available
// import { smsService } from '@/lib/sms';

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

            // Get user ID from token for filtering
            const userId = await getUserIdFromToken(request);
            if (!userId) {
                return NextResponse.json({ error: 'User not found' }, { status: 401 });
            }

            // Get user details to check role
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    shopId: true,
                    role: {
                        select: { name: true }
                    }
                }
            });

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 401 });
            }

            console.log('Invoices API - Shop context:', {
                shopId: context.shopId,
                isFiltered: context.isFiltered,
                isAdmin: context.isAdmin,
                userShopId: context.userShopId,
                userId: user.id,
                userRole: user.role?.name
            });

            const searchParams = request.nextUrl.searchParams;
            const page = parseInt(searchParams.get('page') || '1', 10);
            const limit = Math.min(parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10), 50); // Cap at 50
            const status = searchParams.get('status') || '';
            const paymentMethod = searchParams.get('paymentMethod') || '';
            const searchQuery = searchParams.get('search') || '';
            const shopId = searchParams.get('shopId');

            // Use the admin status from the shop access control middleware for consistency
            const isAdmin = context.isAdmin;
            
            const cacheKey = cacheService.generateKey(CACHE_CONFIG.KEYS.INVOICES, {
                page,
                limit,
                status,
                paymentMethod,
                search: searchQuery,
                shopId: isAdmin ? shopId : context.shopId, // Use context's shopId for non-admins
                userId: isAdmin ? 'admin' : user.id // Admin sees all, others see user-specific
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
            let whereClause: any = ShopAccessControl.buildShopFilter(context);

            // Shop filtering is now primarily handled by the middleware.
            if (status) whereClause.status = status;
            if (paymentMethod) whereClause.paymentMethod = paymentMethod;
            
            // For non-admins, the shopId from their token is already applied by buildShopFilter.
            // We only allow an admin to override it with a query parameter.
            if (isAdmin && shopId && shopId !== 'all') {
                whereClause.shopId = shopId;
            } else if (!isAdmin) {
                // Enforce the user's shopId from the token context for all non-admin users
                whereClause.shopId = context.shopId;
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
                                status: 'pending'
                            }
                        }),

                        // Paid this month
                        prisma.invoice.aggregate({
                            _sum: { total: true },
                            where: {
                                ...whereClause,
                                status: 'paid',
                                createdAt: {
                                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                }
                            }
                        }),

                        // Overdue count
                        prisma.invoice.count({
                            where: {
                                ...whereClause,
                                status: 'pending',
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
            const salesManageResult = await validateTokenPermission(request, 'sales:manage');
            const salesCreateShopResult = await validateTokenPermission(request, 'sales:create:shop');
            
            if (!salesManageResult.isValid && !salesCreateShopResult.isValid) {
                return NextResponse.json({ 
                    error: 'Permission denied: sales:manage or sales:create:shop required' 
                }, { status: 403 });
            }

            // Get user ID from token
            const userId = await getUserIdFromToken(request);
            if (!userId) {
                return NextResponse.json({ 
                    error: 'Unable to get user information from token' 
                }, { status: 401 });
            }

            const invoiceData = await request.json();
            
            // If user only has sales:create:shop permission, validate shop restriction
            if (!salesManageResult.isValid && salesCreateShopResult.isValid) {
                // User can only create sales for their assigned shop
                if (!invoiceData.shopId) {
                    return NextResponse.json({
                        success: false,
                        message: 'Shop ID is required for sales creation'
                    }, { status: 400 });
                }

                // Validate that the user can only create invoices for their shop
                const shopAccessResult = await ShopAccessControl.validateShopAccess(request, invoiceData.shopId);
                if (!shopAccessResult.hasAccess || shopAccessResult.isAdmin) {
                    // If user is admin, they should have sales:manage, not sales:create:shop
                    if (shopAccessResult.isAdmin) {
                        return NextResponse.json({
                            success: false,
                            message: 'Admin users should use sales:manage permission'
                        }, { status: 403 });
                    }
                    return ShopAccessControl.createAccessDeniedResponse(
                        shopAccessResult.error || 'Cannot create sales for this shop'
                    );
                }
            }
            console.log('Invoice data received:', JSON.stringify(invoiceData, null, 2));
            const { sendSms, invoiceNumber, ...invoiceDetails } = invoiceData;
            console.log('Invoice details after destructuring:', JSON.stringify(invoiceDetails, null, 2));
            console.log('Invoice number from request:', invoiceNumber);
            
            // Server-side validation to prevent empty invoices
            if (!invoiceDetails.items || !Array.isArray(invoiceDetails.items) || invoiceDetails.items.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invoice must contain at least one item',
                        error: 'No items provided'
                    },
                    { status: 400 }
                );
            }

            // Validate that all items have required fields
            for (let i = 0; i < invoiceDetails.items.length; i++) {
                const item = invoiceDetails.items[i];
                console.log(`Validating item ${i}:`, {
                    productId: item.productId,
                    productIdType: typeof item.productId,
                    quantity: item.quantity,
                    quantityType: typeof item.quantity,
                    price: item.price,
                    priceType: typeof item.price
                });
                
                if (!item.productId || !item.quantity || item.quantity <= 0) {
                    console.log(`Item validation failed for item ${i}:`, {
                        hasProductId: !!item.productId,
                        hasQuantity: !!item.quantity,
                        quantityValue: item.quantity,
                        quantityCheck: item.quantity <= 0
                    });
                    return NextResponse.json(
                        {
                            success: false,
                            message: `Item ${i + 1}: All items must have valid productId and quantity greater than 0`,
                            error: 'Invalid item data',
                            itemDetails: {
                                index: i,
                                productId: item.productId,
                                quantity: item.quantity,
                                hasProductId: !!item.productId,
                                hasQuantity: !!item.quantity,
                                quantityPositive: item.quantity > 0
                            }
                        },
                        { status: 400 }
                    );
                }
            }

            // Validate customer is provided (optional but recommended)
            if (!invoiceDetails.customerId) {
                console.warn('Invoice created without customer ID');
            }

            // Credit limit validation for wholesale customers
            if (invoiceDetails.customerId) {
                const customer = await prisma.customer.findUnique({
                    where: { id: invoiceDetails.customerId },
                    select: { 
                        customerType: true, 
                        creditLimit: true,
                        name: true
                    }
                });

                if (customer && customer.customerType === 'wholesale' && customer.creditLimit) {
                    // Calculate total invoice amount
                    const totalAmount = invoiceDetails.items.reduce((sum: number, item: any) => {
                        const price = parseFloat(item.customPrice) || parseFloat(item.price) || 0;
                        const quantity = parseInt(item.quantity, 10) || 0;
                        return sum + (price * quantity);
                    }, 0);

                    // Get customer's current outstanding balance
                    const outstandingInvoices = await prisma.invoice.aggregate({
                        where: {
                            customerId: invoiceDetails.customerId,
                            status: { in: ['pending', 'overdue'] }
                        },
                        _sum: { total: true }
                    });

                    const currentBalance = outstandingInvoices._sum.total || 0;
                    const newTotalBalance = currentBalance + totalAmount;

                    if (newTotalBalance > customer.creditLimit) {
                        return NextResponse.json(
                            {
                                success: false,
                                message: `Credit limit exceeded for customer ${customer.name}. Current balance: Rs. ${currentBalance.toLocaleString()}, Invoice amount: Rs. ${totalAmount.toLocaleString()}, Credit limit: Rs. ${customer.creditLimit.toLocaleString()}`,
                                error: 'Credit limit exceeded',
                                details: {
                                    currentBalance,
                                    invoiceAmount: totalAmount,
                                    creditLimit: customer.creditLimit,
                                    exceedAmount: newTotalBalance - customer.creditLimit
                                }
                            },
                            { status: 400 }
                        );
                    }
                }
            }
            
            // Generate invoice number if missing
            const finalInvoiceNumber = invoiceNumber || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            console.log('Final invoice number to use:', finalInvoiceNumber);

            // Validate shop access for the target shop (only if shopId is provided)
            if (invoiceDetails.shopId) {
                console.log('Validating shop access for shopId:', invoiceDetails.shopId);
                const shopAccessResult = await ShopAccessControl.validateShopAccess(request, invoiceDetails.shopId);
                console.log('Shop access result:', shopAccessResult);
                if (!shopAccessResult.hasAccess) {
                    console.log('Shop access denied:', shopAccessResult.error);
                    return ShopAccessControl.createAccessDeniedResponse(shopAccessResult.error);
                }
                console.log('Shop access granted');
            } else {
                console.log('No shopId provided, skipping shop access validation');
            }

            const inventoryUpdatesForEvent: Array<{ productId: number, shopId: string, newQuantity: number, oldQuantity: number }> = [];

            const invoice = await measureAsync('invoice-transaction', () =>
                prisma.$transaction(
                    async (tx) => {
                        const createdInvoice = await tx.invoice.create({
                            data: {
                                invoiceNumber: finalInvoiceNumber,
                                customerId: invoiceDetails.customerId || null,
                                total: 0, // Will be updated after items are processed
                                status: 'pending',
                                paymentMethod: invoiceDetails.paymentMethod || 'Cash',
                                invoiceDate: invoiceDetails.invoiceDate ? new Date(invoiceDetails.invoiceDate) : new Date(),
                                dueDate: invoiceDetails.dueDate ? new Date(invoiceDetails.dueDate) : null,
                                notes: invoiceDetails.notes || '',
                                shopId: invoiceDetails.shopId || null,
                                createdBy: userId,
                                totalProfit: 0, // Will be updated after items are processed
                                profitMargin: 0 // Will be updated after items are processed
                            },
                        });

                        // Removed automatic payment creation for cash invoices
                        // Users will manually record payments when they actually receive them

                        if (invoiceDetails.items && Array.isArray(invoiceDetails.items)) {
                            // Get shop-specific costs for profit calculation instead of global weighted average
                            const productIds = invoiceDetails.items.map((item: any) => parseInt(item.productId, 10));
                            const inventoryItems = await tx.inventoryItem.findMany({
                                where: { 
                                    productId: { in: productIds },
                                    shopId: invoiceDetails.shopId
                                },
                                select: { productId: true, shopSpecificCost: true }
                            });

                            // Create a map of productId to shop-specific cost
                            const productCostMap = new Map(inventoryItems.map(item => [item.productId, item.shopSpecificCost || 0]));
                            
                            // For products not found in inventory, fallback to global weighted average
                            const missingProductIds = productIds.filter((id: any) => !productCostMap.has(id));
                            if (missingProductIds.length > 0) {
                                const fallbackProducts = await tx.product.findMany({
                                    where: { id: { in: missingProductIds } },
                                    select: { id: true, weightedAverageCost: true }
                                });
                                fallbackProducts.forEach(p => {
                                    productCostMap.set(p.id, p.weightedAverageCost || 0);
                                });
                            }

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
                                select: { id: true, productId: true, quantity: true, updatedAt: true, shopId: true }
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

            // Real-time updates now handled by polling system
            console.log(`Invoice ${invoice?.id} created successfully`);

            if (sendSms) {
                try {
                    // SMS service temporarily disabled
                    console.log('SMS notification requested but service is not available');
                    // TODO: Implement SMS service
                    // await smsService.init();
                    // if (smsService.isConfigured()) {
                    //     smsService.sendInvoiceNotification(invoice!.id)
                    //         .then((result: any) => {
                    //             if (result.status >= 200 && result.status < 300) {
                    //                 console.log('SMS notification sent successfully');
                    //             } else {
                    //                 console.warn('Failed to send SMS notification:', result.message);
                    //             }
                    //         })
                    //         .catch((error: any) => {
                    //             console.error('Error sending SMS notification:', error);
                    //         });
                    // }
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