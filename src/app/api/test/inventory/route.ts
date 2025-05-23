import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Test database connection
        const testConnection = await prisma.$queryRaw`SELECT 1 as connected`;
        console.log('Database connection test:', testConnection);

        // Count inventory items
        const inventoryCount = await prisma.inventoryItem.count();
        console.log('Inventory item count:', inventoryCount);

        // Get all inventory items with products
        const inventoryItems = await prisma.inventoryItem.findMany({
            include: {
                product: true
            },
            take: 5 // Limit to 5 items for testing
        });

        // Calculate inventory value manually
        let manualTotal = 0;
        for (const item of inventoryItems) {
            const cost = item.product?.weightedaveragecost || 0;
            const quantity = item.quantity || 0;
            manualTotal += cost * quantity;
        }

        // Direct SQL query to calculate total value
        const sqlResult = await prisma.$queryRaw`
            SELECT SUM(i.quantity * p.weightedaveragecost) as total_value
            FROM "InventoryItem" i
            JOIN "Product" p ON i."productId" = p.id
        `;

        return NextResponse.json({
            success: true,
            connection: testConnection,
            inventoryCount,
            sampleItems: inventoryItems.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.product?.name,
                quantity: item.quantity,
                cost: item.product?.weightedaveragecost,
                value: (item.quantity || 0) * (item.product?.weightedaveragecost || 0)
            })),
            manualTotal,
            sqlResult
        });
    } catch (error) {
        console.error('Test API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 