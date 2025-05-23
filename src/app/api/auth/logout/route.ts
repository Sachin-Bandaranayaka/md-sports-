import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken } from '@/services/refreshTokenService';

export async function POST(req: NextRequest) {
    try {
        // Get refresh token from request body or cookies
        const { refreshToken } = await req.json().catch(() => ({}));
        const cookieRefreshToken = req.cookies.get('refreshToken')?.value;
        const token = refreshToken || cookieRefreshToken;

        // If token exists, revoke it
        if (token) {
            await revokeRefreshToken(token);
        }

        // Create response and clear all authentication cookies
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });

        // Clear auth cookies
        response.cookies.set({
            name: 'accessToken',
            value: '',
            httpOnly: true,
            expires: new Date(0),
            path: '/'
        });

        response.cookies.set({
            name: 'refreshToken',
            value: '',
            httpOnly: true,
            expires: new Date(0),
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({
            success: false,
            message: 'Logout failed'
        }, { status: 500 });
    }
} 