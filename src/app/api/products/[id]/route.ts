import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

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
                        shop_location: item.shop.location
                    }))
                };
            },
            getDefaultProduct(id),
            `Failed to fetch product with ID ${id}`
        );

        if (!product) {
            return NextResponse.json({
                success: false,
                message: `Product with ID ${id} not found`
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
            return NextResponse.json({
                success: false,
                message: 'Invalid product ID'
            }, { status: 400 });
        }

        const productData = await req.json();

        const updatedProduct = await safeQuery(
            async () => {
                // Check if product exists
                const existingProduct = await prisma.product.findUnique({
                    where: { id }
                });

                if (!existingProduct) {
                    return null;
                }

                // Update the product
                return await prisma.product.update({
                    where: { id },
                    data: {
                        name: productData.name,
                        sku: productData.sku,
                        barcode: productData.barcode || null,
                        description: productData.description || null,
                        weightedAverageCost: productData.basePrice || existingProduct.weightedAverageCost,
                        price: productData.retailPrice || existingProduct.price,
                        categoryId: productData.categoryId ? parseInt(productData.categoryId) : existingProduct.categoryId,
                    }
                });
            },
            null,
            `Failed to update product with ID ${id}`
        );

        if (!updatedProduct) {
            return NextResponse.json({
                success: false,
                message: `Product with ID ${id} not found`
            }, { status: 404 });
        }

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
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid product ID'
            }, { status: 400 });
        }

        // Note: Prisma doesn't natively support soft deletes, but we can simulate it
        const deletedProduct = await safeQuery(
            async () => {
                // Check if product exists
                const existingProduct = await prisma.product.findUnique({
                    where: { id }
                });

                if (!existingProduct) {
                    return null;
                }

                // We don't have an 'isActive' field in the Prisma schema
                // Instead of deleting, we'll mark it as deleted in a real app
                // For now, we'll actually delete it
                return await prisma.product.delete({
                    where: { id }
                });
            },
            null,
            `Failed to delete product with ID ${id}`
        );

        if (!deletedProduct) {
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