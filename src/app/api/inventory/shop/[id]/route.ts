import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import { getUserFromToken } from '@/services/authService';
import db from '@/utils/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Check for inventory view permissions
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return NextResponse.json({
            success: false,
            message: 'Authentication required'
        }, { status: 401 });
    }

    // Get user to check specific permissions
    const user = await getUserFromToken(token);
    if (!user) {
        return NextResponse.json({
            success: false,
            message: 'Invalid token'
        }, { status: 401 });
    }

    // Check if user has any inventory view permission
    const hasBasicView = user.permissions?.includes('inventory:view:basic');
    const hasFullView = user.permissions?.includes('inventory:view');
    
    if (!hasBasicView && !hasFullView) {
        return NextResponse.json({
            success: false,
            message: 'Permission denied: inventory view access required'
        }, { status: 403 });
    }

    // Determine if costs should be included
    const includeCosts = hasFullView && !hasBasicView;

    try {
        // Get the shop ID safely
        if (!params || !params.id) {
            return NextResponse.json({
                success: false,
                message: 'Shop ID is required',
            }, { status: 400 });
        }

        const shopId = params.id;

        // Get inventory items for the shop with conditional cost inclusion
        const costField = includeCosts ? 'p.weightedAverageCost,' : '';
        
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
                ${costField}
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