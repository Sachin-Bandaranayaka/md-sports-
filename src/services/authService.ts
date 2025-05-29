import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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
 * Authenticate a user with email and password
 */
export const authenticateUser = async (email: string, password: string) => {
    try {
        // Find user by email with role and permissions
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
                }
            }
        });

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

        // Get permissions from role
        const permissions = user.role.permissions.map(p => p.name);

        // Generate JWT token
        const token = generateToken({
            sub: user.id,
            username: user.name,
            email: user.email,
            roleId: user.roleId,
            shopId: user.shopId,
            permissions
        });

        return {
            success: true,
            token,
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
 * Verify a JWT token
 */
export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
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
 * Check if a token has a specific permission
 */
export const hasPermission = (tokenPayload: TokenPayload, permission: string) => {
    return tokenPayload.permissions?.includes(permission) || false;
};

/**
 * Get user details from a decoded token payload
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

    try {
        console.log('Looking up user with ID:', payload.sub);
        console.time('prisma.user.findFirst for auth'); // Start timer
        const user = await prisma.user.findFirst({
            where: {
                id: Number(payload.sub),
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
            console.error('User not found for ID:', payload.sub);
            return null;
        }

        console.log('User found:', user.id, user.name);
        return {
            ...user,
            roleName: user.role.name,
            permissions: user.role.permissions.map(p => p.name)
        };
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
    const payload = verifyToken(token);
    return getUserFromDecodedPayload(payload);
}; 