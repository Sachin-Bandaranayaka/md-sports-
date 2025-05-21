import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all transactions
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const accountId = searchParams.get('accountId');

        // Build filter conditions
        const where: any = {};

        if (type) {
            where.type = type;
        }

        if (accountId) {
            where.accountId = parseInt(accountId, 10);
        }

        // Get transactions with account names
        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: {
                date: 'desc'
            },
            include: {
                account: {
                    select: {
                        name: true
                    }
                },
                toAccount: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Format the response
        const formattedTransactions = transactions.map(transaction => ({
            id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            accountId: transaction.accountId,
            accountName: transaction.account.name,
            toAccountId: transaction.toAccountId,
            toAccountName: transaction.toAccount?.name,
            type: transaction.type,
            amount: transaction.amount,
            reference: transaction.reference,
            category: transaction.category,
            createdAt: transaction.createdAt
        }));

        return NextResponse.json({
            success: true,
            data: formattedTransactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching transactions',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// POST: Create a new transaction
export async function POST(request: Request) {
    try {
        const { date, description, accountId, toAccountId, type, amount, reference, category } = await request.json();

        // Validate required fields
        if (!date || !description || !accountId || !type || !amount || !category) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields'
            }, { status: 400 });
        }

        // Validate transaction type
        const validTypes = ['income', 'expense', 'withdrawal', 'transfer'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({
                success: false,
                message: `Transaction type must be one of: ${validTypes.join(', ')}`
            }, { status: 400 });
        }

        // For transfers, toAccountId is required
        if (type === 'transfer' && !toAccountId) {
            return NextResponse.json({
                success: false,
                message: 'Destination account is required for transfers'
            }, { status: 400 });
        }

        // Start a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Create the transaction
            const newTransaction = await tx.transaction.create({
                data: {
                    date: new Date(date),
                    description,
                    accountId: parseInt(accountId, 10),
                    toAccountId: toAccountId ? parseInt(toAccountId, 10) : null,
                    type,
                    amount: parseFloat(amount),
                    reference,
                    category
                },
                include: {
                    account: {
                        select: {
                            name: true
                        }
                    },
                    toAccount: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            // Update account balances based on transaction type
            if (type === 'income') {
                await tx.account.update({
                    where: { id: parseInt(accountId, 10) },
                    data: {
                        balance: {
                            increment: parseFloat(amount)
                        }
                    }
                });
            } else if (type === 'expense' || type === 'withdrawal') {
                await tx.account.update({
                    where: { id: parseInt(accountId, 10) },
                    data: {
                        balance: {
                            decrement: parseFloat(amount)
                        }
                    }
                });
            } else if (type === 'transfer' && toAccountId) {
                // For transfers, decrease from account and increase to account
                await tx.account.update({
                    where: { id: parseInt(accountId, 10) },
                    data: {
                        balance: {
                            decrement: parseFloat(amount)
                        }
                    }
                });

                await tx.account.update({
                    where: { id: parseInt(toAccountId, 10) },
                    data: {
                        balance: {
                            increment: parseFloat(amount)
                        }
                    }
                });
            }

            return {
                ...newTransaction,
                accountName: newTransaction.account.name,
                toAccountName: newTransaction.toAccount?.name
            };
        });

        return NextResponse.json({
            success: true,
            message: 'Transaction created successfully',
            data: result
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating transaction',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 