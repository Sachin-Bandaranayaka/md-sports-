import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserFromDecodedPayload } from '@/services/authService';
import jwt from 'jsonwebtoken'; // Import jwt to access error types

export async function GET(req: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('No valid Authorization header found');
            return NextResponse.json(
                { success: false, message: 'No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        console.log('Token received for validation:', token.substring(0, 10) + '...');

        // verifyToken will now throw if token is invalid/expired
        const tokenData = verifyToken(token);

        // If verifyToken didn't throw, tokenData is valid and populated
        const user = await getUserFromDecodedPayload(tokenData);

        if (!user) {
            console.error('User not found from token payload or user is inactive');
            return NextResponse.json(
                { success: false, message: 'User not found or inactive' },
                { status: 401 }
            );
        }

        // Permissions are now part of the user object returned by getUserFromDecodedPayload
        console.log('User validated successfully:', user.id, user.username, 'with permissions:', user.permissions);

        // Return user data
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.name,
                email: user.email,
                roleId: user.roleId,
                roleName: user.roleName,
                shopId: user.shopId,
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error('Token validation error in GET /api/auth/validate:', error);
        if (error instanceof jwt.TokenExpiredError) {
            return NextResponse.json(
                { success: false, message: 'Token expired', errorType: 'TOKEN_EXPIRED' },
                { status: 401 }
            );
        }
        if (error instanceof jwt.JsonWebTokenError) { // Catches other JWT errors (e.g. invalid signature)
            return NextResponse.json(
                { success: false, message: 'Invalid token', errorType: 'TOKEN_INVALID' },
                { status: 401 }
            );
        }
        // Fallback for other unexpected errors not related to JWT verification specifically
        return NextResponse.json(
            { success: false, message: 'Token validation failed due to an unexpected error' },
            { status: 500 }
        );
    }
} 