import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ProductHistoryEvent {
    timestamp: Date;
    type: string;
    description: string;
    quantityChange?: number;
    shopId?: number;
    shopName?: string;
    userId?: number;
    userName?: string;
    relatedDocumentId?: string;
    details?: any;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const productId = parseInt(params.id);
        if (isNaN(productId)) {
            return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 });
        }

        const allEvents: ProductHistoryEvent[] = [];

        // 1. Fetch Purchases
        const purchases = await prisma.purchaseInvoiceItem.findMany({
            where: { productId },
            include: {
                purchaseInvoice: { include: { supplier: true } },
                product: true // To get product name if needed for description, though we have productId
            },
            orderBy: { createdAt: 'desc' }
        });

        purchases.forEach(item => {
            allEvents.push({
                timestamp: item.purchaseInvoice.createdAt, // Or item.createdAt if more specific
                type: 'Purchase',
                description: `Purchased ${item.quantity} units from ${item.purchaseInvoice.supplier.name}. Price: Rs. ${item.price.toFixed(2)} each.`,
                quantityChange: item.quantity,
                relatedDocumentId: `Purchase Invoice #${item.purchaseInvoice.invoiceNumber}`,
                // shopId: item.purchaseInvoice.shopId, // If PurchaseInvoice has a shopId
                // userName: // If PurchaseInvoice has a creator/userId
                details: {
                    supplier: item.purchaseInvoice.supplier.name,
                    invoiceNumber: item.purchaseInvoice.invoiceNumber,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                }
            });
        });

        // 2. Fetch Sales
        const sales = await prisma.invoiceItem.findMany({
            where: { productId },
            include: {
                invoice: { include: { customer: true, shop: true } }, // Assuming Invoice has shop
                product: true
            },
            orderBy: { createdAt: 'desc' }
        });

        sales.forEach(item => {
            allEvents.push({
                timestamp: item.invoice.createdAt, // Or item.createdAt
                type: 'Sale',
                description: `Sold ${item.quantity} units to ${item.invoice.customer.name}.Price: Rs.${item.price.toFixed(2)} each.`,
                quantityChange: -item.quantity, // Negative for sale
                shopId: item.invoice.shopId || undefined,
                shopName: item.invoice.shop?.name || undefined,
                relatedDocumentId: `Sales Invoice #${item.invoice.invoiceNumber}`,
                // userName: item.invoice.userId // If Invoice has a creator/userId
                details: {
                    customer: item.invoice.customer.name,
                    invoiceNumber: item.invoice.invoiceNumber,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                    shop: item.invoice.shop?.name,
                }
            });
        });

        // 3. Fetch Transfers
        const transfers = await prisma.transferItem.findMany({
            where: { productId },
            include: {
                transfer: { include: { fromShop: true, toShop: true, fromUser: true, toUser: true } },
                product: true
            },
            orderBy: { createdAt: 'desc' }
        });

        transfers.forEach(item => {
            // Create two events for each transfer: one for 'out' and one for 'in'
            // Transfer Out
            allEvents.push({
                timestamp: item.transfer.createdAt,
                type: 'Transfer Out',
                description: `Transferred ${item.quantity} units from ${item.transfer.fromShop.name} to ${item.transfer.toShop.name}.`,
                quantityChange: -item.quantity,
                shopId: item.transfer.fromShopId,
                shopName: item.transfer.fromShop.name,
                userId: item.transfer.fromUserId, // User initiating transfer
                userName: item.transfer.fromUser.name,
                relatedDocumentId: `Transfer ID #${item.transfer.id}`,
                details: {
                    fromShop: item.transfer.fromShop.name,
                    toShop: item.transfer.toShop.name,
                    quantity: item.quantity,
                    status: item.transfer.status,
                    notes: item.transfer.notes
                }
            });
            // Transfer In
            allEvents.push({
                timestamp: item.transfer.createdAt, // Could be a slightly later time if transfer has receivedAt
                type: 'Transfer In',
                description: `Received ${item.quantity} units at ${item.transfer.toShop.name} from ${item.transfer.fromShop.name}.`,
                quantityChange: item.quantity,
                shopId: item.transfer.toShopId,
                shopName: item.transfer.toShop.name,
                userId: item.transfer.toUserId, // User receiving/confirming transfer
                userName: item.transfer.toUser.name,
                relatedDocumentId: `Transfer ID #${item.transfer.id}`,
                details: { ...allEvents[allEvents.length - 1].details } // same details as out
            });
        });

        // 4. Fetch Audit Logs (Product Updates and Stock Additions)
        const auditLogs = await prisma.auditLog.findMany({
            where: {
                OR: [
                    { entity: 'Product', entityId: productId, action: 'UPDATE_PRODUCT' },
                    { entity: 'InventoryItem', details: { path: ['productId'], equals: productId }, action: 'ADD_INVENTORY' },
                    // Add more specific audit actions if needed, e.g., for manual adjustments
                ]
            },
            // include: { user: true }, // Temporarily removed due to missing explicit relation
            orderBy: { createdAt: 'desc' }
        });

        auditLogs.forEach(log => {
            let eventType = 'Audit';
            let eventDescription = `Action: ${log.action} on ${log.entity}`;
            let quantityChangeVal: number | undefined = undefined;
            let detailsObject = log.details;
            // let userNameVal: string | undefined = undefined; // Temporarily remove user name

            if (log.action === 'UPDATE_PRODUCT' && typeof log.details === 'object' && log.details !== null) {
                eventType = 'Product Update';
                const changes = Object.entries(log.details as Record<string, { old: any, new: any }>)
                    .map(([key, value]) => `  - ${key}: '${value.old}' -> '${value.new}'`)
                    .join('\n');
                eventDescription = `Product details updated:\n${changes}`;
                detailsObject = log.details; // Already an object
            } else if (log.action === 'ADD_INVENTORY' && typeof log.details === 'object' && log.details !== null) {
                eventType = 'Stock Added';
                const detailJson = log.details as any; // Already parsed by Prisma if jsonb
                quantityChangeVal = detailJson.quantity || 0;
                eventDescription = `Added ${quantityChangeVal} units directly. Shop ID: ${detailJson.shopId}`;
                detailsObject = detailJson;
            }

            allEvents.push({
                timestamp: log.createdAt,
                type: eventType,
                description: eventDescription,
                quantityChange: quantityChangeVal,
                shopId: (log.details as any)?.shopId || undefined,
                userId: log.userId || undefined,
                // userName: userNameVal, // Temporarily remove user name
                relatedDocumentId: `Audit ID #${log.id}`,
                details: detailsObject
            });
        });

        // Sort all collected events by timestamp, most recent first
        allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return NextResponse.json({ success: true, data: allEvents });

    } catch (error) {
        console.error(`Error fetching product history for product ID ${params.id}:`, error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, message: 'Failed to fetch product history', details: message }, { status: 500 });
    }
} 