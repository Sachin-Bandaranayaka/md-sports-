import MainLayout from '@/components/layout/MainLayout';
import { prisma } from '@/lib/prisma';
import InvoiceClientWrapper from './components/InvoiceClientWrapper';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const revalidate = 60; // Revalidate this page every 60 seconds

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
    itemCount?: number;
}

const ITEMS_PER_PAGE = 15;

async function fetchInvoicesData(
    pageParam: string | undefined,
    statusFilterParam: string | undefined,
    paymentMethodFilterParam: string | undefined,
    searchQueryParam: string | undefined,
    timePeriodParam: string | undefined,
    sortByParam: string | undefined
) {
    const page = parseInt(pageParam || '1', 10);
    const statusFilter = statusFilterParam || '';
    const paymentMethodFilter = paymentMethodFilterParam || '';
    const searchQuery = searchQueryParam || '';
    const timePeriod = timePeriodParam || 'all';
    const sortBy = sortByParam || 'newest';

    let whereClause: any = {};
    if (statusFilter) {
        whereClause.status = statusFilter;
    }
    if (paymentMethodFilter) {
        whereClause.paymentMethod = paymentMethodFilter;
    }
    if (searchQuery) {
        whereClause.OR = [
            { invoiceNumber: { contains: searchQuery, mode: 'insensitive' } },
            { customer: { name: { contains: searchQuery, mode: 'insensitive' } } },
        ];
    }

    // Add time period filtering
    const now = new Date();
    if (timePeriod !== 'all') {
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
                startDate = new Date(0); // All time
        }
        whereClause.createdAt = { gte: startDate };
    }

    // Determine sorting order
    let orderBy: any;
    switch (sortBy) {
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
        case 'newest':
        default:
            orderBy = { createdAt: 'desc' };
            break;
    }

    try {
        const invoicesPromise = prisma.invoice.findMany({
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
                _count: {
                    select: { items: true },
                },
            },
            orderBy: orderBy,
            skip: (page - 1) * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
        });

        const totalInvoicesCountPromise = prisma.invoice.count({ where: whereClause });

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalOutstandingPromise = prisma.invoice.aggregate({
            _sum: { total: true },
            where: {
                ...whereClause,
                status: { notIn: ['Paid', 'Cancelled', 'Void'] }, // Ensure 'Void' is also excluded if it means not outstanding
                // AND: whereClause.AND ? [...whereClause.AND] : [], // if you have other AND conditions
            }
        });

        const paidThisMonthPromise = prisma.invoice.aggregate({
            _sum: { total: true },
            where: {
                ...whereClause,
                status: 'Paid',
                updatedAt: { gte: firstDayOfMonth },
                // AND: whereClause.AND ? [...whereClause.AND] : [],
            }
        });

        const overdueCountPromise = prisma.invoice.count({
            where: {
                ...whereClause,
                status: 'Overdue',
            }
        });

        // Credit sales (wholesale customers)
        const creditSalesPromise = prisma.invoice.aggregate({
            _sum: { total: true },
            where: {
                ...whereClause,
                customer: {
                    customerType: 'wholesale'
                }
            }
        });

        // Non-credit sales (retail customers)
        const nonCreditSalesPromise = prisma.invoice.aggregate({
            _sum: { total: true },
            where: {
                ...whereClause,
                customer: {
                    customerType: 'retail'
                }
            }
        });

        const [invoicesFromDB, totalInvoicesCount, totalOutstandingResult, paidThisMonthResult, overdueCountResult, creditSalesResult, nonCreditSalesResult] = await Promise.all([
            invoicesPromise,
            totalInvoicesCountPromise,
            totalOutstandingPromise,
            paidThisMonthPromise,
            overdueCountPromise,
            creditSalesPromise,
            nonCreditSalesPromise
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

            return {
                ...inv,
                id: inv.id.toString(), // Ensure ID is string
                customerName: inv.customer?.name || 'Unknown Customer',
                itemCount: inv._count?.items || 0,
                date: createdDate.toISOString().split('T')[0],
                dueDate: displayDueDate, // Use the calculated or existing due date
                totalProfit: inv.totalProfit || 0,
                profitMargin: inv.profitMargin || 0
            };
        });

        return {
            invoices: formattedInvoices,
            totalPages: Math.ceil(totalInvoicesCount / ITEMS_PER_PAGE),
            currentPage: page,
            statistics: {
                totalOutstanding: totalOutstandingResult._sum.total || 0,
                paidThisMonth: paidThisMonthResult._sum.total || 0,
                overdueCount: overdueCountResult || 0,
                totalCreditSales: creditSalesResult._sum.total || 0,
                totalNonCreditSales: nonCreditSalesResult._sum.total || 0,
            },
        };

    } catch (error) {
        console.error('Error fetching invoices data:', error);
        // It's good practice to return a consistent shape even on error
        return {
            invoices: [],
            totalPages: 0,
            currentPage: 1,
            statistics: { totalOutstanding: 0, paidThisMonth: 0, overdueCount: 0, totalCreditSales: 0, totalNonCreditSales: 0 },
            error: 'Failed to fetch invoices. Please try refreshing the page.',
        };
    }
}

export default async function InvoicesPage({ searchParams: passedSearchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
    const searchParams = await passedSearchParams; // Await the searchParams

    const { invoices, totalPages, currentPage, statistics, error } = await fetchInvoicesData(
        searchParams?.page as string | undefined,
        searchParams?.status as string | undefined,
        searchParams?.paymentMethod as string | undefined,
        searchParams?.search as string | undefined,
        searchParams?.timePeriod as string | undefined,
        searchParams?.sortBy as string | undefined
    );

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
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={
                    <div className="flex justify-center items-center h-screen">
                        <Loader2 className="animate-spin text-indigo-600" size={60} />
                        <p className="ml-4 text-xl text-gray-600">Loading invoices...</p>
                    </div>
                }>
                    <InvoiceClientWrapper
                        initialInvoices={invoices}
                        initialTotalPages={totalPages}
                        initialCurrentPage={currentPage}
                        initialStatistics={statistics}
                    />
                </Suspense>
            </div>
        </MainLayout>
    );
}