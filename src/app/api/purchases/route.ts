import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/purchases - Get all purchase invoices
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const supplierId = searchParams.get('supplierId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build the where clause for Prisma
        const whereClause: any = {};

        if (search) {
            whereClause.invoiceNumber = {
                contains: search,
                mode: 'insensitive'
            };
        }

        if (status) {
            whereClause.status = status;
        }

        if (supplierId) {
            whereClause.supplierId = parseInt(supplierId);
        }

        if (startDate && endDate) {
            whereClause.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (startDate) {
            whereClause.createdAt = {
                gte: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.createdAt = {
                lte: new Date(endDate)
            };
        }

        const purchases = await prisma.purchaseInvoice.findMany({
            where: whereClause,
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(purchases);
    } catch (error) {
        console.error('Error fetching purchase invoices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch purchase invoices' },
            { status: 500 }
        );
    }
}

// POST /api/purchases - Create a new purchase invoice
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Generate an invoice number if not provided
        if (!body.invoiceNumber) {
            body.invoiceNumber = `PI${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        }

        // Extract items from the request
        const { items, ...invoiceData } = body;

        // Create the purchase invoice with items in a transaction
        const purchase = await prisma.$transaction(async (tx) => {
            // Create the purchase invoice
            const createdInvoice = await tx.purchaseInvoice.create({
                data: invoiceData
            });

            // Create the purchase invoice items
            if (items && Array.isArray(items)) {
                for (const item of items) {
                    await tx.purchaseInvoiceItem.create({
                        data: {
                            ...item,
                            purchaseInvoiceId: createdInvoice.id
                        }
                    });
                }
            }

            // Return the complete invoice with relations
            return tx.purchaseInvoice.findUnique({
                where: {
                    id: createdInvoice.id
                },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });
        });

        return NextResponse.json(purchase, { status: 201 });
    } catch (error) {
        console.error('Error creating purchase invoice:', error);
        return NextResponse.json(
            { error: 'Failed to create purchase invoice' },
            { status: 500 }
        );
    }
} 