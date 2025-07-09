import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/services/authService';

export async function POST(req: NextRequest) {
    try {
        // Verify admin access
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        const tokenData = await verifyToken(token);
        
        // Check if user has admin permissions
        if (!tokenData || !tokenData.permissions?.includes('admin:all')) {
            return NextResponse.json(
                { success: false, message: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        console.log('Starting cleanup of duplicate refresh tokens...');
        
        // Get all users with active refresh tokens
        const usersWithTokens = await prisma.refreshToken.findMany({
            where: {
                isRevoked: false,
                expiresAt: { gt: new Date() }
            },
            select: {
                userId: true
            },
            distinct: ['userId']
        });

        console.log(`Found ${usersWithTokens.length} users with active refresh tokens`);
        
        let totalRevoked = 0;
        let usersProcessed = 0;

        for (const { userId } of usersWithTokens) {
            // Get all active tokens for this user, ordered by creation date
            const userTokens = await prisma.refreshToken.findMany({
                where: {
                    userId,
                    isRevoked: false,
                    expiresAt: { gt: new Date() }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (userTokens.length > 1) {
                console.log(`User ${userId} has ${userTokens.length} active tokens`);
                
                // Keep only the most recent token, revoke all others
                const tokensToRevoke = userTokens.slice(1).map(t => t.id);
                
                await prisma.refreshToken.updateMany({
                    where: {
                        id: { in: tokensToRevoke }
                    },
                    data: {
                        isRevoked: true
                    }
                });

                totalRevoked += tokensToRevoke.length;
                usersProcessed++;
                console.log(`Revoked ${tokensToRevoke.length} duplicate tokens for user ${userId}`);
            }
        }

        // Also clean up expired tokens
        const expiredResult = await prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { 
                        isRevoked: true,
                        updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Older than 7 days
                    }
                ]
            }
        });

        console.log(`Deleted ${expiredResult.count} expired/old revoked tokens`);
        console.log('Cleanup completed successfully!');

        return NextResponse.json({
            success: true,
            message: 'Token cleanup completed',
            stats: {
                usersProcessed,
                tokensRevoked: totalRevoked,
                expiredTokensDeleted: expiredResult.count
            }
        });

    } catch (error) {
        console.error('Token cleanup error:', error);
        return NextResponse.json(
            { success: false, message: 'Token cleanup failed' },
            { status: 500 }
        );
    }
} 