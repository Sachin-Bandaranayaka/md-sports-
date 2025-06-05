import { NextRequest } from 'next/server';
// import jwt from 'jsonwebtoken'; replaced
import * as jose from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development';
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Verify a JWT token
 */
export const verifyToken = async (token: string): Promise<jose.JWTPayload | null> => {
    try {
        const { payload } = await jose.jwtVerify(token, secretKey, {
            // Assuming HS256 algorithm, adjust if different
            // algorithms: ['HS256'] 
        });
        return payload;
    } catch (error: any) {
        if (error.code === 'ERR_JWT_EXPIRED') {
            console.error('Token expired:', error.message);
        } else if (error.code === 'ERR_JWS_INVALID' || error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED' || error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
            console.error('Invalid token:', error.message);
        } else {
            console.error('Token verification error:', error.message);
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
 * @returns Object with isValid flag and optional error message
 */
export const validateTokenPermission = async (req: NextRequest, permission: string): Promise<{ isValid: boolean; message?: string }> => {
    try {
        const token = extractToken(req);
        console.log(`Checking permission "${permission}" with token: ${token ? `${token.substring(0, 10)}...` : 'none'}`);

        if (!token) {
            console.error('No token provided when checking permission:', permission);
            return { isValid: false, message: 'Authentication required' };
        }

        // Special case for development token
        if (token === 'dev-token') {
            console.log(`Development mode: granting permission '${permission}'`);
            return { isValid: true };
        }

        const payload = await verifyToken(token);
        console.log('Token payload:', payload);

        if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
            console.error('Invalid token payload when checking permission:', permission);
            return { isValid: false, message: 'Invalid authentication token' };
        }

        const userId = Number(payload.sub);

        // Check if permission is in the token payload directly
        if (payload.permissions && Array.isArray(payload.permissions)) {
            const hasPermission = payload.permissions.includes(permission);
            console.log(`Permission check from token for "${permission}": ${hasPermission ? 'GRANTED' : 'DENIED'}`);
            
            if (hasPermission) {
                return { isValid: true };
            }
        }

        // If not in token or as fallback, get user with permissions from database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            console.error(`User not found for ID: ${userId}`);
            return { isValid: false, message: 'User not found' };
        }

        if (!user.permissions || !Array.isArray(user.permissions)) {
            console.error(`User ${userId} has no permissions array`);
            return { isValid: false, message: 'User has no permissions' };
        }

        // Check if user has the required permission
        console.log(`User ${userId} permissions:`, user.permissions);
        const hasPermission = user.permissions.includes(permission);
        console.log(`Permission check result for "${permission}": ${hasPermission ? 'GRANTED' : 'DENIED'}`);

        return {
            isValid: hasPermission,
            message: hasPermission ? undefined : `Permission denied: '${permission}' is required`
        };
    } catch (error) {
        console.error(`Error checking permission ${permission}:`, error);
        return { isValid: false, message: `Error checking permission: ${error instanceof Error ? error.message : String(error)}` };
    }
};

/**
 * Get user ID from token
 */
export const getUserIdFromToken = async (req: NextRequest): Promise<number | null> => {
    const token = extractToken(req);

    if (!token) {
        return null;
    }

    // Special case for development token
    if (token === 'dev-token') {
        return 1; // Development user ID
    }

    const payload = await verifyToken(token);

    if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
        return null;
    }

    return Number(payload.sub);
};

/**
 * Get shop ID from token
 */
export const getShopIdFromToken = async (req: NextRequest): Promise<number | null> => {
    const token = extractToken(req);

    if (!token) {
        return null;
    }

    // Special case for development token
    if (token === 'dev-token') {
        return null; // Development user might not have a shop
    }

    const payload = await verifyToken(token);

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    // Extract shop ID from token 
    return 'shopId' in payload ? Number(payload.shopId) : null;
}; 