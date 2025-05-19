import { NextResponse } from 'next/server';
import db from '@/utils/db';

// POST: Adjust inventory quantity
export async function POST(request: Request) {
    try {
        const { shopId, productId, adjustmentAmount, notes } = await request.json();

        // Validate required fields
        if (!shopId || !productId || adjustmentAmount === undefined) {
            return NextResponse.json({
                success: false,
                message: 'Shop ID, product ID, and adjustment amount are required'
            }, { status: 400 });
        }

        // Validate shop and product
        const shopResult = await db.query(`
            SELECT id FROM shops WHERE id = $1 AND is_active = true
        `, [shopId]);

        if (shopResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${shopId} not found`
            }, { status: 404 });
        }

        const productResult = await db.query(`
            SELECT id FROM products WHERE id = $1 AND is_active = true
        `, [productId]);

        if (productResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Product with ID ${productId} not found`
            }, { status: 404 });
        }

        // Begin a transaction
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Check if the inventory item exists
            const inventoryResult = await client.query(`
                SELECT id, quantity FROM inventory_items 
                WHERE shop_id = $1 AND product_id = $2
                FOR UPDATE
            `, [shopId, productId]);

            let inventoryId;
            let oldQuantity = 0;
            let newQuantity;

            if (inventoryResult.rows.length > 0) {
                // Update existing inventory item
                inventoryId = inventoryResult.rows[0].id;
                oldQuantity = parseInt(inventoryResult.rows[0].quantity);
                newQuantity = oldQuantity + adjustmentAmount;

                // Check if the resulting quantity would be negative
                if (newQuantity < 0) {
                    throw new Error(`Cannot adjust quantity to ${newQuantity}. Current quantity is ${oldQuantity}.`);
                }

                await client.query(`
                    UPDATE inventory_items 
                    SET 
                        quantity = $1, 
                        last_updated = CURRENT_TIMESTAMP
                    WHERE 
                        id = $2
                `, [newQuantity, inventoryId]);
            } else {
                // Create new inventory item if adjustment is positive
                if (adjustmentAmount < 0) {
                    throw new Error(`Cannot adjust non-existent inventory by negative amount (${adjustmentAmount}).`);
                }

                newQuantity = adjustmentAmount;

                const result = await client.query(`
                    INSERT INTO inventory_items (
                        shop_id, 
                        product_id, 
                        quantity, 
                        reorder_level
                    ) VALUES ($1, $2, $3, 0)
                    RETURNING id
                `, [shopId, productId, newQuantity]);

                inventoryId = result.rows[0].id;
            }

            // Record the adjustment in an audit log (if we had one)
            // For now, we'll just log it to console
            console.log(`Inventory adjustment: Shop ${shopId}, Product ${productId}, Amount ${adjustmentAmount}, Notes: ${notes || 'None'}`);

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Inventory adjusted successfully',
                data: {
                    inventoryId,
                    shopId,
                    productId,
                    oldQuantity,
                    newQuantity,
                    adjustmentAmount
                }
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error adjusting inventory:', error);
        return NextResponse.json({
            success: false,
            message: 'Error adjusting inventory',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 