import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid product ID'
            }, { status: 400 });
        }

        const result = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1 AND p.is_active = true
        `, [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Product with ID ${id} not found`
            }, { status: 404 });
        }

        // Get inventory levels for this product
        const inventoryResult = await db.query(`
            SELECT i.*, s.name as shop_name, s.location as shop_location
            FROM inventory_items i
            JOIN shops s ON i.shop_id = s.id
            WHERE i.product_id = $1
        `, [id]);

        const product = {
            ...result.rows[0],
            inventory: inventoryResult.rows
        };

        return NextResponse.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error(`Error fetching product:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching product',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid product ID'
            }, { status: 400 });
        }

        const productData = await req.json();

        // Check if product exists
        const checkResult = await db.query('SELECT id FROM products WHERE id = $1', [id]);

        if (checkResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Product with ID ${id} not found`
            }, { status: 404 });
        }

        const result = await db.query(`
            UPDATE products
            SET 
                name = $1,
                sku = $2,
                barcode = $3,
                description = $4,
                cost_price = $5,
                retail_price = $6,
                category_id = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `, [
            productData.name,
            productData.sku,
            productData.barcode || null,
            productData.description || null,
            productData.basePrice,
            productData.retailPrice,
            productData.categoryId || null,
            id
        ]);

        return NextResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error(`Error updating product:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error updating product',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid product ID'
            }, { status: 400 });
        }

        // Soft delete - update is_active to false
        const result = await db.query(`
            UPDATE products
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id
        `, [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Product with ID ${id} not found`
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting product:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error deleting product',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 