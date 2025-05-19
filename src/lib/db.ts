import { Sequelize } from 'sequelize';

// Get database connection string from environment variable
const databaseUrl = process.env.DATABASE_URL as string;

// Create Sequelize instance
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // This might need to be false if your SSL setup has issues
        }
    },
    logging: false, // Set to console.log to see SQL queries
});

// Test database connection
export const testConnection = async () => {
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