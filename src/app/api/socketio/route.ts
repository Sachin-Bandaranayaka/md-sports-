import { NextRequest, NextResponse } from 'next/server';
import { getSocketIO, isSocketIOInitialized } from '@/lib/websocket';

// New Next.js 14 route segment config
export const runtime = 'nodejs';

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

// Note: bodyParser config is no longer needed in App Router
// Next.js handles this automatically for API routes