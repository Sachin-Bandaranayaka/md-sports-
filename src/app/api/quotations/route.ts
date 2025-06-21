import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, extractToken } from '@/lib/auth';
import { hasPermission } from '@/lib/utils/permissions';

// GET /api/quotations - Get all quotations
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const customerId = searchParams.get('customerId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const shopId = searchParams.get('shopId');

        // Build the where clause for Prisma
        const whereClause: any = {};

        // Apply shop filtering based on user permissions
        const isAdmin = hasPermission(user.permissions, 'admin:all') || hasPermission(user.permissions, '*');
        if (!isAdmin) {
            // Non-admin users can only see quotations from their assigned shop
            if (user.shopId) {
                whereClause.shopId = user.shopId;
            } else {
                // User has no shop assigned, return empty result
                return NextResponse.json([]);
            }
        } else if (shopId) {
            // Admin users can filter by specific shop if requested
            whereClause.shopId = parseInt(shopId);
        }

        if (search) {
            whereClause.quotationNumber = {
                contains: search,
                mode: 'insensitive'
            };
        }

        // Note: status field is not available in Quotation model
        // if (status) {
        //     whereClause.status = status;
        // }

        if (customerId) {
            whereClause.customerId = parseInt(customerId);
        }

        if (startDate && endDate) {
            whereClause.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (startDate) {
            whereClause.createdAt = {
                gte: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.createdAt = {
                lte: new Date(endDate)
            };
        }

        const quotations = await prisma.quotation.findMany({
            where: whereClause,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(quotations);
    } catch (error) {
        console.error('Error fetching quotations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quotations' },
            { status: 500 }
        );
    }
}

// POST /api/quotations - Create a new quotation
export async function POST(request: NextRequest) {
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
        const canCreateAll = hasPermission(user.permissions, 'sales:manage');
        const canCreateShop = hasPermission(user.permissions, 'sales:create:shop');
        
        if (!canCreateAll && !canCreateShop) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        
        // Validate shopId for users with only shop-specific permissions
        if (!canCreateAll && canCreateShop) {
            if (!user.shopId) {
                return NextResponse.json({ error: 'User not assigned to any shop' }, { status: 403 });
            }
            if (body.shopId && body.shopId !== user.shopId) {
                return NextResponse.json({ error: 'Cannot create quotations for other shops' }, { status: 403 });
            }
            // Ensure shopId is set to user's shop
            body.shopId = user.shopId;
        }

        // Generate a quotation number if not provided
        if (!body.quotationNumber) {
            body.quotationNumber = `QUO${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        }

        // Extract items from the request
        const { items, ...quotationData } = body;

        // Ensure customerId is an integer
        if (quotationData.customerId && typeof quotationData.customerId === 'string') {
            quotationData.customerId = parseInt(quotationData.customerId, 10);
        } else if (quotationData.customerId && typeof quotationData.customerId !== 'number') {
            // Potentially return an error if customerId is not a parsable string or number
            console.error("Invalid customerId format:", quotationData.customerId);
            // return NextResponse.json({ error: 'Invalid customerId format' }, { status: 400 });
        }

        // Remove customerName as it's not a direct field of Quotation model
        if ('customerName' in quotationData) {
            delete quotationData.customerName;
        }

        // Remove date as createdAt is automatically handled by Prisma
        if ('date' in quotationData) {
            delete quotationData.date;
        }

        // Rename expiryDate to validUntil and convert to Date object
        if (quotationData.expiryDate) {
            quotationData.validUntil = new Date(quotationData.expiryDate);
            delete quotationData.expiryDate;
        } else {
            // Set validUntil to null or a default if expiryDate is not provided and it's optional
            // Based on schema (DateTime?), it's optional. So, if not provided, it can be omitted or explicitly null.
            // If you want to ensure it's always set, you might add a default here or make it required in the request.
            quotationData.validUntil = null; // Or simply don't set it if not provided, Prisma handles optional fields
            delete quotationData.expiryDate; // Ensure it's removed if it was an empty string or similar
        }

        // Remove subtotal and discount as they are not direct fields of the Quotation model
        if ('subtotal' in quotationData) {
            delete quotationData.subtotal;
        }
        if ('discount' in quotationData) {
            delete quotationData.discount;
        }

        // Remove notes as it is not a direct field of the Quotation model
        if ('notes' in quotationData) {
            delete quotationData.notes;
        }

        // Remove status as it is not a direct field of the Quotation model
        if ('status' in quotationData) {
            delete quotationData.status;
        }

        // Create the quotation with items in a transaction
        const quotation = await prisma.$transaction(async (tx) => {
            // Create the quotation
            const createdQuotation = await tx.quotation.create({
                data: quotationData
            });

            // Create the quotation items
            if (items && Array.isArray(items)) {
                for (const item of items) {
                    const itemData: any = {
                        quotationId: createdQuotation.id,
                        productId: parseInt(item.productId, 10),
                        quantity: parseInt(item.quantity, 10),
                        price: parseFloat(item.unitPrice || item.price), // Handle if it's already price or unitPrice
                        total: parseFloat(item.total) // Ensure total is also a float
                    };

                    // Remove productName if it exists, as it's not part of QuotationItem schema
                    // The actual product details are linked via productId
                    // We also remove unitPrice explicitly if it was the original field name
                    // and any other unexpected fields that might have come from `...item` spread previously.

                    await tx.quotationItem.create({
                        data: itemData
                    });
                }
            }

            // Return the complete quotation with relations
            return tx.quotation.findUnique({
                where: {
                    id: createdQuotation.id
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

        return NextResponse.json(quotation, { status: 201 });
    } catch (error) {
        console.error('Error creating quotation:', error);
        return NextResponse.json(
            { error: 'Failed to create quotation' },
            { status: 500 }
        );
    }
}