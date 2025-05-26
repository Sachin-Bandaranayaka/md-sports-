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
                // Build the base where clause
                let whereClause: any = {};

                // Add shop filter if specified
                if (shopId) {
                    whereClause.inventoryItems = {
                        some: {
                            shopId: parseInt(shopId)
                        }
                    };
                }

                // Add search filter if specified
                if (search) {
                    whereClause.OR = [
                        { name: { contains: search, mode: 'insensitive' } },
                        { sku: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } }
                    ];
                }

                // Add category filter if specified
                if (category) {
                    whereClause.category = {
                        name: category
                    };
                }

                // Count total products for pagination (without status filter which requires post-processing)
                const countQuery = await prisma.product.count({
                    where: whereClause
                });

                // Get paginated products
                const productsQuery = await prisma.product.findMany({
                    where: whereClause,
                    include: {
                        category: true,
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

                // Format the products data with inventory information
                const formattedProducts = productsQuery.map(product => {
                    // Calculate total stock across all shops
                    let totalStock = 0;
                    const branchStock = product.inventoryItems.map(item => {
                        totalStock += item.quantity;
                        return {
                            shopId: item.shopId,
                            shopName: item.shop.name,
                            quantity: item.quantity
                        };
                    });

                    // Determine status based on stock levels
                    let productStatus = 'Out of Stock';
                    if (totalStock > 0) {
                        // Consider low stock if any shop has inventory below threshold (using 5 as default)
                        const hasLowStock = product.inventoryItems.some(
                            (inv) => inv.quantity > 0 && inv.quantity <= 5
                        );
                        productStatus = hasLowStock ? 'Low Stock' : 'In Stock';
                    }

                    return {
                        id: product.id,
                        sku: product.sku,
                        name: product.name,
                        description: product.description,
                        category: product.category?.name || 'Uncategorized',
                        categoryId: product.categoryId,
                        stock: totalStock,
                        retailPrice: product.price,
                        weightedAverageCost: product.weightedAverageCost,
                        status: productStatus,
                        branchStock
                    };
                });

                // Apply status filter if specified (this needs to be done after calculating the status)
                let filteredProducts = formattedProducts;
                if (status) {
                    filteredProducts = formattedProducts.filter(product => product.status === status);

                    // Adjust count for accurate pagination when status filter is applied
                    // Note: This is a simplification; in a production app, you might want to 
                    // fetch all products, filter by status, then apply pagination
                    const filteredCount = filteredProducts.length;
                    return [filteredProducts, filteredCount];
                }

                return [formattedProducts, countQuery];
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