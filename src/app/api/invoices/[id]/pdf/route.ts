import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        // Fetch invoice with all related data
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                },
                payments: true
            }
        });

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        // Return the invoice data for client-side PDF generation
        // This way we avoid server-side PDF generation which can be complex with Next.js API routes
        return NextResponse.json(invoice);
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error generating invoice PDF',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}