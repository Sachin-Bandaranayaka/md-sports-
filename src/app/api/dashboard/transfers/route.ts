import { NextResponse } from 'next/server';

// GET: Fetch recent inventory transfers
export async function GET() {
    try {
        // Since we haven't implemented the transfers functionality yet,
        // we'll return empty data for now
        // In a real implementation, we would query the database for recent transfers

        const data = [];

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching transfer data:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching transfer data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 