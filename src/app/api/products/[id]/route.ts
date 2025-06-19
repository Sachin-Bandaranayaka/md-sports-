import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { prisma, safeQuery } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

import { cacheService } from '@/lib/cache';

// Default fallback for a single product
const getDefaultProduct = (id: number) => ({
    id,
    name: 'Sample Product',
    sku: `SKU-${id}`,
    description: 'Product description not available',
    price: 1000,
    weightedAverageCost: 800,
    category_name: 'General',
    inventory: []
});

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Ensure params.id is properly awaited in Next.js 14+
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid product ID'
            }, { status: 400 });
        }

        const product = await safeQuery(
            async () => {
                // Get product with its category
                const productData = await prisma.product.findUnique({
                    where: { id },
                    include: {
                        category: true,
                        inventoryItems: {
                            include: {
                                shop: true
                            }
                        }
                    }
                });

                if (!productData) {
                    return null;
                }

                // Format the product data
                return {
                    ...productData,
                    category_name: productData.category?.name,
                    inventory: productData.inventoryItems.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        shop_id: item.shopId,
                        shop_name: item.shop.name,
                        shop_location: item.shop.location,
                        shop_specific_cost: item.shopSpecificCost || 0
                    }))
                };
            },
            getDefaultProduct(parseInt(params.id)),
            `Failed to fetch product with ID ${params.id}`
        );

        if (!product) {
            return NextResponse.json({
                success: false,
                message: `Product with ID ${params.id} not found`
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error(`Error fetching product:`, error);
        return NextResponse.json({
            success: true,
            data: getDefaultProduct(parseInt(params.id))
        });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 });
        }

        const productData = await req.json();
        const userId = req.headers.get('x-user-id'); // Assuming you pass userId in headers

        // Fetch existing product first to compare changes for audit log
        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return NextResponse.json({ success: false, message: `Product with ID ${id} not found` }, { status: 404 });
        }

        // Prepare data for update, only including fields present in productData
        const dataToUpdate: Prisma.ProductUpdateInput = {};
        if (productData.name !== undefined) dataToUpdate.name = productData.name;
        if (productData.sku !== undefined) dataToUpdate.sku = productData.sku;
        if (productData.barcode !== undefined) dataToUpdate.barcode = productData.barcode || null;
        if (productData.description !== undefined) dataToUpdate.description = productData.description || null;
        if (productData.basePrice !== undefined) dataToUpdate.weightedAverageCost = productData.basePrice; // Assuming basePrice maps to WAC
        if (productData.retailPrice !== undefined) dataToUpdate.price = productData.retailPrice;
        if (productData.categoryId !== undefined) dataToUpdate.categoryId = productData.categoryId ? parseInt(productData.categoryId) : null;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: dataToUpdate
        });

        // Audit Log Generation
        const changes: Record<string, { old: any, new: any }> = {};
        (Object.keys(dataToUpdate) as Array<keyof typeof dataToUpdate>).forEach(key => {
            // Type assertion for existingProduct keys
            const typedKey = key as keyof typeof existingProduct;
            if (existingProduct[typedKey] !== updatedProduct[typedKey]) {
                changes[typedKey] = {
                    old: existingProduct[typedKey],
                    new: updatedProduct[typedKey]
                };
            }
        });

        if (Object.keys(changes).length > 0) {
            try {
                await prisma.auditLog.create({
                    data: {
                        userId: userId ? parseInt(userId) : null,
                        action: 'UPDATE_PRODUCT',
                        entity: 'Product',
                        entityId: id,
                        details: changes
                    }
                });
            } catch (auditError) {
                console.error('Failed to create audit log for product update:', auditError);
                // Do not fail the main operation if audit logging fails
            }
        }

        // Invalidate inventory cache
        await cacheService.invalidateInventory();

        // Revalidate Next.js cached pages
        revalidateTag('products');
        revalidateTag('inventory');
        revalidateTag(`product-${id}`);
        revalidatePath('/inventory');
        revalidatePath('/products');

        // Real-time updates now handled by polling system

        return NextResponse.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
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
        // Ensure params.id is properly awaited in Next.js 14+
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid product ID'
            }, { status: 400 });
        }

        try {
            // Check if product exists first
            const existingProduct = await prisma.product.findUnique({
                where: { id }
            });

            if (!existingProduct) {
                return NextResponse.json({
                    success: false,
                    message: `Product with ID ${id} not found`
                }, { status: 404 });
            }

            // Check for related records that prevent deletion
            const relatedRecords = [];
            
            // Check if product is referenced in purchase invoices
            const purchaseInvoiceItemsCount = await prisma.purchaseInvoiceItem.count({
                where: { productId: id }
            });
            
            if (purchaseInvoiceItemsCount > 0) {
                relatedRecords.push(`${purchaseInvoiceItemsCount} purchase invoice item(s)`);
            }

            // Check if product is referenced in sales invoices
            const salesInvoiceItemsCount = await prisma.invoiceItem.count({
                where: { productId: id }
            });
            
            if (salesInvoiceItemsCount > 0) {
                relatedRecords.push(`${salesInvoiceItemsCount} sales invoice item(s)`);
            }

            // Check if product is referenced in quotations
            const quotationItemsCount = await prisma.quotationItem.count({
                where: { productId: id }
            });
            
            if (quotationItemsCount > 0) {
                relatedRecords.push(`${quotationItemsCount} quotation item(s)`);
            }

            // If any related records exist, prevent deletion
            if (relatedRecords.length > 0) {
                return NextResponse.json({
                    success: false,
                    message: `Cannot delete product "${existingProduct.name}" because it is referenced in: ${relatedRecords.join(', ')}. Please remove these references first.`,
                    relatedRecords: {
                        purchaseInvoiceItems: purchaseInvoiceItemsCount,
                        salesInvoiceItems: salesInvoiceItemsCount,
                        quotationItems: quotationItemsCount
                    }
                }, { status: 409 });
            }

            // Use a transaction to delete inventory items and then the product
            await prisma.$transaction(async (tx) => {
                // Delete all inventory items associated with this product
                await tx.inventoryItem.deleteMany({
                    where: { productId: id }
                });

                // Then, delete the product itself
                await tx.product.delete({
                    where: { id }
                });
            });

            // Invalidate product cache
            await cacheService.invalidatePattern('products:*');
            await cacheService.invalidateInventory();

            // Revalidate Next.js cached pages
            revalidateTag('products');
            revalidateTag('inventory');
            revalidateTag(`product-${id}`);
            revalidatePath('/inventory');
            revalidatePath('/products');

            // Real-time updates now handled by polling system

            return NextResponse.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            // Handle foreign key constraint violations
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    // Foreign key constraint violation
                    const constraintName = error.meta?.target as string || '';

                    // Determine which relation is causing the constraint violation
                    let relationMessage = 'it is referenced in other records';

                    if (constraintName.includes('PurchaseInvoiceItem')) {
                        relationMessage = 'it is referenced in purchase invoice records';
                    } else if (constraintName.includes('SalesInvoiceItem')) {
                        relationMessage = 'it is referenced in sales invoice records';
                    } else if (constraintName.includes('InventoryTransaction')) {
                        relationMessage = 'it is referenced in inventory transaction records';
                    }

                    return NextResponse.json({
                        success: false,
                        message: `Cannot delete this product because ${relationMessage}.`,
                        error: 'FOREIGN_KEY_CONSTRAINT'
                    }, { status: 409 });
                }
            }

            throw error; // Re-throw for the outer catch block
        }
    } catch (error) {
        console.error(`Error deleting product:`, error);
        return NextResponse.json({
            success: false,
            message: 'Error deleting product',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}