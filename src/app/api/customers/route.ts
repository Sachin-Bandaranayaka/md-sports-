import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch customers from database using Prisma
        const customers = await prisma.customer.findMany({
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

export async function POST(request: Request) {
    try {
        const customerData = await request.json();

        // Ensure numeric fields are correctly parsed or defaulted
        const creditLimit = parseFloat(customerData.creditLimit) || 0;
        const creditPeriod = parseInt(customerData.creditPeriod) || 30;
        const customerType = customerData.customerType || 'Retail';

        // Create new customer using Prisma
        const customer = await prisma.customer.create({
            data: {
                name: customerData.name,
                email: customerData.email || null,
                phone: customerData.phone || null,
                address: JSON.stringify({
                    mainAddress: customerData.address || null,
                    city: customerData.city || null,
                    postalCode: customerData.postalCode || null,
                    contactPerson: customerData.contactPerson || null,
                    contactPersonPhone: customerData.contactPersonPhone || null,
                    // customerType, creditLimit, creditPeriod, taxId, and notes are also stored in the JSON blob
                    // for potential use where the full address context is needed, but the primary source
                    // for these specific fields will be the top-level columns in the Customer table.
                    customerType: customerType,
                    creditLimit: creditLimit,
                    creditPeriod: creditPeriod,
                    taxId: customerData.taxId || null,
                    notes: customerData.notes || null
                }),
                // Store key fields at the top level for easier querying and indexing
                customerType: customerType,
                creditLimit: creditLimit,
                creditPeriod: creditPeriod,
                taxId: customerData.taxId || null, // also store taxId at top-level if it exists in schema
                notes: customerData.notes || null, // also store notes at top-level if it exists in schema
                // paymentType is removed
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