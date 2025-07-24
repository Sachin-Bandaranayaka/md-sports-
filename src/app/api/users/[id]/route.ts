import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/utils/middleware';
import { auditService } from '@/services/auditService';
import { verifyToken, extractToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET: Get user by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        // Await params before using its properties
        const resolvedParams = await params;
        const userId = resolvedParams.id;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Invalid user ID' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                roleId: true,
                shopId: true,
                roleName: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                shop: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user
        });
    } catch (error) {
        console.error(`Error fetching user:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

// PUT: Update user
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        // Await params before using its properties
        const resolvedParams = await params;
        const userId = resolvedParams.id;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Invalid user ID' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        const body = await req.json();
        const {
            name,
            email,
            phone,
            password,
            roleId,
            shop,
            permissions,
            isActive
        } = body;

        console.log('Received user update data:', body);

        // Validation
        if (!name) {
            return NextResponse.json(
                { success: false, message: 'Name is required' },
                { status: 400 }
            );
        }

        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email is required' },
                { status: 400 }
            );
        }

        if (!shop) {
            return NextResponse.json(
                { success: false, message: 'Shop assignment is required' },
                { status: 400 }
            );
        }

        if (!permissions || permissions.length === 0) {
            return NextResponse.json(
                { success: false, message: 'At least one permission is required' },
                { status: 400 }
            );
        }

        // Check if email is already taken by another user
        const emailExists = await prisma.user.findFirst({
            where: {
                email: email,
                id: { not: userId }
            }
        });

        if (emailExists) {
            return NextResponse.json(
                { success: false, message: 'Email is already taken by another user' },
                { status: 400 }
            );
        }

        // Prepare update data
        const updateData: any = {
            name: name,
            email: email,
            shopId: shop ? parseInt(shop) : null,
            permissions: permissions || [],
        };

        if (phone !== undefined) updateData.phone = phone;
        if (roleId !== undefined) updateData.roleId = roleId;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Hash password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }

        console.log('Final user update data:', updateData);

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                roleId: true,
                shopId: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                shop: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Log audit trail for user update
        try {
            const token = extractToken(req);
            if (token) {
                const decoded = verifyToken(token);
                if (decoded?.userId) {
                    await auditService.logAction({
                        action: 'UPDATE',
                        entityType: 'user',
                        entityId: userId,
                        userId: decoded.userId,
                        details: {
                            name: updatedUser.name,
                            email: updatedUser.email,
                            phone: updatedUser.phone,
                            roleId: updatedUser.roleId,
                            shopId: updatedUser.shopId,
                            permissions: updatedUser.permissions,
                            isActive: updatedUser.isActive
                        }
                    });
                }
            }
        } catch (auditError) {
            console.error('Failed to log audit trail for user update:', auditError);
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error(`Error updating user:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE: Delete user
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        // Await params before using its properties
        const resolvedParams = await params;
        const userId = resolvedParams.id;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Invalid user ID' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Soft delete user using audit service
        try {
            const token = extractToken(req);
            if (token) {
                const decoded = verifyToken(token);
                if (decoded?.userId) {
                    await auditService.softDelete({
                        entityType: 'user',
                        entityId: userId,
                        userId: decoded.userId,
                        originalData: existingUser
                    });
                }
            }
        } catch (auditError) {
            console.error('Failed to log audit trail for user deletion:', auditError);
        }

        // Hard delete user from database
        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting user:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete user' },
            { status: 500 }
        );
    }
}