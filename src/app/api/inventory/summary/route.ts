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
        const categoryNameFilter = searchParams.get('category') || '';
        const statusFilter = searchParams.get('status') || '';

        // Fetch products with inventory in a single efficient query
        const [productsToReturn, totalCountForPagination] = await safeQuery(
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
                        // { description: { contains: search, mode: 'insensitive' } } // Description search can be slow, consider if essential
                    ];
                }
                if (categoryNameFilter) {
                    productWhereClause.category = {
                        name: categoryNameFilter
                    };
                }

                let finalProductOutput = [];
                let countForPaginationQuery = 0;

                if (statusFilter) {
                    // Step 1: Fetch products matching non-status filters, but only data needed for status calculation + IDs
                    const candidateProducts = await prisma.product.findMany({
                        where: productWhereClause,
                        select: {
                            id: true,
                            // Only include inventoryItems for stock calculation, not full product data yet
                            inventoryItems: {
                                select: { quantity: true, shopId: true } // shopId might be useful if low stock is per shop
                            },
                            // We will fetch other details (name, sku, category, price) in a second query for only the filtered & paginated IDs
                        },
                        orderBy: { name: 'asc' } // Consistent ordering for potential later slicing if needed before final fetch
                    });

                    // Step 2: Calculate status in JS and filter by status, collecting IDs
                    const productsMeetingStatusCriteria: Array<{ id: number; calculatedStatus: string; totalStock: number; }> = [];
                    candidateProducts.forEach(product => {
                        let totalStock = 0;
                        product.inventoryItems.forEach(item => { totalStock += item.quantity; });

                        let currentProductStatus = 'Out of Stock';
                        if (totalStock > 0) {
                            // Customize low stock definition, e.g., based on a threshold or specific shop conditions
                            const lowStockThreshold = 5; // Example threshold
                            const hasLowStock = product.inventoryItems.some(inv => inv.quantity > 0 && inv.quantity <= lowStockThreshold);
                            currentProductStatus = hasLowStock ? 'Low Stock' : 'In Stock';
                        }

                        if (currentProductStatus === statusFilter) {
                            productsMeetingStatusCriteria.push({ id: product.id, calculatedStatus: currentProductStatus, totalStock });
                        }
                    });

                    countForPaginationQuery = productsMeetingStatusCriteria.length;
                    const paginatedProductIdsAndInfo = productsMeetingStatusCriteria.slice(skip, skip + limit);
                    const paginatedProductIds = paginatedProductIdsAndInfo.map(p => p.id);

                    if (paginatedProductIds.length > 0) {
                        // Step 3: Fetch full data for the filtered and paginated product IDs
                        const fullProductsData = await prisma.product.findMany({
                            where: { id: { in: paginatedProductIds } },
                            include: {
                                category: { select: { name: true } }, // Select only name
                                inventoryItems: {
                                    include: {
                                        shop: { select: { id: true, name: true } }
                                    }
                                },
                                // Add other necessary includes for the final output
                            },
                            orderBy: { name: 'asc' } // Ensure consistent order with ID selection if any implicit ordering matters
                        });

                        // Map to final structure, using pre-calculated status and stock
                        // Need to merge fullProductsData with paginatedProductIdsAndInfo for status and totalStock
                        const infoMap = new Map(paginatedProductIdsAndInfo.map(p => [p.id, { status: p.calculatedStatus, stock: p.totalStock }]));

                        finalProductOutput = fullProductsData.map(product => ({
                            id: product.id,
                            sku: product.sku,
                            name: product.name,
                            category: product.category?.name || 'Uncategorized',
                            stock: infoMap.get(product.id)?.stock ?? 0, // Use pre-calculated stock
                            retailPrice: product.price,
                            weightedAverageCost: product.weightedAverageCost,
                            status: infoMap.get(product.id)?.status ?? 'Error', // Use pre-calculated status
                        }));
                    }
                } else {
                    // Original logic for no status filter (seems okay, but ensure includes are minimal)
                    countForPaginationQuery = await prisma.product.count({ where: productWhereClause });
                    const paginatedProducts = await prisma.product.findMany({
                        where: productWhereClause,
                        include: {
                            category: { select: { name: true } },
                            inventoryItems: {
                                include: {
                                    shop: { select: { id: true, name: true } }
                                }
                            },
                        },
                        orderBy: { name: 'asc' },
                        skip,
                        take: limit
                    });

                    finalProductOutput = paginatedProducts.map(product => {
                        let totalStock = 0;
                        product.inventoryItems.forEach(item => { totalStock += item.quantity; });
                        let productStatus = 'Out of Stock';
                        if (totalStock > 0) {
                            const lowStockThreshold = 5; // Example threshold
                            const hasLowStock = product.inventoryItems.some(inv => inv.quantity > 0 && inv.quantity <= lowStockThreshold);
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
                            status: productStatus,
                        };
                    });
                }
                return [finalProductOutput, countForPaginationQuery];
            },
            [[], 0],
            'Failed to fetch inventory summary'
        );

        return NextResponse.json({
            success: true,
            data: productsToReturn,
            pagination: {
                total: totalCountForPagination,
                page,
                limit,
                totalPages: Math.ceil(totalCountForPagination / limit)
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