import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserFromToken } from '@/services/authService';

export async function GET(req: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, message: 'No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        const tokenData = verifyToken(token);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get user data from token
        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found or inactive' },
                { status: 401 }
            );
        }

        // Return user data
        const role = user.get('role') as { name: string; permissions?: Array<{ name: string }> };
        const permissions = role?.permissions?.map((p: { name: string }) => p.name) || [];

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                roleId: user.roleId,
                roleName: role?.name,
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