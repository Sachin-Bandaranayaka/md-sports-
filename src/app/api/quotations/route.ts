import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/quotations - Get all quotations
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const customerId = searchParams.get('customerId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build the where clause for Prisma
        const whereClause: any = {};

        if (search) {
            whereClause.quotationNumber = {
                contains: search,
                mode: 'insensitive'
            };
        }

        if (status) {
            whereClause.status = status;
        }

        if (customerId) {
            whereClause.customerId = parseInt(customerId);
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

        const quotations = await prisma.quotation.findMany({
            where: whereClause,
            include: {
                customer: {
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

        return NextResponse.json(quotations);
    } catch (error) {
        console.error('Error fetching quotations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quotations' },
            { status: 500 }
        );
    }
}

// POST /api/quotations - Create a new quotation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Generate a quotation number if not provided
        if (!body.quotationNumber) {
            body.quotationNumber = `QUO${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        }

        // Extract items from the request
        const { items, ...quotationData } = body;

        // Create the quotation with items in a transaction
        const quotation = await prisma.$transaction(async (tx) => {
            // Create the quotation
            const createdQuotation = await tx.quotation.create({
                data: quotationData
            });

            // Create the quotation items
            if (items && Array.isArray(items)) {
                for (const item of items) {
                    await tx.quotationItem.create({
                        data: {
                            ...item,
                            quotationId: createdQuotation.id
                        }
                    });
                }
            }

            // Return the complete quotation with relations
            return tx.quotation.findUnique({
                where: {
                    id: createdQuotation.id
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });
        });

        return NextResponse.json(quotation, { status: 201 });
    } catch (error) {
        console.error('Error creating quotation:', error);
        return NextResponse.json(
            { error: 'Failed to create quotation' },
            { status: 500 }
        );
    }
} 