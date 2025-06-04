import { NextRequest, NextResponse } from 'next/server';
import { generateRefreshToken } from '@/services/refreshTokenService';
import { authenticateUser, parseTimeStringToSeconds } from '@/services/authService';

// JWT configuration - use environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION';
const JWT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
    console.log('[LoginRoute] POST /api/auth/login hit!');
    try {
        const body = await req.json();
        const { email, password } = body;

        console.log('Login attempt for email:', email);

        // Validate request body
        if (!email || !password) {
            console.log('Missing email or password');
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Use optimized authentication service
        console.time('total authentication time');
        const authResult = await authenticateUser(email, password);
        console.timeEnd('total authentication time');

        if (!authResult.success) {
            console.log('Authentication failed:', authResult.message);
            return NextResponse.json(
                { success: false, message: authResult.message },
                { status: 401 }
            );
        }

        const { token: accessToken, user } = authResult;
        console.log('User permissions:', user?.permissions);

        console.log('[LoginRoute] COOKIE_SECURE value:', COOKIE_SECURE);
        console.log('[LoginRoute] AccessToken value before setting cookie:', accessToken ? accessToken.substring(0, 20) + '...' : 'EMPTY/NULL');

        // Generate refresh token - with fallback if it fails
        let refreshToken = null;
        try {
            refreshToken = user ? await generateRefreshToken(user.id) : null;
            console.log('Successfully generated refresh token');
        } catch (error) {
            console.error('Failed to generate refresh token, continuing with login without refresh token:', error);
            // We'll continue with login even if refresh token generation fails
        }

        // Create response object with cookies
        const response = NextResponse.json({
            success: true,
            accessToken,
            refreshToken,
            user
        });

        // Set HTTP-only cookies for tokens (more secure approach)
        response.cookies.set({
            name: 'accessToken',
            value: accessToken || '',
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: parseTimeStringToSeconds(JWT_ACCESS_TOKEN_EXPIRES_IN),
            path: '/'
        });

        // Only set refresh token cookie if we have one
        if (refreshToken) {
            response.cookies.set({
                name: 'refreshToken',
                value: refreshToken,
                httpOnly: true,
                secure: COOKIE_SECURE,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
                path: '/'
            });
        }

        console.log('Login successful for user:', user?.username);
        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 500 }
        );
    }
}