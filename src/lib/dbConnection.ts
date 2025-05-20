import { Pool } from 'pg';

// Get database URL from environment variable or use default
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/mssport';

// Create a pool of connections
const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : undefined
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
    let client;
    try {
        client = await pool.connect();
        console.log('Database connection successful');
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    } finally {
        if (client) client.release();
    }
};

// Execute a single query
export const query = async (text: string, params?: any[]): Promise<any> => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// Execute multiple queries in a transaction
export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction error:', error);
        throw error;
    } finally {
        client.release();
    }
};

export default {
    pool,
    query,
    transaction,
    testConnection
}; 