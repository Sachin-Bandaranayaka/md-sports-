import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import db from '@/utils/db';

// GET: Fetch all inventory transfers
export async function GET(req: NextRequest) {
    // Check for inventory:view permission
    const permissionError = await requirePermission('inventory:view')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const result = await db.query(`
            SELECT 
                t.id,
                t.status,
                t.created_at,
                t.completed_at,
                ss.name as source_shop_name,
                ds.name as destination_shop_name,
                u.full_name as initiated_by,
                COUNT(ti.id) as item_count,
                SUM(ti.quantity) as total_items
            FROM 
                inventory_transfers t
            JOIN 
                shops ss ON t.source_shop_id = ss.id
            JOIN 
                shops ds ON t.destination_shop_id = ds.id
            JOIN 
                users u ON t.initiated_by_user_id = u.id
            LEFT JOIN 
                transfer_items ti ON t.id = ti.transfer_id
            GROUP BY 
                t.id, ss.name, ds.name, u.full_name
            ORDER BY 
                t.created_at DESC
        `);

        return NextResponse.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching transfers:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching transfers',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// POST: Create a new inventory transfer
export async function POST(req: NextRequest) {
    // Check for inventory:transfer permission
    const permissionError = await requirePermission('inventory:transfer')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const body = await req.json();
        const { sourceShopId, destinationShopId, items, userId } = body;

        // Validate request data
        if (!sourceShopId || !destinationShopId || !items || !items.length || !userId) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields'
            }, { status: 400 });
        }

        // Start a transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Create the transfer record
            const transferResult = await client.query(
                `INSERT INTO inventory_transfers(source_shop_id, destination_shop_id, initiated_by_user_id, status)
                 VALUES($1, $2, $3, $4) RETURNING id`,
                [sourceShopId, destinationShopId, userId, 'pending']
            );

            const transferId = transferResult.rows[0].id;

            // Add items to the transfer
            for (const item of items) {
                const { productId, quantity, notes = '' } = item;
                await client.query(
                    `INSERT INTO transfer_items(transfer_id, product_id, quantity, notes)
                     VALUES($1, $2, $3, $4)`,
                    [transferId, productId, quantity, notes]
                );
            }

            // Commit transaction
            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Inventory transfer created successfully',
                data: {
                    id: transferId
                }
            }, { status: 201 });
        } catch (error) {
            // Rollback in case of error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating transfer:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating transfer',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 