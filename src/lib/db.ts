import { Sequelize } from 'sequelize';
import pg from 'pg'; // Import pg

// Get database connection string from environment variable
const databaseUrl = process.env.DATABASE_URL || 'postgres://localhost:5432/mdsports';

// Create a function to initialize the database connection
const initializeSequelize = () => {
    try {
        // Create Sequelize instance
        return new Sequelize(databaseUrl, {
            dialect: 'postgres',
            dialectModule: pg, // Explicitly pass the pg module
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            },
            logging: false,
        });
    } catch (error) {
        console.error('Error initializing Sequelize:', error);
        // Return a minimal Sequelize-like object to prevent crashes
        return {
            authenticate: async () => {
                throw new Error('Database connection failed to initialize');
            },
            model: () => {
                throw new Error('Database connection failed to initialize');
            },
            define: () => { // Add a define method to the mock
                throw new Error('Database connection failed to initialize, cannot define model');
            },
            sync: async () => {
                throw new Error('Database connection failed to initialize');
            }
        } as unknown as Sequelize;
    }
};

// Initialize Sequelize
const sequelize = initializeSequelize();

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
};

export default sequelize;
export { testConnection }; 