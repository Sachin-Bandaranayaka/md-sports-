import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

export async function fetchTransfersData() {
    // Fetch recent inventory transfers using Prisma
    const transfers = await safeQuery(
        () => prisma.inventoryTransfer.findMany({
            select: {
                id: true,
                status: true,
                createdAt: true,
                fromShop: {
                    select: { name: true }
                },
                toShop: {
                    select: { name: true }
                },
                transferItems: {
                    select: { id: true } // Selecting id to count items
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5 // Limit to 5 most recent transfers
        }),
        [], // Empty array fallback
        'Failed to fetch transfers data'
    );

    // Format the data for the frontend
    const data = transfers.map(transfer => ({
        id: `TR-${String(transfer.id).padStart(3, '0')}`,
        source: transfer.fromShop.name,
        destination: transfer.toShop.name,
        status: transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1),
        date: transfer.createdAt.toISOString().split('T')[0],
        items: transfer.transferItems.length
    }));

    return {
        success: true,
        data
    };
}

// GET: Fetch recent inventory transfers
export async function GET() {
    try {
        const transfersResult = await fetchTransfersData();
        return NextResponse.json(transfersResult);
    } catch (error) {
        console.error('Error fetching transfer data:', error);
        // Return empty array instead of error, consistent with original
        return NextResponse.json({
            success: true, // Or false
            data: [],
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 