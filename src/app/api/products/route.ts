import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET() {
    try {
        const result = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true
            ORDER BY p.name
        `);

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
                (name, sku, barcode, description, base_price, retail_price, category_id, image_url)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            productData.name,
            productData.sku,
            productData.barcode || null,
            productData.description || null,
            productData.basePrice,
            productData.retailPrice,
            productData.categoryId || null,
            productData.imageUrl || null
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