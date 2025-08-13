import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        // Identify credit customers (e.g., creditLimit > 0)
        // You might need to adjust this logic based on your definition of a credit customer
        const creditCustomers = await prisma.customer.findMany({
            where: {
                creditLimit: {
                    gt: 0,
                },
                isDeleted: false,
                // OR use another field like customerType: 'Credit' if applicable
            },
            select: {
                id: true,
            },
        });

        if (creditCustomers.length === 0) {
            return NextResponse.json({
                success: true,
                details: [],
                summary: { totalPayments: 0, numberOfPayments: 0 },
                generatedAt: new Date().toISOString(),
                message: 'No credit customers found.'
            });
        }

        const customerIds = creditCustomers.map(c => c.id);

        const payments = await prisma.payment.findMany({
            where: {
                customerId: {
                    in: customerIds,
                },
            },
            include: {
                customer: true, // To get customer name
                invoice: true,   // To get invoice number
            },
            orderBy: [
                { customer: { name: 'asc' } },
                { createdAt: 'desc' },
            ],
        });

        const reportData = payments.map(payment => ({
            paymentId: payment.id,
            customerName: payment.customer.name,
            paymentDate: payment.createdAt,
            paymentAmount: payment.amount,
            paymentMethod: payment.paymentMethod,
            referenceNumber: payment.referenceNumber,
            invoiceNumber: payment.invoice?.invoiceNumber || 'N/A',
            // Consider adding invoiceId if needed for linking: payment.invoiceId
        }));

        const totalPaymentAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

        return NextResponse.json({
            success: true,
            details: reportData,
            summary: {
                totalPaymentsAmount: totalPaymentAmount,
                numberOfPayments: payments.length,
                numberOfCreditCustomersWithPayments: new Set(payments.map(p => p.customerId)).size
            },
            generatedAt: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('Error fetching customer payment history:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch customer payment history', error: error.message },
            { status: 500 }
        );
    }
}