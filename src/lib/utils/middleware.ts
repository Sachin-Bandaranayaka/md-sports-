import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyToken, getUserFromToken, hasPermission } from '@/services/authService';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development';

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
                console.log('Using development token - skipping verification');
                return null;
            }

            // Use optimized cached authentication
            const user = await getUserFromToken(token);

            if (!user) {
                return NextResponse.json(
                    { success: false, message: 'Invalid token or user not found' },
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
        try {
            const token = req.headers.get('authorization')?.replace('Bearer ', '');
            console.log(`Checking permission: ${permission} for token: ${token?.substring(0, 10)}...`);

            if (!token) {
                return NextResponse.json(
                    { success: false, message: 'Authentication required' },
                    { status: 401 }
                );
            }

            // Special case for development token - only grant basic permissions, not admin
            if (token === 'dev-token') {
                const allowedDevPermissions = [
                    'shop:distribution:view',
                    'read:products',
                    'write:products', 
                    'read:invoices',
                    'write:invoices',
                    'user:manage',
                    'shop:manage',
                    'inventory:manage',
                    'settings:manage',
                    'sales:manage',
                    'sales:create:shop'
                ];
                
                if (allowedDevPermissions.includes(permission)) {
                    console.log(`Development mode: granting permission '${permission}'`);
                    return null;
                } else {
                    console.log(`Development mode: denying admin permission '${permission}'`);
                    return NextResponse.json(
                        { success: false, message: `Permission denied: ${permission}` },
                        { status: 403 }
                    );
                }
            }

            // Verify the token to get the payload first
            const tokenPayload = await verifyToken(token);
            if (!tokenPayload) {
                console.error('Invalid token - payload could not be verified');
                return NextResponse.json(
                    { success: false, message: 'Invalid token' },
                    { status: 401 }
                );
            }

            // Now pass the TokenPayload object to hasPermission
            const userHasPermission = await hasPermission(tokenPayload, permission);

            if (!userHasPermission) {
                console.error(`Permission denied: ${permission}`);
                return NextResponse.json(
                    { success: false, message: `Permission denied: ${permission}` },
                    { status: 403 }
                );
            }

            console.log(`Permission granted: ${permission}`);
            return null;
        } catch (error) {
            console.error(`Permission check error for ${permission}:`, error);
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
export async function getUserId(req: NextRequest): Promise<number | null> {
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
        // Use optimized cached user lookup
        const user = await getUserFromToken(token);
        return user ? user.id : null;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

/**
 * Get user's shop ID from token
 * Used for shop-specific operations
 */
export async function getShopId(req: NextRequest): Promise<number | null> {
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
        // Use optimized cached user lookup
        const user = await getUserFromToken(token);
        return user ? user.shopId : null;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}