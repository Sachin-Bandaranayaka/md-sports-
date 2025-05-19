import { Pool } from 'pg';

// Get database connection string from environment variable
const connectionString = process.env.DATABASE_URL;

// Create a pool of connections
const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test connection
export async function testConnection() {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT current_database(), current_user, version()');
        console.log('Database connection successful:', result.rows[0]);
        return { success: true, data: result.rows[0] };
    } catch (error) {
        console.error('Database connection error:', error);
        return { success: false, error };
    } finally {
        if (client) client.release();
    }
}

// Generic query function
export async function query(text: string, params?: any[]) {
    let client;
    try {
        client = await pool.connect();
        const start = Date.now();
        const result = await client.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    } finally {
        if (client) client.release();
    }
}

// Transaction function
export async function transaction<T>(callback: (client: any) => Promise<T>) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export default {
    query,
    transaction,
    testConnection
}; 