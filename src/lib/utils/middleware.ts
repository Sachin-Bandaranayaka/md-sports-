import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import db from '@/utils/db';

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

            // Verify the token
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(JWT_SECRET)
            );

            if (!payload.sub) {
                return NextResponse.json(
                    { success: false, message: 'Invalid token' },
                    { status: 401 }
                );
            }

            // Check if user exists and is active
            const userResult = await db.query(
                'SELECT * FROM users WHERE id = $1 AND is_active = true',
                [payload.sub]
            );

            if (userResult.rows.length === 0) {
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
            const { payload } = await jwtVerify(
                token!,
                new TextEncoder().encode(JWT_SECRET)
            );

            // Get user's permissions based on their role
            const permissionsResult = await db.query(`
                SELECT p.name
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN users u ON u.role_id = rp.role_id
                WHERE u.id = $1
            `, [payload.sub]);

            const userPermissions = permissionsResult.rows.map(row => row.name);

            // Check if user has the required permission
            if (!userPermissions.includes(permission)) {
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
    const tokenData = verifyToken(token);

    return tokenData ? tokenData.userId : null;
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
    const tokenData = verifyToken(token);

    // This assumes shop ID is stored in the token
    // You might need to fetch from database depending on your implementation
    return tokenData ? (tokenData as any).shopId : null;
} 