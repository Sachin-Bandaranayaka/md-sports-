import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma, { safeQuery } from '@/lib/prisma';
import { cacheService, CACHE_CONFIG } from '../lib/cache';
import { hasPermission as checkPermission } from '../lib/utils/permissions';

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
        // Optimized single query using the new composite index with retry logic
        const user = await safeQuery(
            () => prisma.user.findFirst({
                where: {
                    email: email,
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    password: true,
                    roleId: true,
                    shopId: true,
                    permissions: true,
                    role: {
                        include: {
                            permissions: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }),
            null,
            'Failed to find user during authentication'
        ) as any;
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

        // Get permissions from both the user's direct permissions and their role
        let directPermissions: string[] = [];
        let rolePermissions: string[] = [];

        if (user.permissions && Array.isArray(user.permissions)) {
            const permissionNames = user.permissions.filter((p: string) => isNaN(parseInt(p, 10)));
            const permissionIds = user.permissions.filter((p: string) => !isNaN(parseInt(p, 10))).map((id: string) => parseInt(id, 10));

            if (permissionIds.length > 0) {
                const fetchedPermissions = await prisma.permission.findMany({
                    where: { id: { in: permissionIds } },
                    select: { name: true }
                });
                directPermissions = [...permissionNames, ...fetchedPermissions.map(p => p.name)];
            } else {
                directPermissions = permissionNames;
            }
        }

        if (user.role?.permissions) {
            rolePermissions = user.role.permissions.map((p: { name: string }) => p.name);
        }

        // Merge and deduplicate permissions
        const allPermissions = Array.from(new Set([...directPermissions, ...rolePermissions]));

        console.log('Final user permissions being returned:', allPermissions);
        
        // Generate JWT token
        const token = generateToken({
            sub: user.id,
            username: user.name,
            email: user.email,
            roleId: user.roleId,
            shopId: user.shopId,
            permissions: allPermissions,
        });

        const userSession = {
            id: user.id,
            username: user.name,
            fullName: user.name,
            email: user.email,
            roleId: user.roleId,
            roleName: user.role?.name || user.roleName || null,
            shopId: user.shopId,
            permissions: allPermissions,
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
                permissions: allPermissions,
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
    return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN as any });
};

/**
 * Verify a JWT token with caching
 */
export const verifyToken = async (token: string) => {
    // Validate token input
    if (!token || token.trim() === '') {
        throw new Error('jwt must be provided');
    }

    try {
        // Verify token first
        const decoded = jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;

        // Only generate cache key for valid tokens (ensure token is long enough for substring)
        if (token.length >= 20) {
            const tokenKey = cacheService.generateKey(CACHE_CONFIG.KEYS.TOKEN_VALIDATION, { token: token.substring(0, 20) });
            
            // Check cache first for token validation result
            const cachedResult = await cacheService.get(tokenKey);
            if (cachedResult) {
                return cachedResult as TokenPayload;
            }

            // Cache the valid token payload (shorter TTL for security)
            await cacheService.set(tokenKey, decoded, CACHE_CONFIG.TTL.TOKEN_VALIDATION);
        }

        return decoded;
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
    // Use the imported permission checking utility
    
    // Quick check from token payload first
    if (tokenPayload.permissions) {
        if (checkPermission(tokenPayload.permissions, permission)) {
            return true;
        }
    }

    // If not in token, check cached user permissions
    const permissionsCacheKey = cacheService.generateKey(CACHE_CONFIG.KEYS.USER_PERMISSIONS, { userId: tokenPayload.sub });

    try {
        const cachedPermissions = await cacheService.get(permissionsCacheKey);
        if (cachedPermissions) {
            return checkPermission(cachedPermissions, permission);
        }

        // Fallback to database query if not cached
        const user = await safeQuery(
            () => prisma.user.findFirst({
                where: { id: String(tokenPayload.sub), isActive: true },
                include: {
                    role: {
                        include: {
                            permissions: { select: { name: true } }
                        }
                    }
                }
            }),
            null,
            'Failed to find user for permission check'
        ) as any;

        if (user) {
            // Combine role permissions and direct user permissions
            const rolePermissions = user.role?.permissions?.map((p: any) => p.name) || [];
            const directPermissions = user.permissions || [];
            
            // Convert permission IDs to names if needed
            let convertedDirectPermissions: string[] = [];
            if (directPermissions.length > 0) {
                const firstPermission = directPermissions[0];
                if (typeof firstPermission === 'number' || (typeof firstPermission === 'string' && !isNaN(parseInt(firstPermission)))) {
                    // Permissions are stored as IDs, need to convert to names
                    const permissionIds = directPermissions
                        .map((id: any) => parseInt(id.toString()))
                        .filter((id: number) => !isNaN(id));
                    
                    if (permissionIds.length > 0) {
                        try {
                            const permissionRecords = await safeQuery(
                                () => prisma.permission.findMany({
                                    where: {
                                        id: {
                                            in: permissionIds
                                        }
                                    },
                                    select: { name: true }
                                }),
                                [],
                                'Failed to find permissions by IDs'
                            );
                            convertedDirectPermissions = (permissionRecords as any[]).map((p: any) => p.name);
                        } catch (error) {
                            console.error('Error converting permission IDs to names:', error);
                            convertedDirectPermissions = [];
                        }
                    }
                } else {
                    // Permissions are already stored as names
                    convertedDirectPermissions = directPermissions;
                }
            }
            
            // Combine all permissions and remove duplicates
            const allPermissions = [...rolePermissions, ...convertedDirectPermissions];
            const permissions = Array.from(new Set(allPermissions));
            
            // Cache permissions for future checks
            await cacheService.set(permissionsCacheKey, permissions, CACHE_CONFIG.TTL.USER_PERMISSIONS);
            return checkPermission(permissions, permission);
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
    process.stderr.write(`DEBUG: getUserFromDecodedPayload called with payload: ${JSON.stringify(payload)}\n`);

    if (!payload) {
        console.error('Invalid token payload provided to getUserFromDecodedPayload');
        process.stderr.write('DEBUG: Invalid payload or missing sub, returning null\n');
        return null;
    }

    if (!payload.sub) {
        console.error('Token payload missing user ID (sub claim)');
        process.stderr.write('DEBUG: Invalid payload or missing sub, returning null\n');
        return null;
    }

    const userId = payload.sub;
    process.stderr.write(`DEBUG: About to call cacheService.generateKey with userId: ${userId}\n`);
    const cacheKey = cacheService.generateKey(CACHE_CONFIG.KEYS.USER_SESSION, { userId });
    process.stderr.write(`DEBUG: Generated cache key: ${cacheKey}\n`);

    try {
        // Try to get user from cache first
        const cachedUser = await cacheService.get(cacheKey);
        if (cachedUser) {
            console.log('User found in cache:', userId);
            return cachedUser;
        }

        console.log('Looking up user with ID:', userId);
        console.time('prisma.user.findFirst for auth'); // Start timer
        const user = await safeQuery(
            () => prisma.user.findFirst({
                where: {
                    id: String(userId),
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
            }),
            null,
            'Failed to find user by ID for authentication'
        ) as any;
        console.timeEnd('prisma.user.findFirst for auth'); // End timer

        if (!user) {
            console.error('User not found for ID:', userId);
            return null;
        }

        // Combine role permissions and direct user permissions
        const rolePermissions = user.role?.permissions?.map((p: any) => p.name) || [];
        const directPermissions = user.permissions || [];
        
        // Convert permission IDs to names if needed
        let convertedDirectPermissions: string[] = [];
        if (Array.isArray(directPermissions) && directPermissions.length > 0) {
            // Check if permissions are stored as IDs (numbers) or names (strings)
            const firstPermission = directPermissions[0];
            if (typeof firstPermission === 'number' || (typeof firstPermission === 'string' && !isNaN(parseInt(firstPermission)))) {
                // Permissions are stored as IDs, need to convert to names
                const permissionIds = directPermissions
                    .map((id: any) => parseInt(id.toString()))
                    .filter((id: number) => !isNaN(id));
                
                if (permissionIds.length > 0) {
                    try {
                        const permissionRecords = await safeQuery(
                            () => prisma.permission.findMany({
                                where: {
                                    id: {
                                        in: permissionIds
                                    }
                                },
                                select: { name: true }
                            }),
                            [],
                            'Failed to find permissions by IDs'
                        );
                        convertedDirectPermissions = (permissionRecords as any[]).map((p: any) => p.name);
                    } catch (error) {
                        console.error('Error converting permission IDs to names:', error);
                        convertedDirectPermissions = [];
                    }
                }
            } else {
                // Permissions are already stored as names
                convertedDirectPermissions = directPermissions;
            }
        }
        
        // Combine all permissions and remove duplicates
        const allPermissions = [...rolePermissions, ...convertedDirectPermissions];
        const permissions = Array.from(new Set(allPermissions));

        const userWithPermissions = {
            ...user,
            roleName: user.role?.name || user.roleName || 'Admin',
            permissions: permissions
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