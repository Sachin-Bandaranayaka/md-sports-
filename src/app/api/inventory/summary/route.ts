import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { getShopId } from '@/lib/utils/middleware';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Get shop ID from token if user is restricted to a specific shop
        const shopId = getShopId(request);

        // Parse pagination parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Parse filter parameters
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const status = searchParams.get('status') || '';

        // Fetch products with inventory in a single efficient query
        const [productsWithInventory, totalCount] = await safeQuery(
            async () => {
                // Build the base where clause for product fetching (without status)
                let productWhereClause: any = {};
                if (shopId) {
                    productWhereClause.inventoryItems = {
                        some: {
                            shopId: parseInt(shopId)
                        }
                    };
                }
                if (search) {
                    productWhereClause.OR = [
                        { name: { contains: search, mode: 'insensitive' } },
                        { sku: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } }
                    ];
                }
                if (category) {
                    productWhereClause.category = {
                        name: category
                    };
                }

                let finalProductsToPaginate = [];
                let countForPagination = 0;

                if (status) {
                    // If status filter is applied, we need a multi-step process
                    // 1. Fetch all products matching non-status filters (search, category, shopId)
                    const allMatchingProducts = await prisma.product.findMany({
                        where: productWhereClause,
                        include: {
                            category: true,
                            inventoryItems: {
                                include: {
                                    shop: {
                                        select: { id: true, name: true }
                                    }
                                }
                            }
                        },
                        orderBy: { name: 'asc' }
                    });

                    // 2. Calculate status for each and filter by status
                    const statusFilteredProducts = allMatchingProducts.map(product => {
                        let totalStock = 0;
                        product.inventoryItems.forEach(item => {
                            totalStock += item.quantity;
                        });
                        let productStatus = 'Out of Stock';
                        if (totalStock > 0) {
                            const hasLowStock = product.inventoryItems.some(inv => inv.quantity > 0 && inv.quantity <= 5);
                            productStatus = hasLowStock ? 'Low Stock' : 'In Stock';
                        }
                        return {
                            id: product.id,
                            sku: product.sku,
                            name: product.name,
                            category: product.category?.name || 'Uncategorized',
                            stock: totalStock,
                            retailPrice: product.price,
                            weightedAverageCost: product.weightedAverageCost,
                            status: productStatus
                        };
                    }).filter(p => p.status === status);

                    countForPagination = statusFilteredProducts.length;
                    finalProductsToPaginate = statusFilteredProducts.slice(skip, skip + limit);

                } else {
                    countForPagination = await prisma.product.count({
                        where: productWhereClause
                    });

                    const paginatedProducts = await prisma.product.findMany({
                        where: productWhereClause,
                        include: {
                            category: true,
                            inventoryItems: {
                                include: {
                                    shop: {
                                        select: { id: true, name: true, location: true }
                                    }
                                }
                            }
                        },
                        orderBy: { name: 'asc' },
                        skip,
                        take: limit
                    });

                    finalProductsToPaginate = paginatedProducts.map(product => {
                        let totalStock = 0;
                        product.inventoryItems.forEach(item => {
                            totalStock += item.quantity;
                        });
                        let productStatus = 'Out of Stock';
                        if (totalStock > 0) {
                            const hasLowStock = product.inventoryItems.some(inv => inv.quantity > 0 && inv.quantity <= 5);
                            productStatus = hasLowStock ? 'Low Stock' : 'In Stock';
                        }
                        return {
                            id: product.id,
                            sku: product.sku,
                            name: product.name,
                            category: product.category?.name || 'Uncategorized',
                            stock: totalStock,
                            retailPrice: product.price,
                            weightedAverageCost: product.weightedAverageCost,
                            status: productStatus
                        };
                    });
                }

                return [finalProductsToPaginate, countForPagination];
            },
            [[], 0],
            'Failed to fetch inventory summary'
        );

        return NextResponse.json({
            success: true,
            data: productsWithInventory,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching inventory summary:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch inventory summary',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 