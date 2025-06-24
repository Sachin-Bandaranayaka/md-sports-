import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditService } from '@/services/auditService';
import { verifyToken } from '@/lib/auth';
import { requirePermission } from '@/lib/utils/middleware';

export async function GET(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        // Get params from context and ensure it's resolved
        const { id: paramId } = context.params;
        const id = parseInt(paramId);

        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid customer ID'
                },
                { status: 400 }
            );
        }

        const customer = await prisma.customer.findUnique({
            where: {
                id: id
            },
            include: {
                invoices: {
                    include: {
                        items: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Customer not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching customer',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    context: { params: { id: string } }
) {
    // Check for 'customer:update' permission
    const permissionError = await requirePermission('customer:update')(request);
    if (permissionError) {
        return permissionError;
    }

    try {
        // Get params from context and ensure it's resolved
        const { id: paramId } = context.params;
        const id = parseInt(paramId);

        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid customer ID'
                },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, email, phone, address: addressString, customerType: bodyCustomerType, creditLimit: bodyCreditLimit, creditPeriod: bodyCreditPeriod, notes: bodyNotes, ...otherData } = body;

        let addressDetails: any = {};
        if (addressString && typeof addressString === 'string') {
            try {
                addressDetails = JSON.parse(addressString);

                // Check if mainAddress is a JSON string and parse it to prevent nesting
                if (addressDetails.mainAddress && typeof addressDetails.mainAddress === 'string' &&
                    addressDetails.mainAddress.startsWith('{')) {
                    try {
                        const nestedAddress = JSON.parse(addressDetails.mainAddress);
                        // Replace the string with the actual value or null
                        addressDetails.mainAddress = nestedAddress.mainAddress || null;
                    } catch (nestedError) {
                        console.warn('Nested address string is not valid JSON:', nestedError);
                    }
                }
            } catch (e) {
                console.warn('Address string is not valid JSON, proceeding with direct assignment if available or an empty object:', e);
                // If addressString is not JSON, it might be a simple string address or undefined.
                // We'll let Prisma handle it or use defaults.
            }
        } else if (typeof addressString === 'object' && addressString !== null) {
            // If addressString is already an object (e.g. from direct API call not stringified form data)
            addressDetails = addressString;
        }

        const {
            mainAddress,
            city,
            postalCode,
            contactPerson,
            contactPersonPhone,
            customerType: addressCustomerType,
            creditLimit: addressCreditLimit,
            creditPeriod: addressCreditPeriod,
            taxId,
            notes: addressNotes
        } = addressDetails as any; // Type assertion for easier access

        // Use values from request body first, then fall back to address details, then defaults
        const customerType = bodyCustomerType || addressCustomerType || 'Retail';
        const creditLimit = bodyCreditLimit || addressCreditLimit || 0;
        const creditPeriod = bodyCreditPeriod || addressCreditPeriod || 0;
        const notes = bodyNotes || addressNotes || null;

        const customerUpdateData: any = {
            name: name,
            email: email || null,
            phone: phone || null,
            // Store detailed address fields in the address JSON blob as per existing pattern
            // and also individual fields if they exist at the top level of the Customer model
            address: JSON.stringify({
                mainAddress: mainAddress || (typeof addressString === 'string' && !addressString.startsWith('{') ? addressString : null), // Use raw addressString if it's not JSON
                city: city || null,
                postalCode: postalCode || null,
                contactPerson: contactPerson || null,
                contactPersonPhone: contactPersonPhone || null,
                customerType: customerType || 'Retail',
                creditLimit: parseFloat(creditLimit) || 0,
                creditPeriod: parseInt(creditPeriod) || 0,
                taxId: taxId || null,
                notes: notes || null,
            }),
            customerType: customerType || 'Retail', // Persist this at the top level too
            creditLimit: parseFloat(creditLimit) || 0, // Persist this at the top level too
            creditPeriod: parseInt(creditPeriod) || 0, // Persist this at the top level too
            // otherData might contain fields like 'status', which we want to preserve
            ...otherData
        };

        // Remove undefined fields to avoid Prisma errors
        Object.keys(customerUpdateData).forEach(key => {
            if (customerUpdateData[key] === undefined) {
                delete customerUpdateData[key];
            }
        });

        // Check for duplicate mobile number if phone is being updated
        if (phone && phone.trim()) {
            const existingCustomer = await prisma.customer.findFirst({
                where: {
                    phone: phone.trim(),
                    id: {
                        not: id // Exclude the current customer being updated
                    }
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

        const updatedCustomer = await prisma.customer.update({
            where: {
                id: id
            },
            data: customerUpdateData
        });

        // Revalidate the customers page to refresh data
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/customers');

        return NextResponse.json({
            success: true,
            message: 'Customer updated successfully',
            data: updatedCustomer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error updating customer',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    // Check for 'customer:delete' permission
    const permissionError = await requirePermission('customer:delete')(request);
    if (permissionError) {
        return permissionError;
    }

    try {
        // Verify token and get user
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json(
                { success: false, message: 'No token provided' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        // Get params from context and ensure it's resolved
        const { id: paramId } = context.params;
        const id = parseInt(paramId);

        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid customer ID'
                },
                { status: 400 }
            );
        }

        // Get customer data before deletion for audit log
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                invoices: true
            }
        });

        if (!customer) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Customer not found'
                },
                { status: 404 }
            );
        }

        // Note: Since we're using soft deletion, we allow deletion of customers with invoices
        // The customer will be moved to recycle bin and can be recovered if needed

        // Use audit service for soft delete
        const auditService = new AuditService();
        await auditService.softDelete(
            'Customer',
            id,
            customer,
            decoded.userId,
            true // canRecover
        );

        return NextResponse.json({
            success: true,
            message: 'Customer moved to recycle bin successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error deleting customer',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}