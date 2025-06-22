const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateTestData() {
    try {
        console.log('🚀 Starting to populate test data...');
        
        // Create categories
        console.log('📂 Creating categories...');
        const categories = [
            { id: 1, name: 'Sports Equipment', description: 'General sports equipment and gear' },
            { id: 2, name: 'Footwear', description: 'Sports shoes and athletic footwear' },
            { id: 3, name: 'Apparel', description: 'Sports clothing and uniforms' },
            { id: 4, name: 'Accessories', description: 'Sports accessories and small items' },
            { id: 5, name: 'Team Sports', description: 'Equipment for team sports' },
            { id: 6, name: 'Individual Sports', description: 'Equipment for individual sports' },
            { id: 7, name: 'Fitness Equipment', description: 'Gym and fitness equipment' },
            { id: 8, name: 'Outdoor Sports', description: 'Outdoor and adventure sports gear' },
            { id: 9, name: 'Water Sports', description: 'Swimming and water sports equipment' },
            { id: 10, name: 'Winter Sports', description: 'Winter and snow sports equipment' }
        ];

        for (const category of categories) {
            await prisma.category.upsert({
                where: { id: category.id },
                update: {},
                create: category
            });
        }

        // Create shops
        console.log('🏪 Creating shops...');
        const shops = [
            { id: 'shop1', name: 'Main Sports Store', location: '100 Sports Plaza, Downtown', phone: '+1-555-1001' },
            { id: 'shop2', name: 'Sports Outlet North', location: '200 Athletic Center, North District', phone: '+1-555-1002' },
            { id: 'shop3', name: 'Pro Sports South', location: '300 Champion Mall, South Side', phone: '+1-555-1003' }
        ];

        for (const shop of shops) {
            await prisma.shop.upsert({
                where: { id: shop.id },
                update: {},
                create: shop
            });
        }

        // Generate 2000 products
        console.log('📦 Creating 2000 products...');
        const productTypes = [
            'Running Shoes Model',
            'Basketball Jersey #',
            'Tennis Racket Pro',
            'Football Cleats',
            'Yoga Mat Premium',
            'Dumbbells Set',
            'Swimming Goggles',
            'Cycling Helmet',
            'Golf Club Driver',
            'Sports Water Bottle'
        ];

        const descriptions = [
            'High-performance running shoes with advanced cushioning technology',
            'Professional basketball jersey with moisture-wicking fabric',
            'Professional tennis racket with carbon fiber construction',
            'Football cleats with superior grip and comfort',
            'Premium yoga mat with non-slip surface',
            'Professional dumbbells set for strength training',
            'Anti-fog swimming goggles with UV protection',
            'Lightweight cycling helmet with ventilation system',
            'Professional golf driver with titanium head',
            'BPA-free sports water bottle with leak-proof design'
        ];

        const categoryMapping = [2, 3, 6, 2, 7, 7, 9, 8, 6, 4]; // Maps to category IDs

        const batchSize = 100;
        for (let i = 0; i < 20; i++) { // 20 batches of 100 = 2000
            const startId = i * batchSize + 1;
            const endId = (i + 1) * batchSize;
            console.log(`   Creating products ${startId} to ${endId}...`);
            
            const products = [];
            for (let j = startId; j <= endId; j++) {
                const typeIndex = (j - 1) % 10;
                const product = {
                    id: j,
                    name: `${productTypes[typeIndex]} ${j}`,
                    description: descriptions[typeIndex],
                    sku: `SKU-${j.toString().padStart(6, '0')}`,
                    barcode: `Barcode-${1000000000 + j}`,
                    categoryId: categoryMapping[typeIndex],
                    price: Math.round((Math.random() * 500 + 10) * 100) / 100,
                    weightedAverageCost: Math.round((Math.random() * 300 + 5) * 100) / 100,
                    minStockLevel: Math.floor(Math.random() * 20 + 5)
                };
                products.push(product);
            }

            await prisma.product.createMany({
                data: products,
                skipDuplicates: true
            });
        }

        // Generate 1000 customers
        console.log('👥 Creating 1000 customers...');
        const firstNames = [
            'John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Christopher', 'Ashley', 'Matthew', 'Amanda',
            'Daniel', 'Jennifer', 'James', 'Lisa', 'Robert', 'Michelle', 'William', 'Stephanie', 'Joseph', 'Rachel'
        ];

        const lastNames = [
            'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Moore', 'Taylor', 'Anderson', 'Thomas',
            'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez'
        ];

        const cities = [
            'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
            'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA'
        ];

        const customerBatchSize = 100;
        for (let i = 0; i < 10; i++) { // 10 batches of 100 = 1000
            const startId = i * customerBatchSize + 1;
            const endId = (i + 1) * customerBatchSize;
            console.log(`   Creating customers ${startId} to ${endId}...`);
            
            const customers = [];
            for (let j = startId; j <= endId; j++) {
                const firstName = firstNames[(j - 1) % firstNames.length];
                const lastName = lastNames[Math.floor((j - 1) / firstNames.length) % lastNames.length];
                const city = cities[(j - 1) % cities.length];
                
                const customer = {
                    id: j,
                    name: `${firstName} ${lastName} ${j}`,
                    email: `customer${j}@example.com`,
                    phone: `+1-555-${(j % 10000).toString().padStart(4, '0')}`,
                    address: `${j} Main Street, ${city}`,
                    customerType: j % 5 === 0 ? 'VIP' : (j % 3 === 0 ? 'Premium' : 'Regular'),
                    creditLimit: Math.round(Math.random() * 10000 * 100) / 100
                };
                customers.push(customer);
            }

            await prisma.customer.createMany({
                data: customers,
                skipDuplicates: true
            });
        }

        // Create inventory items
        console.log('📊 Creating inventory items...');
        const inventoryBatchSize = 500;
        for (let i = 0; i < 12; i++) { // 12 batches to cover all products across 3 shops
            const startProductId = Math.floor(i / 3) * inventoryBatchSize + 1;
            const endProductId = Math.min(Math.floor(i / 3 + 1) * inventoryBatchSize, 2000);
            const shopId = ['shop1', 'shop2', 'shop3'][i % 3];
            
            console.log(`   Creating inventory for ${shopId} - products ${startProductId} to ${endProductId}...`);
            
            const inventoryItems = [];
            for (let productId = startProductId; productId <= endProductId; productId++) {
                const inventoryItem = {
                    productId: productId,
                    shopId: shopId,
                    quantity: Math.floor(Math.random() * 100 + 10),
                    shopSpecificCost: Math.round((Math.random() * 300 + 5) * 100) / 100
                };
                inventoryItems.push(inventoryItem);
            }

            await prisma.inventoryItem.createMany({
                data: inventoryItems,
                skipDuplicates: true
            });
        }

        // Get summary
        console.log('\n📈 Data Population Summary:');
        const productCount = await prisma.product.count();
        const customerCount = await prisma.customer.count();
        const categoryCount = await prisma.category.count();
        const shopCount = await prisma.shop.count();
        const inventoryCount = await prisma.inventoryItem.count();

        console.log(`✅ Products: ${productCount}`);
        console.log(`✅ Customers: ${customerCount}`);
        console.log(`✅ Categories: ${categoryCount}`);
        console.log(`✅ Shops: ${shopCount}`);
        console.log(`✅ Inventory Items: ${inventoryCount}`);

        // Show sample data
        console.log('\n📋 Sample Products:');
        const sampleProducts = await prisma.product.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                weightedAverageCost: true
            }
        });
        console.table(sampleProducts);

        console.log('\n👥 Sample Customers:');
        const sampleCustomers = await prisma.customer.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                email: true,
                customerType: true,
                creditLimit: true
            }
        });
        console.table(sampleCustomers);

        console.log('\n🎉 Test data population completed successfully!');
        
    } catch (error) {
        console.error('❌ Error populating test data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
populateTestData()
    .then(() => {
        console.log('✨ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    }); 