import { Pool } from 'pg';

// Create a connection pool with more robust error handling
let pool: Pool;

try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} catch (error) {
    console.error('Error initializing database pool:', error);
    // Create a minimal pool object to prevent crashes
    pool = {
        query: async () => {
            throw new Error('Database connection failed to initialize');
        },
        connect: async () => {
            throw new Error('Database connection failed to initialize');
        },
        end: async () => { }
    } as unknown as Pool;
}

/**
 * Executes a SQL query and returns the result
 * @param text SQL query to execute
 * @param params Optional parameters for the query
 * @returns Query result
 */
export async function performQuery(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', {
            text,
            duration,
            rows: result.rowCount
        });
        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

/**
 * Performs a transaction with multiple queries
 * @param callback Function that receives a client and executes queries
 * @returns Result of the transaction
 */
export async function performTransaction<T>(callback: (client: any) => Promise<T>) {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        if (client) {
            await client.query('ROLLBACK').catch(e => console.error('Error during rollback:', e));
        }
        console.error('Transaction error:', error);
        throw error;
    } finally {
        if (client) client.release();
    }
}

export default {
    pool,
    performQuery,
    performTransaction
}; 