import { PrismaClient } from '@prisma/client';

// Use a single instance of Prisma Client across the entire app
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connection options with retry logic
const prismaOptions = {
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://localhost:5432/mssport',
        },
    },
    // Add reasonable timeout and connection error handling
    log: ['error'],
    errorFormat: 'minimal',
};

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