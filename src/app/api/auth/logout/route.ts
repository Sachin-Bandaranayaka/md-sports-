import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken } from '@/services/refreshTokenService';
import { cacheService, CACHE_CONFIG } from '@/lib/cache';
import { getUserIdFromToken } from '@/lib/auth';

const COOKIE_SECURE = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
    console.log('Logout request received');
    try {
        const refreshTokenFromCookie = req.cookies.get('refreshToken')?.value;

        // Get the user ID to clear their cache
        let userId: string | null = null;
        try {
            userId = await getUserIdFromToken(req);
        } catch (error) {
            console.log('Could not get user ID from token during logout:', error);
        }

        if (refreshTokenFromCookie) {
            try {
                await revokeRefreshToken(refreshTokenFromCookie);
                console.log('Refresh token revoked successfully:', refreshTokenFromCookie.substring(0, 10) + '...');
            } catch (error) {
                // Log the error but continue to clear cookies as a best effort
                console.error('Error revoking refresh token:', error);
            }
        } else {
            console.log('No refresh token cookie found to revoke.');
        }

        // Clear user's cached session data if we have the user ID
        if (userId) {
            console.log('Clearing cached session data for user:', userId);
            await cacheService.invalidateAllUserAuth(userId);
        }

        const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

        // Clear accessToken cookie
        response.cookies.set({
            name: 'accessToken',
            value: '',
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: -1, // Expire immediately
            path: '/'
        });

        // Clear refreshToken cookie
        response.cookies.set({
            name: 'refreshToken',
            value: '',
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: -1, // Expire immediately
            path: '/'
        });

        console.log('Auth cookies cleared.');
        return response;
    } catch (error: any) {
        console.error('Logout error:', error);
        // Still attempt to clear cookies in the response even if an unexpected error occurs
        const errorResponse = NextResponse.json(
            { success: false, message: 'Logout failed' },
            { status: 500 }
        );
        errorResponse.cookies.set({
            name: 'accessToken',
            value: '',
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: -1,
            path: '/'
        });
        errorResponse.cookies.set({
            name: 'refreshToken',
            value: '',
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: -1,
            path: '/'
        });
        return errorResponse;
    }
} 