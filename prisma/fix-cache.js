const { PrismaClient } = require('@prisma/client');

async function clearCache() {
  try {
    console.log('Connecting to database...');
    const prisma = new PrismaClient();
    
    console.log('Deallocating all prepared statements...');
    await prisma.$executeRawUnsafe('DEALLOCATE ALL;');
    
    console.log('Running VACUUM ANALYZE on User table...');
    await prisma.$executeRawUnsafe('VACUUM ANALYZE "User";');
    
    console.log('Cache cleared successfully!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache(); 