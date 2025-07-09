import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { verifyRefreshToken, generateRefreshToken } from '@/services/refreshTokenService';
import { generateToken, parseTimeStringToSeconds } from '@/services/authService';
import prisma, { safeQuery } from '@/lib/prisma';

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
            tokenSource: cookieRefreshToken ? 'cookie' : 'body',
            tokenPreview: tokenToVerify ? tokenToVerify.substring(0, 10) + '...' : 'none'
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

        // Get user data to include in new token with retry logic
        const user = await safeQuery(
            () => prisma.user.findFirst({
                where: {
                    id: String(userId),
                    isActive: true
                },
                include: {
                    role: {
                        include: {
                            permissions: true
                        }
                    }
                }
            }),
            null,
            'Failed to find user during token refresh'
        );

        if (!user) {
            console.log('User not found or inactive for ID:', userId);
            return NextResponse.json({
                success: false,
                message: 'User not found or inactive'
            }, { status: 401 });
        }

        // Log user details to help debug session switching
        console.log('Token refresh for user:', {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            roleName: user.role?.name || user.roleName,
            shopId: user.shopId
        });

        // Handle case where user has no role assigned but may have direct permissions
        let permissions: string[] = [];
        
        if (user.role) {
            // User has a role, get permissions from role
            permissions = user.role.permissions.map((p: { name: string }) => p.name);
        } else if (user.permissions && user.permissions.length > 0) {
            // User has no role but has direct permissions
            permissions = user.permissions;
            console.log('User has no role but has direct permissions for ID:', userId, 'Permissions:', permissions);
        } else {
            // User has neither role nor permissions
            console.log('User has no role and no permissions assigned for ID:', userId);
            return NextResponse.json({
                success: false,
                message: 'User has no role or permissions assigned'
            }, { status: 401 });
        }

        const newAccessToken = jwt.sign({
            sub: user.id,
            username: user.name,
            email: user.email,
            roleId: user.roleId,
            roleName: user.role?.name || user.roleName || null,
            permissions,
            shopId: user.shopId
        }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN } as any);

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
                roleName: user.role?.name || user.roleName || null,
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