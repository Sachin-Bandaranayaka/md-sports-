import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserFromToken } from '@/services/authService';

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
            console.error('Token verification failed');
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get user data from token
        const user = await getUserFromToken(token);

        if (!user) {
            console.error('User not found from token');
            return NextResponse.json(
                { success: false, message: 'User not found or inactive' },
                { status: 401 }
            );
        }

        // Extract permissions from user with Prisma structure
        const permissions = user.role.permissions.map(p => p.name);
        console.log('User validated successfully:', user.id, user.name, 'with permissions:', permissions);

        // Return user data with field names matching the Prisma model
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.name,
                fullName: user.name,
                email: user.email,
                roleId: user.roleId,
                roleName: user.role.name,
                shopId: user.shopId,
                permissions
            }
        });
    } catch (error) {
        console.error('Token validation error:', error);
        return NextResponse.json(
            { success: false, message: 'Token validation failed' },
            { status: 500 }
        );
    }
} 