import { NextRequest, NextResponse } from 'next/server';
import { User, Role } from '@/lib/models';
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

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['passwordHash'] },
            include: [
                {
                    model: Role,
                    attributes: ['id', 'name']
                }
            ]
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

        const user = await User.findByPk(userId);
        if (!user) {
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

        // Prepare update object
        const updateData: any = {};

        if (fullName !== undefined) updateData.fullName = fullName;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (roleId !== undefined) updateData.roleId = roleId;
        if (shopId !== undefined) updateData.shopId = shopId;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Hash password if provided
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        // Update user
        await user.update(updateData);

        // Return updated user without password
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['passwordHash'] },
            include: [
                {
                    model: Role,
                    attributes: ['id', 'name']
                }
            ]
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

// DELETE: Delete user
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

        const user = await User.findByPk(userId);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Instead of hard delete, set isActive to false
        await user.update({ isActive: false });

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