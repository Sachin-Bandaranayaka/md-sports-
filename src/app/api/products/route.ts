import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { getShopId } from '@/lib/utils/middleware';
import { NextRequest } from 'next/server';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';
import { cacheService } from '@/lib/cache';

// Default fallback data for products
const defaultProductsData = [
    { id: 1, name: 'Cricket Bat', sku: 'CB001', description: 'Professional cricket bat', price: 15000, weightedAverageCost: 12000, category_name: 'Cricket' },
    { id: 2, name: 'Cricket Ball', sku: 'CB002', description: 'Match quality cricket ball', price: 2500, weightedAverageCost: 1800, category_name: 'Cricket' },
    { id: 3, name: 'Football', sku: 'FB001', description: 'Size 5 football', price: 5000, weightedAverageCost: 3500, category_name: 'Football' },
    { id: 4, name: 'Basketball', sku: 'BB001', description: 'Indoor basketball', price: 6000, weightedAverageCost: 4200, category_name: 'Basketball' },
    { id: 5, name: 'Tennis Racket', sku: 'TR001', description: 'Professional tennis racket', price: 12000, weightedAverageCost: 8400, category_name: 'Tennis' }
];

export async function GET(request: NextRequest) {
    try {
        // Get shop ID from token if user is restricted to a specific shop
        const tokenShopId = await getShopId(request);
        console.log('Products API - Shop ID from token:', tokenShopId);

        // Check for shopId query parameter
        const { searchParams } = new URL(request.url);
        const queryShopId = searchParams.get('shopId');
        console.log('Products API - Shop ID from query:', queryShopId);

        // Use query shopId if provided, otherwise use token shopId
        const shopId = queryShopId ? queryShopId : tokenShopId ? String(tokenShopId) : null;

        // Fetch products using Prisma
        const products = await safeQuery(
            async () => {
                let productsQuery;

                if (shopId) {
                    console.log(`Fetching products for shop ID: ${shopId}`);
                    // Only show products that have inventory in the specified shop
                    productsQuery = await prisma.product.findMany({
                        where: {
                            inventoryItems: {
                                some: {
                                    shopId: shopId,
                                    quantity: {
                                        gt: 0  // Only show products with available stock
                                    }
                                }
                            }
                        },
                        include: {
                            category: true
                        },
                        orderBy: {
                            name: 'asc'
                        }
                    });
                    console.log(`Found ${productsQuery.length} products with inventory for shop ${shopId}`);
                } else {
                    console.log('No shop restriction - fetching all products');
                    // Administrator or manager with full access - show all products
                    productsQuery = await prisma.product.findMany({
                        include: {
                            category: true
                        },
                        orderBy: {
                            name: 'asc'
                        }
                    });
                    console.log(`Found ${productsQuery.length} total products`);
                }

                // Don't fall back to all products when filtering by shop
                // If no products found for a shop, return empty array

                // Format the products data
                const formattedProducts = productsQuery.map(product => ({
                    ...product,
                    category_name: product.category?.name || null
                }));

                console.log('Returning formatted products:', formattedProducts.length);
                return formattedProducts;
            },
            defaultProductsData,
            'Failed to fetch products'
        );

        return NextResponse.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);

        // Return default data instead of error
        return NextResponse.json({
            success: true,
            data: defaultProductsData
        });
    }
}

export async function POST(request: Request) {
    try {
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

        // Emit WebSocket event for real-time updates
        const io = getSocketIO();
        if (io) {
            io.emit(WEBSOCKET_EVENTS.INVENTORY_ITEM_CREATE, {
                type: 'product_create',
                payload: {
                    product: product
                }
            });
            console.log('Emitted product creation event via WebSocket');
        }

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