import { PrismaClient } from '@prisma/client';

// Use a single instance of Prisma Client across the entire app
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Optimized connection options for Vercel serverless
const prismaOptions = {
    datasources: {
        db: {
            url: process.env.DATABASE_URL ? 
                `${process.env.DATABASE_URL}?connection_limit=1&pool_timeout=0&connect_timeout=60` :
                'postgresql://localhost:5432/mssport',
        },
    },
    // Optimized logging for production
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    errorFormat: 'minimal' as const,
};

console.log('Initializing Prisma client with DATABASE_URL:',
    process.env.DATABASE_URL ?
        `${process.env.DATABASE_URL.substring(0, 20)}...` :
        'Not set (using default)'
);

// Create the Prisma client instance or reuse the existing one
export const prisma = globalForPrisma.prisma || new PrismaClient(prismaOptions);

// For development, save the instance to avoid too many client instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to safely execute database operations with fallback
export async function safeQuery<T>(
    queryFn: () => Promise<T>,
    fallback: T,
    logMessage = 'Database operation failed'
): Promise<T> {
    try {
        return await queryFn();
    } catch (error) {
        console.error(`${logMessage}:`, error);
        return fallback;
    }
}

export default prisma;