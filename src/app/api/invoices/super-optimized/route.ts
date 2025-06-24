import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { validateTokenPermission } from '@/lib/auth';
import { unstable_cache } from 'next/cache';

const ITEMS_PER_PAGE = 20;
const CACHE_TTL = 300; // 5 minutes

// Minimal interface for optimized data transfer
interface OptimizedInvoiceResponse {
    id: string;
    invoiceNumber: string;
    customerId: number | null;
    customerName: string;
    total: number;
    status: string;
    paymentMethod: string | null;
    createdAt: string;
    dueDate: string | null;
    shopName: string | null;
    itemCount: number;
    totalPaid: number;
}

// Ultra-optimized database query with caching
const getOptimizedInvoices = unstable_cache(
    async (filters: {
        page: number;
        status?: string;
        paymentMethod?: string;
        searchQuery?: string;
        sortBy?: string;
        shopId?: string;
    }) => {
        const { page, status, paymentMethod, searchQuery, sortBy, shopId } = filters;
        const skip = (page - 1) * ITEMS_PER_PAGE;

        // Build minimal where clause
        const whereClause: Prisma.InvoiceWhereInput = {};
        
        if (status && status !== 'all') whereClause.status = status;
        if (paymentMethod && paymentMethod !== 'all') whereClause.paymentMethod = paymentMethod;
        if (shopId && shopId !== 'all') whereClause.shopId = shopId;
        
        if (searchQuery) {
            whereClause.OR = [
                { invoiceNumber: { contains: searchQuery, mode: 'insensitive' } },
                { customer: { name: { contains: searchQuery, mode: 'insensitive' } } },
            ];
        }

        // Optimized order by
        let orderBy: Prisma.InvoiceOrderByWithRelationInput = { createdAt: 'desc' };
        switch (sortBy) {
            case 'oldest': orderBy = { createdAt: 'asc' }; break;
            case 'amount-high': orderBy = { total: 'desc' }; break;
            case 'amount-low': orderBy = { total: 'asc' }; break;
            case 'customer': orderBy = { customer: { name: 'asc' } }; break;
        }

        // Single optimized query with minimal data
        const [invoicesRaw, totalCount, stats] = await Promise.all([
            prisma.invoice.findMany({
                where: whereClause,
                select: {
                    id: true,
                    invoiceNumber: true,
                    customerId: true,
                    total: true,
                    status: true,
                    paymentMethod: true,
                    createdAt: true,
                    dueDate: true,
                    customer: {
                        select: { name: true }
                    },
                    shop: {
                        select: { name: true }
                    },
                    _count: {
                        select: { items: true }
                    },
                    payments: {
                        select: { amount: true },
                        where: { receipt: { isNot: null } }
                    }
                },
                orderBy,
                skip,
                take: ITEMS_PER_PAGE,
            }),

            prisma.invoice.count({ where: whereClause }),

            // Simplified stats query
            prisma.$transaction([
                prisma.invoice.aggregate({
                    _sum: { total: true },
                    where: { ...whereClause, status: { notIn: ['paid', 'cancelled', 'void'] } }
                }),
                prisma.invoice.aggregate({
                    _sum: { total: true },
                    where: {
                        ...whereClause,
                        status: 'paid',
                        updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                    }
                }),
                prisma.invoice.count({
                    where: { ...whereClause, status: 'overdue' }
                })
            ])
        ]);

        // Transform efficiently
        const invoices: OptimizedInvoiceResponse[] = invoicesRaw.map(inv => ({
            id: inv.id.toString(),
            invoiceNumber: inv.invoiceNumber,
            customerId: inv.customerId,
            customerName: inv.customer?.name || 'Unknown',
            total: inv.total,
            status: inv.status,
            paymentMethod: inv.paymentMethod,
            createdAt: inv.createdAt.toISOString(),
            dueDate: inv.dueDate?.toISOString() || null,
            shopName: inv.shop?.name || null,
            itemCount: inv._count.items,
            totalPaid: inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
        }));

        return {
            invoices,
            totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
            currentPage: page,
            statistics: {
                totalOutstanding: stats[0]._sum.total || 0,
                paidThisMonth: stats[1]._sum.total || 0,
                overdueCount: stats[2],
                totalInvoices: totalCount
            }
        };
    },
    ['super-optimized-invoices-api'],
    { 
        revalidate: CACHE_TTL,
        tags: ['invoices', 'super-optimized']
    }
);

export async function GET(request: NextRequest) {
    try {
        // Validate token
        const authResult = await validateTokenPermission(request, 'sales:view');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const filters = {
            page: parseInt(searchParams.get('page') || '1', 10),
            status: searchParams.get('status') || undefined,
            paymentMethod: searchParams.get('paymentMethod') || undefined,
            searchQuery: searchParams.get('search') || undefined,
            sortBy: searchParams.get('sortBy') || undefined,
            shopId: searchParams.get('shopId') || undefined,
        };

        // Get cached data
        const data = await getOptimizedInvoices(filters);

        // Set aggressive caching headers
        const response = NextResponse.json({ 
            success: true, 
            data,
            cached: true,
            timestamp: new Date().toISOString()
        });
        
        response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=60`);
        response.headers.set('X-Cache', 'OPTIMIZED');
        
        return response;

    } catch (error) {
        console.error('Super-optimized invoices API error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to fetch invoices',
                timestamp: new Date().toISOString()
            }, 
            { status: 500 }
        );
    }
} 