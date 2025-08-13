import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { AuditService } from '@/services/auditService';

export async function GET() {
    try {
        // Fetch customers from database using Prisma, excluding soft-deleted ones
        const customers = await prisma.customer.findMany({
            where: {
                isDeleted: false
            },
            orderBy: {
                name: 'asc'
            },
            include: {
                invoices: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1,
                    select: {
                        createdAt: true
                    }
                }
            }
        });

        // Add lastPurchaseDate field to each customer
        const enrichedCustomers = customers.map(customer => {
            const lastInvoice = customer.invoices?.[0];
            return {
                ...customer,
                lastPurchaseDate: lastInvoice ? lastInvoice.createdAt : null,
                // Remove the invoices array from the response to keep it clean
                invoices: undefined
            };
        });

        return NextResponse.json(enrichedCustomers);
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

export async function POST(request: NextRequest) {
    // Check for 'customer:create' permission
    const permissionError = await requirePermission('customer:create')(request);
    if (permissionError) {
        return permissionError;
    }

    try {
        const customerData = await request.json();

        // Validate and transform incoming data
        const type = customerData.customerType === 'Wholesale' ? 'wholesale' : 'retail';
        let creditLimit = null;
        let creditPeriod = null;

        if (type === 'wholesale') {
            creditLimit = parseFloat(customerData.creditLimit) || 0;
            creditPeriod = parseInt(customerData.creditPeriod) || null;
        }

        // Check for duplicate mobile number if phone is provided
        if (customerData.phone && customerData.phone.trim()) {
            const existingCustomer = await prisma.customer.findFirst({
                where: {
                    phone: customerData.phone.trim()
                }
            });

            if (existingCustomer) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'A customer with this mobile number already exists',
                        error: 'Duplicate mobile number'
                    },
                    { status: 400 }
                );
            }
        }

        // Create new customer using Prisma
        const customer = await prisma.customer.create({
            data: {
                name: customerData.name,
                email: customerData.email || null,
                phone: customerData.phone || null,
                address: customerData.address || null, // Store address as a simple string
                customerType: type, // Changed from type to customerType
                creditLimit: creditLimit,
                creditPeriod: creditPeriod,
                // taxId and notes are removed as they are not in the Customer model
                // The JSON blob for address is removed
            }
        });

        // Get token for audit logging
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        let userId: number | null = null;
        if (token) {
            try {
                const decoded = await verifyToken(token);
                userId = decoded?.userId ? Number(decoded.userId) : null;
            } catch (error) {
                console.warn('Failed to get userId for audit logging');
            }
        }

        // Log CREATE action
        const auditService = AuditService.getInstance();
        await auditService.logAction({
            userId: userId ? String(userId) : null,
            action: 'CREATE',
            entity: 'Customer',
            entityId: customer.id,
            details: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                customerType: customer.customerType,
                creditLimit: customer.creditLimit,
                creditPeriod: customer.creditPeriod
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