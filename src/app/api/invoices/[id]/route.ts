import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        // Fetch invoice with all related data
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                },
                payments: true
            }
        });

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching invoice',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        const invoiceData = await request.json();

        // Update invoice with transaction to handle items
        const updatedInvoice = await prisma.$transaction(
            async (tx) => {
                // Check if invoice exists
                const existingInvoice = await tx.invoice.findUnique({
                    where: { id },
                    include: {
                        items: true
                    }
                });

                if (!existingInvoice) {
                    throw new Error('Invoice not found');
                }

                // Update basic invoice details
                const updatedInvoiceDetails = await tx.invoice.update({
                    where: { id },
                    data: {
                        customerId: invoiceData.customerId,
                        total: invoiceData.total,
                        status: invoiceData.status,
                        paymentMethod: invoiceData.paymentMethod,
                        // Add other fields that can be updated
                    }
                });

                // If items are provided, update them
                if (invoiceData.items && Array.isArray(invoiceData.items)) {
                    // Delete existing items
                    await tx.invoiceItem.deleteMany({
                        where: { invoiceId: id }
                    });

                    // Create new items
                    for (const item of invoiceData.items) {
                        await tx.invoiceItem.create({
                            data: {
                                invoiceId: id,
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price,
                                total: item.quantity * item.price
                            }
                        });
                    }
                }

                // Return the complete updated invoice with relations
                return tx.invoice.findUnique({
                    where: { id },
                    include: {
                        customer: true,
                        items: {
                            include: {
                                product: true
                            }
                        },
                        payments: true
                    }
                });
            },
            { timeout: 30000 }
        );

        return NextResponse.json({
            success: true,
            message: 'Invoice updated successfully',
            data: updatedInvoice
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error updating invoice',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        // Delete related invoice items first
        await prisma.invoiceItem.deleteMany({
            where: { invoiceId: id }
        });

        // Delete related payments
        await prisma.payment.deleteMany({
            where: { invoiceId: id }
        });

        // Delete the invoice
        await prisma.invoice.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Invoice deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error deleting invoice',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 