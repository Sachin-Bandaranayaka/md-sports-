import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development';

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.error('Token expired:', error.expiredAt);
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.error('Invalid token:', error.message);
        } else {
            console.error('Token verification error:', error);
        }
        return null;
    }
};

/**
 * Extract token from authorization header
 */
export const extractToken = (req: NextRequest): string | null => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};

/**
 * Validate if a user has a specific permission
 * @param req - Next.js request object
 * @param permission - Permission string to check
 * @returns Boolean indicating if user has permission
 */
export const validateTokenPermission = async (req: NextRequest, permission: string): Promise<boolean> => {
    try {
        const token = extractToken(req);
        console.log(`Checking permission "${permission}" with token: ${token ? `${token.substring(0, 10)}...` : 'none'}`);

        if (!token) {
            console.error('No token provided when checking permission:', permission);
            return false;
        }

        // Special case for development token
        if (token === 'dev-token') {
            console.log(`Development mode: granting permission '${permission}'`);
            return true;
        }

        const payload = verifyToken(token);
        console.log('Token payload:', payload);

        if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
            console.error('Invalid token payload when checking permission:', permission);
            return false;
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

        if (!user) {
            console.error(`User not found for ID: ${userId}`);
            return false;
        }

        if (!user.role) {
            console.error(`User ${userId} has no role assigned`);
            return false;
        }

        if (!user.role.permissions || !Array.isArray(user.role.permissions)) {
            console.error(`User ${userId} with role ${user.roleId} has no permissions`);
            return false;
        }

        // Check if user has the required permission
        const permissions = user.role.permissions.map(p => p.name);
        console.log(`User ${userId} permissions:`, permissions);
        const hasPermission = permissions.includes(permission);
        console.log(`Permission check result for "${permission}": ${hasPermission ? 'GRANTED' : 'DENIED'}`);

        return hasPermission;
    } catch (error) {
        console.error(`Error checking permission ${permission}:`, error);
        return false;
    }
};

/**
 * Get user ID from token
 */
export const getUserIdFromToken = (req: NextRequest): number | null => {
    const token = extractToken(req);

    if (!token) {
        return null;
    }

    // Special case for development token
    if (token === 'dev-token') {
        return 1; // Development user ID
    }

    const payload = verifyToken(token);

    if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
        return null;
    }

    return Number(payload.sub);
};

/**
 * Get shop ID from token
 */
export const getShopIdFromToken = (req: NextRequest): number | null => {
    const token = extractToken(req);

    if (!token) {
        return null;
    }

    // Special case for development token
    if (token === 'dev-token') {
        return null; // Development user might not have a shop
    }

    const payload = verifyToken(token);

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    // Extract shop ID from token 
    return 'shopId' in payload ? Number(payload.shopId) : null;
}; 