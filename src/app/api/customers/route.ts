import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch customers from database using Prisma
        const customers = await prisma.customer.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching customers',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const customerData = await request.json();

        // Create new customer using Prisma - only include the fields that are recognized by current Prisma client
        const customer = await prisma.customer.create({
            data: {
                name: customerData.name,
                email: customerData.email || null,
                phone: customerData.phone || null,
                // Store additional fields in a structured format in the address field as a workaround
                // until prisma client is regenerated properly
                address: JSON.stringify({
                    mainAddress: customerData.address || null,
                    city: customerData.city || null,
                    postalCode: customerData.postalCode || null,
                    contactPerson: customerData.contactPerson || null,
                    contactPersonPhone: customerData.contactPersonPhone || null,
                    customerType: customerData.customerType || null,
                    paymentType: customerData.paymentType || 'Cash',
                    creditLimit: customerData.paymentType === 'Credit' ? customerData.creditLimit || 0 : null,
                    creditPeriod: customerData.paymentType === 'Credit' ? customerData.creditPeriod || 30 : null,
                    taxId: customerData.taxId || null,
                    notes: customerData.notes || null
                }),
                // Also store the payment type in the dedicated field for future use
                paymentType: customerData.paymentType || 'Cash'
            }
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Customer created successfully',
                data: customer
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error creating customer',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 