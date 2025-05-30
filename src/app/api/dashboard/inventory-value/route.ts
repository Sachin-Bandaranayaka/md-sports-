import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

export async function GET() {
    try {
        // Check cache first
        const cacheKey = 'dashboard:inventory-value';
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Inventory value served from cache');
            return NextResponse.json(cachedData);
        }

        console.log('🔄 Fetching fresh inventory value');
        // Direct SQL query to calculate inventory value
        const result = await prisma.$queryRaw`
            SELECT SUM(i.quantity * p.weightedaveragecost) as total_value
            FROM "InventoryItem" i
            JOIN "Product" p ON i."productId" = p.id
        `;

        // Log the raw result
        console.log('Raw inventory value result:', result);

        // Extract the value from the result
        const totalValue = result[0]?.total_value || 0;
        console.log('Extracted total value:', totalValue);

        // Format the value
        const formattedValue = Number(totalValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        const responseData = {
            success: true,
            totalValue,
            formattedValue: `Rs. ${formattedValue}`
        };

        // Cache for 3 minutes (inventory value changes moderately)
        await cacheService.set(cacheKey, responseData, 180);
        console.log('💾 Inventory value cached for 3 minutes');

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error calculating inventory value:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to calculate inventory value',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}