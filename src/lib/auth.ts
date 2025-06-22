import { NextRequest } from 'next/server';
// import jwt from 'jsonwebtoken'; replaced
import * as jose from 'jose';
import prisma from '@/lib/prisma';
import { hasPermission as checkPermission } from '@/lib/utils/permissions';
import CredentialsProvider from 'next-auth/providers/credentials';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'default-secret-key-for-development';
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Export authOptions for NextAuth
export const authOptions = {
  secret: NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(_credentials) {
        // This is a placeholder - the actual authentication is handled by custom API routes
        // NextAuth.js requires a provider to be configured even if we're using custom auth
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.permissions = token.permissions;
      }
      return session;
    }
  }
};

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

        const userId = payload.sub as string;

        // Check if permission is in the token payload directly
        if (payload.permissions && Array.isArray(payload.permissions)) {
            const hasPermission = checkPermission(payload.permissions, permission);
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
        const hasPermission = checkPermission(user.permissions, permission);
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
export const getUserIdFromToken = async (req: NextRequest): Promise<string | null> => {
    const token = extractToken(req);

    if (!token) {
        return null;
    }

    // Special case for development token
    if (token === 'dev-token') {
        return '4447d3a9-595b-483e-b55a-38f0f6160121'; // Admin user ID for development
    }

    const payload = await verifyToken(token);

    if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
        return null;
    }

    return payload.sub as string;
};

/**
 * Get shop ID from token
 */
export const getShopIdFromToken = async (req: NextRequest): Promise<string | null> => {
    const token = extractToken(req);

    if (!token) {
        return null;
    }

    // Special case for development token - assign to first shop for testing shop staff behavior
    if (token === 'dev-token') {
        return 'cmbtr9q6l000061romoxi7uvf'; // Assign dev-token to first shop from database
    }

    const payload = await verifyToken(token);

    if (!payload || typeof payload !== 'object' || !('shopId' in payload)) {
        return null;
    }

    return payload.shopId as string;
};