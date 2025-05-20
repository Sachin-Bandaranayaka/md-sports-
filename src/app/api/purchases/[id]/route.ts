import { NextRequest, NextResponse } from 'next/server';
import { PurchaseInvoice, Supplier, PurchaseInvoiceItem, Product } from '@/lib/models';

// GET /api/purchases/[id] - Get a specific purchase invoice
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const purchase = await PurchaseInvoice.findByPk(params.id, {
            include: [
                {
                    model: Supplier,
                    as: 'supplier'
                },
                {
                    model: PurchaseInvoiceItem,
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
        const body = await request.json();
        const purchase = await PurchaseInvoice.findByPk(params.id);

        if (!purchase) {
            return NextResponse.json(
                { error: 'Purchase invoice not found' },
                { status: 404 }
            );
        }

        // Extract items from the request
        const { items, ...invoiceData } = body;

        // Update the purchase invoice
        await purchase.update(invoiceData);

        // Handle items update if provided
        if (items && Array.isArray(items)) {
            // Delete existing items
            await PurchaseInvoiceItem.destroy({
                where: { purchaseInvoiceId: params.id }
            });

            // Create new items
            for (const item of items) {
                await PurchaseInvoiceItem.create({
                    ...item,
                    purchaseInvoiceId: params.id
                });
            }
        }

        // Fetch the updated purchase with items
        const updatedPurchase = await PurchaseInvoice.findByPk(params.id, {
            include: [
                {
                    model: Supplier,
                    as: 'supplier'
                },
                {
                    model: PurchaseInvoiceItem,
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
        const purchase = await PurchaseInvoice.findByPk(params.id);

        if (!purchase) {
            return NextResponse.json(
                { error: 'Purchase invoice not found' },
                { status: 404 }
            );
        }

        // Update supplier's totalPurchases
        const supplier = await Supplier.findByPk(purchase.supplierId);
        if (supplier) {
            await supplier.update({
                totalPurchases: Math.max(0, supplier.totalPurchases - purchase.total)
            });
        }

        // Delete associated items
        await PurchaseInvoiceItem.destroy({
            where: { purchaseInvoiceId: params.id }
        });

        // Delete the purchase invoice
        await purchase.destroy();

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