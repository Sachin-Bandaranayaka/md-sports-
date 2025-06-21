import { PrismaClient, LogLevel } from '@prisma/client';

// Use a single instance of Prisma Client across the entire app
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Optimized connection options for Vercel serverless
const prismaOptions = {
    datasources: {
        db: {
            url: process.env.DATABASE_URL ? 
                `${process.env.DATABASE_URL}?connection_limit=1&pool_timeout=900&connect_timeout=900&prepared_statement_cache_size=0&statement_timeout=30000&idle_in_transaction_session_timeout=30000` :
                'postgresql://localhost:5432/mssport',
        },
    },
    // Optimized logging for production
    log: process.env.NODE_ENV === 'production' ? ['error' as LogLevel] : ['error' as LogLevel, 'warn' as LogLevel],
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
export async function safeQuery<T>(queryFn: () => Promise<T>, fallback: T, logMessage: string = 'Query error', maxRetries: number = 3): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await queryFn();
        } catch (error: any) {
            lastError = error;
            console.error(`${logMessage} (attempt ${attempt}/${maxRetries}):`, error);
            
            // Check for prepared statement errors
            const isPreparedStatementError = 
                error?.code === '42P05' ||
                error?.message?.includes('prepared statement') ||
                error?.message?.includes('already exists') ||
                error?.meta?.code === '42P05';
            
            if (isPreparedStatementError && attempt < maxRetries) {
                console.log(`Detected prepared statement error on attempt ${attempt}, resetting connection...`);
                try {
                    await prisma.$disconnect();
                    // Exponential backoff: 100ms, 200ms, 400ms
                    const delay = 100 * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } catch (disconnectError) {
                    console.error('Error during disconnect:', disconnectError);
                }
            } else if (attempt < maxRetries) {
                // For other errors, still retry with a shorter delay
                await new Promise(resolve => setTimeout(resolve, 50 * attempt));
            }
        }
    }
    
    console.error(`${logMessage}: All ${maxRetries} attempts failed. Returning fallback.`);
    return fallback;
}

// Graceful shutdown handler (only in Node.js environment)
if (typeof process !== 'undefined' && process.on) {
    process.on('beforeExit', async () => {
        await prisma.$disconnect();
    });
}

export default prisma;