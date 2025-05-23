import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { verifyRefreshToken } from '@/services/refreshTokenService';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION';
const JWT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
    try {
        // Get refresh token from request
        const { refreshToken } = await req.json().catch(() => ({}));

        // Alternative: get refresh token from cookies
        const cookieRefreshToken = req.cookies.get('refreshToken')?.value;

        // Also try to get from Authorization header as fallback
        const authHeader = req.headers.get('authorization');
        const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        const token = refreshToken || cookieRefreshToken || headerToken;

        console.log('Refresh token request received', {
            hasJsonToken: !!refreshToken,
            hasCookieToken: !!cookieRefreshToken,
            hasHeaderToken: !!headerToken
        });

        if (!token) {
            console.log('No refresh token provided');
            return NextResponse.json({
                success: false,
                message: 'Refresh token is required'
            }, { status: 400 });
        }

        // Verify refresh token
        let userId;
        try {
            userId = await verifyRefreshToken(token);
        } catch (error) {
            console.error('Error during refresh token verification:', error);
            return NextResponse.json({
                success: false,
                message: 'Refresh token verification failed'
            }, { status: 401 });
        }

        if (!userId) {
            console.log('Invalid or expired refresh token');
            return NextResponse.json({
                success: false,
                message: 'Invalid or expired refresh token'
            }, { status: 401 });
        }

        console.log('Valid refresh token for user ID:', userId);

        // Get user data to include in new token
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                isActive: true
            },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });

        if (!user) {
            console.log('User not found or inactive for ID:', userId);
            return NextResponse.json({
                success: false,
                message: 'User not found or inactive'
            }, { status: 401 });
        }

        // Extract permissions
        const permissions = user.role.permissions.map(p => p.name);

        // Generate new access token
        const accessToken = jwt.sign({
            sub: user.id,
            username: user.name,
            email: user.email,
            roleId: user.roleId,
            permissions,
            shopId: user.shopId
        }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN });

        console.log('Generated new access token for user:', user.id);

        // Create response with new access token
        const response = NextResponse.json({
            success: true,
            accessToken,
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

        // Set HTTP-only cookie for access token
        response.cookies.set({
            name: 'accessToken',
            value: accessToken,
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: 60 * 15, // 15 minutes in seconds
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to refresh token'
        }, { status: 500 });
    }
} 