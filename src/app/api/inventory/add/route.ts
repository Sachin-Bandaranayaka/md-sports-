import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { productId, shopId, quantity } = data;

        // Validate required fields
        if (!productId || !shopId || quantity === undefined) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: productId, shopId, and quantity are required'
            }, { status: 400 });
        }

        // Validate numeric values
        const productIdNum = parseInt(productId);
        const shopIdNum = parseInt(shopId);
        const quantityNum = parseInt(quantity);

        if (isNaN(productIdNum) || isNaN(shopIdNum) || isNaN(quantityNum)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid data format: productId, shopId, and quantity must be numbers'
            }, { status: 400 });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productIdNum }
        });

        if (!product) {
            return NextResponse.json({
                success: false,
                message: `Product with ID ${productId} not found`
            }, { status: 404 });
        }

        // Check if shop exists
        const shop = await prisma.shop.findUnique({
            where: { id: shopIdNum }
        });

        if (!shop) {
            return NextResponse.json({
                success: false,
                message: `Shop with ID ${shopId} not found`
            }, { status: 404 });
        }

        // Check if inventory item exists for this product and shop
        const existingInventory = await prisma.inventoryItem.findFirst({
            where: {
                productId: productIdNum,
                shopId: shopIdNum
            }
        });

        let result;

        if (existingInventory) {
            // Update existing inventory
            result = await prisma.inventoryItem.update({
                where: { id: existingInventory.id },
                data: {
                    quantity: existingInventory.quantity + quantityNum,
                    updatedAt: new Date()
                }
            });
        } else {
            // Create new inventory item
            result = await prisma.inventoryItem.create({
                data: {
                    productId: productIdNum,
                    shopId: shopIdNum,
                    quantity: quantityNum
                }
            });
        }

        // Log this action to audit trail (if implemented)
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'ADD_INVENTORY',
                    entity: 'InventoryItem',
                    entityId: result.id,
                    details: JSON.stringify({
                        productId: productIdNum,
                        shopId: shopIdNum,
                        quantity: quantityNum,
                        method: 'Direct Addition'
                    })
                }
            });
        } catch (auditError) {
            // Log error but don't fail the request
            console.error('Error creating audit log:', auditError);
            // Continue with the request even if audit logging fails
        }

        return NextResponse.json({
            success: true,
            message: 'Inventory updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error adding inventory:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to add inventory',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 