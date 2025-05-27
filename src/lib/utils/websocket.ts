import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';

/**
 * Emits a dashboard update event to all connected clients
 * @param data Dashboard data to send
 */
export function emitDashboardUpdate(data: any) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.DASHBOARD_UPDATE, data);
        console.log('Emitted dashboard update event');
    } else {
        console.log('Socket.IO not initialized, skipping dashboard update');
    }
}

/**
 * Emits an inventory update event to all connected clients
 * @param data Inventory data to send
 */
export function emitInventoryUpdate(data: any) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.INVENTORY_UPDATE, data);
        console.log('Emitted inventory update event');
    } else {
        console.log('Socket.IO not initialized, skipping inventory update');
    }
}

/**
 * Emits an inventory item update event to all connected clients
 * @param item Updated inventory item
 */
export function emitInventoryItemUpdate(item: any) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.INVENTORY_ITEM_UPDATE, {
            type: 'item_update',
            item
        });
        console.log(`Emitted inventory item update event for item ID ${item.id}`);
    } else {
        console.log('Socket.IO not initialized, skipping inventory item update');
    }
}

/**
 * Emits an inventory item create event to all connected clients
 * @param item Created inventory item
 */
export function emitInventoryItemCreate(item: any) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.INVENTORY_ITEM_CREATE, {
            type: 'item_create',
            item
        });
        console.log(`Emitted inventory item create event for item ID ${item.id}`);
    } else {
        console.log('Socket.IO not initialized, skipping inventory item create');
    }
}

/**
 * Emits an inventory item delete event to all connected clients
 * @param itemId ID of the deleted inventory item
 */
export function emitInventoryItemDelete(itemId: number) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.INVENTORY_ITEM_DELETE, {
            type: 'item_delete',
            itemId
        });
        console.log(`Emitted inventory item delete event for item ID ${itemId}`);
    } else {
        console.log('Socket.IO not initialized, skipping inventory item delete');
    }
}

/**
 * Emits an invoice update event to all connected clients
 * @param data Invoice data to send
 */
export function emitInvoiceUpdate(data: any) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.INVOICE_UPDATE, data);
        console.log('Emitted invoice update event');
    } else {
        console.log('Socket.IO not initialized, skipping invoice update');
    }
}

/**
 * Emits an invoice create event to all connected clients
 * @param invoice Created invoice
 */
export function emitInvoiceCreate(invoice: any) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.INVOICE_CREATE, {
            type: 'create',
            invoice
        });
        console.log(`Emitted invoice create event for invoice ID ${invoice.id}`);
    } else {
        console.log('Socket.IO not initialized, skipping invoice create');
    }
}

/**
 * Emits an invoice status update event to all connected clients
 * @param invoiceId ID of the updated invoice
 * @param status New status
 */
export function emitInvoiceStatusUpdate(invoiceId: number, status: string) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.INVOICE_STATUS_UPDATE, {
            type: 'status_update',
            invoiceId,
            status
        });
        console.log(`Emitted invoice status update event for invoice ID ${invoiceId}`);
    } else {
        console.log('Socket.IO not initialized, skipping invoice status update');
    }
}

/**
 * Emits a customer update event to all connected clients
 * @param data Customer data to send
 */
export function emitCustomerUpdate(data: any) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.CUSTOMER_UPDATE, data);
        console.log('Emitted customer update event');
    } else {
        console.log('Socket.IO not initialized, skipping customer update');
    }
}

/**
 * Emits a purchase update event to all connected clients
 * @param data Purchase data to send
 */
export function emitPurchaseUpdate(data: any) {
    const io = getSocketIO();
    if (io) {
        io.emit(WEBSOCKET_EVENTS.PURCHASE_UPDATE, data);
        console.log('Emitted purchase update event');
    } else {
        console.log('Socket.IO not initialized, skipping purchase update');
    }
} 