import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// Secret key for JWT - should be moved to environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

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
        console.error('Token verification error:', error);
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
 * Get user details from token
 */
export const getUserFromToken = async (token: string) => {
    const payload = verifyToken(token);
    if (!payload) {
        return null;
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: payload.sub
            },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });

        if (!user || !user.isActive) {
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error getting user from token:', error);
        return null;
    }
}; 