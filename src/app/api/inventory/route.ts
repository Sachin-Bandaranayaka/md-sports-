import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/db';


import { ShopAccessControl } from '@/lib/utils/shopMiddleware';

// GET: Fetch all inventory items with shop-based filtering
export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const categoryId = searchParams.get('categoryId');
        const lowStock = searchParams.get('lowStock') === 'true';

        console.log('Inventory API - Shop context:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered,
            isAdmin: context.isAdmin,
            userShopId: context.userShopId
        });

        // Build the query with possible filters
        let query = `
            SELECT 
                i.id as inventory_id,
                i.shop_id,
                s.name as shop_name,
                s.location as shop_location,
                i.product_id,
                p.name as product_name,
                p.sku as product_sku,
                p.barcode as product_barcode,
                p.price,
                p.weightedAverageCost,
                i.shopspecificcost as shop_specific_cost,
                c.id as category_id,
                c.name as category_name,
                i.quantity,
                i.reorder_level,
                i.last_updated
            FROM 
                inventory_items i
            JOIN 
                products p ON i.product_id = p.id
            JOIN 
                shops s ON i.shop_id = s.id
            LEFT JOIN 
                categories c ON p.category_id = c.id
            WHERE 
                p.is_active = true 
                AND s.is_active = true
        `;

        // Add filters based on query parameters and shop access
        const params: any[] = [];
        let paramIndex = 1;

        // Apply shop filtering based on user permissions
        if (context.isFiltered && context.shopId) {
            query += ` AND i.shop_id = $${paramIndex}`;
            params.push(context.shopId);
            paramIndex++;
        }

        if (productId) {
            query += ` AND i.product_id = $${paramIndex}`;
            params.push(parseInt(productId));
            paramIndex++;
        }

        if (categoryId) {
            query += ` AND p.category_id = $${paramIndex}`;
            params.push(parseInt(categoryId));
            paramIndex++;
        }

        if (lowStock) {
            query += ` AND i.quantity <= i.reorder_level`;
        }

        // Add sorting
        query += ` ORDER BY s.name, p.name`;

        console.log('Inventory query:', query);
        console.log('Inventory params:', params);

        // Execute the query
        const result = await db.query(query, params);

        return NextResponse.json({
            success: true,
            data: result.rows,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                totalItems: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching inventory items',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
});

// POST: Create or update inventory items with shop validation
export const POST = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        const { shopId, productId, quantity, reorderLevel } = await request.json();

        // Validate required fields
        if (!shopId || !productId || quantity === undefined) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: shopId, productId, and quantity are required'
            }, { status: 400 });
        }

        // Validate shop access for the target shop
        const shopAccessResult = await ShopAccessControl.validateShopAccess(request, shopId);
        if (!shopAccessResult.hasAccess) {
            return ShopAccessControl.createAccessDeniedResponse(shopAccessResult.error);
        }

        // Check if shop exists
        const shopResult = await db.query(`
            SELECT id FROM shops WHERE id = $1 AND is_active = true
        `, [shopId]);

        if (shopResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${shopId} not found`
            }, { status: 404 });
        }

        // Check if product exists
        const productResult = await db.query(`
            SELECT id FROM products WHERE id = $1 AND is_active = true
        `, [productId]);

        if (productResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: `Product with ID ${productId} not found`
            }, { status: 404 });
        }

        // Check if inventory item already exists
        const inventoryResult = await db.query(`
            SELECT id FROM inventory_items 
            WHERE shop_id = $1 AND product_id = $2
        `, [shopId, productId]);

        let result;

        if (inventoryResult.rows.length > 0) {
            // Update existing inventory item
            result = await db.query(`
                UPDATE inventory_items 
                SET 
                    quantity = $1, 
                    reorder_level = $2,
                    last_updated = CURRENT_TIMESTAMP
                WHERE 
                    shop_id = $3 AND product_id = $4
                RETURNING *
            `, [quantity, reorderLevel || 0, shopId, productId]);
        } else {
            // Create new inventory item
            result = await db.query(`
                INSERT INTO inventory_items (
                    shop_id, 
                    product_id, 
                    quantity, 
                    reorder_level
                ) VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [shopId, productId, quantity, reorderLevel || 0]);
        }

        // Real-time updates now handled by polling system
        const inventoryItem = result.rows[0];

        return NextResponse.json({
            success: true,
            message: inventoryResult.rows.length > 0
                ? 'Inventory item updated successfully'
                : 'Inventory item created successfully',
            data: inventoryItem
        });
    } catch (error) {
        console.error('Error creating/updating inventory item:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating/updating inventory item',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
});