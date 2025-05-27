import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all receipts with pagination and optional filtering
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        // Build the where condition for search
        const where = search ? {
            OR: [
                { receiptNumber: { contains: search, mode: 'insensitive' } },
                { payment: { referenceNumber: { contains: search, mode: 'insensitive' } } },
                { payment: { customer: { name: { contains: search, mode: 'insensitive' } } } }
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

        // Create receipt
        const receipt = await prisma.receipt.create({
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

        // Make sure the invoice is marked as paid
        await prisma.invoice.update({
            where: { id: existingPayment.invoiceId },
            data: { status: 'Paid' }
        });

        return NextResponse.json(receipt, { status: 201 });
    } catch (error) {
        console.error('Error creating receipt:', error);
        return NextResponse.json(
            { error: 'Failed to create receipt' },
            { status: 500 }
        );
    }
}