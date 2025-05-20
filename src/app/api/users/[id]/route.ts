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
                createdAt: true,
                updatedAt: true,
                role: {
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
            fullName,
            email,
            phone,
            password,
            roleId,
            shopId,
            isActive
        } = body;

        // Prepare update data
        const updateData: any = {};

        if (fullName !== undefined) updateData.name = fullName; // name field in Prisma
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (roleId !== undefined) updateData.roleId = roleId;
        if (shopId !== undefined) updateData.shopId = shopId;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Hash password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }

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
                createdAt: true,
                updatedAt: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            user: updatedUser
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