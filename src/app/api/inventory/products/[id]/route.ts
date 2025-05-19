import { NextRequest, NextResponse } from 'next/server';
import { Product, Category } from '@/lib/models';
import { requirePermission } from '@/lib/utils/middleware';

// GET: Get product by ID
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const permissionError = await requirePermission('inventory:view')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const productId = parseInt(params.id);

        if (isNaN(productId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid product ID' },
                { status: 400 }
            );
        }

        const product = await Product.findByPk(productId, {
            include: [
                {
                    model: Category,
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            product
        });
    } catch (error) {
        console.error(`Error fetching product with ID ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}

// PUT: Update product
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const permissionError = await requirePermission('inventory:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const productId = parseInt(params.id);

        if (isNaN(productId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid product ID' },
                { status: 400 }
            );
        }

        const product = await Product.findByPk(productId);
        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        const body = await req.json();
        const {
            name,
            sku,
            barcode,
            description,
            basePrice,
            retailPrice,
            categoryId
        } = body;

        // Update product
        await product.update({
            name: name !== undefined ? name : product.name,
            sku: sku !== undefined ? sku : product.sku,
            barcode: barcode !== undefined ? barcode : product.barcode,
            description: description !== undefined ? description : product.description,
            basePrice: basePrice !== undefined ? basePrice : product.basePrice,
            retailPrice: retailPrice !== undefined ? retailPrice : product.retailPrice,
            categoryId: categoryId !== undefined ? categoryId : product.categoryId
        });

        // Return updated product
        const updatedProduct = await Product.findByPk(productId, {
            include: [
                {
                    model: Category,
                    attributes: ['id', 'name']
                }
            ]
        });

        return NextResponse.json({
            success: true,
            product: updatedProduct
        });
    } catch (error) {
        console.error(`Error updating product with ID ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to update product' },
            { status: 500 }
        );
    }
}

// DELETE: Delete product
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const permissionError = await requirePermission('inventory:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const productId = parseInt(params.id);

        if (isNaN(productId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid product ID' },
                { status: 400 }
            );
        }

        const product = await Product.findByPk(productId);
        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        // Delete product
        await product.destroy();

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting product with ID ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete product' },
            { status: 500 }
        );
    }
} 