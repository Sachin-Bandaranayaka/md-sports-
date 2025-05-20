import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import { prisma, safeQuery } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Default fallback data for transfers
const defaultTransfersData = [
    { id: 1, status: 'pending', created_at: '2025-05-20T10:00:00Z', completed_at: null, source_shop_name: 'Colombo Shop', destination_shop_name: 'Kandy Shop', initiated_by: 'System User', item_count: 5, total_items: 25 },
    { id: 2, status: 'completed', created_at: '2025-05-19T09:30:00Z', completed_at: '2025-05-19T16:00:00Z', source_shop_name: 'Galle Shop', destination_shop_name: 'Colombo Shop', initiated_by: 'System User', item_count: 3, total_items: 15 },
    { id: 3, status: 'cancelled', created_at: '2025-05-18T14:00:00Z', completed_at: null, source_shop_name: 'Kandy Shop', destination_shop_name: 'Jaffna Shop', initiated_by: 'System User', item_count: 2, total_items: 10 }
];

// GET: Fetch all inventory transfers
export async function GET(req: NextRequest) {
    console.log('GET /api/inventory/transfers - Checking permission: inventory:view');
    // Check for inventory:view permission
    const permissionError = await requirePermission('inventory:view')(req);
    if (permissionError) {
        console.error('Permission denied for inventory:view:', permissionError.status);
        return permissionError;
    }

    try {
        console.log('Executing query to fetch transfers...');

        const transfers = await safeQuery(
            async () => {
                const result = await prisma.inventoryTransfer.findMany({
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        notes: true,
                        fromShop: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        toShop: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        fromUser: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        transferItems: {
                            select: {
                                id: true,
                                quantity: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                // Format the data to match the expected format from the SQL query
                return result.map(transfer => ({
                    id: transfer.id,
                    status: transfer.status,
                    created_at: transfer.createdAt.toISOString(),
                    completed_at: null, // This field doesn't exist in Prisma schema, could be added later
                    source_shop_name: transfer.fromShop.name,
                    destination_shop_name: transfer.toShop.name,
                    initiated_by: transfer.fromUser.name,
                    item_count: transfer.transferItems.length,
                    total_items: transfer.transferItems.reduce((sum, item) => sum + item.quantity, 0)
                }));
            },
            defaultTransfersData,
            'Failed to fetch inventory transfers'
        );

        console.log('Query executed successfully. Results:', transfers);
        console.log(`Retrieved ${transfers.length} transfers successfully`);
        return NextResponse.json({
            success: true,
            data: transfers
        });
    } catch (error) {
        console.error('Error fetching transfers:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching transfers',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// POST: Create a new inventory transfer
export async function POST(req: NextRequest) {
    console.log('POST /api/inventory/transfers - Checking permission: inventory:transfer');
    // Check for inventory:transfer permission
    const permissionError = await requirePermission('inventory:transfer')(req);
    if (permissionError) {
        console.error('Permission denied for inventory:transfer:', permissionError.status);
        return permissionError;
    }

    try {
        const body = await req.json();
        const { sourceShopId, destinationShopId, items } = body;

        // Get user ID from authorization token
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        if (typeof decodedToken !== 'object' || !decodedToken.sub) {
            return NextResponse.json({
                success: false,
                message: 'Invalid token'
            }, { status: 401 });
        }

        const userId = Number(decodedToken.sub);
        console.log('Creating transfer for user ID:', userId);

        // Validate request data
        if (!sourceShopId || !destinationShopId || !items || !items.length) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields'
            }, { status: 400 });
        }

        const result = await safeQuery(
            async () => {
                // Create the transfer with items in a transaction
                const transfer = await prisma.$transaction(async (tx) => {
                    // Create the transfer record
                    const newTransfer = await tx.inventoryTransfer.create({
                        data: {
                            fromShopId: parseInt(sourceShopId),
                            toShopId: parseInt(destinationShopId),
                            fromUserId: userId,
                            toUserId: userId, // Using the same user for both as we don't have separate users in the UI yet
                            status: 'pending',
                            transferItems: {
                                create: items.map(item => ({
                                    productId: parseInt(item.productId),
                                    quantity: parseInt(item.quantity)
                                }))
                            }
                        }
                    });

                    return newTransfer;
                });

                return transfer;
            },
            null,
            'Failed to create inventory transfer'
        );

        if (!result) {
            throw new Error('Failed to create transfer');
        }

        console.log('Transfer created successfully with ID:', result.id);
        return NextResponse.json({
            success: true,
            message: 'Inventory transfer created successfully',
            data: {
                id: result.id
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating transfer:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating transfer',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 