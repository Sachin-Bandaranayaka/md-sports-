import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch invoices from database using Prisma
        const invoices = await prisma.invoice.findMany({
            include: {
                customer: true, // Include customer data
                items: true // Include invoice items
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching invoices',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const invoiceData = await request.json();

        // Create new invoice using Prisma
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: invoiceData.invoiceNumber,
                customerId: invoiceData.customerId,
                total: invoiceData.total,
                status: invoiceData.status || 'Pending',
                // Create invoice items if provided
                items: invoiceData.items ? {
                    create: invoiceData.items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.quantity * item.price
                    }))
                } : undefined
            },
            include: {
                customer: true,
                items: true
            }
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Invoice created successfully',
                data: invoice
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error creating invoice',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 