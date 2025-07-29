import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, extractToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { AuditService } from '@/services/auditService';

// Get all receipts with pagination and optional filtering
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        // Build the where condition for search
        const where: Prisma.ReceiptWhereInput = search ? {
            OR: [
                { receiptNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { payment: { referenceNumber: { contains: search, mode: Prisma.QueryMode.insensitive } } },
                { payment: { customer: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } }
            ]
        } : {};

        // Get receipts with pagination
        const receipts = await prisma.receipt.findMany({
            where,
            include: {
                payment: {
                    include: {
                        customer: true,
                        invoice: true
                    }
                },
                confirmedByUser: true
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        // Get total count for pagination
        const totalReceipts = await prisma.receipt.count({ where });
        const totalPages = Math.ceil(totalReceipts / limit);

        return NextResponse.json({
            receipts,
            pagination: {
                totalReceipts,
                totalPages,
                currentPage: page,
                perPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching receipts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch receipts' },
            { status: 500 }
        );
    }
}

// Create a new receipt
export async function POST(request: Request) {
    try {
        const receiptData = await request.json();

        // Validate receipt data
        if (!receiptData.paymentId) {
            return NextResponse.json(
                { error: 'Payment ID is required' },
                { status: 400 }
            );
        }

        // Check if payment exists and doesn't already have a receipt
        const existingPayment = await prisma.payment.findUnique({
            where: { id: receiptData.paymentId },
            include: { receipt: true }
        });

        if (!existingPayment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        if (existingPayment.receipt) {
            return NextResponse.json(
                { error: 'A receipt already exists for this payment' },
                { status: 409 }
            );
        }

        // Generate a unique receipt number
        const receiptNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Use a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Create receipt
            const receipt = await tx.receipt.create({
                data: {
                    paymentId: receiptData.paymentId,
                    receiptNumber,
                    receiptDate: receiptData.receiptDate ? new Date(receiptData.receiptDate) : new Date(),
                    bankName: receiptData.bankName || null,
                    accountNumber: receiptData.accountNumber || null,
                    chequeNumber: receiptData.chequeNumber || null,
                    transactionId: receiptData.transactionId || null,
                    notes: receiptData.notes || null,
                    confirmedBy: receiptData.confirmedBy || null
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

            // Calculate total payments with receipts for the invoice to determine correct status
            // Only count payments that have receipts (confirmed payments)
            const totalPayments = await tx.payment.aggregate({
                where: { 
                    invoiceId: existingPayment.invoiceId,
                    receipt: {
                        isNot: null
                    }
                },
                _sum: { amount: true }
            });

            const invoice = await tx.invoice.findUnique({
                where: { id: existingPayment.invoiceId },
                select: { total: true }
            });

            const totalPaid = totalPayments._sum.amount || 0;
            const invoiceTotal = invoice?.total || 0;

            // Determine the correct status based on payment amount
            let newStatus = 'pending';
            if (totalPaid >= invoiceTotal) {
                newStatus = 'paid';
            } else if (totalPaid > 0) {
                newStatus = 'partial';
            }

            // Update invoice status based on actual payment amount
            await tx.invoice.update({
                where: { id: existingPayment.invoiceId },
                data: { status: newStatus }
            });

            // Use the selected account from the payment, or fallback to payment method logic
            let account;
            
            if (existingPayment.accountId) {
                // Use the account selected during payment creation
                account = await tx.account.findUnique({
                    where: { id: existingPayment.accountId }
                });
                
                if (!account) {
                    throw new Error('Selected payment account not found');
                }
            } else {
                // Fallback to old logic for payments without selected accounts
                const paymentMethod = existingPayment.paymentMethod.toLowerCase();
                let accountName = '';
                let accountType = 'asset';

                if (paymentMethod.includes('cash')) {
                    accountName = 'Cash in Hand';
                } else {
                    // For all non-cash payments, default to Cash in Bank
                    accountName = 'Cash in Bank';
                }

                // Find or create the appropriate account
                account = await tx.account.findFirst({
                    where: {
                        name: accountName,
                        type: accountType
                    }
                });

                if (!account) {
                    // Create the account if it doesn't exist
                    account = await tx.account.create({
                        data: {
                            name: accountName,
                            type: accountType,
                            balance: 0,
                            description: `Auto-created account for ${paymentMethod} payments`,
                            isActive: true
                        }
                    });
                }
            }

            // Create accounting transaction for the income
            await tx.transaction.create({
                data: {
                    date: receiptData.receiptDate ? new Date(receiptData.receiptDate) : new Date(),
                    description: `Payment received from ${receipt.payment.customer.name} - Invoice ${receipt.payment.invoice.invoiceNumber}`,
                    accountId: account.id,
                    type: 'income',
                    amount: existingPayment.amount,
                    reference: receiptNumber,
                    category: 'Sales Revenue'
                }
            });

            // Update account balance
            await tx.account.update({
                where: { id: account.id },
                data: {
                    balance: {
                        increment: existingPayment.amount
                    }
                }
            });

            return receipt;
        });

        // Log audit action
            const auditService = AuditService.getInstance();
            await auditService.logAction({
                userId: receiptData.confirmedBy,
                action: 'CREATE',
                entity: 'Receipt',
                entityId: result.id,
                details: {
                    receiptNumber: result.receiptNumber,
                    paymentId: result.paymentId,
                    amount: existingPayment.amount,
                    paymentMethod: existingPayment.paymentMethod,
                    accountId: existingPayment.accountId
                }
            });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating receipt:', error);
        return NextResponse.json(
            { error: 'Failed to create receipt' },
            { status: 500 }
        );
    }
}