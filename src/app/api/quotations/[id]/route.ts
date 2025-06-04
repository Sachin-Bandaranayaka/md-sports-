import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/quotations/[id] - Get a specific quotation
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const quotationId = parseInt(params.id);

        if (isNaN(quotationId)) {
            return NextResponse.json(
                { error: 'Invalid quotation ID' },
                { status: 400 }
            );
        }

        const quotation = await prisma.quotation.findUnique({
            where: {
                id: quotationId
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

        if (!quotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to the start of the day for comparison

        let updatedQuotationData = { ...quotation };

        if (quotation.validUntil && new Date(quotation.validUntil) < today && quotation.status === 'pending') {
            try {
                updatedQuotationData = await prisma.quotation.update({
                    where: { id: quotationId },
                    data: { status: 'expired' },
                    include: {
                        customer: true,
                        items: {
                            include: {
                                product: true
                            }
                        }
                    }
                });
            } catch (dbError) {
                console.error(`Failed to update status for quotation ${quotationId}:`, dbError);
                // If DB update fails, we'll return the original quotation data but log the error
            }
        }

        return NextResponse.json(updatedQuotationData);
    } catch (error) {
        console.error(`Error fetching quotation ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch quotation' },
            { status: 500 }
        );
    }
}

// PUT /api/quotations/[id] - Update a quotation
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const quotationId = parseInt(params.id);

        if (isNaN(quotationId)) {
            return NextResponse.json(
                { error: 'Invalid quotation ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const quotation = await prisma.quotation.findUnique({
            where: {
                id: quotationId
            }
        });

        if (!quotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            );
        }

        // Extract items from the request
        const { items, ...quotationData } = body;

        // Update the quotation and items in a transaction
        const updatedQuotation = await prisma.$transaction(async (tx) => {
            // Update the quotation
            await tx.quotation.update({
                where: {
                    id: quotationId
                },
                data: quotationData
            });

            // Handle items update if provided
            if (items && Array.isArray(items)) {
                // Delete existing items
                await tx.quotationItem.deleteMany({
                    where: {
                        quotationId: quotationId
                    }
                });

                // Create new items
                for (const item of items) {
                    await tx.quotationItem.create({
                        data: {
                            ...item,
                            quotationId: quotationId
                        }
                    });
                }
            }

            // Return the updated quotation with items
            return tx.quotation.findUnique({
                where: {
                    id: quotationId
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

        return NextResponse.json(updatedQuotation);
    } catch (error) {
        console.error(`Error updating quotation ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to update quotation' },
            { status: 500 }
        );
    }
}

// DELETE /api/quotations/[id] - Delete a quotation
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const quotationId = parseInt(params.id);

        if (isNaN(quotationId)) {
            return NextResponse.json(
                { error: 'Invalid quotation ID' },
                { status: 400 }
            );
        }

        const quotation = await prisma.quotation.findUnique({
            where: {
                id: quotationId
            }
        });

        if (!quotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            );
        }

        // Delete quotation and items in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete associated items
            await tx.quotationItem.deleteMany({
                where: {
                    quotationId: quotationId
                }
            });

            // Delete the quotation
            await tx.quotation.delete({
                where: {
                    id: quotationId
                }
            });
        });

        return NextResponse.json(
            { message: 'Quotation deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error(`Error deleting quotation ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to delete quotation' },
            { status: 500 }
        );
    }
} 