import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import db from '@/utils/db';

// GET: Get details of a specific inventory transfer
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Check for inventory:view permission
    const permissionError = await requirePermission('inventory:view')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const id = params.id;

        // Get transfer details
        const transferResult = await db.query(
            `SELECT 
                t.*,
                ss.name as source_shop_name,
                ds.name as destination_shop_name,
                u."fullName" as initiated_by
            FROM 
                inventory_transfers t
            JOIN 
                shops ss ON t.source_shop_id = ss.id
            JOIN 
                shops ds ON t.destination_shop_id = ds.id
            JOIN 
                users u ON t.initiated_by_user_id = u.id
            WHERE 
                t.id = $1`,
            [id]
        );

        if (transferResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Transfer not found'
            }, { status: 404 });
        }

        // Get transfer items
        const itemsResult = await db.query(
            `SELECT 
                ti.id,
                ti.product_id,
                ti.quantity,
                ti.notes,
                p.name as product_name,
                p.sku,
                p.retail_price
            FROM 
                transfer_items ti
            JOIN 
                products p ON ti.product_id = p.id
            WHERE 
                ti.transfer_id = $1`,
            [id]
        );

        const transfer = transferResult.rows[0];
        const items = itemsResult.rows;

        return NextResponse.json({
            success: true,
            data: {
                ...transfer,
                items
            }
        });
    } catch (error) {
        console.error(`Error fetching transfer ${params.id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching transfer',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// PATCH: Update transfer status (complete or cancel)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Check for inventory:transfer permission
    const permissionError = await requirePermission('inventory:transfer')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const id = params.id;
        const { action } = await req.json();

        if (!['complete', 'cancel'].includes(action)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid action, must be "complete" or "cancel"'
            }, { status: 400 });
        }

        // Check if transfer exists and is in pending status
        const transferResult = await db.query(
            'SELECT * FROM inventory_transfers WHERE id = $1',
            [id]
        );

        if (transferResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Transfer not found'
            }, { status: 404 });
        }

        const transfer = transferResult.rows[0];
        if (transfer.status !== 'pending') {
            return NextResponse.json({
                success: false,
                message: `Cannot ${action} a transfer that is not in pending status`
            }, { status: 400 });
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            if (action === 'complete') {
                // Get all items in the transfer
                const itemsResult = await client.query(
                    'SELECT * FROM transfer_items WHERE transfer_id = $1',
                    [id]
                );
                const items = itemsResult.rows;

                // Process each item - decrease source inventory and increase destination inventory
                for (const item of items) {
                    // Check source inventory
                    const sourceInventoryResult = await client.query(
                        'SELECT * FROM inventory_items WHERE shop_id = $1 AND product_id = $2',
                        [transfer.source_shop_id, item.product_id]
                    );

                    if (sourceInventoryResult.rows.length === 0 ||
                        sourceInventoryResult.rows[0].quantity < item.quantity) {
                        throw new Error(`Insufficient inventory for product ID ${item.product_id} in source shop`);
                    }

                    // Decrease source inventory
                    await client.query(
                        'UPDATE inventory_items SET quantity = quantity - $1, last_updated = NOW() WHERE shop_id = $2 AND product_id = $3',
                        [item.quantity, transfer.source_shop_id, item.product_id]
                    );

                    // Check if destination inventory exists
                    const destInventoryResult = await client.query(
                        'SELECT * FROM inventory_items WHERE shop_id = $1 AND product_id = $2',
                        [transfer.destination_shop_id, item.product_id]
                    );

                    if (destInventoryResult.rows.length === 0) {
                        // Create destination inventory if it doesn't exist
                        // Get reorder level from source inventory
                        const reorderLevel = sourceInventoryResult.rows[0].reorder_level;

                        await client.query(
                            'INSERT INTO inventory_items(shop_id, product_id, quantity, reorder_level, last_updated) VALUES($1, $2, $3, $4, NOW())',
                            [transfer.destination_shop_id, item.product_id, item.quantity, reorderLevel]
                        );
                    } else {
                        // Increase destination inventory
                        await client.query(
                            'UPDATE inventory_items SET quantity = quantity + $1, last_updated = NOW() WHERE shop_id = $2 AND product_id = $3',
                            [item.quantity, transfer.destination_shop_id, item.product_id]
                        );
                    }
                }

                // Update transfer status to completed
                await client.query(
                    'UPDATE inventory_transfers SET status = $1, completed_at = NOW(), updated_at = NOW() WHERE id = $2',
                    ['completed', id]
                );
            } else {
                // For cancel action, just update the status
                await client.query(
                    'UPDATE inventory_transfers SET status = $1, updated_at = NOW() WHERE id = $2',
                    ['cancelled', id]
                );
            }

            // Commit transaction
            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `Transfer ${action === 'complete' ? 'completed' : 'cancelled'} successfully`
            });
        } catch (error) {
            // Rollback in case of error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(`Error updating transfer ${params.id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error updating transfer',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// DELETE: Delete a pending transfer
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Check for inventory:transfer permission
    const permissionError = await requirePermission('inventory:transfer')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const id = params.id;

        // Check if transfer exists and is in pending status
        const transferResult = await db.query(
            'SELECT * FROM inventory_transfers WHERE id = $1',
            [id]
        );

        if (transferResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Transfer not found'
            }, { status: 404 });
        }

        const transfer = transferResult.rows[0];
        if (transfer.status !== 'pending') {
            return NextResponse.json({
                success: false,
                message: 'Only pending transfers can be deleted'
            }, { status: 400 });
        }

        // Delete transfer and its items (using cascade)
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Delete transfer items first
            await client.query(
                'DELETE FROM transfer_items WHERE transfer_id = $1',
                [id]
            );

            // Delete the transfer
            await client.query(
                'DELETE FROM inventory_transfers WHERE id = $1',
                [id]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Transfer deleted successfully'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(`Error deleting transfer ${params.id}:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error deleting transfer',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 