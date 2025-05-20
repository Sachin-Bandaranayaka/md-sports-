import { NextRequest, NextResponse } from 'next/server';
import { Supplier } from '@/lib/models';

// GET /api/suppliers - Get all suppliers
export async function GET(request: NextRequest) {
    try {
        const suppliers = await Supplier.findAll({
            order: [['createdAt', 'DESC']]
        });

        return NextResponse.json(suppliers);
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

        // Generate a supplier ID if not provided
        if (!body.id) {
            body.id = `SUP${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        }

        const supplier = await Supplier.create(body);

        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        console.error('Error creating supplier:', error);
        return NextResponse.json(
            { error: 'Failed to create supplier' },
            { status: 500 }
        );
    }
} 