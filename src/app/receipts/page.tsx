import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import ReceiptsClientWrapper from './components/ReceiptsClientWrapper';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

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
        // Get receipts with pagination
        const receipts = await prisma.receipt.findMany({
            where: search ? {
                OR: [
                    { receiptNumber: { contains: search, mode: 'insensitive' } },
                    { payment: { referenceNumber: { contains: search, mode: 'insensitive' } } },
                    { payment: { customer: { name: { contains: search, mode: 'insensitive' } } } }
                ]
            } : {},
            include: {
                payment: {
                    include: {
                        customer: true,
                        invoice: true
                    }
                },
                confirmedByUser: true
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });

        // Get total count for pagination
        const totalReceipts = await prisma.receipt.count({
            where: search ? {
                OR: [
                    { receiptNumber: { contains: search, mode: 'insensitive' } },
                    { payment: { referenceNumber: { contains: search, mode: 'insensitive' } } },
                    { payment: { customer: { name: { contains: search, mode: 'insensitive' } } } }
                ]
            } : {}
        });

        // Convert receiptDate from Date to string to match the Receipt interface
        const formattedReceipts = receipts.map(receipt => ({
            ...receipt,
            receiptDate: receipt.receiptDate.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
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
                        initialReceipts={receipts}
                        initialTotalPages={totalPages}
                        initialCurrentPage={currentPage}
                        initialSearch={search}
                    />
                </Suspense>
            </div>
        </MainLayout>
    );
}