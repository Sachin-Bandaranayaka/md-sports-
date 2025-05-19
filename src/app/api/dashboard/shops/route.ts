import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET: Fetch shop performance data
export async function GET() {
    try {
        // Get all active shops with their inventory counts
        const shopsQuery = await db.query(`
            SELECT 
                s.id, 
                s.name, 
                COALESCE(SUM(i.quantity), 0) as stock
            FROM 
                shops s
            LEFT JOIN 
                inventory_items i ON s.id = i.shop_id
            WHERE 
                s.is_active = true
            GROUP BY 
                s.id, s.name
            ORDER BY 
                s.name
        `);

        // Since we don't have sales data yet, we'll add dummy sales data
        const data = shopsQuery.rows.map(shop => {
            // Generate a random sales figure between 50,000 and 150,000
            const randomSales = Math.floor(Math.random() * 100000) + 50000;

            return {
                name: shop.name,
                sales: randomSales,
                stock: Number(shop.stock)
            };
        });

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching shop performance data:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching shop performance data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 