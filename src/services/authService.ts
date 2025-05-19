import jwt from 'jsonwebtoken';
import { User, Role, Permission } from '../lib/models';

// Secret key for JWT - should be moved to environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

interface TokenPayload {
    userId: number;
    username: string;
    roleId: number;
    permissions?: string[];
}

/**
 * Authenticate a user with username and password
 */
export const authenticateUser = async (username: string, password: string) => {
    try {
        // Find user by username
        const user = await User.findOne({
            where: { username, isActive: true },
            include: [{
                model: Role,
                include: ['permissions']
            }]
        });

        // If user not found or password doesn't match
        if (!user || !(await user.authenticate(password))) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }

        // Get permissions from role
        const role = user.get('role') as any;
        const permissions = role?.permissions?.map((p: any) => p.name) || [];

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            username: user.username,
            roleId: user.roleId,
            permissions
        });

        return {
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                roleId: user.roleId,
                roleName: role?.name,
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
        const user = await User.findByPk(payload.userId, {
            include: [{
                model: Role,
                include: ['permissions']
            }]
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