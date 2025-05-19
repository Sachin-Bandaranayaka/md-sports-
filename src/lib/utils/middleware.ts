import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hasPermission } from '../../services/authService';

/**
 * Authentication middleware to verify JWT token
 */
export async function authMiddleware(req: NextRequest) {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { success: false, message: 'Authentication required' },
            { status: 401 }
        );
    }

    const token = authHeader.split(' ')[1];
    const tokenData = verifyToken(token);

    if (!tokenData) {
        return NextResponse.json(
            { success: false, message: 'Invalid or expired token' },
            { status: 401 }
        );
    }

    // Token is valid, proceed
    return null;
}

/**
 * Authorization middleware to check for specific permissions
 */
export function requirePermission(permission: string) {
    return async (req: NextRequest) => {
        // First authenticate
        const authError = await authMiddleware(req);
        if (authError) {
            return authError;
        }

        // Get token from header
        const token = req.headers.get('authorization')!.split(' ')[1];
        const tokenData = verifyToken(token);

        // Check permission
        if (!hasPermission(tokenData!, permission)) {
            return NextResponse.json(
                { success: false, message: 'Permission denied' },
                { status: 403 }
            );
        }

        // User has permission, proceed
        return null;
    };
}

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