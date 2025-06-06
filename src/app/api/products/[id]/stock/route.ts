import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';

export const GET = ShopAccessControl.withShopAccess(async (
    req: NextRequest,
    context: any,
    { params }: { params: { id: string } } = { params: { id: '' } }
) => {
    try {
        const productId = parseInt(params.id);
        if (isNaN(productId)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid product ID'
            }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const shopIdParam = searchParams.get('shopId');

        if (!shopIdParam) {
            return NextResponse.json({
                success: false,
                message: 'Shop ID is required'
            }, { status: 400 });
        }

        // Ensure shopId is properly converted to string for database query
        const shopId = shopIdParam.toString();

        const stockData = await safeQuery(
            async () => {
                // Get inventory item for the specific product and shop
                const inventoryItem = await prisma.inventoryItem.findFirst({
                    where: {
                        productId: productId,
                        shopId: shopId
                    },
                    include: {
                        product: {
                            select: {
                                name: true,
                                sku: true,
                                price: true
                            }
                        },
                        shop: {
                            select: {
                                name: true
                            }
                        }
                    }
                });

                if (!inventoryItem) {
                    return {
                        stock: 0,
                        productId: productId,
                        shopId: shopId,
                        productName: null,
                        shopName: null
                    };
                }

                return {
                    stock: inventoryItem.quantity || 0,
                    productId: productId,
                    shopId: shopId,
                    productName: inventoryItem.product.name,
                    shopName: inventoryItem.shop.name,
                    price: inventoryItem.product.price
                };
            },
            {
                stock: 0,
                productId: productId,
                shopId: shopId,
                productName: null,
                shopName: null
            },
            `Failed to fetch stock for product ${productId} in shop ${shopId}`
        );

        return NextResponse.json({
            success: true,
            data: stockData,
            stock: stockData.stock // For backward compatibility
        });
    } catch (error) {
        console.error('Error fetching product stock:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error',
            stock: 0
        }, { status: 500 });
    }
});