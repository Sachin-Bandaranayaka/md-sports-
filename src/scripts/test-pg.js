// Simple script to test if pg can be imported correctly
const { Pool, Client } = require('pg');
console.log('pg module imported successfully');

// Optionally create a dummy client to test
const client = new Client({
  connectionString: 'postgres://localhost:5432/test',
  // Don't actually connect
});

console.log('Client instance created successfully'); 