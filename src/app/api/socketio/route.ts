import { NextRequest, NextResponse } from 'next/server';
import { getSocketIO, isSocketIOInitialized } from '@/lib/websocket';

export async function GET(req: NextRequest) {
    if (isSocketIOInitialized()) {
        // You could add more checks here if needed, e.g., io.engine
        return NextResponse.json(
            { success: true, message: 'WebSocket server is initialized and running.' },
            { status: 200 }
        );
    } else {
        return NextResponse.json(
            { success: false, message: 'WebSocket server is not initialized.' },
            { status: 500 }
        );
    }
}

// Disable default body parsing for WebSocket connections
// This might still be relevant if Next.js tries to parse the body for /api/socketio, 
// which is handled by socket.io itself.
export const config = {
    api: {
        bodyParser: false,
    },
}; 