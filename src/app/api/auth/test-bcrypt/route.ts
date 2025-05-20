import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
    try {
        // Test password hashing
        const testPassword = 'password';

        // Generate a salt
        const salt = await bcrypt.genSalt(10);

        // Hash the password
        const hashedPassword = await bcrypt.hash(testPassword, salt);

        // Compare the password with the hash
        const isMatch = await bcrypt.compare(testPassword, hashedPassword);

        // Compare with a known hash from our database
        const dbHash = '$2b$10$r249vbhhSVlwwCM7bO0v9e3CS9lXfD5M7ySVU2ECMQwEn1WhHBY8a';
        const dbMatch = await bcrypt.compare(testPassword, dbHash);

        // Test with a wrong password
        const wrongMatch = await bcrypt.compare('wrongpassword', dbHash);

        return NextResponse.json({
            success: true,
            testResults: {
                hashedPassword,
                isMatch,
                dbHash,
                dbMatch,
                wrongMatch
            }
        });
    } catch (error) {
        console.error('Bcrypt test error:', error);
        return NextResponse.json(
            { success: false, message: 'Test failed', error: (error as Error).message },
            { status: 500 }
        );
    }
} 