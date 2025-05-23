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
        // Get the shop ID safely
        if (!params || !params.id) {
            return NextResponse.json({
                success: false,
                message: 'Shop ID is required',
            }, { status: 400 });
        }

        const shopId = params.id;

        // Get inventory items for the shop
        const result = await db.query(
            `SELECT 
                i.id,
                i."productId",
                i.quantity,
                p.id AS product_id,
                p.name AS product_name,
                p.description,
                p.sku,
                p.barcode,
                p.price,
                p.weightedAverageCost,
                c.name AS category_name
            FROM 
                "InventoryItem" i
            JOIN 
                "Product" p ON i."productId" = p.id
            LEFT JOIN 
                "Category" c ON p."categoryId" = c.id
            WHERE 
                i."shopId" = $1
            ORDER BY
                p.name`,
            [shopId]
        );

        return NextResponse.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        // Log the error
        console.error(`Error fetching shop inventory (shop_id ${params?.id}):`, error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch shop inventory',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 