import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { generateRefreshToken } from '@/services/refreshTokenService';
import { parseTimeStringToSeconds } from '@/services/authService';

// JWT configuration - use environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION';
const JWT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
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

        // Find user by email with related role and permissions
        const user = await prisma.user.findFirst({
            where: {
                email: email,
                isActive: true
            },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                },
                shop: true
            }
        });

        if (!user) {
            console.log('User not found with email:', email);
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        console.log('User found:', user.id, user.name, user.email);
        console.log('Stored password hash:', user.password);

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', passwordMatch);

        if (!passwordMatch) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Extract permissions
        const permissions = user.role.permissions.map(p => p.name);
        console.log('User permissions:', permissions);

        // Generate JWT access token with shorter expiration
        const accessToken = jwt.sign({
            sub: user.id, // Standard JWT claim for subject (user ID)
            username: user.name,
            email: user.email,
            roleId: user.roleId,
            permissions,
            shopId: user.shopId
        }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN });

        // Generate refresh token - with fallback if it fails
        let refreshToken = null;
        try {
            refreshToken = await generateRefreshToken(user.id);
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

        // Set HTTP-only cookies for tokens (more secure approach)
        response.cookies.set({
            name: 'accessToken',
            value: accessToken,
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

        console.log('Login successful for user:', user.name);
        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 500 }
        );
    }
} 