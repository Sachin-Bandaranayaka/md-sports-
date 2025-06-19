// Simple script to test if pg can be imported correctly
const { Pool: _Pool, Client } = require('pg');
console.log('pg module imported successfully');

// Optionally create a dummy client to test
const _client = new Client({
  connectionString: 'postgres://localhost:5432/test',
  // Don't actually connect
});

console.log('Client instance created successfully');