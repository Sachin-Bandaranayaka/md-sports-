import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development';

/**
 * Verify a JWT token using jose
 */
async function verifyJWT(token: string) {
    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        );
        return payload;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

/**
 * Middleware to require authentication
 */
export const requireAuth = () => {
    return async (req: NextRequest) => {
        try {
            const token = req.headers.get('authorization')?.replace('Bearer ', '');

            if (!token) {
                return NextResponse.json(
                    { success: false, message: 'Authentication required' },
                    { status: 401 }
                );
            }

            // Special case for development token
            if (token === 'dev-token') {
                // For development, accept a hardcoded token and skip verification
                // In a production environment, you would never do this
                console.log('Using development token - skipping verification');
                return null;
            }

            // Verify the token
            const payload = await verifyJWT(token);

            if (!payload || !payload.sub) {
                return NextResponse.json(
                    { success: false, message: 'Invalid token' },
                    { status: 401 }
                );
            }

            // Check if user exists and is active
            const user = await prisma.user.findFirst({
                where: {
                    id: Number(payload.sub),
                    isActive: true
                }
            });

            if (!user) {
                return NextResponse.json(
                    { success: false, message: 'User not found or inactive' },
                    { status: 401 }
                );
            }

            // User is authenticated
            return null;
        } catch (error) {
            console.error('Auth error:', error);
            return NextResponse.json(
                { success: false, message: 'Authentication failed' },
                { status: 401 }
            );
        }
    };
};

/**
 * Middleware to require specific permission
 */
export const requirePermission = (permission: string) => {
    return async (req: NextRequest) => {
        // First check if user is authenticated
        const authError = await requireAuth()(req);
        if (authError) {
            return authError;
        }

        try {
            const token = req.headers.get('authorization')?.replace('Bearer ', '');

            // Special case for development token
            if (token === 'dev-token') {
                // In development mode with dev-token, grant all permissions
                console.log(`Development mode: granting permission '${permission}'`);
                return null;
            }

            const payload = await verifyJWT(token!);

            if (!payload || !payload.sub) {
                return NextResponse.json(
                    { success: false, message: 'Invalid token' },
                    { status: 401 }
                );
            }

            const userId = Number(payload.sub);

            // Get user's role with permissions
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    role: {
                        include: {
                            permissions: true
                        }
                    }
                }
            });

            if (!user || !user.role || !user.role.permissions) {
                return NextResponse.json(
                    { success: false, message: 'User role or permissions not found' },
                    { status: 403 }
                );
            }

            // Check if user has the required permission
            const hasPermission = user.role.permissions.some(p => p.name === permission);

            if (!hasPermission) {
                return NextResponse.json(
                    { success: false, message: 'Permission denied' },
                    { status: 403 }
                );
            }

            // User has the required permission
            return null;
        } catch (error) {
            console.error('Permission check error:', error);
            return NextResponse.json(
                { success: false, message: 'Permission check failed' },
                { status: 500 }
            );
        }
    };
};

/**
 * Get user ID from token
 */
export function getUserId(req: NextRequest): number | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    // Special case for development token
    if (token === 'dev-token') {
        return 1; // Development user ID
    }

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        return typeof decodedToken === 'object' && decodedToken.sub ?
            Number(decodedToken.sub) : null;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

/**
 * Get user's shop ID from token
 * Used for shop-specific operations
 */
export function getShopId(req: NextRequest): number | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    // Special case for development token
    if (token === 'dev-token') {
        return null; // Development user might not have a shop
    }

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        return typeof decodedToken === 'object' && decodedToken.shopId ?
            Number(decodedToken.shopId) : null;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
} 