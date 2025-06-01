const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
    const prisma = new PrismaClient();
    
    try {
        console.log('Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        
        const productCount = await prisma.product.count();
        console.log(`📦 Product count: ${productCount}`);
        
        if (productCount === 0) {
            console.log('⚠️  No products found in database - this explains why mock data is being used');
        } else {
            const products = await prisma.product.findMany({
                take: 3,
                include: {
                    category: true
                }
            });
            console.log('📋 Sample products:', products.map(p => ({ id: p.id, name: p.name, sku: p.sku })));
        }
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('This explains why the API is falling back to mock data');
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();