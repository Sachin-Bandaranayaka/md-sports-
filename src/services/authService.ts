import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { cacheService, CACHE_CONFIG } from '@/lib/cache';

// Secret key for JWT - should be moved to environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Changed token expiration to 12h (from 24h) for better security
const JWT_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '12h';

/**
 * Parses a time string like "15m", "2h", "1d" into seconds.
 * @param timeStr The time string.
 * @returns The number of seconds, or 0 if parsing fails.
 */
export const parseTimeStringToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const lastChar = timeStr.slice(-1);
    const num = parseInt(timeStr.slice(0, -1));

    if (isNaN(num)) return 0;

    switch (lastChar) {
        case 's': return num;
        case 'm': return num * 60;
        case 'h': return num * 60 * 60;
        case 'd': return num * 60 * 60 * 24;
        default: // If no unit, assume seconds if it's just a number string
            if (!isNaN(parseInt(timeStr))) return parseInt(timeStr);
            return 0;
    }
};

interface TokenPayload {
    sub: number; // User ID as 'sub' claim
    username: string;
    email: string;
    roleId: number;
    shopId?: number | null;
    permissions?: string[];
}

/**
 * Authenticate a user with email and password (optimized with single query)
 */
export const authenticateUser = async (email: string, password: string) => {
    try {
        console.time('user authentication query');
        // Optimized single query using the new composite index
        const user = await prisma.user.findFirst({
            where: {
                email: email,
                isActive: true
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            select: { name: true }
                        }
                    }
                }
            }
        });
        console.timeEnd('user authentication query');

        // If user not found
        if (!user) {
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }

        // Get permissions from role (handle case where user has no role)
        let permissions: string[] = [];
        if (user.role?.permissions) {
            permissions = user.role.permissions.map(p => p.name);
        } else if (user.permissions && Array.isArray(user.permissions)) {
            // Convert permission IDs to names
            const permissionRecords = await prisma.permission.findMany({
                where: {
                    id: {
                        in: user.permissions.map(id => parseInt(id.toString()))
                    }
                },
                select: { name: true }
            });
            permissions = permissionRecords.map(p => p.name);
        }

        // Generate JWT token
        const token = generateToken({
            sub: user.id,
            username: user.name,
            email: user.email,
            roleId: user.roleId,
            shopId: user.shopId,
            permissions
        });

        const userSession = {
            id: user.id,
            username: user.name,
            fullName: user.name,
            email: user.email,
            roleId: user.roleId,
            roleName: user.role?.name || user.roleName || null,
            shopId: user.shopId,
            permissions,
            role: user.role
        };

        // Cache user session for faster subsequent requests
        const cacheKey = cacheService.generateKey(CACHE_CONFIG.KEYS.USER_SESSION, { userId: user.id });
        await cacheService.set(cacheKey, userSession, CACHE_CONFIG.TTL.USER_SESSION);

        return {
            success: true,
            token,
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
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            message: 'Authentication failed'
        };
    }
};

/**
 * Generate a JWT token
 */
export const generateToken = (payload: TokenPayload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify a JWT token with caching
 */
export const verifyToken = async (token: string) => {
    const tokenKey = cacheService.generateKey(CACHE_CONFIG.KEYS.TOKEN_VALIDATION, { token: token.substring(0, 20) });

    try {
        // Check cache first for token validation result
        const cachedResult = await cacheService.get(tokenKey);
        if (cachedResult) {
            return cachedResult as TokenPayload;
        }

        // Verify token
        const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

        // Cache the valid token payload (shorter TTL for security)
        await cacheService.set(tokenKey, payload, CACHE_CONFIG.TTL.TOKEN_VALIDATION);

        return payload;
    } catch (error) {
        // Log the error here if desired
        if (error instanceof jwt.TokenExpiredError) {
            console.error('Token expired during verification:', error.expiredAt);
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.error('Invalid token during verification:', error.message);
        } else {
            console.error('Unknown token verification error:', error);
        }
        throw error; // Re-throw the error
    }
};

/**
 * Check if a token has a specific permission with caching
 */
export const hasPermission = async (tokenPayload: TokenPayload, permission: string) => {
    // Quick check from token payload first
    if (tokenPayload.permissions?.includes(permission)) {
        return true;
    }

    // If not in token, check cached user permissions
    const permissionsCacheKey = cacheService.generateKey(CACHE_CONFIG.KEYS.USER_PERMISSIONS, { userId: tokenPayload.sub });

    try {
        const cachedPermissions = await cacheService.get(permissionsCacheKey);
        if (cachedPermissions) {
            return cachedPermissions.includes(permission);
        }

        // Fallback to database query if not cached
        const user = await prisma.user.findFirst({
            where: { id: tokenPayload.sub, isActive: true },
            include: {
                role: {
                    include: {
                        permissions: { select: { name: true } }
                    }
                }
            }
        });

        if (user) {
            const permissions = user.role.permissions.map(p => p.name);
            // Cache permissions for future checks
            await cacheService.set(permissionsCacheKey, permissions, CACHE_CONFIG.TTL.USER_PERMISSIONS);
            return permissions.includes(permission);
        }
    } catch (error) {
        console.error('Error checking permissions:', error);
    }

    return false;
};

/**
 * Get user details from a decoded token payload with caching
 */
export const getUserFromDecodedPayload = async (payload: TokenPayload | null) => {
    console.log('getUserFromDecodedPayload received payload:', payload);

    if (!payload) {
        console.error('Invalid token payload provided to getUserFromDecodedPayload');
        return null;
    }

    if (!payload.sub) {
        console.error('Token payload missing user ID (sub claim)');
        return null;
    }

    const userId = Number(payload.sub);
    const cacheKey = cacheService.generateKey(CACHE_CONFIG.KEYS.USER_SESSION, { userId });

    try {
        // Try to get user from cache first
        const cachedUser = await cacheService.get(cacheKey);
        if (cachedUser) {
            console.log('User found in cache:', userId);
            return cachedUser;
        }

        console.log('Looking up user with ID:', userId);
        console.time('prisma.user.findFirst for auth'); // Start timer
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                isActive: true
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            select: { name: true }
                        }
                    }
                }
            }
        });
        console.timeEnd('prisma.user.findFirst for auth'); // End timer

        if (!user) {
            console.error('User not found for ID:', userId);
            return null;
        }

        const userWithPermissions = {
            ...user,
            roleName: user.role.name,
            permissions: user.role.permissions.map(p => p.name)
        };

        // Cache the user session
        await cacheService.set(cacheKey, userWithPermissions, CACHE_CONFIG.TTL.USER_SESSION);

        console.log('User found and cached:', user.id, user.name);
        return userWithPermissions;
    } catch (error) {
        console.error('Error getting user from decoded payload:', error);
        return null;
    }
};

/**
 * Get user details from token (Legacy - consider phasing out or refactoring)
 * This function now calls verifyToken and then getUserFromDecodedPayload.
 */
export const getUserFromToken = async (token: string) => {
    const payload = await verifyToken(token);
    return getUserFromDecodedPayload(payload);
};