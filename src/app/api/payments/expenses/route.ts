import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const paymentData = await request.json();

        // Validate payment data for expense payments
        if (!paymentData.amount || !paymentData.paymentMethod || !paymentData.expenseAccountId || !paymentData.fromAccountId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Missing required payment information. Amount, payment method, expense account, and source account are required.'
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

        // Convert string IDs to integers
        const expenseAccountId = parseInt(paymentData.expenseAccountId);
        const fromAccountId = parseInt(paymentData.fromAccountId);

        // Validate that IDs are valid integers
        if (isNaN(expenseAccountId) || isNaN(fromAccountId)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid account IDs provided'
                },
                { status: 400 }
            );
        }

        // Validate that both accounts exist and are active
        const [expenseAccount, fromAccount] = await Promise.all([
            prisma.account.findUnique({
                where: { id: expenseAccountId, isActive: true }
            }),
            prisma.account.findUnique({
                where: { id: fromAccountId, isActive: true }
            })
        ]);

        if (!expenseAccount) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Expense account not found or inactive'
                },
                { status: 400 }
            );
        }

        if (!fromAccount) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Source account not found or inactive'
                },
                { status: 400 }
            );
        }

        // Create the expense payment transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the expense transaction (debit to expense account)
            const expenseTransaction = await tx.transaction.create({
                data: {
                    date: new Date(),
                    description: paymentData.description || `Expense payment - ${expenseAccount.name}`,
                    accountId: expenseAccountId,
                    toAccountId: fromAccountId,
                    type: 'expense',
                    amount: paymentData.amount,
                    reference: paymentData.referenceNumber || null,
                    category: 'expense_payment'
                }
            });

            // Update account balances
            // Increase expense account balance (debit)
            await tx.account.update({
                where: { id: expenseAccountId },
                data: {
                    balance: {
                        increment: paymentData.amount
                    }
                }
            });

            // Decrease source account balance (credit)
            await tx.account.update({
                where: { id: fromAccountId },
                data: {
                    balance: {
                        decrement: paymentData.amount
                    }
                }
            });

            return expenseTransaction;
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Expense payment recorded successfully',
                data: result
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error recording expense payment:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error recording expense payment',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Fetch all expense transactions
        const expensePayments = await prisma.transaction.findMany({
            where: {
                type: 'expense',
                category: 'expense_payment'
            },
            include: {
                account: true,
                toAccount: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(expensePayments);
    } catch (error) {
        console.error('Error fetching expense payments:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching expense payments',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}