import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Get all inventory items
        const inventoryItems = await prisma.inventoryItem.findMany();

        // Get all products to access their retail prices
        const productIds = inventoryItems.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds
                }
            },
            select: {
                id: true,
                name: true,
                price: true  // This is the retail price
            }
        });

        // Create a map of product ID to product data for easy lookup
        const productMap = new Map();
        products.forEach(product => {
            productMap.set(product.id, product);
        });

        // Calculate total retail value
        let totalRetailValue = 0;
        let previousPeriodValue = 0;  // For comparison with previous period

        // Process each inventory item
        inventoryItems.forEach(item => {
            const product = productMap.get(item.productId);
            if (product && item.quantity > 0) {
                const retailPrice = product.price || 0;
                const itemRetailValue = retailPrice * item.quantity;
                totalRetailValue += itemRetailValue;
            }
        });

        // For demo purposes, let's assume previous value was 5% less
        // In a real app, you would fetch historical data
        previousPeriodValue = totalRetailValue * 0.95;

        // Calculate trend
        const difference = totalRetailValue - previousPeriodValue;
        const percentChange = (difference / previousPeriodValue) * 100;

        // Format the value for display
        const formattedValue = `Rs. ${totalRetailValue.toLocaleString()}`;

        return NextResponse.json({
            success: true,
            formattedValue,
            rawValue: totalRetailValue,
            trend: `+${percentChange.toFixed(0)}%`,
            trendUp: percentChange >= 0
        });
    } catch (error) {
        console.error('Error calculating total retail value:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to calculate total retail value'
        }, { status: 500 });
    }
} 