import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';

// Optimized endpoint for inventory distribution page
// Gets all products with their inventory data in ONE database query
export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        console.log('Fetching inventory distribution data...');
        
        // Single optimized query to get all products with inventory
        const products = await prisma.product.findMany({
            where: context.isFiltered && context.shopId ? {
                inventoryItems: {
                    some: {
                        shopId: context.shopId
                    }
                }
            } : {},
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                inventoryItems: {
                    where: context.isFiltered && context.shopId ? {
                        shopId: context.shopId
                    } : {},
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
            }
        });

        // Transform data for the frontend
        const transformedProducts = products.map(product => {
            const branchStock = product.inventoryItems.map(item => ({
                shopId: item.shopId,
                shopName: item.shop.name,
                quantity: item.quantity,
                shopSpecificCost: item.shopSpecificCost || 0
            }));

            const totalStock = branchStock.reduce((sum, branch) => sum + branch.quantity, 0);

            return {
                id: product.id,
                name: product.name,
                sku: product.sku || '',
                retailPrice: product.price || 0,
                weightedAverageCost: product.weightedAverageCost || 0,
                totalStock,
                branchStock,
                category: product.category
            };
        });

        // Extract unique shops
        const shopsMap = new Map();
        products.forEach(product => {
            product.inventoryItems.forEach(item => {
                if (!shopsMap.has(item.shopId)) {
                    shopsMap.set(item.shopId, {
                        id: item.shopId,
                        name: item.shop.name,
                        location: item.shop.location
                    });
                }
            });
        });

        const shops = Array.from(shopsMap.values()).sort((a, b) => 
            a.name.localeCompare(b.name)
        );

        console.log(`Retrieved ${transformedProducts.length} products with inventory distribution`);

        return NextResponse.json({
            success: true,
            data: {
                products: transformedProducts,
                shops: shops
            },
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                totalProducts: transformedProducts.length,
                totalShops: shops.length
            }
        });

    } catch (error) {
        console.error('Error fetching inventory distribution:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching inventory distribution data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}); 