// Simple script to check if pg is installed correctly
try {
    const pg = require('pg');
    console.log('PG module loaded successfully');
    console.log('PG version:', pg.version);
    
    // Try to create a client with proper credentials
    // Note: Replace with actual credentials if needed
    const client = new pg.Client({
        host: 'localhost',
        port: 5432,
        database: 'mdsports',
        user: 'postgres',  // Replace with your actual database user
        password: 'postgres',  // Replace with your actual database password
        ssl: false
    });
    
    console.log('PG client created successfully');
    
    // Try to connect
    client.connect()
        .then(() => {
            console.log('Connected to PostgreSQL successfully');
            return client.query('SELECT NOW() as current_time');
        })
        .then(result => {
            console.log('Query executed successfully');
            console.log('Current time:', result.rows[0].current_time);
            client.end();
        })
        .catch(err => {
            console.error('Error connecting to PostgreSQL:', err);
            process.exit(1);
        });
} catch (error) {
    console.error('Error loading pg module:', error);
    process.exit(1);
} 