import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        // TODO: Implement inventory status report logic
        const inventoryItems = await prisma.inventoryItem.findMany({
            include: {
                product: {
                    include: {
                        category: true,
                    }
                },
                shop: true,
            },
            orderBy: [
                { shop: { name: 'asc' } },
                { product: { name: 'asc' } },
            ]
        });

        const reportData = inventoryItems.map(item => ({
            productName: item.product.name,
            sku: item.product.sku,
            barcode: item.product.barcode,
            category: item.product.category?.name || 'N/A',
            shopName: item.shop.name,
            quantity: item.quantity,
            price: item.product.price, // Assuming 'price' on Product is the current retail price
            totalValue: item.quantity * item.product.price,
            // Add other relevant fields from item.product or item.shop as needed
        }));

        return NextResponse.json({
            success: true,
            // Summary might not be applicable here, or could be total items, total value etc.
            // For now, just returning the detailed list.
            details: reportData,
            generatedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error fetching inventory status report:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch inventory status report' },
            { status: 500 }
        );
    }
} 