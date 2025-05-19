require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

// Get connection string from environment variable
const connectionString = process.env.DATABASE_URL;
console.log('Connection string (masked):', connectionString.replace(/:[^:]*@/, ':***@'));

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connection successful!');
    
    const res = await client.query('SELECT current_database(), current_user, version();');
    console.log('Database info:', res.rows[0]);
    
    console.log('Testing table creation...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Test table created successfully!');
    
    await client.query(`
      INSERT INTO connection_test (test_name) VALUES ('Connection test at ${new Date().toISOString()}');
    `);
    console.log('Test record inserted successfully!');
    
    const testResult = await client.query('SELECT * FROM connection_test ORDER BY id DESC LIMIT 5;');
    console.log('Recent test records:', testResult.rows);
    
  } catch (error) {
    console.error('Error testing connection:', error);
  } finally {
    await client.end();
  }
}

testConnection(); 