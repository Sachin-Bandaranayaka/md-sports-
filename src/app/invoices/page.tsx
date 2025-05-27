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
    searchQueryParam: string | undefined
) {
    const page = parseInt(pageParam || '1', 10);
    const statusFilter = statusFilterParam || '';
    const paymentMethodFilter = paymentMethodFilterParam || '';
    const searchQuery = searchQueryParam || '';

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
        // Optional: If you want to search by total if a number is entered
        // const numericQuery = parseFloat(searchQuery);
        // if (!isNaN(numericQuery)) {
        //     whereClause.OR.push({ total: numericQuery }); 
        // }
    }

    try {
        const invoicesPromise = prisma.invoice.findMany({
            where: whereClause,
            include: {
                customer: true, // To get customerName
                _count: {
                    select: { items: true }, // To get itemCount
                },
            },
            orderBy: { createdAt: 'desc' },
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
                // AND: whereClause.AND ? [...whereClause.AND] : [],
            }
        });

        const [invoicesFromDB, totalInvoicesCount, totalOutstandingResult, paidThisMonthResult, overdueCountResult] = await Promise.all([
            invoicesPromise,
            totalInvoicesCountPromise,
            totalOutstandingPromise,
            paidThisMonthPromise,
            overdueCountPromise
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
            },
        };

    } catch (error) {
        console.error('Error fetching invoices data:', error);
        // It's good practice to return a consistent shape even on error
        return {
            invoices: [],
            totalPages: 0,
            currentPage: 1,
            statistics: { totalOutstanding: 0, paidThisMonth: 0, overdueCount: 0 },
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
        searchParams?.search as string | undefined
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