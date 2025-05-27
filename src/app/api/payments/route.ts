import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const paymentData = await request.json();

        // Validate payment data
        if (!paymentData.invoiceId || !paymentData.customerId || !paymentData.amount || !paymentData.paymentMethod) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Missing required payment information'
                },
                { status: 400 }
            );
        }

        // Validate the amount is positive
        if (paymentData.amount <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Payment amount must be greater than zero'
                },
                { status: 400 }
            );
        }

        // Create payment in database
        const payment = await prisma.payment.create({
            data: {
                invoiceId: paymentData.invoiceId,
                customerId: paymentData.customerId,
                amount: paymentData.amount,
                paymentMethod: paymentData.paymentMethod,
                referenceNumber: paymentData.referenceNumber || null,
            }
        });

        // Get the invoice information for reference
        const invoice = await prisma.invoice.findUnique({
            where: { id: paymentData.invoiceId },
            include: {
                payments: true
            }
        });

        // NOTE: We no longer automatically update the invoice status here
        // The invoice status will only be updated when a receipt is created
        // This ensures proper payment documentation before marking as paid

        return NextResponse.json(
            {
                success: true,
                message: 'Payment recorded successfully',
                data: payment
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error recording payment:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error recording payment',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Fetch all payments with related invoice and customer info
        const payments = await prisma.payment.findMany({
            include: {
                invoice: true,
                customer: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching payments',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 