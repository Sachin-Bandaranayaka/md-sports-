import { NextRequest, NextResponse } from 'next/server';
import { Quotation, Customer, QuotationItem, Product } from '@/lib/models';

// GET /api/quotations/[id] - Get a specific quotation
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const quotation = await Quotation.findByPk(params.id, {
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: QuotationItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                }
            ]
        });

        if (!quotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(quotation);
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
        const body = await request.json();
        const quotation = await Quotation.findByPk(params.id);

        if (!quotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            );
        }

        // Extract items from the request
        const { items, ...quotationData } = body;

        // Update the quotation
        await quotation.update(quotationData);

        // Handle items update if provided
        if (items && Array.isArray(items)) {
            // Delete existing items
            await QuotationItem.destroy({
                where: { quotationId: params.id }
            });

            // Create new items
            for (const item of items) {
                await QuotationItem.create({
                    ...item,
                    quotationId: params.id
                });
            }
        }

        // Fetch the updated quotation with items
        const updatedQuotation = await Quotation.findByPk(params.id, {
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: QuotationItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                }
            ]
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
        const quotation = await Quotation.findByPk(params.id);

        if (!quotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            );
        }

        // Delete associated items
        await QuotationItem.destroy({
            where: { quotationId: params.id }
        });

        // Delete the quotation
        await quotation.destroy();

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