import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

// Default fallback data for shops (can be removed if not needed after refactor)
// const defaultShopsData = [
//     { name: 'Colombo Shop', sales: 125000, stock: 450 },
//     { name: 'Kandy Shop', sales: 98500, stock: 320 },
//     { name: 'Galle Shop', sales: 75200, stock: 280 },
//     { name: 'Jaffna Shop', sales: 62800, stock: 210 }
// ];

// Filtered version of fetchShopsData with date range support
export async function fetchShopsDataFiltered(startDate?: string | null, endDate?: string | null) {
    // Build date filter
    let startOfPeriod: Date;
    let endOfPeriod: Date;

    if (startDate && endDate) {
        startOfPeriod = new Date(startDate);
        endOfPeriod = new Date(endDate);
        endOfPeriod.setHours(23, 59, 59, 999);
    } else {
        // Default to current month if no dates provided
        const now = new Date();
        startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
        endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // 1. Fetch all shops and their inventory in one go
    const shopsWithInventory = await safeQuery(
        () => prisma.shop.findMany({
            include: {
                inventoryItems: {
                    select: { quantity: true } // Only select quantity for stock calculation
                }
            }
        }),
        [],
        'Failed to fetch shops data'
    );

    if (!shopsWithInventory || shopsWithInventory.length === 0) {
        return { success: true, data: [] };
    }

    // 2. Fetch aggregated sales data for all relevant shops in the specified period
    const shopIds = shopsWithInventory.map(s => s.id);
    const salesByShop = await safeQuery(
        () => prisma.invoice.groupBy({
            by: ['shopId'],
            where: {
                shopId: { in: shopIds },
                createdAt: {
                    gte: startOfPeriod,
                    lte: endOfPeriod
                }
            },
            _sum: {
                total: true
            }
        }),
        [],
        'Failed to fetch aggregated sales data for shops'
    );

    // Create a map for easy lookup of sales by shopId
    const salesMap = new Map();
    if (Array.isArray(salesByShop)) {
        salesByShop.forEach(sale => {
            if (sale.shopId !== null) {
                salesMap.set(sale.shopId, sale._sum.total || 0);
            }
        });
    }

    // 3. Combine shop data with their sales and stock
    const data = shopsWithInventory.map(shop => {
        const totalStock = shop.inventoryItems.reduce(
            (sum, item) => sum + item.quantity,
            0
        );
        return {
            name: shop.name,
            sales: salesMap.get(shop.id) || 0,
            stock: totalStock
        };
    });

    return {
        success: true,
        data: data
    };
}

export async function fetchShopsData() {
    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Fetch all shops and their inventory in one go
    const shopsWithInventory = await safeQuery(
        () => prisma.shop.findMany({
            include: {
                inventoryItems: {
                    select: { quantity: true } // Only select quantity for stock calculation
                }
            }
        }),
        [],
        'Failed to fetch shops data'
    );

    if (!shopsWithInventory || shopsWithInventory.length === 0) {
        return { success: true, data: [] };
    }

    // 2. Fetch aggregated sales data for all relevant shops in the current month
    const shopIds = shopsWithInventory.map(s => s.id);
    const monthlySalesByShop = await safeQuery(
        () => prisma.invoice.groupBy({
            by: ['shopId'],
            where: {
                shopId: { in: shopIds }, // Filter by the shops we care about
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                },
                // Optionally, filter by invoice status if only e.g. 'Paid' invoices count as sales
                // status: 'Paid' 
            },
            _sum: {
                total: true
            }
        }),
        [],
        'Failed to fetch aggregated sales data for shops'
    );

    // Create a map for easy lookup of sales by shopId
    const salesMap = new Map();
    if (Array.isArray(monthlySalesByShop)) {
        monthlySalesByShop.forEach(sale => {
            if (sale.shopId !== null) { // Ensure shopId is not null before setting
                salesMap.set(sale.shopId, sale._sum.total || 0);
            }
        });
    }

    // 3. Combine shop data with their sales and stock
    const data = shopsWithInventory.map(shop => {
        const totalStock = shop.inventoryItems.reduce(
            (sum, item) => sum + item.quantity,
            0
        );
        return {
            name: shop.name,
            sales: salesMap.get(shop.id) || 0, // Get sales from the map, default to 0
            stock: totalStock
        };
    });

    // Filter out shops with no inventory (if still desired, or adjust logic)
    const shopsToDisplay = data.filter(shop => shop.stock > 0 || shop.sales > 0); // show if stock or sales

    return {
        success: true,
        data: shopsToDisplay
    };
}

// GET: Fetch shop performance data
export async function GET() {
    try {
        // Check cache first
        const cacheKey = 'dashboard:shops';
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Shops data served from cache');
            return NextResponse.json(cachedData);
        }

        console.log('🔄 Fetching fresh shops data');
        const shopsResult = await fetchShopsData();

        // Cache for 5 minutes (shop data changes less frequently)
        await cacheService.set(cacheKey, shopsResult, 300);
        console.log('💾 Shops data cached for 5 minutes');

        return NextResponse.json(shopsResult);
    } catch (error) {
        console.error('Error fetching shop performance data:', error);
        return NextResponse.json({
            success: false, // Signal error more clearly
            data: [],
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}