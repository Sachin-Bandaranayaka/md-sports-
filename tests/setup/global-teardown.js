const { PrismaClient } = require('@prisma/client');

const { cleanupCache } = require('../../src/lib/cache');

module.exports = async () => {
  console.log('🧹 Starting Jest global teardown...');
  
  // Clean up cache intervals
  try {
    cleanupCache();
    console.log('🧹 Cache cleanup completed');
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
  }
  
  // Clean up test database if needed
  if (process.env.SETUP_TEST_DB === 'true') {
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      
      // Clean up test data
      await cleanupTestData(prisma);
      
      console.log('🗑️ Test data cleaned up');
      
    } catch (error) {
      console.error('❌ Test cleanup failed:', error);
      // Don't throw to avoid failing the teardown
    } finally {
      await prisma.$disconnect();
    }
  }
  
  console.log('✅ Jest global teardown completed');
};

async function cleanupTestData(prisma) {
  try {
    // Clean up Jest-specific test data
    await prisma.shop.deleteMany({
      where: {
        id: 'test-shop-jest'
      }
    });
    
    // Clean up any other test artifacts
    await prisma.user.deleteMany({
      where: {
        email: {
          endsWith: '@jest.test'
        }
      }
    });
    
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error.message);
  }
}