import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// Secret key for JWT - should be moved to environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Changed token expiration to 12h (from 24h) for better security
const JWT_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '12h';

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
        // Fetch user, but role and permissions might already be in payload
        // Decide if a DB call is always needed, e.g., to check isActive status
        const user = await prisma.user.findFirst({
            where: {
                id: Number(payload.sub),
                isActive: true
            },
            // Conditionally include role and permissions if not in payload or if refresh is needed
            include: {
                role: {
                    select: { name: true } // Only select role name, permissions are in token
                }
            }
        });

        if (!user) {
            console.error('User not found for ID:', payload.sub);
            return null;
        }

        console.log('User found:', user.id, user.name);
        // Combine user data from DB with permissions from token payload
        return {
            ...user,
            roleName: user.role.name, // ensure roleName is added
            permissions: payload.permissions || [] // Use permissions from token
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
    // console.log('Token payload in getUserFromToken:', payload); // Already logged in verifyToken or called function
    return getUserFromDecodedPayload(payload);
}; 