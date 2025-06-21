import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

/**
 * Helper function to execute Prisma queries with retry logic for prepared statement conflicts
 */
const executeWithRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            // Check if this is a prepared statement conflict error
            if (error?.code === '42P05' && attempt < maxRetries) {
                console.log(`Prepared statement conflict detected, retrying... (attempt ${attempt}/${maxRetries})`);
                // Exponential backoff: wait longer between retries
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
                continue;
            }
            // If it's not a retryable error or we've exhausted retries, throw the error
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
};

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
        const user = await executeWithRetry(() =>
            prisma.user.findFirst({
                where: {
                    email: email,
                    isActive: true
                }
            })
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