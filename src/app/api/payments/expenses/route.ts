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

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('id');

        if (!transactionId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Transaction ID is required'
                },
                { status: 400 }
            );
        }

        const id = parseInt(transactionId);
        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid transaction ID'
                },
                { status: 400 }
            );
        }

        // Find the transaction to delete
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                account: true,
                toAccount: true
            }
        });

        if (!transaction) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Transaction not found'
                },
                { status: 404 }
            );
        }

        if (transaction.type !== 'expense' || transaction.category !== 'expense_payment') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid transaction type for expense payment deletion'
                },
                { status: 400 }
            );
        }

        // Reverse the transaction within a database transaction
        await prisma.$transaction(async (tx) => {
            // Reverse the account balance changes
            // Decrease expense account balance (reverse the debit)
            await tx.account.update({
                where: { id: transaction.accountId },
                data: {
                    balance: {
                        decrement: transaction.amount
                    }
                }
            });

            // Increase source account balance (reverse the credit)
            if (transaction.toAccountId) {
                await tx.account.update({
                    where: { id: transaction.toAccountId },
                    data: {
                        balance: {
                            increment: transaction.amount
                        }
                    }
                });
            }

            // Delete the transaction
            await tx.transaction.delete({
                where: { id }
            });
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Expense payment deleted successfully'
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting expense payment:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error deleting expense payment',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('id');
        const updateData = await request.json();

        if (!transactionId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Transaction ID is required'
                },
                { status: 400 }
            );
        }

        const id = parseInt(transactionId);
        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid transaction ID'
                },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!updateData.amount || !updateData.expenseAccountId || !updateData.fromAccountId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Missing required fields: amount, expenseAccountId, and fromAccountId are required'
                },
                { status: 400 }
            );
        }

        // Validate amount is positive
        if (updateData.amount <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Amount must be greater than zero'
                },
                { status: 400 }
            );
        }

        // Find the existing transaction
        const existingTransaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                account: true,
                toAccount: true
            }
        });

        if (!existingTransaction) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Transaction not found'
                },
                { status: 404 }
            );
        }

        if (existingTransaction.type !== 'expense' || existingTransaction.category !== 'expense_payment') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid transaction type for expense payment update'
                },
                { status: 400 }
            );
        }

        // Convert string IDs to integers
        const newExpenseAccountId = parseInt(updateData.expenseAccountId);
        const newFromAccountId = parseInt(updateData.fromAccountId);

        if (isNaN(newExpenseAccountId) || isNaN(newFromAccountId)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid account IDs provided'
                },
                { status: 400 }
            );
        }

        // Validate that new accounts exist and are active
        const [newExpenseAccount, newFromAccount] = await Promise.all([
            prisma.account.findUnique({
                where: { id: newExpenseAccountId, isActive: true }
            }),
            prisma.account.findUnique({
                where: { id: newFromAccountId, isActive: true }
            })
        ]);

        if (!newExpenseAccount) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'New expense account not found or inactive'
                },
                { status: 400 }
            );
        }

        if (!newFromAccount) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'New source account not found or inactive'
                },
                { status: 400 }
            );
        }

        // Update the transaction within a database transaction
        const result = await prisma.$transaction(async (tx) => {
            // First, reverse the original transaction's balance effects
            // Decrease original expense account balance
            await tx.account.update({
                where: { id: existingTransaction.accountId },
                data: {
                    balance: {
                        decrement: existingTransaction.amount
                    }
                }
            });

            // Increase original source account balance
            if (existingTransaction.toAccountId) {
                await tx.account.update({
                    where: { id: existingTransaction.toAccountId },
                    data: {
                        balance: {
                            increment: existingTransaction.amount
                        }
                    }
                });
            }

            // Now apply the new transaction's balance effects
            // Increase new expense account balance
            await tx.account.update({
                where: { id: newExpenseAccountId },
                data: {
                    balance: {
                        increment: updateData.amount
                    }
                }
            });

            // Decrease new source account balance
            await tx.account.update({
                where: { id: newFromAccountId },
                data: {
                    balance: {
                        decrement: updateData.amount
                    }
                }
            });

            // Update the transaction record
            const updatedTransaction = await tx.transaction.update({
                where: { id },
                data: {
                    amount: updateData.amount,
                    description: updateData.description || existingTransaction.description,
                    accountId: newExpenseAccountId,
                    toAccountId: newFromAccountId,
                    reference: updateData.referenceNumber || existingTransaction.reference
                },
                include: {
                    account: true,
                    toAccount: true
                }
            });

            return updatedTransaction;
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Expense payment updated successfully',
                data: result
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating expense payment:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error updating expense payment',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}