import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/services/auditService';
import { verifyToken } from '@/lib/auth';

// Get a single receipt by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid receipt ID' },
                { status: 400 }
            );
        }

        const receipt = await prisma.receipt.findUnique({
            where: { id },
            include: {
                payment: {
                    include: {
                        customer: true,
                        invoice: true
                    }
                },
                confirmedByUser: true
            }
        });

        if (!receipt) {
            return NextResponse.json(
                { error: 'Receipt not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(receipt);
    } catch (error) {
        console.error('Error fetching receipt:', error);
        return NextResponse.json(
            { error: 'Failed to fetch receipt' },
            { status: 500 }
        );
    }
}

// Update a receipt
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid receipt ID' },
                { status: 400 }
            );
        }

        const receiptData = await request.json();

        // Check if receipt exists
        const existingReceipt = await prisma.receipt.findUnique({
            where: { id },
            include: { payment: true }
        });

        if (!existingReceipt) {
            return NextResponse.json(
                { error: 'Receipt not found' },
                { status: 404 }
            );
        }

        // Get user ID from token for audit logging
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        let userId: number = 1; // Default system user ID
        
        if (token) {
            try {
                const decoded = await verifyToken(token);
                if (decoded && typeof decoded.userId === 'number') {
                    userId = decoded.userId;
                }
            } catch (error) {
                console.warn('Invalid token for audit logging, using default user ID');
            }
        }

        // Update receipt
        const updatedReceipt = await prisma.receipt.update({
            where: { id },
            data: {
                receiptDate: receiptData.receiptDate ? new Date(receiptData.receiptDate) : undefined,
                bankName: receiptData.bankName !== undefined ? receiptData.bankName : undefined,
                accountNumber: receiptData.accountNumber !== undefined ? receiptData.accountNumber : undefined,
                chequeNumber: receiptData.chequeNumber !== undefined ? receiptData.chequeNumber : undefined,
                transactionId: receiptData.transactionId !== undefined ? receiptData.transactionId : undefined,
                notes: receiptData.notes !== undefined ? receiptData.notes : undefined,
                confirmedBy: receiptData.confirmedBy !== undefined ? receiptData.confirmedBy : undefined
            },
            include: {
                payment: {
                    include: {
                        customer: true,
                        invoice: true
                    }
                },
                confirmedByUser: true
            }
        });

        // Log the update to the audit trail
        await auditService.logAction({
            userId: userId.toString(),
            action: 'UPDATE',
            entity: 'Receipt',
            entityId: id,
            details: {
                receiptNumber: updatedReceipt.receiptNumber,
                originalData: existingReceipt,
                updatedFields: receiptData
            }
        });

        return NextResponse.json(updatedReceipt);
    } catch (error) {
        console.error('Error updating receipt:', error);
        return NextResponse.json(
            { error: 'Failed to update receipt' },
            { status: 500 }
        );
    }
}

// Delete a receipt
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid receipt ID' },
                { status: 400 }
            );
        }

        // Check if receipt exists
        const existingReceipt = await prisma.receipt.findUnique({
            where: { id },
            include: { payment: true }
        });

        if (!existingReceipt) {
            return NextResponse.json(
                { error: 'Receipt not found' },
                { status: 404 }
            );
        }

        // Get user ID from token for audit logging
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        let userId: number = 1; // Default system user ID
        
        if (token) {
            try {
                const decoded = await verifyToken(token);
                if (decoded && typeof decoded.userId === 'number') {
                    userId = decoded.userId;
                }
            } catch (error) {
                console.warn('Invalid token for audit logging, using default user ID');
            }
        }

        // Delete receipt and recalculate invoice status
        await prisma.$transaction(async (tx) => {
            // Find the related accounting transaction to reverse it
            const relatedTransaction = await tx.transaction.findFirst({
                where: {
                    reference: existingReceipt.receiptNumber,
                    type: 'income'
                },
                include: { account: true }
            });

            if (relatedTransaction) {
                // Reverse the account balance
                await tx.account.update({
                    where: { id: relatedTransaction.accountId },
                    data: {
                        balance: {
                            decrement: relatedTransaction.amount
                        }
                    }
                });

                // Delete the accounting transaction
                await tx.transaction.delete({
                    where: { id: relatedTransaction.id }
                });
            }

            // Delete the receipt
            await tx.receipt.delete({
                where: { id }
            });

            // Recalculate invoice status based on remaining payments with receipts
            // Only count payments that have receipts (confirmed payments)
            const totalPayments = await tx.payment.aggregate({
                where: { 
                    invoiceId: existingReceipt.payment.invoiceId,
                    receipt: {
                        isNot: null
                    }
                },
                _sum: { amount: true }
            });

            const totalPaid = totalPayments._sum.amount || 0;

            // Get invoice total
            const invoice = await tx.invoice.findUnique({
                where: { id: existingReceipt.payment.invoiceId },
                select: { total: true }
            });

            const invoiceTotal = invoice?.total || 0;

            // Determine the correct status based on remaining payment amount
            let newStatus = 'pending';
            if (totalPaid >= invoiceTotal) {
                newStatus = 'paid';
            } else if (totalPaid > 0) {
                newStatus = 'partial';
            }

            // Update invoice status based on remaining payments
            await tx.invoice.update({
                where: { id: existingReceipt.payment.invoiceId },
                data: { status: newStatus }
            });
        });

        // Log the deletion to the audit trail
        await auditService.softDelete(
            'Receipt',
            id,
            existingReceipt,
            userId.toString(),
            true // canRecover
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting receipt:', error);
        return NextResponse.json(
            { error: 'Failed to delete receipt' },
            { status: 500 }
        );
    }
}

// Update specific receipt fields (PATCH method for partial updates)
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid receipt ID' },
                { status: 400 }
            );
        }

        const { notes, paymentMethod, accountId } = await request.json();

        // Check if receipt exists
        const existingReceipt = await prisma.receipt.findUnique({
            where: { id },
            include: { 
                payment: {
                    include: {
                        account: true,
                        customer: true,
                        invoice: true
                    }
                }
            }
        });

        if (!existingReceipt) {
            return NextResponse.json(
                { success: false, message: 'Receipt not found' },
                { status: 404 }
            );
        }

        // Get user ID from token for audit logging
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        let userId: number = 1; // Default system user ID
        
        if (token) {
            try {
                const decoded = await verifyToken(token);
                if (decoded && typeof decoded.userId === 'number') {
                    userId = decoded.userId;
                }
            } catch (error) {
                console.warn('Invalid token for audit logging, using default user ID');
            }
        }

        // Perform updates in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update the receipt notes
            const updatedReceipt = await tx.receipt.update({
                where: { id },
                data: {
                    ...(notes !== undefined && { notes })
                }
            });

            // Update payment method and account if provided
            let updatedPayment = existingReceipt.payment;
            if (paymentMethod !== undefined || accountId !== undefined) {
                const paymentUpdateData: any = {};
                
                if (paymentMethod !== undefined) {
                    paymentUpdateData.paymentMethod = paymentMethod;
                }
                
                if (accountId !== undefined) {
                    // Validate the new account exists
                    const newAccount = await tx.account.findUnique({
                        where: { id: parseInt(accountId.toString()) }
                    });
                    
                    if (!newAccount) {
                        throw new Error('Selected account not found');
                    }
                    
                    paymentUpdateData.accountId = parseInt(accountId.toString());
                    
                    // If account is changing, we need to adjust balances
                    if (existingReceipt.payment.accountId !== parseInt(accountId.toString())) {
                        const paymentAmount = existingReceipt.payment.amount;
                        
                        // Remove amount from old account
                        if (existingReceipt.payment.accountId) {
                            await tx.account.update({
                                where: { id: existingReceipt.payment.accountId },
                                data: {
                                    balance: {
                                        decrement: paymentAmount
                                    }
                                }
                            });
                        }
                        
                        // Add amount to new account
                        await tx.account.update({
                            where: { id: parseInt(accountId.toString()) },
                            data: {
                                balance: {
                                    increment: paymentAmount
                                }
                            }
                        });
                        
                        // Update the accounting transaction
                        const whereClause: any = {
                            reference: existingReceipt.receiptNumber,
                            type: 'income'
                        };
                        
                        if (existingReceipt.payment.accountId !== null) {
                            whereClause.accountId = existingReceipt.payment.accountId;
                        }
                        
                        const relatedTransaction = await tx.transaction.findFirst({
                            where: whereClause
                        });
                        
                        if (relatedTransaction && existingReceipt.payment.customer && existingReceipt.payment.invoice) {
                            await tx.transaction.update({
                                where: { id: relatedTransaction.id },
                                data: {
                                    accountId: parseInt(accountId.toString()),
                                    description: `Payment received from ${existingReceipt.payment.customer.name} - Invoice ${existingReceipt.payment.invoice.invoiceNumber} (Account Updated)`
                                }
                            });
                        }
                    }
                }
                
                updatedPayment = await tx.payment.update({
                    where: { id: existingReceipt.paymentId },
                    data: paymentUpdateData,
                    include: {
                        account: true,
                        customer: true,
                        invoice: true
                    }
                });
            }

            // Log the update in audit trail
            await auditService.logAction({
                action: 'UPDATE',
                entity: 'Receipt',
                entityId: id,
                details: {
                    receiptNumber: existingReceipt.receiptNumber,
                    changes: {
                        notes: notes !== undefined ? { old: existingReceipt.notes, new: notes } : undefined,
                        paymentMethod: paymentMethod !== undefined ? { old: existingReceipt.payment.paymentMethod, new: paymentMethod } : undefined,
                        accountId: accountId !== undefined ? { 
                            old: existingReceipt.payment.accountId, 
                            new: parseInt(accountId),
                            oldAccountName: existingReceipt.payment.account?.name,
                            newAccountName: accountId !== undefined ? (await tx.account.findUnique({ where: { id: parseInt(accountId) } }))?.name : undefined
                        } : undefined
                    }
                },
                userId: userId.toString()
            });

            return {
                ...updatedReceipt,
                payment: updatedPayment
            };
        });

        // Fetch the complete updated receipt with all relations
        const completeReceipt = await prisma.receipt.findUnique({
            where: { id },
            include: {
                payment: {
                    include: {
                        customer: true,
                        invoice: true,
                        account: true
                    }
                },
                confirmedByUser: true
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Receipt updated successfully',
            data: completeReceipt
        });
    } catch (error) {
        console.error('Error updating receipt:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to update receipt' },
            { status: 500 }
        );
    }
}