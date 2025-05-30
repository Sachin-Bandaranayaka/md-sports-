import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

// Filtered version of fetchTransfersData with date range support
export async function fetchTransfersDataFiltered(startDate?: string | null, endDate?: string | null) {
    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
        dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.lte = endDateTime;
    }

    // Fetch inventory transfers with date filtering
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
            where: Object.keys(dateFilter).length > 0 ? {
                createdAt: dateFilter
            } : undefined,
            orderBy: {
                createdAt: 'desc'
            },
            take: 10 // Show more transfers when filtering by date
        }),
        [],
        'Failed to fetch filtered transfers data'
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
        // Check cache first
        const cacheKey = 'dashboard:transfers';
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Transfers data served from cache');
            return NextResponse.json(cachedData);
        }

        console.log('🔄 Fetching fresh transfers data');
        const transfersResult = await fetchTransfersData();

        // Cache for 2 minutes (transfers change frequently)
        await cacheService.set(cacheKey, transfersResult, 120);
        console.log('💾 Transfers data cached for 2 minutes');

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