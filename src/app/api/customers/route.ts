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

        // Create new customer using Prisma
        const customer = await prisma.customer.create({
            data: {
                name: customerData.name,
                email: customerData.email || null,
                phone: customerData.phone || null,
                address: customerData.address || null
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