import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

// Default fallback data for transfers
const defaultTransfersData = [
    { id: 'TR-001', source: 'Colombo Shop', destination: 'Kandy Shop', status: 'Completed', date: '2025-05-20', items: 12 },
    { id: 'TR-002', source: 'Galle Shop', destination: 'Colombo Shop', status: 'Pending', date: '2025-05-19', items: 8 },
    { id: 'TR-003', source: 'Kandy Shop', destination: 'Jaffna Shop', status: 'In Transit', date: '2025-05-18', items: 15 }
];

// GET: Fetch recent inventory transfers
export async function GET() {
    try {
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
                        select: { id: true }
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

        // If no data, return dummy data
        if (data.length === 0) {
            return NextResponse.json({
                success: true,
                data: defaultTransfersData
            });
        }

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching transfer data:', error);

        // Return fallback data in case of error
        return NextResponse.json({
            success: true,
            data: defaultTransfersData
        });
    }
} 