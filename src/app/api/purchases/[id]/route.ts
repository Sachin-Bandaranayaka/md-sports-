import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/purchases/[id] - Get a specific purchase invoice
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const purchaseId = parseInt(params.id);

        if (isNaN(purchaseId)) {
            return NextResponse.json(
                { error: 'Invalid purchase ID' },
                { status: 400 }
            );
        }

        const purchase = await prisma.purchaseInvoice.findUnique({
            where: {
                id: purchaseId
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

        if (!purchase) {
            return NextResponse.json(
                { error: 'Purchase invoice not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(purchase);
    } catch (error) {
        console.error(`Error fetching purchase invoice ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch purchase invoice' },
            { status: 500 }
        );
    }
}

// PUT /api/purchases/[id] - Update a purchase invoice
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const purchaseId = parseInt(params.id);

        if (isNaN(purchaseId)) {
            return NextResponse.json(
                { error: 'Invalid purchase ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const purchase = await prisma.purchaseInvoice.findUnique({
            where: {
                id: purchaseId
            }
        });

        if (!purchase) {
            return NextResponse.json(
                { error: 'Purchase invoice not found' },
                { status: 404 }
            );
        }

        // Extract items from the request
        const { items, ...invoiceData } = body;

        // Update the purchase invoice in a transaction
        const updatedPurchase = await prisma.$transaction(async (tx) => {
            // Update the purchase invoice
            const updated = await tx.purchaseInvoice.update({
                where: {
                    id: purchaseId
                },
                data: invoiceData
            });

            // Handle items update if provided
            if (items && Array.isArray(items)) {
                // Delete existing items
                await tx.purchaseInvoiceItem.deleteMany({
                    where: {
                        purchaseInvoiceId: purchaseId
                    }
                });

                // Create new items
                for (const item of items) {
                    await tx.purchaseInvoiceItem.create({
                        data: {
                            ...item,
                            purchaseInvoiceId: purchaseId
                        }
                    });
                }
            }

            // Return the updated purchase with items
            return tx.purchaseInvoice.findUnique({
                where: {
                    id: purchaseId
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

        return NextResponse.json(updatedPurchase);
    } catch (error) {
        console.error(`Error updating purchase invoice ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to update purchase invoice' },
            { status: 500 }
        );
    }
}

// DELETE /api/purchases/[id] - Delete a purchase invoice
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const purchaseId = parseInt(params.id);

        if (isNaN(purchaseId)) {
            return NextResponse.json(
                { error: 'Invalid purchase ID' },
                { status: 400 }
            );
        }

        const purchase = await prisma.purchaseInvoice.findUnique({
            where: {
                id: purchaseId
            }
        });

        if (!purchase) {
            return NextResponse.json(
                { error: 'Purchase invoice not found' },
                { status: 404 }
            );
        }

        // Delete in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete associated items
            await tx.purchaseInvoiceItem.deleteMany({
                where: {
                    purchaseInvoiceId: purchaseId
                }
            });

            // Delete the purchase invoice
            await tx.purchaseInvoice.delete({
                where: {
                    id: purchaseId
                }
            });
        });

        return NextResponse.json(
            { message: 'Purchase invoice deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error(`Error deleting purchase invoice ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to delete purchase invoice' },
            { status: 500 }
        );
    }
} 