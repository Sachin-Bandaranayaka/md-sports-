const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentUsers() {
    try {
        console.log('Checking recent users and their shop assignments...');
        
        const users = await prisma.user.findMany({
            include: {
                role: true
            },
            orderBy: {
                id: 'desc'
            },
            take: 10
        });
        
        console.log('Recent users:');
        users.forEach(user => {
            console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role?.name || 'No role'}, ShopId: ${user.shopId || 'No shop'}`);
        });
        
        // Also check shops
        const shops = await prisma.shop.findMany({
            select: {
                id: true,
                name: true
            }
        });
        
        console.log('\nAvailable shops:');
        shops.forEach(shop => {
            console.log(`ID: ${shop.id}, Name: ${shop.name}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentUsers();