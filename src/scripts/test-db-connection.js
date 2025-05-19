// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const { Sequelize } = require('sequelize');

// Get connection string from environment variables
const databaseUrl = process.env.DATABASE_URL;

console.log('Testing database connection...');
console.log('Database URL:', databaseUrl ? 'Available' : 'Not available');

// Create Sequelize instance
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  } finally {
    await sequelize.close();
  }
}

testConnection(); 