import { Pool, QueryResult, PoolConfig } from 'pg';

// Optimized connection pool configuration for millisecond performance
const poolConfig: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    
    // Connection pool optimization for high performance
    max: 20,                    // Maximum number of clients in the pool
    min: 2,                     // Minimum number of clients in the pool
    idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return error after 2 seconds if can't connect
    allowExitOnIdle: true,      // Allow the pool to exit when all clients are idle
    
    // Statement timeout for fast queries
    statement_timeout: 10000,   // 10 second timeout for statements
    query_timeout: 5000,        // 5 second timeout for queries
    
    // Application name for monitoring
    application_name: 'mssports_app',
    
    // Additional performance options
    options: '-c default_transaction_isolation=read_committed -c statement_timeout=10000'
};

// Create optimized connection pool
const pool = new Pool(poolConfig);

// Performance monitoring
let queryCount = 0;
let totalQueryTime = 0;
const slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];

// Enhanced query method with performance monitoring
const query = async (text: string, params?: any[]): Promise<QueryResult> => {
    const start = Date.now();
    const queryId = ++queryCount;
    
    try {
        // Use a prepared statement for better performance
        const client = await pool.connect();
        let res: QueryResult;
        
        try {
            if (params && params.length > 0) {
                res = await client.query(text, params);
            } else {
                res = await client.query(text);
            }
        } finally {
            client.release();
        }
        
        const duration = Date.now() - start;
        totalQueryTime += duration;
        
        // Log performance metrics
        if (process.env.NODE_ENV !== 'production') {
            if (duration > 50) { // Log queries slower than 50ms
                const slowQuery = { query: text.substring(0, 100), duration, timestamp: new Date() };
                slowQueries.push(slowQuery);
                console.log(`🐌 Slow query #${queryId}:`, slowQuery);
                
                // Keep only last 10 slow queries
                if (slowQueries.length > 10) {
                    slowQueries.shift();
                }
            }
            
            if (queryId % 100 === 0) { // Log stats every 100 queries
                const avgTime = totalQueryTime / queryCount;
                console.log(`📊 Query stats: ${queryCount} queries, avg: ${avgTime.toFixed(2)}ms`);
            }
        }
        
        return res;
    } catch (error: any) {
        const duration = Date.now() - start;
        console.error(`❌ Query #${queryId} failed after ${duration}ms:`, {
            error: error.message,
            query: text.substring(0, 100),
            params: params?.length || 0
        });
        throw error;
    }
};

// Optimized batch query method
const batchQuery = async (queries: Array<{ text: string; params?: any[] }>): Promise<QueryResult[]> => {
    const client = await pool.connect();
    const results: QueryResult[] = [];
    
    try {
        await client.query('BEGIN');
        
        for (const { text, params } of queries) {
            const result = await client.query(text, params);
            results.push(result);
        }
        
        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Connection health check
const healthCheck = async (): Promise<boolean> => {
    try {
        const result = await query('SELECT 1 as health_check');
        return result.rows.length === 1;
    } catch {
        return false;
    }
};

// Get performance statistics
const getStats = () => ({
    totalQueries: queryCount,
    averageQueryTime: queryCount > 0 ? totalQueryTime / queryCount : 0,
    slowQueries: [...slowQueries],
    poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
    }
});

// Graceful shutdown
const shutdown = async (): Promise<void> => {
    await pool.end();
};

// Export the enhanced database interface
const db = {
    query,
    batchQuery,
    healthCheck,
    getStats,
    shutdown,
    pool
};

export default db; 