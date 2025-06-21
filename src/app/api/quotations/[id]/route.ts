import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, extractToken } from '@/lib/auth';
import { hasPermission } from '@/lib/utils/permissions';

// GET /api/quotations/[id] - Get a specific quotation
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const token = extractToken(request);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.sub) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: payload.sub as string },
            select: { permissions: true, shopId: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check permissions
        if (!hasPermission(user.permissions, 'sales:view')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const quotationId = parseInt(params.id);

        if (isNaN(quotationId)) {
            return NextResponse.json(
                { error: 'Invalid quotation ID' },
                { status: 400 }
            );
        }

        const quotation = await prisma.quotation.findUnique({
            where: {
                id: quotationId
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!quotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            );
        }

        // Check shop access for non-admin users
        const isAdmin = hasPermission(user.permissions, 'admin:all') || hasPermission(user.permissions, '*');
        if (!isAdmin && user.shopId && quotation.shopId !== user.shopId) {
            return NextResponse.json(
                { error: 'Access denied: Quotation belongs to different shop' },
                { status: 403 }
            );
        }

        return NextResponse.json(quotation);
    } catch (error) {
        console.error(`Error fetching quotation ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch quotation' },
            { status: 500 }
        );
    }
}

// PUT /api/quotations/[id] - Update a quotation
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const token = extractToken(request);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.sub) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: payload.sub as string },
            select: { permissions: true, shopId: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check permissions - only admin or users with sales:manage can edit quotations
        const isAdmin = hasPermission(user.permissions, 'admin:all') || hasPermission(user.permissions, '*');
        const canManageSales = hasPermission(user.permissions, 'sales:manage');
        
        if (!isAdmin && !canManageSales) {
            return NextResponse.json({ error: 'Insufficient permissions to edit quotations' }, { status: 403 });
        }

        const quotationId = parseInt(params.id);

        if (isNaN(quotationId)) {
            return NextResponse.json(
                { error: 'Invalid quotation ID' },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Ensure the quotation exists before attempting to update
        const existingQuotation = await prisma.quotation.findUnique({
            where: { id: quotationId },
        });

        if (!existingQuotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            );
        }
        
        // Check shop access for non-admin users
        if (!isAdmin && user.shopId && existingQuotation.shopId !== user.shopId) {
            return NextResponse.json(
                { error: 'Access denied: Cannot edit quotations from other shops' },
                { status: 403 }
            );
        }

        const { items, ...quotationDetails } = body;

        // Prepare data for Quotation update, only including valid fields
        const dataToUpdate: any = {};

        if (quotationDetails.quotationNumber !== undefined) {
            dataToUpdate.quotationNumber = String(quotationDetails.quotationNumber);
        }
        if (quotationDetails.customerId !== undefined) {
            dataToUpdate.customerId = parseInt(String(quotationDetails.customerId), 10);
            if (isNaN(dataToUpdate.customerId)) {
                return NextResponse.json({ error: 'Invalid customerId format' }, { status: 400 });
            }
        }
        if (quotationDetails.total !== undefined) {
            dataToUpdate.total = parseFloat(String(quotationDetails.total));
            if (isNaN(dataToUpdate.total)) {
                return NextResponse.json({ error: 'Invalid total format' }, { status: 400 });
            }
        }
        if (quotationDetails.status !== undefined) {
            dataToUpdate.status = String(quotationDetails.status);
        }
        if (quotationDetails.expiryDate !== undefined) { // Frontend sends expiryDate
            dataToUpdate.validUntil = quotationDetails.expiryDate ? new Date(quotationDetails.expiryDate) : null;
        }
        // Note: We don't update createdAt. updatedAt is handled by Prisma.
        // Fields like notes, subtotal, tax, discount are not in the current Quotation Prisma schema.
        // If they need to be stored, the schema needs to be updated.

        const updatedQuotation = await prisma.$transaction(async (tx) => {
            // Update the quotation
            await tx.quotation.update({
                where: {
                    id: quotationId
                },
                data: dataToUpdate // Use the prepared data
            });

            // Handle items update if provided
            if (items && Array.isArray(items)) {
                // Delete existing items
                await tx.quotationItem.deleteMany({
                    where: {
                        quotationId: quotationId
                    }
                });

                // Create new items
                for (const item of items) {
                    const productId = parseInt(String(item.productId), 10);
                    const quantity = parseInt(String(item.quantity), 10);
                    // Prisma schema uses 'price', frontend might send 'unitPrice' or 'price'
                    const price = parseFloat(String(item.unitPrice ?? item.price));
                    const itemTotal = parseFloat(String(item.total));

                    if (isNaN(productId) || isNaN(quantity) || isNaN(price) || isNaN(itemTotal)) {
                        throw new Error('Invalid item data: All item numeric fields must be valid numbers.');
                    }

                    await tx.quotationItem.create({
                        data: {
                            quotationId: quotationId,
                            productId: productId,
                            quantity: quantity,
                            price: price, // Ensure this matches schema field name
                            total: itemTotal
                        }
                    });
                }
            }

            // Return the updated quotation with items
            return tx.quotation.findUnique({
                where: {
                    id: quotationId
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });
        });

        return NextResponse.json(updatedQuotation);
    } catch (error: any) { // Catch specific error types if needed
        console.error(`Error updating quotation ${params.id}:`, error);
        // Provide a more specific error message if it's our custom validation error
        if (error.message.startsWith('Invalid item data:')) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to update quotation', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/quotations/[id] - Delete a quotation
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const token = extractToken(request);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.sub) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: payload.sub as string },
            select: { permissions: true, shopId: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check permissions - only admin or users with sales:manage can delete quotations
        const isAdmin = hasPermission(user.permissions, 'admin:all') || hasPermission(user.permissions, '*');
        const canManageSales = hasPermission(user.permissions, 'sales:manage');
        
        if (!isAdmin && !canManageSales) {
            return NextResponse.json({ error: 'Insufficient permissions to delete quotations' }, { status: 403 });
        }

        const quotationId = parseInt(params.id);

        if (isNaN(quotationId)) {
            return NextResponse.json(
                { error: 'Invalid quotation ID' },
                { status: 400 }
            );
        }

        const quotation = await prisma.quotation.findUnique({
            where: {
                id: quotationId
            }
        });

        if (!quotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            );
        }
        
        // Check shop access for non-admin users
        if (!isAdmin && user.shopId && quotation.shopId !== user.shopId) {
            return NextResponse.json(
                { error: 'Access denied: Cannot delete quotations from other shops' },
                { status: 403 }
            );
        }

        // Delete quotation and items in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete associated items
            await tx.quotationItem.deleteMany({
                where: {
                    quotationId: quotationId
                }
            });

            // Delete the quotation
            await tx.quotation.delete({
                where: {
                    id: quotationId
                }
            });
        });

        return NextResponse.json(
            { message: 'Quotation deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error(`Error deleting quotation ${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to delete quotation' },
            { status: 500 }
        );
    }
}