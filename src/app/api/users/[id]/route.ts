import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/utils/middleware';
import bcrypt from 'bcryptjs';

// GET: Get user by ID
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const userId = parseInt(params.id);

        if (isNaN(userId)) {
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
        console.error(`Error fetching user with ID ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

// PUT: Update user
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const userId = parseInt(params.id);

        if (isNaN(userId)) {
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

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error(`Error updating user with ID ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE: Deactivate user (soft delete)
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const userId = parseInt(params.id);

        if (isNaN(userId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid user ID' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Instead of hard delete, set isActive to false
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
        });

        return NextResponse.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        console.error(`Error deleting user with ID ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete user' },
            { status: 500 }
        );
    }
}