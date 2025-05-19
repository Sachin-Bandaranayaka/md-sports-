import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET: Fetch inventory distribution by category
export async function GET() {
    try {
        // Get inventory counts by category
        const categoryInventoryQuery = await db.query(`
            SELECT 
                c.name, 
                COALESCE(SUM(i.quantity), 0) as value
            FROM 
                categories c
            LEFT JOIN 
                products p ON c.id = p.category_id
            LEFT JOIN 
                inventory_items i ON p.id = i.product_id
            WHERE 
                c.parent_id IS NOT NULL
                AND p.is_active = true
            GROUP BY 
                c.name
            HAVING 
                COALESCE(SUM(i.quantity), 0) > 0
            ORDER BY 
                value DESC
            LIMIT 5
        `);

        const data = categoryInventoryQuery.rows;

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching inventory distribution data:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching inventory distribution data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 