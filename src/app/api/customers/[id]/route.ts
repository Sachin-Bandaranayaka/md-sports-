import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Ensure params is fully resolved
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid customer ID'
                },
                { status: 400 }
            );
        }

        const customer = await prisma.customer.findUnique({
            where: {
                id: id
            }
        });

        if (!customer) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Customer not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching customer',
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
        // Ensure params is fully resolved
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid customer ID'
                },
                { status: 400 }
            );
        }

        const customerData = await request.json();

        const updatedCustomer = await prisma.customer.update({
            where: {
                id: id
            },
            data: {
                name: customerData.name,
                email: customerData.email || null,
                phone: customerData.phone || null,
                address: customerData.address || null
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Customer updated successfully',
            data: updatedCustomer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error updating customer',
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
        // Ensure params is fully resolved
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid customer ID'
                },
                { status: 400 }
            );
        }

        // Check if customer has related invoices
        const invoiceCount = await prisma.invoice.count({
            where: {
                customerId: id
            }
        });

        if (invoiceCount > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Cannot delete customer with existing invoices'
                },
                { status: 400 }
            );
        }

        await prisma.customer.delete({
            where: {
                id: id
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error deleting customer',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 