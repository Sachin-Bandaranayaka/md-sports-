import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const direction = searchParams.get('direction') || 'desc';

    try {
        // Build where clause based on search parameters
        let whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { receiptNumber: { contains: search, mode: 'insensitive' } },
                { payment: { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } } },
                { payment: { customer: { name: { contains: search, mode: 'insensitive' } } } },
            ];
        }

        // Add date filters
        if (dateFrom || dateTo) {
            whereClause.receiptDate = {};

            if (dateFrom) {
                whereClause.receiptDate.gte = new Date(dateFrom);
            }

            if (dateTo) {
                // Set the time to end of day for the "to" date
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                whereClause.receiptDate.lte = toDate;
            }
        }

        // Determine sorting
        let orderBy: any = {};

        // Handle nested sorts
        if (sort.includes('.')) {
            const [parentField, childField] = sort.split('.');
            orderBy[parentField] = { [childField]: direction };
        } else {
            orderBy[sort] = direction;
        }

        // Fetch receipts with pagination
        const receipts = await prisma.receipt.findMany({
            where: whereClause,
            include: {
                payment: {
                    include: {
                        customer: {
                            select: { name: true }
                        },
                        invoice: {
                            select: { invoiceNumber: true }
                        }
                    }
                },
                confirmedByUser: {
                    select: { name: true }
                }
            },
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        });

        // Get total count for pagination
        const totalReceipts = await prisma.receipt.count({ where: whereClause });

        return NextResponse.json({
            receipts,
            totalPages: Math.ceil(totalReceipts / limit),
            currentPage: page,
            totalReceipts
        });
    } catch (error) {
        console.error('Error fetching receipts:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching receipts',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await request.json();

        // Validate required fields
        if (!data.paymentId || !data.receiptNumber || !data.receiptDate) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if payment exists
        const payment = await prisma.payment.findUnique({
            where: { id: data.paymentId },
            include: { invoice: true }
        });

        if (!payment) {
            return NextResponse.json(
                { success: false, message: 'Payment not found' },
                { status: 404 }
            );
        }

        // Check if receipt number is unique
        const existingReceipt = await prisma.receipt.findUnique({
            where: { receiptNumber: data.receiptNumber }
        });

        if (existingReceipt) {
            return NextResponse.json(
                { success: false, message: 'Receipt number already exists' },
                { status: 400 }
            );
        }

        // Create receipt and update invoice status in a transaction
        const receipt = await prisma.$transaction(async (tx) => {
            // Create the receipt
            const newReceipt = await tx.receipt.create({
                data: {
                    paymentId: data.paymentId,
                    receiptNumber: data.receiptNumber,
                    receiptDate: new Date(data.receiptDate),
                    bankName: data.bankName || null,
                    accountNumber: data.accountNumber || null,
                    chequeNumber: data.chequeNumber || null,
                    transactionId: data.transactionId || null,
                    notes: data.notes || null,
                    confirmedBy: session.user.id || null,
                }
            });

            // Update invoice status to Paid
            await tx.invoice.update({
                where: { id: payment.invoiceId },
                data: { status: 'Paid' }
            });

            return newReceipt;
        });

        return NextResponse.json({
            success: true,
            message: 'Receipt created successfully',
            data: receipt
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating receipt:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error creating receipt',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 