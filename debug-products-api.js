const { PrismaClient } = require('@prisma/client');

async function debugProductsAPI() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Debugging Products API Issue...');
        console.log('================================');
        
        // Test 1: Direct database query
        console.log('\n1. Testing direct database query:');
        const directProducts = await prisma.product.findMany({
            include: {
                category: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        
        console.log(`✅ Direct query found ${directProducts.length} products`);
        if (directProducts.length > 0) {
            console.log('📋 Sample products from DB:', directProducts.slice(0, 2).map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                category_name: p.category?.name || null
            })));
        }
        
        // Test 2: Simulate the exact query from the API
        console.log('\n2. Testing API-style query (no shop filter):');
        const apiStyleProducts = await prisma.product.findMany({
            include: {
                category: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        
        const formattedProducts = apiStyleProducts.map(product => ({
            ...product,
            category_name: product.category?.name || null
        }));
        
        console.log(`✅ API-style query found ${formattedProducts.length} products`);
        
        // Test 3: Check if there are any shop-specific inventory items
        console.log('\n3. Checking inventory items and shop associations:');
        const inventoryCount = await prisma.inventoryItem.count();
        console.log(`📦 Total inventory items: ${inventoryCount}`);
        
        if (inventoryCount > 0) {
            const sampleInventory = await prisma.inventoryItem.findMany({
                take: 3,
                include: {
                    product: true,
                    shop: true
                }
            });
            console.log('📋 Sample inventory items:', sampleInventory.map(item => ({
                productName: item.product.name,
                shopId: item.shopId,
                shopName: item.shop?.name || 'No shop'
            })));
        }
        
        // Test 4: Test shop-filtered query
        console.log('\n4. Testing shop-filtered query (shopId = 1):');
        const shopFilteredProducts = await prisma.product.findMany({
            where: {
                inventoryItems: {
                    some: {
                        shopId: 1
                    }
                }
            },
            include: {
                category: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        
        console.log(`✅ Shop-filtered query found ${shopFilteredProducts.length} products`);
        
        console.log('\n🎯 CONCLUSION:');
        if (directProducts.length > 0) {
            console.log('✅ Database has real products');
            console.log('❌ API is likely failing due to authentication or shop filtering issues');
            console.log('💡 The safeQuery function is catching an error and returning mock data');
        } else {
            console.log('❌ Database has no products - need to seed the database');
        }
        
    } catch (error) {
        console.error('❌ Error during debugging:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugProductsAPI();