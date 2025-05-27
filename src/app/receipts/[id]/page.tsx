import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReceiptClientWrapper from '../components/ReceiptClientWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Receipt Details | MS Sports',
    description: 'View and edit receipt details'
};

async function getReceiptById(id: number) {
    try {
        const receipt = await prisma.receipt.findUnique({
            where: { id },
            include: {
                payment: {
                    include: {
                        customer: true,
                        invoice: {
                            include: {
                                items: {
                                    include: {
                                        product: true
                                    }
                                }
                            }
                        }
                    }
                },
                confirmedByUser: true
            }
        });

        return receipt;
    } catch (error) {
        console.error('Error fetching receipt:', error);
        return null;
    }
}

export default async function ReceiptPage({
    params
}: {
    params: { id: string };
}) {
    const id = parseInt(params.id);

    if (isNaN(id)) {
        return notFound();
    }

    const receipt = await getReceiptById(id);

    if (!receipt) {
        return notFound();
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <ReceiptClientWrapper receipt={receipt} />
        </div>
    );
} 