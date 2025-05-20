import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// POST: Reset user password
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        // Parse the ID as a number
        const userId = parseInt(params.id);

        if (isNaN(userId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid user ID' },
                { status: 400 }
            );
        }

        // Get the request body
        const { newPassword } = await req.json();

        if (!newPassword) {
            return NextResponse.json(
                { success: false, message: 'New password is required' },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password using Prisma
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        if (!updatedUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json(
            { success: false, message: 'Error resetting password' },
            { status: 500 }
        );
    }
} 