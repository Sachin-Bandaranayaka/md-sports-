import MainLayout from '@/components/layout/MainLayout';
import { prisma } from '@/lib/prisma';
import InvoiceClientWrapper from './components/InvoiceClientWrapper';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

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
        const numericQuery = parseFloat(searchQuery);
        if (!isNaN(numericQuery)) {
            // If you want to search by total if a number is entered
            // whereClause.OR.push({ total: numericQuery }); 
        }
    }

    try {
        const invoicesFromDB = await prisma.invoice.findMany({
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

        const totalInvoicesCount = await prisma.invoice.count({ where: whereClause });

        const formattedInvoices: Invoice[] = invoicesFromDB.map(inv => {
            const createdDate = new Date(inv.createdAt);
            const dueDate = new Date(createdDate);
            dueDate.setDate(dueDate.getDate() + 30);

            return {
                ...inv,
                id: inv.id.toString(), // Ensure ID is string
                customerName: inv.customer?.name || 'Unknown Customer',
                itemCount: inv._count?.items || 0,
                date: createdDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
            };
        });

        // Calculate statistics
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // For stats, we might need to query without pagination but with filters
        const allFilteredInvoicesForStats = await prisma.invoice.findMany({
            where: whereClause, // Apply same filters as the main list for consistency in stats
            select: { total: true, status: true, updatedAt: true }
        });

        let totalOutstanding = 0;
        let paidThisMonth = 0;
        let overdueCount = 0;

        allFilteredInvoicesForStats.forEach(inv => {
            if (inv.status !== 'Paid' && inv.status !== 'Cancelled') { // Consider what non-paid means for outstanding
                totalOutstanding += inv.total;
            }
            if (inv.status === 'Paid' && new Date(inv.updatedAt) >= firstDayOfMonth) {
                paidThisMonth += inv.total;
            }
            if (inv.status === 'Overdue') { // Ensure 'Overdue' is a valid status you set
                overdueCount++;
            }
        });

        return {
            invoices: formattedInvoices,
            totalPages: Math.ceil(totalInvoicesCount / ITEMS_PER_PAGE),
            currentPage: page,
            statistics: {
                totalOutstanding,
                paidThisMonth,
                overdueCount,
            },
        };

    } catch (error) {
        console.error('Error fetching invoices data:', error);
        return {
            invoices: [],
            totalPages: 0,
            currentPage: 1,
            statistics: { totalOutstanding: 0, paidThisMonth: 0, overdueCount: 0 },
            error: 'Failed to fetch invoices',
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