import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { smsService } from '@/services/smsService';
import { validateTokenPermission, getUserIdFromToken } from '@/lib/auth';
import { cacheService } from '@/lib/cache';
import { AuditService } from '@/services/auditService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'sales:view');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Get user ID from token
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // Get user details to check role and shop access
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

        const resolvedParams = await params;
        if (!resolvedParams?.id || isNaN(Number(resolvedParams.id))) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        const invoiceId = Number(resolvedParams.id);

        // Build where clause with shop filtering
        let whereClause: any = { id: invoiceId };
        
        // For shop staff, restrict to their assigned shop only
        if (user.role?.name === 'Shop Staff' && user.shopId) {
            whereClause.shopId = user.shopId;
        }

        // Fetch invoice with all related data
        const invoice = await prisma.invoice.findUnique({
            where: whereClause,
            include: {
                customer: true,
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
                items: {
                    include: {
                        product: true
                    }
                },
                payments: {
                    where: {
                        receipt: {
                            isNot: null
                        }
                    },
                    include: {
                        receipt: true
                    }
                }
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
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Validate token and permissions
        const hasSalesEdit = await validateTokenPermission(request, 'sales:edit');
        const hasInvoiceManage = await validateTokenPermission(request, 'invoice:manage');
        if (!hasSalesEdit.isValid && !hasInvoiceManage.isValid) {
            return NextResponse.json({ 
                error: "Permission denied. Requires 'sales:edit' or 'invoice:manage'." 
            }, { status: 403 });
        }

        // Get user ID from token
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // Get user details to check role and shop access
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

        const resolvedParams = await params;
        if (!resolvedParams?.id || isNaN(Number(resolvedParams.id))) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        const invoiceId = Number(resolvedParams.id);
        
        // First, check if the invoice exists and user has access to it
        let whereClause: any = { id: invoiceId };
        if (user.role?.name === 'Shop Staff' && user.shopId) {
            whereClause.shopId = user.shopId;
        }
        
        const existingInvoice = await prisma.invoice.findUnique({
            where: whereClause,
            select: { id: true, shopId: true, customerId: true, invoiceNumber: true }
        });
        
        if (!existingInvoice) {
            return NextResponse.json(
                { error: 'Invoice not found or access denied' },
                { status: 404 }
            );
        }
        const requestData = await request.json();
        console.log('Invoice update request data:', { invoiceId, ...requestData });
        const { sendSms, ...invoiceData } = requestData;

        // Credit limit validation for wholesale customers
        if (invoiceData.customerId) {
            const customer = await prisma.customer.findUnique({
                where: { id: parseInt(invoiceData.customerId.toString()) },
                select: { 
                    customerType: true, 
                    creditLimit: true,
                    name: true
                }
            });

            if (customer && customer.customerType === 'wholesale' && customer.creditLimit) {
                // Calculate total invoice amount from the updated items
                const totalAmount = invoiceData.items?.reduce((sum: number, item: any) => {
                    const price = parseFloat(item.customPrice) || parseFloat(item.price) || 0;
                    const quantity = parseInt(item.quantity, 10) || 0;
                    return sum + (price * quantity);
                }, 0) || 0;

                // Get customer's current outstanding balance (excluding the current invoice being updated)
                const outstandingInvoices = await prisma.invoice.aggregate({
                    where: {
                        customerId: parseInt(invoiceData.customerId.toString()),
                        status: { in: ['pending', 'overdue'] },
                        id: { not: invoiceId } // Exclude the current invoice being updated
                    },
                    _sum: { total: true }
                });

                const currentBalance = outstandingInvoices._sum.total || 0;
                const newTotalBalance = currentBalance + totalAmount;

                if (newTotalBalance > customer.creditLimit) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: `Credit limit exceeded for customer ${customer.name}. Current balance: Rs. ${currentBalance.toLocaleString()}, Updated invoice amount: Rs. ${totalAmount.toLocaleString()}, Credit limit: Rs. ${customer.creditLimit.toLocaleString()}`,
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

        // Check if this is only a status update to "Paid"
        // More specific check: make sure it only has the status field and it's being changed to 'Paid'
        const isOnlyStatusUpdate =
            Object.keys(invoiceData).length === 1 &&
            invoiceData.status !== undefined &&
            ['Paid', 'Pending'].includes(invoiceData.status);

        // If it's only updating status, handle it without affecting inventory
        if (isOnlyStatusUpdate) {
            console.log(`Processing status-only update to ${invoiceData.status} for invoice ${invoiceId}`);
            const updatedInvoice = await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: invoiceData.status },
                include: {
                    customer: true,
                    shop: true,
                    items: {
                        include: {
                            product: true
                        }
                    },
                    payments: true
                }
            });

            // Invalidate caches
            const shopId = updatedInvoice.shopId;
            const invalidationPromises = [
                cacheService.invalidateInvoices(),
                cacheService.invalidatePattern(`invoices:*:shop:${shopId || 'all'}`),
                cacheService.invalidatePattern('invoices:all:*'),
                cacheService.invalidatePattern('dashboard:*'),
                cacheService.invalidatePattern(`dashboard:optimized:shop:${shopId || 'all'}`),
                cacheService.invalidatePattern('dashboard:summary'),
                cacheService.invalidatePattern('dashboard:sales'),
                cacheService.invalidatePattern('dashboard:shops'),
            ];
            await Promise.all(invalidationPromises);

            return NextResponse.json(updatedInvoice);
        }

        // Ensure invoiceData.items is an array, default to empty if not provided or not an array
        if (!Array.isArray(invoiceData.items)) {
            console.log('invoiceData.items was not an array, defaulting to [] for update.');
            invoiceData.items = [];
        }

        // Inventory update events are now handled in the service layer if needed

        // Update invoice with transaction to handle items
        const updatedInvoice = await prisma.$transaction(
            async (tx) => {
                try {
                    const existingInvoice = await tx.invoice.findUnique({
                        where: { id: invoiceId },
                        include: {
                            items: true // Keep for inventory adjustment if needed, though items will be replaced
                        }
                    });

                    if (!existingInvoice) {
                        throw new Error('Invoice not found');
                    }

                    // --- Inventory Adjustment Logic (existing) --- 
                    // This logic might need review if items are fully replaced, 
                    // as it compares old vs new item quantities. 
                    // For profit, we are deleting and re-creating items.
                    const oldItemsMap = new Map();
                    const newItemsMap = new Map();

                    for (const item of existingInvoice.items) {
                        const existingQuantity = oldItemsMap.get(item.productId) || 0;
                        oldItemsMap.set(item.productId, existingQuantity + item.quantity);
                    }

                    for (const item of invoiceData.items) {
                        const productId = parseInt(item.productId.toString());
                        const existingQuantity = newItemsMap.get(productId) || 0;
                        newItemsMap.set(productId, existingQuantity + item.quantity);
                    }

                    const allProductIds = new Set([
                        ...Array.from(oldItemsMap.keys()),
                        ...Array.from(newItemsMap.keys())
                    ]);

                    console.log('Invoice update - Inventory changes (based on diff):');
                    for (const productId of Array.from(allProductIds)) {
                        const oldQuantity = oldItemsMap.get(productId) || 0;
                        const newQuantity = newItemsMap.get(productId) || 0;
                        const quantityChange = newQuantity - oldQuantity;
                        console.log(`Product ID ${productId}: Old=${oldQuantity}, New=${newQuantity}, Change=${quantityChange}`);
                        if (quantityChange !== 0) {
                            // Ensure affectedShopId is a string if invoiceData.shopId is a string
                            const affectedShopId: string | undefined = invoiceData.shopId ? String(invoiceData.shopId) : undefined;

                            if (quantityChange > 0) { // Deduct (more items sold or added)
                                if (affectedShopId) {
                                    const availableInventory = await tx.inventoryItem.findMany({
                                        where: { productId: parseInt(productId.toString()), shopId: affectedShopId }
                                    });
                                    const totalAvailable = availableInventory.reduce((sum, item) => sum + item.quantity, 0);
                                    if (totalAvailable < quantityChange) {
                                        throw new Error(`Insufficient inventory for product ID ${productId} in shop ${affectedShopId}. Available: ${totalAvailable}, Required increase: ${quantityChange}`);
                                    }
                                    // This should ideally be a more robust way to pick which inventory item to decrement
                                    await tx.inventoryItem.updateMany({
                                        where: { productId: parseInt(productId.toString()), shopId: affectedShopId, quantity: { gte: quantityChange } }, // Simplistic update
                                        data: { quantity: { decrement: quantityChange } }
                                    });
                                } else {
                                    await tx.inventoryItem.updateMany({
                                        where: { productId: parseInt(productId.toString()), quantity: { gte: quantityChange } }, // Simplistic update
                                        data: { quantity: { decrement: quantityChange } }
                                    });
                                }
                            } else { // Add back (fewer items sold or items removed)
                                if (affectedShopId) {
                                    await tx.inventoryItem.updateMany({
                                        where: { productId: parseInt(productId.toString()), shopId: affectedShopId },
                                        data: { quantity: { increment: Math.abs(quantityChange) } }
                                    });
                                } else {
                                    await tx.inventoryItem.updateMany({
                                        where: { productId: parseInt(productId.toString()) },
                                        data: { quantity: { increment: Math.abs(quantityChange) } }
                                    });
                                }
                            }
                        }
                    }
                    // --- End Inventory Adjustment Logic ---

                    // Delete old invoice items before adding new ones for profit recalc
                    await tx.invoiceItem.deleteMany({ where: { invoiceId: invoiceId } });

                    let newCalculatedTotalInvoiceAmount = 0;
                    let newTotalInvoiceProfit = 0;

                    if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
                        const productIdsForNewItems = invoiceData.items.map((item: any) => parseInt(item.productId.toString()));
                        
                        // Get shop-specific costs for profit calculation instead of global weighted average
                        const inventoryItems = await tx.inventoryItem.findMany({
                            where: { 
                                productId: { in: productIdsForNewItems },
                                shopId: invoiceData.shopId
                            },
                            select: { productId: true, shopSpecificCost: true }
                        });

                        // Create a map of productId to shop-specific cost
                        const productCostMap = new Map(inventoryItems.map(item => [item.productId, item.shopSpecificCost || 0]));
                        
                        // For products not found in inventory, fallback to global weighted average
                        const missingProductIds = productIdsForNewItems.filter((id: number) => !productCostMap.has(id));
                        if (missingProductIds.length > 0) {
                            const fallbackProducts = await tx.product.findMany({
                                where: { id: { in: missingProductIds } },
                                select: { id: true, weightedAverageCost: true }
                            });
                            fallbackProducts.forEach(p => {
                                productCostMap.set(p.id, p.weightedAverageCost || 0);
                            });
                        }

                        for (const item of invoiceData.items) {
                            const productId = parseInt(item.productId.toString());
                            const costPrice = productCostMap.get(productId) || 0;
                            const itemSellingTotal = item.quantity * item.price;
                            const totalItemCost = costPrice * item.quantity;
                            const itemProfit = itemSellingTotal - totalItemCost;

                            await tx.invoiceItem.create({
                                data: {
                                    invoiceId: invoiceId,
                                    productId: productId,
                                    quantity: item.quantity,
                                    price: item.price,
                                    total: itemSellingTotal,
                                    costPrice: costPrice,
                                    profit: itemProfit
                                }
                            });
                            newCalculatedTotalInvoiceAmount += itemSellingTotal;
                            newTotalInvoiceProfit += itemProfit;
                        }
                    }

                    const newProfitMargin = newCalculatedTotalInvoiceAmount > 0 ? (newTotalInvoiceProfit / newCalculatedTotalInvoiceAmount) * 100 : 0;

                    const dataToUpdate: any = {
                        status: invoiceData.status,
                        paymentMethod: invoiceData.paymentMethod,
                        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : undefined,
                        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined,
                        notes: invoiceData.notes,
                        shopId: invoiceData.shopId ? invoiceData.shopId.toString() : null, // Ensure shopId is string or null
                        total: newCalculatedTotalInvoiceAmount, // Updated total
                        totalProfit: newTotalInvoiceProfit,   // Updated profit
                        profitMargin: newProfitMargin         // Updated profit margin
                    };

                    if (invoiceData.customerId) {
                        dataToUpdate.customerId = parseInt(invoiceData.customerId.toString());
                    } else {
                        // If customerId is explicitly null or undefined, disconnect it if your schema allows
                        // dataToUpdate.customer = { disconnect: true }; 
                        // Or ensure it's set to null if the field is optional and you want to clear it.
                        // For now, we assume if not provided, it's not changed or handled by frontend state.
                    }

                    console.log('Updating invoice details with profit:', { invoiceId, dataToUpdate });

                    const finalUpdatedInvoice = await tx.invoice.update({
                        where: { id: invoiceId },
                        data: dataToUpdate,
                        include: {
                            customer: true,
                            shop: true,
                            items: {
                                include: {
                                    product: true
                                }
                            },
                            payments: true
                        }
                    });

                    // Handle cash payment method
                    // Removed automatic payment creation/update for cash invoices
                    // Users will manually record payments when they actually receive them

                    return finalUpdatedInvoice;
                } catch (txError) {
                    console.error('Transaction error:', txError);
                    throw txError;
                }
            },
            { timeout: 30000 }
        );

        // Real-time updates now handled by polling system
        // if (inventoryUpdatesForEvent.length > 0) { // This line is removed
        //     console.log(`${inventoryUpdatesForEvent.length} inventory updates processed for updated invoice ${invoiceId}`);
        // }

        // Send SMS notification if requested
        if (sendSms && updatedInvoice) {
            try {
                await smsService.init();
                if (smsService.isConfigured()) {
                    // Send SMS notification asynchronously
                    smsService.sendInvoiceNotification(updatedInvoice.id)
                        .then((result: any) => {
                            if (result.status >= 200 && result.status < 300) {
                                console.log('SMS update notification sent successfully');
                            } else {
                                console.warn('Failed to send SMS update notification:', result.message);
                            }
                        })
                        .catch((error: any) => {
                            console.error('Error sending SMS update notification:', error);
                        });
                }
            } catch (smsError) {
                // Log SMS error but don't fail the request
                console.error('SMS update notification error:', smsError);
            }
        }

        // Invalidate related caches after successful update
        const shopId = updatedInvoice.shopId;
        const invalidationPromises = [
            cacheService.invalidateInvoices(),
            cacheService.invalidatePattern(`invoices:*:shop:${shopId || 'all'}`),
            cacheService.invalidatePattern('invoices:all:*'),
            cacheService.invalidatePattern('inventory:*'),
            cacheService.invalidatePattern(`inventory:*:shop:${shopId || 'all'}`),
            cacheService.invalidatePattern('dashboard:*'),
            cacheService.invalidatePattern(`dashboard:optimized:shop:${shopId || 'all'}`),
            cacheService.invalidatePattern('dashboard:summary'),
            cacheService.invalidatePattern('dashboard:sales'),
            cacheService.invalidatePattern('dashboard:shops'),
        ];
        await Promise.all(invalidationPromises);

        const auditService = new AuditService();
        const changes = {}; // Compare existingInvoice and updatedInvoice
        Object.keys(dataToUpdate).forEach(key => {
            if (existingInvoice[key] !== updatedInvoice[key]) {
                changes[key] = { old: existingInvoice[key], new: updatedInvoice[key] };
            }
        });

        if (Object.keys(changes).length > 0) {
            await auditService.logAction({
                userId,
                action: 'UPDATE',
                entity: 'Invoice',
                entityId: invoiceId,
                details: changes
            });
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
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Validate token and permissions
        const hasSalesDelete = await validateTokenPermission(request, 'sales:delete');
        const hasInvoiceManage = await validateTokenPermission(request, 'invoice:manage');

        if (!hasSalesDelete.isValid && !hasInvoiceManage.isValid) {
            return NextResponse.json({ 
                error: "Permission denied. Requires 'sales:delete' or 'invoice:manage'." 
            }, { status: 403 });
        }

        const resolvedParams = await params;
        if (!resolvedParams?.id || isNaN(Number(resolvedParams.id))) {
            return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
        }
        const invoiceId = Number(resolvedParams.id);

        // Get userId
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // Inventory update events are now handled in the service layer if needed

        // Delegate deletion logic to the service layer to keep this handler lean
        const { deleteInvoice } = await import('@/services/invoiceService');
        const deletedInvoiceResult = await deleteInvoice(invoiceId, Number(userId));
        
        // Real-time updates now handled by polling system
        console.log(`Invoice ${deletedInvoiceResult.id} deleted successfully`);

        // Smart cache invalidation - only invalidate what's necessary
        const invalidationPromises = [
            // Invalidate invoice-specific caches
            cacheService.invalidatePattern(`invoices:*:shop:${deletedInvoiceResult?.shopId || 'all'}`),
            cacheService.invalidatePattern('invoices:all:*'),
            
            // Invalidate inventory caches for affected shop
            cacheService.invalidatePattern(`inventory:*:shop:${deletedInvoiceResult?.shopId || 'all'}`),
            cacheService.invalidatePattern('inventory:all:*'),
            
            // Use optimized dashboard cache invalidation
            cacheService.invalidatePattern(`dashboard:optimized:*:shop:${deletedInvoiceResult?.shopId || 'all'}`),
            cacheService.invalidatePattern('dashboard:optimized:*:all'),
            
            // Invalidate legacy dashboard caches
            cacheService.invalidatePattern(`dashboard:summary:*:shop:${deletedInvoiceResult?.shopId || 'all'}`),
            cacheService.invalidatePattern('dashboard:summary:*:all')
        ];

        await Promise.allSettled(invalidationPromises);
        
        // Trigger materialized view refresh in background
        // Instead of issuing an internal HTTP request (which doubles latency and
        // consumes another lambda invocation), we rely on the cacheService
        // invalidation performed above. The optimized dashboard route will
        // regenerate fresh data on the next request.
        
        return NextResponse.json({
            success: true,
            message: `Invoice ${deletedInvoiceResult?.invoiceNumber || invoiceId} deleted successfully`,
            data: { id: deletedInvoiceResult?.id }
        });

    } catch (error) {
        console.error('Error deleting invoice:', error);
        const err = error as Error;

        // Check for foreign key constraint violation with receipts
        if (err.message && err.message.includes('Receipt_paymentId_fkey')) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Cannot delete invoice with associated receipts. Please delete the receipts first.',
                    error: err.message
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: err.message || 'Error deleting invoice', error: err.stack },
            { status: 500 }
        );
    }
}