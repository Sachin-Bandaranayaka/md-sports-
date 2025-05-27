import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Socket as NetSocket } from 'net';
import type { Server as IOServer } from 'socket.io';

export const WEBSOCKET_EVENTS = {
    // Dashboard events
    DASHBOARD_UPDATE: 'dashboard:update',

    // Inventory events
    INVENTORY_UPDATE: 'inventory:update',
    INVENTORY_ITEM_UPDATE: 'inventory:item:update',
    INVENTORY_ITEM_CREATE: 'inventory:item:create',
    INVENTORY_ITEM_DELETE: 'inventory:item:delete',

    // Customer events
    CUSTOMER_UPDATE: 'customer:update',
    CUSTOMER_CREATE: 'customer:create',
    CUSTOMER_DELETE: 'customer:delete',

    // Invoice events
    INVOICE_UPDATE: 'invoice:update',
    INVOICE_CREATE: 'invoice:create',
    INVOICE_STATUS_UPDATE: 'invoice:status:update',
    INVOICE_DELETE: 'invoice:delete',

    // Purchase events
    PURCHASE_UPDATE: 'purchase:update',
    PURCHASE_CREATE: 'purchase:create',
    PURCHASE_STATUS_UPDATE: 'purchase:status:update',
    PURCHASE_DELETE: 'purchase:delete',
};

interface SocketServer extends HTTPServer {
    io?: IOServer | undefined;
}

interface SocketWithIO extends NetSocket {
    server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
    socket: SocketWithIO;
}

export function getSocketIO(): IOServer | null {
    // @ts-ignore
    return global.io || null;
}

export function initSocketIO(server: HTTPServer): IOServer {
    let currentIO = getSocketIO();
    if (!currentIO) {
        currentIO = new SocketIOServer(server, {
            path: '/api/socketio',
            addTrailingSlash: false,
            cors: {
                origin: process.env.NODE_ENV === 'production'
                    ? process.env.NEXT_PUBLIC_SITE_URL || '*'
                    : 'http://localhost:3000', // Assuming client runs on 3000
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        console.log('Socket.IO server initialized and attached to global.io');
        // @ts-ignore
        global.io = currentIO;

        // Set up event handlers
        currentIO.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
    }
    return currentIO;
}

// Helper function to emit events to all connected clients
export function emitToAll(event: string, data: any): void {
    const ioInstance = getSocketIO();
    if (ioInstance) {
        ioInstance.emit(event, data);
    }
}

// Helper function to emit events to specific rooms
export function emitToRoom(room: string, event: string, data: any): void {
    const ioInstance = getSocketIO();
    if (ioInstance) {
        ioInstance.to(room).emit(event, data);
    }
}

// Helper to check if Socket.IO is initialized
export function isSocketIOInitialized(): boolean {
    return getSocketIO() !== null;
} 