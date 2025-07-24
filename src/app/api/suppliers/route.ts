import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { AuditService } from '@/services/auditService';
import { verifyToken, extractToken } from '@/lib/auth';

// GET /api/suppliers - Get all suppliers
export async function GET(_request: NextRequest) {
    try {
        // Get IDs of soft-deleted suppliers
        const auditService = new AuditService();
        const deletedSupplierIds = await auditService.getDeletedEntityIds('Supplier');

        const suppliers = await prisma.supplier.findMany({
            where: {
                id: {
                    notIn: deletedSupplierIds
                }
            },
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

        // Audit Log for Supplier Creation
        const token = extractToken(request);
        const decoded = token ? verifyToken(token) : null;
        const userId = decoded?.userId;

        try {
            const auditService = new AuditService();
            await auditService.logAction({
                userId: userId || null,
                action: 'CREATE',
                entity: 'Supplier',
                entityId: supplier.id,
                details: {
                    name: supplier.name,
                    email: supplier.email,
                    phone: supplier.phone,
                    address: supplier.address,
                    city: supplier.city,
                    contactPerson: supplier.contactPerson,
                    notes: supplier.notes
                }
            });
        } catch (auditError) {
            console.error('Failed to create audit log for supplier creation:', auditError);
            // Do not fail the main operation if audit logging fails
        }

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