import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { verifyRefreshToken } from '@/services/refreshTokenService';
import { parseTimeStringToSeconds } from '@/services/authService';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION';
const JWT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
    try {
        // Prioritize refresh token from httpOnly cookie
        const cookieRefreshToken = req.cookies.get('refreshToken')?.value;
        let tokenFromBody = null;

        // Attempt to parse body only if cookie is not present, and be careful with empty/malformed bodies
        if (!cookieRefreshToken) {
            try {
                const body = await req.json();
                tokenFromBody = body?.refreshToken;
            } catch (e) {
                // Ignore error if body is empty or not valid JSON, cookie is the preferred method
                console.log('No JSON body or refreshToken field in body, relying on cookie if present.');
            }
        }

        const tokenToVerify = cookieRefreshToken || tokenFromBody;

        console.log('Refresh token request received', {
            hasCookieToken: !!cookieRefreshToken,
            hasTokenFromBody: !!tokenFromBody,
        });

        if (!tokenToVerify) {
            console.log('No refresh token provided in cookie or body');
            return NextResponse.json({
                success: false,
                message: 'Refresh token is required'
            }, { status: 400 });
        }

        // Verify refresh token (this comes from refreshTokenService)
        let userId;
        try {
            userId = await verifyRefreshToken(tokenToVerify);
        } catch (error) {
            console.error('Error during refresh token verification:', error);
            // verifyRefreshToken itself should handle logging details of the error.
            return NextResponse.json({
                success: false,
                message: 'Refresh token verification failed' // Generic message
            }, { status: 401 });
        }

        if (!userId) {
            console.log('Invalid, expired, or revoked refresh token. Token used:', tokenToVerify.substring(0, 10) + '...');
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

        const permissions = user.role.permissions.map(p => p.name);

        const newAccessToken = jwt.sign({
            sub: user.id,
            username: user.name,
            email: user.email,
            roleId: user.roleId,
            permissions,
            shopId: user.shopId
        }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN });

        console.log('Generated new access token for user:', user.id);

        const response = NextResponse.json({
            success: true,
            accessToken: newAccessToken,
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

        // Set the new access token in an httpOnly cookie as well
        response.cookies.set({
            name: 'accessToken',
            value: newAccessToken,
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: parseTimeStringToSeconds(JWT_ACCESS_TOKEN_EXPIRES_IN),
            path: '/'
        });

        // IMPORTANT: If you implement refresh token rotation, generate a new refresh token here
        // and set it in the 'refreshToken' cookie, potentially revoking the old one.

        return response;
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to refresh token'
        }, { status: 500 });
    }
} 