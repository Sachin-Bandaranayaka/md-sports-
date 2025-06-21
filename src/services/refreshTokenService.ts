import prisma, { safeQuery } from '@/lib/prisma';

// Configuration
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

// Generate a secure random token using Web Crypto API
const generateSecureToken = (length = 40): string => {
    // Use Web Crypto API which is supported in Edge Runtime
    if (typeof crypto !== 'undefined') {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    // Fallback (less secure but works everywhere)
    return Array.from(
        { length },
        () => Math.floor(Math.random() * 16).toString(16)
    ).join('');
};

/**
 * Generate a new refresh token for a user
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
    try {
        // Verify prisma client is initialized
        if (!prisma || !prisma.refreshToken) {
            console.error('Prisma client or RefreshToken model not available');
            throw new Error('Database client not initialized correctly');
        }

        // Log for debugging
        console.log('Generating refresh token for user ID:', userId);

        // Generate a random token
        const token = generateSecureToken(40);

        // Calculate expiration date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

        // Log the token details before creating
        console.log('Preparing to create refresh token with:', {
            userId,
            token: token.substring(0, 10) + '...',
            expiresAt,
        });

        // Store the token in the database with retry logic
        const createdToken = await safeQuery(
            () => prisma.refreshToken.create({
                data: {
                    userId,
                    token,
                    expiresAt,
                    updatedAt: new Date(),
                },
            }),
            null,
            'Failed to create refresh token'
        );

        if (!createdToken) {
            throw new Error('Failed to create refresh token in database');
        }

        console.log('Successfully created refresh token with ID:', createdToken.id);

        return token;
    } catch (error) {
        // More detailed error logging
        console.error('Error generating refresh token:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw new Error('Failed to generate refresh token');
    }
};



/**
 * Verify a refresh token and return the associated user ID if valid
 */
export const verifyRefreshToken = async (token: string): Promise<string | null> => {
    try {
        // Verify prisma client is initialized
        if (!prisma || !prisma.refreshToken) {
            console.error('Prisma client or RefreshToken model not available');
            return null;
        }

        // Find the token in the database with retry logic
        const refreshToken = await safeQuery(
            () => prisma.refreshToken.findUnique({
                where: { token },
            }),
            null,
            'Failed to find refresh token'
        );

        // Check if token exists and is not revoked
        if (!refreshToken || refreshToken.isRevoked) {
            console.log('Token not found or revoked:', token.substring(0, 10) + '...');
            return null;
        }

        // Check if token is expired
        if (new Date() > refreshToken.expiresAt) {
            console.log('Token expired:', token.substring(0, 10) + '...');

            // Revoke expired token with retry logic
            await safeQuery(
                () => prisma.refreshToken.update({
                    where: { id: refreshToken.id },
                    data: { isRevoked: true },
                }),
                null,
                'Failed to revoke expired refresh token'
            );

            return null;
        }

        return refreshToken.userId;
    } catch (error) {
        console.error('Error verifying refresh token:', error);
        return null;
    }
};

/**
 * Revoke a specific refresh token
 */
export const revokeRefreshToken = async (token: string): Promise<boolean> => {
    try {
        // Verify prisma client is initialized
        if (!prisma || !prisma.refreshToken) {
            console.error('Prisma client or RefreshToken model not available');
            return false;
        }

        await safeQuery(
            () => prisma.refreshToken.updateMany({
                where: { token },
                data: { isRevoked: true },
            }),
            null,
            'Failed to revoke refresh token'
        );

        return true;
    } catch (error) {
        console.error('Error revoking refresh token:', error);
        return false;
    }
};

/**
 * Revoke all refresh tokens for a specific user
 */
export const revokeAllUserRefreshTokens = async (userId: string): Promise<boolean> => {
    try {
        // Verify prisma client is initialized
        if (!prisma || !prisma.refreshToken) {
            console.error('Prisma client or RefreshToken model not available');
            return false;
        }

        await safeQuery(
            () => prisma.refreshToken.updateMany({
                where: { userId },
                data: { isRevoked: true },
            }),
            null,
            'Failed to revoke all user refresh tokens'
        );

        return true;
    } catch (error) {
        console.error('Error revoking user refresh tokens:', error);
        return false;
    }
};

/**
 * Clean up expired and revoked tokens
 * Note: This should be run periodically via a cron job
 */
export const cleanupRefreshTokens = async (): Promise<void> => {
    try {
        // Verify prisma client is initialized
        if (!prisma || !prisma.refreshToken) {
            console.error('Prisma client or RefreshToken model not available');
            return;
        }

        const now = new Date();

        await safeQuery(
            () => prisma.refreshToken.deleteMany({
                where: {
                    OR: [
                        { expiresAt: { lt: now } },
                        { isRevoked: true },
                    ],
                },
            }),
            null,
            'Failed to cleanup expired refresh tokens'
        );
    } catch (error) {
        console.error('Error cleaning up refresh tokens:', error);
    }
};