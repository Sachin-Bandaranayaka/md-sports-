import { testConnection } from '../lib/db';

(async () => {
    try {
        console.log('Testing database connection...');
        const success = await testConnection();

        if (success) {
            console.log('Database connection successful! ✅');
        } else {
            console.error('Database connection failed. ❌');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error testing database connection:', error);
        process.exit(1);
    }
})(); 