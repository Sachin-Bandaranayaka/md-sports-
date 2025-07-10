import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import ReceiptsClientWrapper from './components/ReceiptsClientWrapper';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Prisma } from '@prisma/client';

// Simple loading component
function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="ml-3 text-lg text-gray-600">Loading receipts...</p>
        </div>
    );
}

export const metadata: Metadata = {
    title: 'Receipts | MS Sports',
    description: 'View and manage all payment receipts'
};

async function getReceipts(page = 1, limit = 10, search = '') {
    try {

        // Build search filter once
        const searchFilter: Prisma.ReceiptWhereInput = search ? {
            OR: [
                { receiptNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { payment: { referenceNumber: { contains: search, mode: Prisma.QueryMode.insensitive } } },
                { payment: { customer: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
                { payment: { invoice: { invoiceNumber: { contains: search, mode: Prisma.QueryMode.insensitive } } } }
            ]
        } : {};

        // Fetch list & count concurrently to reduce total latency
        const [receipts, totalReceipts] = await prisma.$transaction([
            prisma.receipt.findMany({
                where: searchFilter,
                include: {
                    payment: {
                        include: {
                            customer: true,
                            invoice: true,
                            account: true
                        }
                    },
                    confirmedByUser: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.receipt.count({ where: searchFilter })
        ]) as [any[], number];

        // Convert receiptDate from Date to string to match the Receipt interface
        const formattedReceipts = receipts.map(receipt => ({
            ...receipt,
            receiptDate: receipt.receiptDate.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
            payment: {
                ...receipt.payment,
                // Limit nested objects to only the fields required by the client component
                customer: {
                    id: receipt.payment.customer?.id ?? 0,
                    name: receipt.payment.customer?.name ?? 'Unknown'
                },
                invoice: {
                    id: receipt.payment.invoice.id,
                    invoiceNumber: receipt.payment.invoice.invoiceNumber
                },
                account: receipt.payment?.account
                    ? {
                          id: receipt.payment.account.id,
                          name: receipt.payment.account.name
                      }
                    : null
            }
        }));

        return {
            receipts: formattedReceipts,
            totalReceipts,
            totalPages: Math.ceil(totalReceipts / limit),
            currentPage: page
        };
    } catch (error) {
        console.error('Error fetching receipts:', error);
        return {
            receipts: [],
            totalPages: 0,
            currentPage: 1
        };
    }
}

export default async function ReceiptsPage({
    searchParams
}: {
    searchParams?: { page?: string; search?: string };
}) {
    const page = searchParams?.page ? parseInt(searchParams.page) : 1;
    const search = searchParams?.search || '';
    const { receipts, totalPages, currentPage } = await getReceipts(page, 10, search);

    return (
        <MainLayout>
            <div>
                <h1 className="text-2xl font-bold text-black mb-6">Payment Receipts</h1>

                <Suspense fallback={<LoadingSpinner />}>
                    <ReceiptsClientWrapper
                        initialReceipts={receipts as any}
                        initialTotalPages={totalPages}
                        initialCurrentPage={currentPage}
                        initialSearch={search}
                    />
                </Suspense>
            </div>
        </MainLayout>
    );
}