import { Sequelize } from 'sequelize';

// Get database connection string from environment variable
const databaseUrl = process.env.DATABASE_URL || 'postgres://localhost:5432/mdsports';

// Create Sequelize instance
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false // This might need to be false if your SSL setup has issues
        } : false
    },
    logging: false, // Set to console.log to see SQL queries
});

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