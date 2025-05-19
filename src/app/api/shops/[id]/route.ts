import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET: Fetch a specific shop by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid shop ID'
            }, { status: 400 });
        }

        // Query to get the shop details
        const shopResult = await db.query(`
            SELECT 
                id, name, location, contact_person, phone, email, created_at, updated_at
            FROM 
                shops
            WHERE 
                id = $1 AND is_active = true
        `, [id]);

        if (shopResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${id} not found`
            }, { status: 404 });
        }

        // Get inventory items for this shop
        const inventoryResult = await db.query(`
            SELECT 
                i.id, 
                i.product_id, 
                p.name as product_name,
                p.sku as product_sku,
                p.retail_price,
                i.quantity, 
                i.reorder_level
            FROM 
                inventory_items i
            JOIN 
                products p ON i.product_id = p.id
            WHERE 
                i.shop_id = $1
            ORDER BY 
                p.name
        `, [id]);

        // Combine the data
        const shopData = {
            ...shopResult.rows[0],
            inventory: inventoryResult.rows
        };

        return NextResponse.json({
            success: true,
            data: shopData
        });
    } catch (error) {
        console.error(`Error fetching shop with ID ${params.id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// PUT: Update a shop by ID
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const { name, location, contactPerson, phone, email } = await request.json();

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid shop ID'
            }, { status: 400 });
        }

        // Validate required fields
        if (!name || !location) {
            return NextResponse.json({
                success: false,
                message: 'Shop name and location are required'
            }, { status: 400 });
        }

        // Check if the shop exists
        const checkResult = await db.query(`
            SELECT id FROM shops WHERE id = $1 AND is_active = true
        `, [id]);

        if (checkResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${id} not found`
            }, { status: 404 });
        }

        // Update the shop in the database
        const result = await db.query(`
            UPDATE shops 
            SET 
                name = $1, 
                location = $2, 
                contact_person = $3, 
                phone = $4, 
                email = $5, 
                updated_at = CURRENT_TIMESTAMP
            WHERE 
                id = $6
            RETURNING *
        `, [name, location, contactPerson || null, phone || null, email || null, id]);

        return NextResponse.json({
            success: true,
            message: 'Shop updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error(`Error updating shop with ID ${params.id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error updating shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// DELETE: Deactivate a shop by ID (soft delete)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid shop ID'
            }, { status: 400 });
        }

        // Check if the shop exists
        const checkResult = await db.query(`
            SELECT id FROM shops WHERE id = $1 AND is_active = true
        `, [id]);

        if (checkResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${id} not found`
            }, { status: 404 });
        }

        // Soft delete the shop by setting is_active to false
        await db.query(`
            UPDATE shops 
            SET 
                is_active = false, 
                updated_at = CURRENT_TIMESTAMP
            WHERE 
                id = $1
        `, [id]);

        return NextResponse.json({
            success: true,
            message: 'Shop deactivated successfully'
        });
    } catch (error) {
        console.error(`Error deactivating shop with ID ${params.id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error deactivating shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 