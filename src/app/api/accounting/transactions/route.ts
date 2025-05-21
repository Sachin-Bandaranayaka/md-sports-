import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all transactions
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const accountId = searchParams.get('accountId');
        const id = searchParams.get('id');

        // Build filter conditions
        const where: any = {};

        if (type) {
            where.type = type;
        }

        if (accountId) {
            where.accountId = parseInt(accountId, 10);
        }

        if (id) {
            // If ID is provided, fetch a single transaction
            const transaction = await prisma.transaction.findUnique({
                where: { id: parseInt(id, 10) },
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

            if (!transaction) {
                return NextResponse.json({
                    success: false,
                    message: 'Transaction not found'
                }, { status: 404 });
            }

            // Format the response
            const formattedTransaction = {
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
            };

            return NextResponse.json({
                success: true,
                data: formattedTransaction
            });
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

// DELETE: Delete a transaction
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({
                success: false,
                message: 'Transaction ID is required'
            }, { status: 400 });
        }

        // Get the transaction details first to reverse the account balance changes
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                account: true,
                toAccount: true
            }
        });

        if (!transaction) {
            return NextResponse.json({
                success: false,
                message: 'Transaction not found'
            }, { status: 404 });
        }

        // Start a transaction to ensure data consistency
        await prisma.$transaction(async (tx) => {
            // Reverse the account balance changes based on transaction type
            if (transaction.type === 'income') {
                await tx.account.update({
                    where: { id: transaction.accountId },
                    data: {
                        balance: {
                            decrement: transaction.amount
                        }
                    }
                });
            } else if (transaction.type === 'expense' || transaction.type === 'withdrawal') {
                await tx.account.update({
                    where: { id: transaction.accountId },
                    data: {
                        balance: {
                            increment: transaction.amount
                        }
                    }
                });
            } else if (transaction.type === 'transfer' && transaction.toAccountId) {
                // For transfers, increase from account and decrease to account
                await tx.account.update({
                    where: { id: transaction.accountId },
                    data: {
                        balance: {
                            increment: transaction.amount
                        }
                    }
                });

                await tx.account.update({
                    where: { id: transaction.toAccountId },
                    data: {
                        balance: {
                            decrement: transaction.amount
                        }
                    }
                });
            }

            // Delete the transaction
            await tx.transaction.delete({
                where: { id: parseInt(id, 10) }
            });
        });

        return NextResponse.json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({
            success: false,
            message: 'Error deleting transaction',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// PATCH: Update a transaction
export async function PATCH(request: Request) {
    try {
        const { id, date, description, accountId, toAccountId, type, amount, reference, category } = await request.json();

        // Validate required fields
        if (!id || !date || !description || !accountId || !type || !amount || !category) {
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

        // Get the original transaction to calculate balance adjustments
        const originalTransaction = await prisma.transaction.findUnique({
            where: { id: parseInt(id, 10) }
        });

        if (!originalTransaction) {
            return NextResponse.json({
                success: false,
                message: 'Transaction not found'
            }, { status: 404 });
        }

        // Start a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // First, reverse the original transaction's effect on account balances
            if (originalTransaction.type === 'income') {
                await tx.account.update({
                    where: { id: originalTransaction.accountId },
                    data: {
                        balance: {
                            decrement: originalTransaction.amount
                        }
                    }
                });
            } else if (originalTransaction.type === 'expense' || originalTransaction.type === 'withdrawal') {
                await tx.account.update({
                    where: { id: originalTransaction.accountId },
                    data: {
                        balance: {
                            increment: originalTransaction.amount
                        }
                    }
                });
            } else if (originalTransaction.type === 'transfer' && originalTransaction.toAccountId) {
                // For transfers, increase from account and decrease to account
                await tx.account.update({
                    where: { id: originalTransaction.accountId },
                    data: {
                        balance: {
                            increment: originalTransaction.amount
                        }
                    }
                });

                await tx.account.update({
                    where: { id: originalTransaction.toAccountId },
                    data: {
                        balance: {
                            decrement: originalTransaction.amount
                        }
                    }
                });
            }

            // Update the transaction
            const updatedTransaction = await tx.transaction.update({
                where: { id: parseInt(id, 10) },
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

            // Now apply the new transaction's effect on account balances
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
                ...updatedTransaction,
                accountName: updatedTransaction.account.name,
                toAccountName: updatedTransaction.toAccount?.name
            };
        });

        return NextResponse.json({
            success: true,
            message: 'Transaction updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json({
            success: false,
            message: 'Error updating transaction',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 