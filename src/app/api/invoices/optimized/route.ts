import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { cache as vercelCache } from '@/lib/cache-vercel';
import { performance } from '@/lib/performance';

// Vercel serverless optimizations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// Enhanced caching configuration
const CACHE_CONFIG = {
    invoices: {
        ttl: 60, // 1 minute for invoice list
        staleWhileRevalidate: 300 // 5 minutes
    },
    statistics: {
        ttl: 300, // 5 minutes for statistics
        staleWhileRevalidate: 900 // 15 minutes
    },
    customers: {
        ttl: 600, // 10 minutes for customers
        staleWhileRevalidate: 1800 // 30 minutes
    }
};

// Cursor-based pagination helper
function createCursor(id: string | number, createdAt: Date): string {
    return Buffer.from(`${id}:${createdAt.getTime()}`).toString('base64');
}

function parseCursor(cursor: string): { id: string; createdAt: Date } | null {
    try {
        const decoded = Buffer.from(cursor, 'base64').toString();
        const [id, timestamp] = decoded.split(':');
        return {
            id,
            createdAt: new Date(parseInt(timestamp))
        };
    } catch {
        return null;
    }
}

// Optimized query builder
function buildWhereClause(filters: any, shopId?: string) {
    const where: any = {};

    if (shopId) {
        where.shopId = shopId;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.paymentMethod) {
        where.paymentMethod = filters.paymentMethod;
    }

    if (filters.customerId) {
        where.customerId = parseInt(filters.customerId);
    }

    if (filters.search) {
        where.OR = [
            { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
            { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
            { total: { equals: parseFloat(filters.search) || undefined } }
        ].filter(condition => {
            // Remove invalid conditions
            if (condition.total?.equals === undefined) {
                delete condition.total;
            }
            return Object.keys(condition).length > 0;
        });
    }

    // Time period filtering
    if (filters.timePeriod && filters.timePeriod !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.timePeriod) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(0);
        }

        where.createdAt = { gte: startDate };
    }

    return where;
}

function buildOrderBy(sortBy: string) {
    switch (sortBy) {
        case 'oldest':
            return { createdAt: 'asc' };
        case 'amount-high':
            return { total: 'desc' };
        case 'amount-low':
            return { total: 'asc' };
        case 'customer':
            return { customer: { name: 'asc' } };
        case 'due-date':
            return { dueDate: 'asc' };
        case 'due-date-desc':
            return { dueDate: 'desc' };
        case 'newest':
        default:
            return { createdAt: 'desc' };
    }
}

// Optimized statistics query with materialized view fallback
async function getStatistics(shopId?: string) {
    const cacheKey = `invoice-statistics:${shopId || 'all'}`;

    return cache.getOrSet(
        cacheKey,
        async () => {
            const whereClause = shopId ? { shopId } : {};

            // Try to use materialized view first (if exists)
            try {
                const result = await prisma.$queryRaw`
                    SELECT 
                        COALESCE(SUM(CASE WHEN LOWER(status) != 'paid' THEN total ELSE 0 END), 0) as total_outstanding,
                        COALESCE(SUM(CASE WHEN LOWER(status) = 'paid' AND DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', CURRENT_DATE) THEN total ELSE 0 END), 0) as paid_this_month,
                        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
                        COALESCE(SUM(CASE WHEN "paymentMethod" = 'credit' THEN total ELSE 0 END), 0) as total_credit_sales,
                        COALESCE(SUM(CASE WHEN "paymentMethod" != 'credit' THEN total ELSE 0 END), 0) as total_non_credit_sales
                    FROM "Invoice"
                    ${shopId ? `WHERE "shopId" = '${shopId}'` : ''}
                `;

                const stats = result[0] as any;
                return {
                    totalOutstanding: parseFloat(stats.total_outstanding) || 0,
                    paidThisMonth: parseFloat(stats.paid_this_month) || 0,
                    overdueCount: parseInt(stats.overdue_count) || 0,
                    totalCreditSales: parseFloat(stats.total_credit_sales) || 0,
                    totalNonCreditSales: parseFloat(stats.total_non_credit_sales) || 0
                };
            } catch (error) {
                console.warn('Materialized view not available, falling back to aggregation queries');

                // Fallback to individual queries
                const [totalOutstanding, paidThisMonth, overdueCount, creditSales, nonCreditSales] = await Promise.all([
                    prisma.invoice.aggregate({
                        where: { ...whereClause, status: { not: 'paid' } },
                        _sum: { total: true }
                    }),
                    prisma.invoice.aggregate({
                        where: {
                            ...whereClause,
                            status: 'paid',
                            createdAt: {
                                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                            }
                        },
                        _sum: { total: true }
                    }),
                    prisma.invoice.count({
                        where: { ...whereClause, status: 'overdue' }
                    }),
                    prisma.invoice.aggregate({
                        where: { ...whereClause, paymentMethod: 'credit' },
                        _sum: { total: true }
                    }),
                    prisma.invoice.aggregate({
                        where: { ...whereClause, paymentMethod: { not: 'credit' } },
                        _sum: { total: true }
                    })
                ]);

                return {
                    totalOutstanding: totalOutstanding._sum.total || 0,
                    paidThisMonth: paidThisMonth._sum.total || 0,
                    overdueCount,
                    totalCreditSales: creditSales._sum.total || 0,
                    totalNonCreditSales: nonCreditSales._sum.total || 0
                };
            }
        },
        CACHE_CONFIG.statistics.ttl
    );
}

// Bulk operations helper
async function bulkUpdateInvoices(invoiceIds: string[], updates: any) {
    return prisma.invoice.updateMany({
        where: {
            id: { in: invoiceIds }
        },
        data: updates
    });
}

export async function GET(request: NextRequest) {
    const startTime = performance.now();

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filters = {
            cursor: searchParams.get('cursor'),
            limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
            status: searchParams.get('status'),
            paymentMethod: searchParams.get('paymentMethod'),
            customerId: searchParams.get('customerId'),
            search: searchParams.get('search'),
            timePeriod: searchParams.get('timePeriod') || 'all',
            sortBy: searchParams.get('sortBy') || 'newest',
            includeStatistics: searchParams.get('includeStatistics') === 'true'
        };

        // Get user's shop access
        const userShops = await prisma.userShop.findMany({
            where: { userId: session.user.id },
            select: { shopId: true }
        });

        const shopIds = userShops.map(us => us.shopId);
        const shopId = searchParams.get('shopId');

        if (shopId && !shopIds.includes(shopId)) {
            return NextResponse.json({ error: 'Access denied to this shop' }, { status: 403 });
        }

        // Build cache key
        const cacheKey = `invoices:${JSON.stringify({ ...filters, shopIds: shopId ? [shopId] : shopIds })}`;

        // Try cache first
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult) {
            return NextResponse.json({
                ...cachedResult,
                cached: true,
                responseTime: performance.now() - startTime
            });
        }

        // Build query conditions
        const where = buildWhereClause(filters, shopId);
        if (!shopId) {
            where.shopId = { in: shopIds };
        }

        // Handle cursor-based pagination
        if (filters.cursor) {
            const cursorData = parseCursor(filters.cursor);
            if (cursorData) {
                where.OR = [
                    {
                        createdAt: { lt: cursorData.createdAt }
                    },
                    {
                        createdAt: cursorData.createdAt,
                        id: { lt: cursorData.id }
                    }
                ];
            }
        }

        const orderBy = buildOrderBy(filters.sortBy);

        // Optimized query with selective field loading
        const [invoices, totalCount, statistics] = await Promise.all([
            prisma.invoice.findMany({
                where,
                orderBy,
                take: filters.limit + 1, // Take one extra to check if there are more
                select: {
                    id: true,
                    invoiceNumber: true,
                    customerId: true,
                    total: true,
                    totalProfit: true,
                    profitMargin: true,
                    status: true,
                    paymentMethod: true,
                    createdAt: true,
                    updatedAt: true,
                    dueDate: true,
                    customer: {
                        select: {
                            name: true
                        }
                    },
                    shop: {
                        select: {
                            name: true
                        }
                    },
                    payments: {
                        where: {
                            receipt: {
                                isNot: null
                            }
                        },
                        select: {
                            amount: true
                        }
                    },
                    _count: {
                        select: {
                            items: true
                        }
                    }
                }
            }),
            // Only count if we need pagination info
            filters.cursor ? Promise.resolve(0) : prisma.invoice.count({ where }),
            // Only fetch statistics if requested
            filters.includeStatistics ? getStatistics(shopId) : Promise.resolve(null)
        ]);

        // Check if there are more results
        const hasMore = invoices.length > filters.limit;
        const resultInvoices = hasMore ? invoices.slice(0, -1) : invoices;

        // Generate next cursor
        const nextCursor = hasMore && resultInvoices.length > 0
            ? createCursor(resultInvoices[resultInvoices.length - 1].id, resultInvoices[resultInvoices.length - 1].createdAt)
            : null;

        // Format response
        const formattedInvoices = resultInvoices.map(invoice => {
            const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const dueAmount = Math.max(0, invoice.total - totalPaid);
            
            return {
                ...invoice,
                customerName: invoice.customer.name,
                shopName: invoice.shop?.name,
                itemCount: invoice._count.items,
                date: invoice.createdAt.toISOString().split('T')[0],
                dueDate: invoice.dueDate?.toISOString().split('T')[0],
                totalPaid,
                dueAmount
            };
        });

        const result = {
            invoices: formattedInvoices,
            hasMore,
            nextCursor,
            totalCount: filters.cursor ? undefined : totalCount,
            statistics,
            responseTime: performance.now() - startTime
        };

        // Cache the result
        await cache.set(cacheKey, result, CACHE_CONFIG.invoices.ttl);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch invoices',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                responseTime: performance.now() - startTime
            },
            { status: 500 }
        );
    }
}

// Bulk operations endpoint
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { operation, invoiceIds, data } = body;

        if (!operation || !invoiceIds || !Array.isArray(invoiceIds)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Verify user has access to these invoices
        const userShops = await prisma.userShop.findMany({
            where: { userId: session.user.id },
            select: { shopId: true }
        });
        const shopIds = userShops.map(us => us.shopId);

        const invoices = await prisma.invoice.findMany({
            where: {
                id: { in: invoiceIds },
                shopId: { in: shopIds }
            },
            select: { id: true }
        });

        if (invoices.length !== invoiceIds.length) {
            return NextResponse.json({ error: 'Some invoices not found or access denied' }, { status: 403 });
        }

        let result;
        switch (operation) {
            case 'bulkUpdateStatus':
                result = await bulkUpdateInvoices(invoiceIds, { status: data.status });
                break;
            case 'bulkDelete':
                result = await prisma.invoice.deleteMany({
                    where: { id: { in: invoiceIds } }
                });
                break;
            default:
                return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
        }

        // Invalidate related caches
        await cache.invalidatePattern('invoices:*');
        await cache.invalidatePattern('invoice-statistics:*');

        return NextResponse.json({
            success: true,
            affected: result.count,
            operation
        });

    } catch (error) {
        console.error('Error in bulk operation:', error);
        return NextResponse.json(
            { error: 'Failed to perform bulk operation' },
            { status: 500 }
        );
    }
}