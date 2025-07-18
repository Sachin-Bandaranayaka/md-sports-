import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateTokenPermission } from '@/lib/auth';

interface BulkProductData {
    name: string;
    sku?: string;
    description?: string;
    price: number;
    weightedAverageCost?: number;
    barcode?: string;
    categoryId?: number;
    minStockLevel?: number;
    initialQuantity?: number;
    shopId?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'inventory:manage');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        const { products }: { products: BulkProductData[] } = await request.json();

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ 
                success: false, 
                message: 'Products array is required and must not be empty' 
            }, { status: 400 });
        }

        const results = [];
        let successCount = 0;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const index = i + 1;

            try {
                // Validate required fields
                if (!product.name || !product.price) {
                    results.push({
                        index,
                        success: false,
                        message: 'Product name and price are required',
                        productName: product.name
                    });
                    continue;
                }

                // Check for duplicate SKU within the batch
                if (product.sku) {
                    const duplicateInBatch = products.slice(0, i).find(p => p.sku === product.sku);
                    if (duplicateInBatch) {
                        results.push({
                            index,
                            success: false,
                            message: `SKU '${product.sku}' is duplicated within the batch`,
                            productName: product.name
                        });
                        continue;
                    }

                    // Check if SKU already exists in database
                    const existingSKU = await prisma.product.findUnique({
                        where: { sku: product.sku }
                    });

                    if (existingSKU) {
                        results.push({
                            index,
                            success: false,
                            message: `SKU '${product.sku}' already exists`,
                            productName: product.name
                        });
                        continue;
                    }
                }

                // Create product in transaction
                await prisma.$transaction(async (tx) => {
                    const newProduct = await tx.product.create({
                        data: {
                            name: product.name,
                            sku: product.sku || null,
                            description: product.description || null,
                            price: product.price,
                            weightedAverageCost: product.weightedAverageCost || 0,
                            barcode: product.barcode || null,
                            categoryId: product.categoryId || null,
                            minStockLevel: product.minStockLevel || 10,
                        }
                    });

                    // Create initial inventory if specified
                    if (product.initialQuantity && product.initialQuantity > 0 && product.shopId) {
                        await tx.inventoryItem.create({
                            data: {
                                productId: newProduct.id,
                                quantity: product.initialQuantity,
                                shopId: product.shopId,
                            }
                        });
                    }
                });

                results.push({
                    index,
                    success: true,
                    message: 'Product created successfully',
                    productName: product.name
                });
                successCount++;

            } catch (error: any) {
                console.error(`Error creating product ${index}:`, error);
                let message = 'Database error during creation';
                
                if (error.code === 'P2002') {
                    if (error.meta?.target?.includes('sku')) {
                        message = `SKU '${product.sku}' already exists`;
                    } else {
                        message = 'Duplicate entry detected';
                    }
                }

                results.push({
                    index,
                    success: false,
                    message,
                    productName: product.name
                });
            }
        }

        // Invalidate cache if any products were created
        if (successCount > 0) {
            const { cacheService } = await import('@/lib/cache');
            await cacheService.invalidateInventory();
        }

        return NextResponse.json({
            success: successCount > 0,
            message: `${successCount} out of ${products.length} products created successfully`,
            totalProcessed: products.length,
            successCount,
            failureCount: products.length - successCount,
            results
        });

    } catch (error: any) {
        console.error('Bulk product creation error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to process bulk product creation',
            error: error.message
        }, { status: 500 });
    }
} 