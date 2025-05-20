import { Pool, QueryResult } from 'pg';

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
});

// Simple query method
const query = async (text: string, params?: any[]): Promise<QueryResult> => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries in development
    if (process.env.NODE_ENV !== 'production' && duration > 100) {
        console.log('Slow query:', { text, duration, rows: res.rowCount });
    }

    return res;
};

// Export the database interface
const db = {
    query,
    pool
};

export default db; 