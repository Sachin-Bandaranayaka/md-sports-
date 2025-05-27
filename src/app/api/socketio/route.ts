import { NextRequest, NextResponse } from 'next/server';
import { initSocketIO, isSocketIOInitialized } from '@/lib/websocket';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

// Create HTTP server for Socket.IO
const httpServer = createServer();
let io: SocketIOServer;

// Initialize Socket.IO if not already done
if (!isSocketIOInitialized()) {
    io = initSocketIO(httpServer);

    // Start the HTTP server on a different port
    const PORT = parseInt(process.env.SOCKET_IO_PORT || '3001', 10);
    httpServer.listen(PORT, () => {
        console.log(`Socket.IO server listening on port ${PORT}`);
    });
}

export async function GET(req: NextRequest) {
    // This route is just a placeholder for Socket.IO
    // The actual WebSocket connection is handled by the Socket.IO server
    return NextResponse.json(
        { success: true, message: 'WebSocket server is running' },
        { status: 200 }
    );
}

// Disable default body parsing for WebSocket connections
export const config = {
    api: {
        bodyParser: false,
    },
}; 