import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/utils/middleware';
import { AuditService } from '@/lib/services/auditService';
import { verifyToken } from '@/lib/auth/jwt';

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

        const product = await prisma.product.findUnique({
            where: {
                id: productId
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
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

        const existingProduct = await prisma.product.findUnique({
            where: {
                id: productId
            }
        });

        if (!existingProduct) {
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
            price,
            weightedAverageCost,  // renamed from basePrice in Prisma
            categoryId
        } = body;

        // Update product
        const updatedProduct = await prisma.product.update({
            where: {
                id: productId
            },
            data: {
                name: name !== undefined ? name : existingProduct.name,
                sku: sku !== undefined ? sku : existingProduct.sku,
                barcode: barcode !== undefined ? barcode : existingProduct.barcode,
                description: description !== undefined ? description : existingProduct.description,
                price: price !== undefined ? price : existingProduct.price,
                weightedAverageCost: weightedAverageCost !== undefined ? weightedAverageCost : existingProduct.weightedAverageCost,
                categoryId: categoryId !== undefined ? categoryId : existingProduct.categoryId
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
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
        // Get user from token for audit logging
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json(
                { success: false, message: 'No token provided' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const productId = parseInt(params.id);

        if (isNaN(productId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid product ID' },
                { status: 400 }
            );
        }

        const product = await prisma.product.findUnique({
            where: {
                id: productId
            },
            include: {
                category: true,
                inventoryItems: true
            }
        });

        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        // Use audit service for soft delete
        const auditService = new AuditService();
        await auditService.softDelete(
            'Product',
            productId,
            decoded.userId,
            product,
            true // canRecover
        );

        return NextResponse.json({
            success: true,
            message: 'Product moved to recycle bin successfully'
        });
    } catch (error) {
        console.error(`Error deleting product with ID ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete product' },
            { status: 500 }
        );
    }
}