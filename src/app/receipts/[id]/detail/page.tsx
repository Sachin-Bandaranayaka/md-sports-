import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReceiptDetailWrapper from '@/app/receipts/components/ReceiptDetailWrapper';

interface PageProps {
    params: {
        id: string;
    };
}

export default async function ReceiptDetailPage({ params }: PageProps) {
    const receiptId = parseInt(params.id);

    if (isNaN(receiptId)) {
        notFound();
    }

    try {
        const receipt = await prisma.receipt.findUnique({
            where: {
                id: receiptId
            },
            include: {
                payment: {
                    include: {
                        invoice: {
                            include: {
                                items: true
                            }
                        },
                        customer: true,
                        account: true
                    }
                },
                confirmedByUser: true
            }
        });

        if (!receipt) {
            notFound();
        }

        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <ReceiptDetailWrapper receipt={receipt} />
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error fetching receipt:', error);
        notFound();
    }
}