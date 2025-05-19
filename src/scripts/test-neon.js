// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Simple script to check if pg can connect to Neon
const { Pool } = require('pg');

console.log('Testing Neon database connection...');

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection
async function testConnection() {
    try {
        // Connect to the database
        const client = await pool.connect();
        console.log('Connected to Neon database successfully!');
        
        // Execute a simple query
        const result = await client.query('SELECT NOW() as current_time');
        console.log('Query executed successfully');
        console.log('Current time from Neon:', result.rows[0].current_time);
        
        // List tables in the database
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('\nTables in database:');
        if (tablesResult.rows.length === 0) {
            console.log('No tables found');
        } else {
            tablesResult.rows.forEach(row => {
                console.log(`- ${row.table_name}`);
            });
        }
        
        // Release the client
        client.release();
    } catch (error) {
        console.error('Error connecting to Neon database:', error);
    } finally {
        // End the pool
        await pool.end();
    }
}

// Run the test
testConnection().catch(console.error); 