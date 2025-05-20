import { NextRequest, NextResponse } from 'next/server';
import { Supplier } from '@/lib/models';

// GET /api/suppliers/[id] - Get a specific supplier
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supplier = await Supplier.findByPk(params.id);

        if (!supplier) {
            return NextResponse.json(
                { error: 'Supplier not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(supplier);
    } catch (error) {
        console.error(`Error fetching supplier ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch supplier' },
            { status: 500 }
        );
    }
}

// PUT /api/suppliers/[id] - Update a supplier
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const supplier = await Supplier.findByPk(params.id);

        if (!supplier) {
            return NextResponse.json(
                { error: 'Supplier not found' },
                { status: 404 }
            );
        }

        await supplier.update(body);

        return NextResponse.json(supplier);
    } catch (error) {
        console.error(`Error updating supplier ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to update supplier' },
            { status: 500 }
        );
    }
}

// DELETE /api/suppliers/[id] - Delete a supplier
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supplier = await Supplier.findByPk(params.id);

        if (!supplier) {
            return NextResponse.json(
                { error: 'Supplier not found' },
                { status: 404 }
            );
        }

        await supplier.destroy();

        return NextResponse.json(
            { message: 'Supplier deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error(`Error deleting supplier ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to delete supplier' },
            { status: 500 }
        );
    }
} 