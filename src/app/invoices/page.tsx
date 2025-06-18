import MainLayout from '@/components/layout/MainLayout';
import { Suspense } from 'react';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import InvoiceClientWrapper from './components/InvoiceClientWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { unstable_cache } from 'next/cache';
import { Loader2 } from 'lucide-react';

// Invoice Page Skeleton Component
function InvoicePageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
            
            {/* Filters Skeleton */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-4 mb-4">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            
            {/* Table Skeleton */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4">
                    <div className="space-y-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Pagination Skeleton */}
            <div className="mt-6 flex justify-center">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-20" />
                </div>
            </div>
        </div>
    );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for real-time data

// Interface for Invoice - ensure this matches the shape expected by InvoiceClientWrapper
interface Invoice {
    id: string | number;
    invoiceNumber: string;
    customerId: number;
    customerName?: string;
    total: number;
    totalProfit?: number;
    profitMargin?: number;
    status: string;
    paymentMethod: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    date?: string; // Formatted for display
    dueDate?: string; // Formatted for display
    notes?: string;
    totalPaid?: number; // Total amount paid
    dueAmount?: number; // Amount still due
}

const ITEMS_PER_PAGE = 15;

// Optimized function to fetch invoices data with filters and pagination
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

    // Build where clause based on filters
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

    // Add time period filter
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

    // Build order by clause
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
        // Use Promise.all for parallel execution to improve performance
        const [invoicesFromDB, totalInvoicesCount, totalOutstandingResult, paidThisMonthResult, overdueCountResult, creditSalesResult, nonCreditSalesResult] = await Promise.all([
            // Get invoices with pagination - optimized with minimal includes
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
            
            // Get total count for pagination
            prisma.invoice.count({ where: whereClause }),
            
            // Calculate total outstanding
            prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    ...whereClause,
                    status: { notIn: ['paid', 'cancelled', 'void'] },
                }
            }),
            
            // Get paid this month
            prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    ...whereClause,
                    status: 'paid',
                    updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
                }
            }),
            
            // Get overdue count
            prisma.invoice.count({
                where: {
                    ...whereClause,
                    status: 'overdue',
                }
            }),
            
            // Credit sales (wholesale customers)
            prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    ...whereClause,
                    customer: {
                        customerType: 'wholesale'
                    }
                }
            }),
            
            // Non-credit sales (retail customers)
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
            // const dueDate = new Date(createdDate);
            // dueDate.setDate(dueDate.getDate() + 30); // Assuming due date is always 30 days from creation
            // It's better if dueDate is stored or calculated based on actual terms
            let displayDueDate = inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '';
            if (!displayDueDate && inv.date) { // Fallback if specific dueDate field doesn't exist on model but a general 'date' might imply it
                const tempDueDate = new Date(inv.date);
                tempDueDate.setDate(tempDueDate.getDate() + 30); // Example: 30 days after invoice date
                displayDueDate = tempDueDate.toISOString().split('T')[0];
            }

            // Calculate total paid and due amount
            const totalPaid = inv.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
            const dueAmount = Math.max(0, inv.total - totalPaid);

            return {
                ...inv,
                id: inv.id.toString(), // Ensure ID is string
                customerName: inv.customer?.name || 'Unknown Customer',
                itemCount: inv._count?.items || 0,
                date: createdDate.toISOString().split('T')[0],
                dueDate: displayDueDate, // Use the calculated or existing due date
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
        // It's good practice to return a consistent shape even on error
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

export default async function InvoicesPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const pageParam = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
    const statusFilterParam = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
    const paymentMethodFilterParam = Array.isArray(searchParams.paymentMethod) ? searchParams.paymentMethod[0] : searchParams.paymentMethod;
    const searchQueryParam = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search;
    const timePeriodParam = Array.isArray(searchParams.timePeriod) ? searchParams.timePeriod[0] : searchParams.timePeriod;
    const sortByParam = Array.isArray(searchParams.sortBy) ? searchParams.sortBy[0] : searchParams.sortBy;
    const shopIdParam = Array.isArray(searchParams.shopId) ? searchParams.shopId[0] : searchParams.shopId;

    const [{ invoices, totalPages, currentPage, statistics, error }, shops] = await Promise.all([
        fetchInvoicesData({
            pageParam: pageParam ? parseInt(pageParam, 10) : 1,
            status: statusFilterParam,
            paymentMethod: paymentMethodFilterParam,
            searchQueryParam,
            timePeriod: timePeriodParam,
            sortByParam,
            shopId: shopIdParam
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
            <MainLayout>
                <div className="container mx-auto px-4 py-8">
                    <p className="text-red-500 text-center">{error}. Please try refreshing the page.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Suspense fallback={<InvoicePageSkeleton />}>
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
            </Suspense>
        </MainLayout>
    );
}