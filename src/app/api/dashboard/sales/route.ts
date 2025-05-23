import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

// GET: Fetch monthly sales data
export async function GET() {
    try {
        // Get current month
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-indexed (0 = January)
        const months = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Get all inventory items to calculate inventory value per month
        // Since we don't have actual sales data, we'll use inventory value as a proxy
        const inventoryItems = await safeQuery(
            () => prisma.inventoryItem.findMany({
                include: {
                    product: true,
                    shop: true
                }
            }),
            [], // Empty array fallback
            'Failed to fetch inventory items'
        );

        // Calculate the total value of inventory
        const totalInventoryValue = inventoryItems.reduce((sum, item) => {
            const price = item.product?.price || 0;
            return sum + (price * item.quantity);
        }, 0);

        // If we have no inventory data, return empty months
        if (totalInventoryValue === 0) {
            for (let i = 5; i >= 0; i--) {
                let monthIndex = currentMonth - i;
                if (monthIndex < 0) {
                    monthIndex += 12;
                }
                months.push({
                    month: monthNames[monthIndex],
                    sales: 0
                });
            }
            return NextResponse.json({
                success: true,
                data: months
            });
        }

        // Get shops to distribute inventory value
        const shops = await safeQuery(
            () => prisma.shop.findMany(),
            [], // Empty array fallback
            'Failed to fetch shops data'
        );

        // Calculate distribution factor based on number of shops
        const shopCount = shops.length || 1; // Avoid division by zero

        // Create a distribution pattern over 6 months
        // This simulates how inventory might translate to sales over time
        const distributionPattern = [0.7, 0.8, 0.85, 0.9, 0.95, 1.0];

        for (let i = 5; i >= 0; i--) {
            // Calculate month index (handling wrapping to previous year)
            let monthIndex = currentMonth - i;
            if (monthIndex < 0) {
                monthIndex += 12;
            }

            // Calculate a portion of the inventory value as simulated sales
            // Use inventory value and distribution pattern to create a trend
            // This gives us data based on real inventory rather than random numbers
            const sales = Math.round(totalInventoryValue * distributionPattern[5 - i] / shopCount);

            months.push({
                month: monthNames[monthIndex],
                sales: sales
            });
        }

        return NextResponse.json({
            success: true,
            data: months
        });
    } catch (error) {
        console.error('Error generating sales data:', error);
        return NextResponse.json({
            success: false,
            message: 'Error generating sales data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 