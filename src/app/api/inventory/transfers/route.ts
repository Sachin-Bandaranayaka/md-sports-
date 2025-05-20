import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import db from '@/utils/db';
import jwt from 'jsonwebtoken';

// GET: Fetch all inventory transfers
export async function GET(req: NextRequest) {
    console.log('GET /api/inventory/transfers - Checking permission: inventory:view');
    // Check for inventory:view permission
    const permissionError = await requirePermission('inventory:view')(req);
    if (permissionError) {
        console.error('Permission denied for inventory:view:', permissionError.status);
        return permissionError;
    }

    try {
        console.log('Executing query to fetch transfers...');
        const result = await db.query(`
            SELECT 
                t.id,
                t.status,
                t.created_at,
                t.completed_at,
                ss.name as source_shop_name,
                ds.name as destination_shop_name,
                COALESCE(u."fullName", 'Unknown User') as initiated_by,
                COUNT(ti.id) as item_count,
                COALESCE(SUM(ti.quantity), 0) as total_items
            FROM 
                inventory_transfers t
            JOIN 
                shops ss ON t.source_shop_id = ss.id
            JOIN 
                shops ds ON t.destination_shop_id = ds.id
            LEFT JOIN 
                users u ON t.initiated_by_user_id = u.id
            LEFT JOIN 
                transfer_items ti ON t.id = ti.transfer_id
            GROUP BY 
                t.id, ss.name, ds.name, u."fullName"
            ORDER BY 
                t.created_at DESC
        `);

        console.log('Query executed successfully. Results:', result.rows);
        console.log(`Retrieved ${result.rows.length} transfers successfully`);
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
    console.log('POST /api/inventory/transfers - Checking permission: inventory:transfer');
    // Check for inventory:transfer permission
    const permissionError = await requirePermission('inventory:transfer')(req);
    if (permissionError) {
        console.error('Permission denied for inventory:transfer:', permissionError.status);
        return permissionError;
    }

    try {
        const body = await req.json();
        const { sourceShopId, destinationShopId, items } = body;

        // Get user ID from authorization token
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        if (typeof decodedToken !== 'object' || !decodedToken.sub) {
            return NextResponse.json({
                success: false,
                message: 'Invalid token'
            }, { status: 401 });
        }

        const userId = Number(decodedToken.sub);
        console.log('Creating transfer for user ID:', userId);

        // Validate request data
        if (!sourceShopId || !destinationShopId || !items || !items.length) {
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

            console.log('Transfer created successfully with ID:', transferId);
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