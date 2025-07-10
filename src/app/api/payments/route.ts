import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
                accountId: paymentData.accountId || null,
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

// Update an existing payment and keep accounting in sync
export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const paymentId = searchParams.get('id');

        if (!paymentId) {
            return NextResponse.json(
                { success: false, message: 'Payment ID is required' },
                { status: 400 }
            );
        }

        const id = parseInt(paymentId);
        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid payment ID' },
                { status: 400 }
            );
        }

        const updateData = await request.json();

        // At minimum, one updatable field should be provided
        if (
            updateData.amount === undefined &&
            updateData.paymentMethod === undefined &&
            updateData.accountId === undefined &&
            updateData.referenceNumber === undefined
        ) {
            return NextResponse.json(
                { success: false, message: 'No valid fields provided to update' },
                { status: 400 }
            );
        }

        if (updateData.amount !== undefined && updateData.amount <= 0) {
            return NextResponse.json(
                { success: false, message: 'Amount must be greater than zero' },
                { status: 400 }
            );
        }

        // Fetch payment with relations
        const existingPayment = await prisma.payment.findUnique({
            where: { id },
            include: {
                receipt: true,
                customer: true,
                invoice: true
            }
        });

        if (!existingPayment) {
            return NextResponse.json(
                { success: false, message: 'Payment not found' },
                { status: 404 }
            );
        }

        // Normalize new values falling back to current values
        const newAmount: number = updateData.amount !== undefined ? parseFloat(updateData.amount) : existingPayment.amount;
        const newPaymentMethod: string = updateData.paymentMethod ?? existingPayment.paymentMethod;
        const newReference: string | null = updateData.referenceNumber ?? existingPayment.referenceNumber;
        const newAccountId: number | null = updateData.accountId !== undefined ? (updateData.accountId ? parseInt(updateData.accountId) : null) : existingPayment.accountId;

        // Perform updates in a DB transaction to keep everything consistent
        const result = await prisma.$transaction(async (tx) => {
            // If there is an associated receipt, we must also update the accounting transaction and balances
            if (existingPayment.receipt) {
                // Locate the related accounting transaction using the receipt number reference
                const relatedTxn = await tx.transaction.findFirst({
                    where: {
                        reference: existingPayment.receipt.receiptNumber,
                        type: 'income'
                    }
                });

                if (!relatedTxn) {
                    throw new Error('Related accounting transaction not found');
                }

                const oldAccountId = relatedTxn.accountId;
                const oldAmount = (relatedTxn.amount as unknown as Prisma.Decimal).toNumber ? (relatedTxn.amount as unknown as Prisma.Decimal).toNumber() : parseFloat(relatedTxn.amount as unknown as string);

                // Reverse the original balances
                await tx.account.update({
                    where: { id: oldAccountId },
                    data: { balance: { decrement: oldAmount } }
                });

                // If the account is changing, we handle the new account separately; otherwise we can re-use oldAccountId
                const appliedAccountId = newAccountId ?? oldAccountId;

                // Apply the new balance effect
                await tx.account.update({
                    where: { id: appliedAccountId },
                    data: { balance: { increment: newAmount } }
                });

                // Update the accounting transaction record
                await tx.transaction.update({
                    where: { id: relatedTxn.id },
                    data: {
                        accountId: appliedAccountId,
                        amount: new Prisma.Decimal(newAmount),
                        description: `Payment received from ${existingPayment.customer?.name ?? 'Customer'} - Invoice ${existingPayment.invoice.invoiceNumber}`
                    }
                });
            }

            // Update the payment record itself
            const updatedPayment = await tx.payment.update({
                where: { id },
                data: {
                    amount: newAmount,
                    paymentMethod: newPaymentMethod,
                    referenceNumber: newReference,
                    accountId: newAccountId
                },
                include: {
                    receipt: true,
                    account: true,
                    customer: true,
                    invoice: true
                }
            });

            // If payment has a receipt, recalculate invoice status
            if (updatedPayment.receipt) {
                const aggregate = await tx.payment.aggregate({
                    where: {
                        invoiceId: updatedPayment.invoiceId,
                        receipt: {
                            isNot: null
                        }
                    },
                    _sum: { amount: true }
                });

                const invoiceInfo = await tx.invoice.findUnique({
                    where: { id: updatedPayment.invoiceId },
                    select: { total: true }
                });

                const paid = aggregate._sum.amount || 0;
                const invoiceTotal = invoiceInfo?.total || 0;
                let newStatus: string = 'pending';
                if (paid >= invoiceTotal) newStatus = 'paid';
                else if (paid > 0) newStatus = 'partial';

                await tx.invoice.update({
                    where: { id: updatedPayment.invoiceId },
                    data: { status: newStatus }
                });
            }

            return updatedPayment;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Error updating payment:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error updating payment',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Fetch all payments with related invoice, customer, and account info
        const payments = await prisma.payment.findMany({
            include: {
                invoice: true,
                customer: true,
                account: true
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