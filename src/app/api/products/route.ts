import { NextResponse } from 'next/server';
import db from '@/utils/db';
import { getShopId } from '@/lib/utils/middleware';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Get shop ID from token if user is restricted to a specific shop
        const shopId = getShopId(request);

        let query;
        let params = [];

        if (shopId) {
            // User is restricted to a specific shop - only show products in that shop's inventory
            query = `
                SELECT DISTINCT p.*, c.name as category_name 
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                INNER JOIN inventory_items i ON p.id = i.product_id
                WHERE p.is_active = true AND i.shop_id = $1
                ORDER BY p.name
            `;
            params = [shopId];
        } else {
            // Administrator or manager with full access - show all products
            query = `
                SELECT p.*, c.name as category_name 
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_active = true
                ORDER BY p.name
            `;
        }

        const result = await db.query(query, params);

        return NextResponse.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching products',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const productData = await request.json();

        const result = await db.query(`
            INSERT INTO products 
                (name, sku, barcode, description, cost_price, retail_price, category_id)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            productData.name,
            productData.sku,
            productData.barcode || null,
            productData.description || null,
            productData.basePrice,
            productData.retailPrice,
            productData.categoryId || null
        ]);

        return NextResponse.json({
            success: true,
            message: 'Product created successfully',
            data: result.rows[0]
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating product',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 