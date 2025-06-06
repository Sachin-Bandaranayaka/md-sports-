import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';

// GET /api/suppliers - Get all suppliers
export async function GET(_request: NextRequest) {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(suppliers, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch suppliers' },
            { status: 500 }
        );
    }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const supplier = await prisma.supplier.create({
            data: body
        });

        // Invalidate suppliers cache to ensure fresh data
        revalidateTag('suppliers');
        
        // Also invalidate purchase invoice pages that might cache supplier data
        revalidateTag('purchase-invoices');

        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        console.error('Error creating supplier:', error);
        return NextResponse.json(
            { error: 'Failed to create supplier' },
            { status: 500 }
        );
    }
}