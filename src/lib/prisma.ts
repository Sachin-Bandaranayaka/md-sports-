import { PrismaClient } from '@prisma/client';

// Use a single instance of Prisma Client across the entire app
const globalForPrisma = global as unknown as { 
    prisma: PrismaClient;
    prismaInstanceCount: number;
};

// Track instance creation for debugging
if (!globalForPrisma.prismaInstanceCount) {
    globalForPrisma.prismaInstanceCount = 0;
}

// Optimized connection options for millisecond performance
const prismaOptions = {
    datasources: {
        db: {
            url: process.env.DATABASE_URL ? 
                `${process.env.DATABASE_URL}?connection_limit=5&pool_timeout=20&connect_timeout=10&prepared_statement_cache_size=100&statement_timeout=10000&idle_in_transaction_session_timeout=10000&pgbouncer=true&application_name=mssports_prisma` :
                'postgresql://localhost:5432/mssport',
        },
    },
    errorFormat: 'minimal' as const,
    
    // Additional performance options
    transactionOptions: {
        maxWait: 5000,      // 5 seconds max wait for transaction
        timeout: 10000,     // 10 seconds timeout for transaction
    },
};

console.log('Initializing Prisma client with DATABASE_URL:',
    process.env.DATABASE_URL ?
        `${process.env.DATABASE_URL.substring(0, 20)}...` :
        'Not set (using default)'
);

// Function to detect if we're running in Edge Runtime
function isEdgeRuntime(): boolean {
    return (
        typeof process === 'undefined' ||
        process.env.NEXT_RUNTIME === 'edge' ||
        (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis)
    );
}

// Function to create a new Prisma client with prepared statement handling
function createPrismaClient(): PrismaClient {
    globalForPrisma.prismaInstanceCount++;
    console.log(`Creating Prisma client instance #${globalForPrisma.prismaInstanceCount}`);
    
    const client = new PrismaClient(prismaOptions);
    
    // Only add middleware in Node.js runtime, not in Edge Runtime
    if (!isEdgeRuntime()) {
        console.log('Adding Prisma middleware for prepared statement handling (Node.js runtime)');
        
        // Add middleware to handle prepared statement conflicts
        client.$use(async (params, next) => {
            try {
                return await next(params);
            } catch (error: any) {
                // Check for prepared statement errors
                const isPreparedStatementError = 
                    error?.code === '42P05' ||
                    error?.message?.includes('prepared statement') ||
                    error?.message?.includes('already exists');
                
                if (isPreparedStatementError) {
                    console.log('Prepared statement conflict detected in middleware, retrying...');
                    
                    try {
                        // Try to clear prepared statements
                        await client.$executeRaw`DEALLOCATE ALL`;
                    } catch (deallocateError) {
                        // Ignore deallocate errors as they're expected in some cases
                    }
                    
                    // Wait a bit and retry
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return await next(params);
                }
                
                throw error;
            }
        });
    } else {
        console.log('Skipping Prisma middleware in Edge Runtime');
    }
    
    return client;
}

// Create the Prisma client instance or reuse the existing one
export const prisma = globalForPrisma.prisma || createPrismaClient();

// For development, save the instance to avoid too many client instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to safely execute database operations with fallback
export async function safeQuery<T>(queryFn: () => Promise<T>, fallback: T, logMessage: string = 'Query error', maxRetries: number = 3): Promise<T> {
    let _lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await queryFn();
        } catch (error: any) {
            _lastError = error;
            console.error(`${logMessage} (attempt ${attempt}/${maxRetries}):`, error);
            
            // Check for prepared statement errors
            const isPreparedStatementError = 
                error?.code === '42P05' ||
                error?.message?.includes('prepared statement') ||
                error?.message?.includes('already exists') ||
                error?.meta?.code === '42P05';
            
            if (isPreparedStatementError && attempt < maxRetries) {
                console.log(`Detected prepared statement error on attempt ${attempt}, handling with middleware retry...`);
                
                // The middleware should handle this, but add additional delay for safety
                const delay = 150 * attempt;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else if (attempt < maxRetries) {
                // For other errors, still retry with a shorter delay
                await new Promise(resolve => setTimeout(resolve, 50 * attempt));
            }
        }
    }
    
    console.error(`${logMessage}: All ${maxRetries} attempts failed. Returning fallback.`);
    return fallback;
}

// Enhanced query function that automatically handles prepared statement conflicts
export async function executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    try {
        return await queryFn();
    } catch (error: any) {
        // Check for prepared statement errors
        const isPreparedStatementError = 
            error?.code === '42P05' ||
            error?.message?.includes('prepared statement') ||
            error?.message?.includes('already exists');
        
        if (isPreparedStatementError) {
            console.log('Prepared statement conflict detected, attempting recovery...');
            
            try {
                // Try to clear prepared statements
                await prisma.$executeRaw`DEALLOCATE ALL`;
                console.log('Successfully cleared prepared statements');
            } catch (deallocateError) {
                console.log('Could not deallocate statements (this is normal in some cases)');
            }
            
            // Wait a moment and retry
            await new Promise(resolve => setTimeout(resolve, 200));
            return await queryFn();
        }
        
        throw error;
    }
}

// Graceful shutdown handler (only in Node.js environment)
if (typeof process !== 'undefined' && process.on) {
    process.on('beforeExit', async () => {
        await prisma.$disconnect();
    });
}

export default prisma;