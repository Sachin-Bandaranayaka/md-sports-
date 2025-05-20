import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import db from '@/utils/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Check for 'inventory:view' permission
    const permissionError = await requirePermission('inventory:view')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        // Fix: Await params to properly handle dynamic route parameters
        const id = params.id;

        // Get inventory items for the shop
        const result = await db.query(
            `SELECT 
                i.id,
                i.product_id,
                i.quantity,
                i.reorder_level,
                p.name as product_name,
                p.sku,
                p.retail_price,
                p.base_price,
                c.name as category_name
            FROM 
                inventory_items i
            JOIN 
                products p ON i.product_id = p.id
            LEFT JOIN 
                categories c ON p.category_id = c.id
            WHERE 
                i.shop_id = $1 AND p.is_active = true
            ORDER BY
                p.name`,
            [id]
        );

        return NextResponse.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(`Error fetching shop inventory (shop_id ${params.id}):`, error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch shop inventory',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 