import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Direct SQL query to calculate total retail inventory value
        const result = await prisma.$queryRaw`
            SELECT SUM(i.quantity * p.price) as total_retail_value
            FROM "InventoryItem" i
            JOIN "Product" p ON i."productId" = p.id
        `;

        // Log the raw result
        console.log('Raw total retail value result:', result);

        // Extract the value from the result
        const totalRetailValue = result[0]?.total_retail_value || 0;
        console.log('Extracted total retail value:', totalRetailValue);

        // Since we don't have historical data, we'll use a simplified approach
        // We'll assume a small random change for demonstration purposes
        // In a real app, you would store historical data or calculate based on recent changes

        // Generate a random percentage between -5% and +5%
        const randomPercentage = (Math.random() * 10 - 5).toFixed(1);
        const retailTrend = `${randomPercentage > 0 ? '+' : ''}${randomPercentage}%`;
        const retailTrendUp = parseFloat(randomPercentage) >= 0;

        // Format the value
        const formattedValue = Number(totalRetailValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        return NextResponse.json({
            success: true,
            totalRetailValue,
            formattedValue: `Rs. ${formattedValue}`,
            trend: retailTrend,
            trendUp: retailTrendUp
        });
    } catch (error) {
        console.error('Error calculating total retail value:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to calculate total retail value',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 