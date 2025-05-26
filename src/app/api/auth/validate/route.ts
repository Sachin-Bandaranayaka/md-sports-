import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserFromDecodedPayload } from '@/services/authService';

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

        const tokenData = verifyToken(token);

        if (!tokenData) {
            console.error('Token verification failed or token is invalid/expired');
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token', expired: true },
                { status: 403 }
            );
        }

        // Get user data using the decoded tokenData (payload)
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
        console.error('Token validation error:', error);
        if ((error as any).name === 'TokenExpiredError') {
            return NextResponse.json(
                { success: false, message: 'Token expired', expired: true },
                { status: 403 }
            );
        }
        return NextResponse.json(
            { success: false, message: 'Token validation failed' },
            { status: 500 }
        );
    }
} 