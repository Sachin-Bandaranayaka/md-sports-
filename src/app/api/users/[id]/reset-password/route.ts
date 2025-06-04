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

        // Generate a new temporary password
        const newPassword = generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(newPassword, 12);

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
            message: 'Password reset successfully',
            newPassword: newPassword // In production, this should be sent via email instead
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to reset password' },
            { status: 500 }
        );
    }
}

// Generate a temporary password
function generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}