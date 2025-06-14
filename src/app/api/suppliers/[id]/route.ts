import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditService } from '@/services/auditService';
import { verifyToken } from '@/lib/auth';

// GET /api/suppliers/[id] - Get a specific supplier
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supplierId = parseInt(params.id);

        if (isNaN(supplierId)) {
            return NextResponse.json(
                { error: 'Invalid supplier ID' },
                { status: 400 }
            );
        }

        const supplier = await prisma.supplier.findUnique({
            where: {
                id: supplierId
            }
        });

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
        const supplierId = parseInt(params.id);

        if (isNaN(supplierId)) {
            return NextResponse.json(
                { error: 'Invalid supplier ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const supplier = await prisma.supplier.findUnique({
            where: {
                id: supplierId
            }
        });

        if (!supplier) {
            return NextResponse.json(
                { error: 'Supplier not found' },
                { status: 404 }
            );
        }

        const updatedSupplier = await prisma.supplier.update({
            where: {
                id: supplierId
            },
            data: body
        });

        return NextResponse.json(updatedSupplier);
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
        // Get user from token for audit logging
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        const supplierId = parseInt(params.id);

        if (isNaN(supplierId)) {
            return NextResponse.json(
                { error: 'Invalid supplier ID' },
                { status: 400 }
            );
        }

        const supplier = await prisma.supplier.findUnique({
            where: {
                id: supplierId
            },
            include: {
                purchaseInvoices: true
            }
        });

        if (!supplier) {
            return NextResponse.json(
                { error: 'Supplier not found' },
                { status: 404 }
            );
        }

        // Use audit service for soft delete
        const auditService = new AuditService();
        await auditService.softDelete(
            'Supplier',
            supplierId,
            supplier,
            decoded.userId,
            true // canRecover
        );

        return NextResponse.json(
            { message: 'Supplier moved to recycle bin successfully' },
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