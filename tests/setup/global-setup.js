const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  console.log('🚀 Setting up Jest global environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  // Initialize test database if needed
  if (process.env.SETUP_TEST_DB === 'true') {
    const prisma = new PrismaClient();
    
    try {
      // Ensure database connection
      await prisma.$connect();
      console.log('✅ Test database connected');
      
      // Run any necessary setup
      await setupTestData(prisma);
      
    } catch (error) {
      console.error('❌ Test database setup failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  console.log('✅ Jest global setup completed');
};

async function setupTestData(prisma) {
  // Create minimal test data if needed
  try {
    // Check if test shop exists
    const testShop = await prisma.shop.findFirst({
      where: { id: 'test-shop-jest' }
    });
    
    if (!testShop) {
      await prisma.shop.create({
        data: {
          id: 'test-shop-jest',
          name: 'Jest Test Shop',
          location: 'Test Location'
        }
      });
      console.log('📦 Test shop created for Jest');
    }
  } catch (error) {
    console.warn('⚠️ Test data setup warning:', error.message);
    // Don't fail setup for data creation issues
  }
}