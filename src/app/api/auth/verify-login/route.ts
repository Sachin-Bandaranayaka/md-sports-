import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import prisma, { safeQuery } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Try to find the user directly from the database with retry logic
        const user = await safeQuery(
            () => prisma.user.findFirst({
                where: {
                    email: email,
                    isActive: true
                }
            }),
            null,
            'Failed to find user during login verification'
        );

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found',
                email
            });
        }

        // Get stored password hash
        const storedHash = user.password;

        // Test with the provided password
        const isMatch = await bcrypt.compare(password, storedHash);

        // Hash a new password for comparison
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash('password', salt);

        return NextResponse.json({
            success: true,
            userFound: true,
            passwordMatch: isMatch,
            userInfo: {
                id: user.id,
                name: user.name,
                email: user.email,
                storedPasswordHash: storedHash,
                newGeneratedHash: newHash,
                passwordCompareResult: isMatch
            }
        });
    } catch (error) {
        console.error('Verify login error:', error);
        return NextResponse.json(
            { success: false, message: 'Verification failed', error: (error as Error).message },
            { status: 500 }
        );
    }
}