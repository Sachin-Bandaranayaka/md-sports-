import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getShopId } from '@/lib/utils/middleware';
import { cacheService } from '@/lib/cache';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';
import { safeQuery, prisma } from '@/lib/prisma';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';
import { emitInventoryItemCreate } from '@/lib/utils/websocket';

// Default fallback data for products
const defaultProductsData = [
    { id: 1, name: 'Cricket Bat', sku: 'CB001', description: 'Professional cricket bat', price: 15000, weightedAverageCost: 12000, category_name: 'Cricket' },
    { id: 2, name: 'Cricket Ball', sku: 'CB002', description: 'Match quality cricket ball', price: 2500, weightedAverageCost: 1800, category_name: 'Cricket' },
    { id: 3, name: 'Football', sku: 'FB001', description: 'Size 5 football', price: 5000, weightedAverageCost: 3500, category_name: 'Football' },
    { id: 4, name: 'Basketball', sku: 'BB001', description: 'Indoor basketball', price: 6000, weightedAverageCost: 4200, category_name: 'Basketball' },
    { id: 5, name: 'Tennis Racket', sku: 'TR001', description: 'Professional tennis racket', price: 12000, weightedAverageCost: 8400, category_name: 'Tennis' }
];

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        console.log('Products API - Shop context:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered,
            isAdmin: context.isAdmin,
            userShopId: context.userShopId
        });

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        }

        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    sku: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    barcode: {
                        contains: search,
                        mode: 'insensitive'
                    }
                }
            ];
        }

        // Apply shop-based filtering for inventory
        let products;
        if (context.isFiltered && context.shopId) {
            console.log(`Filtering products by shopId: ${context.shopId}`);
            products = await prisma.product.findMany({
                where: {
                    ...where,
                    inventoryItems: {
                        some: {
                            shopId: context.shopId
                        }
                    }
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    inventoryItems: {
                        where: {
                            shopId: context.shopId
                        },
                        include: {
                            shop: {
                                select: {
                                    id: true,
                                    name: true,
                                    location: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                },
                skip,
                take: limit
            });
        } else {
            console.log('Fetching all products (admin or no shop filter)');
            products = await prisma.product.findMany({
                where,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    inventoryItems: {
                        include: {
                            shop: {
                                select: {
                                    id: true,
                                    name: true,
                                    location: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                },
                skip,
                take: limit
            });
        }

        console.log(`Found ${products.length} products`);

        return NextResponse.json({
            success: true,
            data: products,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                totalItems: products.length
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching products',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
});

export async function POST(request: NextRequest) {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'inventory:manage');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        const productData = await request.json();
        console.log('Received productData:', productData);
        console.log('productData.basePrice type:', typeof productData.basePrice);
        console.log('productData.basePrice value:', productData.basePrice);

        const newWeightedAverageCost = productData.basePrice || 0;
        console.log('Calculated newWeightedAverageCost:', newWeightedAverageCost);

        const product = await safeQuery(
            async () => {
                return await prisma.product.create({
                    data: {
                        name: productData.name,
                        sku: productData.sku,
                        barcode: productData.barcode || null,
                        description: productData.description || null,
                        weightedAverageCost: newWeightedAverageCost,
                        price: productData.retailPrice || 0,
                        categoryId: productData.categoryId ? parseInt(productData.categoryId) : null,
                    }
                });
            },
            null,
            'Failed to create product'
        );

        if (!product) {
            throw new Error('Product creation failed');
        }

        console.log('Product created successfully with WAC:', product.weightedAverageCost);

        // Invalidate inventory cache
        await cacheService.invalidateInventory();

        // Emit WebSocket event for real-time updates using utility function
        emitInventoryItemCreate(product);

        return NextResponse.json({
            success: true,
            message: 'Product created successfully',
            data: product
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating product',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}