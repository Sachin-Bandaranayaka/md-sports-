import MainLayout from '@/components/layout/MainLayout';
import { Suspense } from 'react';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import InvoiceSuperOptimizedWrapper from './components/InvoiceSuperOptimizedWrapper';

// Minimal skeleton component for instant loading
function SuperOptimizedSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                </div>
                <div className="h-96 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}

// Optimized interface with minimal fields
interface OptimizedInvoice {
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

interface OptimizedStatistics {
    totalOutstanding: number;
    paidThisMonth: number;
    overdueCount: number;
    totalInvoices: number;
}

const ITEMS_PER_PAGE = 20; // Increased for better UX
const CACHE_TTL = 300; // 5 minutes cache

// Ultra-optimized query with minimal data fetching
const fetchOptimizedInvoicesData = unstable_cache(
    async ({
        page = 1,
        status,
        paymentMethod,
        searchQuery,
        sortBy = 'newest',
        shopId
    }: {
        page?: number;
        status?: string;
        paymentMethod?: string;
        searchQuery?: string;
        sortBy?: string;
        shopId?: string;
    }) => {
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

        try {
            // Single optimized query with minimal joins
            const [invoicesRaw, totalCount, stats] = await Promise.all([
                // Main query - only essential fields
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
                        // Use aggregated payments for total paid
                        payments: {
                            select: { amount: true },
                            where: { receipt: { isNot: null } }
                        }
                    },
                    orderBy,
                    skip,
                    take: ITEMS_PER_PAGE,
                }),

                // Count query
                prisma.invoice.count({ where: whereClause }),

                // Simplified stats in one query using aggregations
                prisma.$transaction([
                    // Outstanding
                    prisma.invoice.aggregate({
                        _sum: { total: true },
                        where: { ...whereClause, status: { notIn: ['paid', 'cancelled', 'void'] } }
                    }),
                    // Paid this month
                    prisma.invoice.aggregate({
                        _sum: { total: true },
                        where: {
                            ...whereClause,
                            status: 'paid',
                            updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                        }
                    }),
                    // Overdue count
                    prisma.invoice.count({
                        where: { ...whereClause, status: 'overdue' }
                    })
                ])
            ]);

            // Transform data efficiently
            const invoices: OptimizedInvoice[] = invoicesRaw.map(inv => ({
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

            const statistics: OptimizedStatistics = {
                totalOutstanding: stats[0]._sum.total || 0,
                paidThisMonth: stats[1]._sum.total || 0,
                overdueCount: stats[2],
                totalInvoices: totalCount
            };

            return {
                invoices,
                totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
                currentPage: page,
                statistics,
                error: null
            };

        } catch (error) {
            console.error('Error fetching optimized invoices:', error);
            return {
                invoices: [],
                totalPages: 0,
                currentPage: 1,
                statistics: { totalOutstanding: 0, paidThisMonth: 0, overdueCount: 0, totalInvoices: 0 },
                error: 'Failed to fetch invoices'
            };
        }
    },
    ['super-optimized-invoices'],
    { 
        revalidate: CACHE_TTL,
        tags: ['invoices', 'super-optimized']
    }
);

// Main page component
export default async function SuperOptimizedInvoicesPage({
    searchParams,
}: {
    searchParams: Promise<{ 
        page?: string;
        status?: string;
        paymentMethod?: string;
        search?: string;
        sortBy?: string;
        shopId?: string;
    }>;
}) {
    const params = await searchParams;
    
    // Get data with cache
    const data = await fetchOptimizedInvoicesData({
        page: parseInt(params.page || '1', 10),
        status: params.status,
        paymentMethod: params.paymentMethod,
        searchQuery: params.search,
        sortBy: params.sortBy,
        shopId: params.shopId
    });

    return (
        <MainLayout>
            <Suspense fallback={<SuperOptimizedSkeleton />}>
                <InvoiceSuperOptimizedWrapper
                    initialData={data}
                    searchParams={params}
                />
            </Suspense>
        </MainLayout>
    );
}

// Force static optimization where possible
export const dynamic = 'force-dynamic';
export const revalidate = CACHE_TTL; 