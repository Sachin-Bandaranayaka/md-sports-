'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import InvoiceClientWrapper from './InvoiceClientWrapper';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

interface Invoice {
    id: string | number;
    invoiceNumber: string;
    customerId: number | null;
    customerName?: string;
    total: number;
    totalProfit?: number;
    profitMargin?: number;
    status: string;
    paymentMethod: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    date?: string;
    dueDate?: string;
    notes?: string | null;
    totalPaid?: number;
    dueAmount?: number;
}

const ITEMS_PER_PAGE = 15;

async function fetchInvoicesData({
    pageParam = 1,
    status,
    paymentMethod,
    timePeriod,
    searchQueryParam,
    sortByParam,
    shopId
}: {
    pageParam?: number;
    status?: string;
    paymentMethod?: string;
    timePeriod?: string;
    searchQueryParam?: string;
    sortByParam?: string;
    shopId?: string;
}) {
    const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : pageParam;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const take = ITEMS_PER_PAGE;

    const whereClause: Prisma.InvoiceWhereInput = {
        ...(status && status !== 'all' && { status }),
        ...(paymentMethod && paymentMethod !== 'all' && { paymentMethod }),
        ...(shopId && shopId !== 'all' && { shopId }),
        ...(searchQueryParam && {
            OR: [
                { invoiceNumber: { contains: searchQueryParam, mode: 'insensitive' } },
                { customer: { name: { contains: searchQueryParam, mode: 'insensitive' } } },
            ],
        }),
    };

    if (timePeriod && timePeriod !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (timePeriod) {
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

        whereClause.createdAt = {
            gte: startDate,
        };
    }

    let orderBy: Prisma.InvoiceOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortByParam) {
        switch (sortByParam) {
            case 'oldest':
                orderBy = { createdAt: 'asc' };
                break;
            case 'amount-high':
                orderBy = { total: 'desc' };
                break;
            case 'amount-low':
                orderBy = { total: 'asc' };
                break;
            case 'customer':
                orderBy = { customer: { name: 'asc' } };
                break;
            case 'due-date':
                orderBy = { dueDate: 'asc' };
                break;
            case 'due-date-desc':
                orderBy = { dueDate: 'desc' };
                break;
            case 'newest':
            default:
                orderBy = { createdAt: 'desc' };
                break;
        }
    }

    try {
        const [invoicesFromDB, totalInvoicesCount, totalOutstandingResult, paidThisMonthResult, overdueCountResult, creditSalesResult, nonCreditSalesResult] = await Promise.all([
            prisma.invoice.findMany({
                where: whereClause,
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
                    invoiceDate: true,
                    dueDate: true,
                    notes: true,
                    shopId: true,
                    customer: true,
                    shop: {
                        select: {
                            id: true,
                            name: true,
                            location: true
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
                        select: { items: true },
                    },
                },
                orderBy: orderBy,
                skip: (page - 1) * ITEMS_PER_PAGE,
                take: ITEMS_PER_PAGE,
            }),
            prisma.invoice.count({ where: whereClause }),
            prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    ...whereClause,
                    status: { notIn: ['paid', 'cancelled', 'void'] },
                }
            }),
            prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    ...whereClause,
                    status: 'paid',
                    updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
                }
            }),
            prisma.invoice.count({
                where: {
                    ...whereClause,
                    status: 'overdue',
                }
            }),
            prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    ...whereClause,
                    customer: {
                        customerType: 'wholesale'
                    }
                }
            }),
            prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    ...whereClause,
                    customer: {
                        customerType: 'retail'
                    }
                }
            }),
        ]);

        const formattedInvoices: Invoice[] = invoicesFromDB.map(inv => {
            const createdDate = new Date(inv.createdAt);
            let displayDueDate = inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '';
            if (!displayDueDate && inv.invoiceDate) {
                const tempDueDate = new Date(inv.invoiceDate);
                tempDueDate.setDate(tempDueDate.getDate() + 30);
                displayDueDate = tempDueDate.toISOString().split('T')[0];
            }

            const totalPaid = inv.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
            const dueAmount = Math.max(0, inv.total - totalPaid);

            return {
                ...inv,
                id: inv.id.toString(),
                customerName: inv.customer?.name || 'Unknown Customer',
                itemCount: inv._count?.items || 0,
                date: createdDate.toISOString().split('T')[0],
                dueDate: displayDueDate,
                totalProfit: inv.totalProfit || 0,
                profitMargin: inv.profitMargin || 0,
                totalPaid,
                dueAmount
            };
        });

        return {
            invoices: formattedInvoices,
            totalPages: Math.ceil(totalInvoicesCount / ITEMS_PER_PAGE),
            currentPage: page,
            statistics: {
                totalOutstanding: totalOutstandingResult._sum.total || 0,
                paidThisMonth: paidThisMonthResult._sum.total || 0,
                overdueCount: overdueCountResult,
                creditSales: creditSalesResult._sum.total || 0,
                nonCreditSales: nonCreditSalesResult._sum.total || 0,
            },
            error: null,
        };

    } catch (error) {
        console.error('Error fetching invoices data:', error);
        return {
            invoices: [],
            totalPages: 0,
            currentPage: 1,
            statistics: {
                totalOutstanding: 0,
                paidThisMonth: 0,
                overdueCount: 0,
                creditSales: 0,
                nonCreditSales: 0,
            },
            error: 'Failed to fetch invoices',
        };
    }
}

export default async function InvoicesList({
    searchParams,
}: {
    searchParams: Promise<{ 
        page?: string;
        status?: string;
        paymentMethod?: string;
        search?: string;
        timePeriod?: string;
        sortBy?: string;
        shopId?: string;
    }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    let userShopId: string | undefined;

    if (token) {
        const payload = await verifyToken(token);
        if (payload?.shopId) {
            userShopId = payload.shopId as string;
        }
    }

    const resolvedSearchParams = await searchParams;
    const { page, status, paymentMethod, search, timePeriod, sortBy, shopId } = resolvedSearchParams;

    const appliedShopId = userShopId || shopId;

    const [{ invoices, totalPages, currentPage, statistics, error }, shops] = await Promise.all([
        fetchInvoicesData({
            pageParam: page ? parseInt(page, 10) : 1,
            status: status,
            paymentMethod: paymentMethod,
            searchQueryParam: search,
            timePeriod: timePeriod,
            sortByParam: sortBy,
            shopId: appliedShopId
        }),
        prisma.shop.findMany({
            select: {
                id: true,
                name: true,
                location: true
            }
        })
    ]);

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-red-500 text-center">{error}. Please try refreshing the page.</p>
            </div>
        );
    }

    return (
        <InvoiceClientWrapper
            initialInvoices={invoices}
            initialTotalPages={totalPages}
            initialCurrentPage={currentPage}
            initialStatistics={{
                totalOutstanding: statistics.totalOutstanding,
                paidThisMonth: statistics.paidThisMonth,
                overdueCount: statistics.overdueCount,
                totalCreditSales: statistics.creditSales,
                totalNonCreditSales: statistics.nonCreditSales
            }}
            shops={shops}
        />
    );
} 