const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateTestData() {
    try {
        console.log('🚀 Starting to populate test data...');
        
        // Create categories
        console.log('📂 Creating categories...');
        await prisma.$executeRaw`
            INSERT INTO "Category" (id, name, description, "createdAt", "updatedAt") 
            VALUES 
              (1, 'Sports Equipment', 'General sports equipment and gear', NOW(), NOW()),
              (2, 'Footwear', 'Sports shoes and athletic footwear', NOW(), NOW()),
              (3, 'Apparel', 'Sports clothing and uniforms', NOW(), NOW()),
              (4, 'Accessories', 'Sports accessories and small items', NOW(), NOW()),
              (5, 'Team Sports', 'Equipment for team sports', NOW(), NOW()),
              (6, 'Individual Sports', 'Equipment for individual sports', NOW(), NOW()),
              (7, 'Fitness Equipment', 'Gym and fitness equipment', NOW(), NOW()),
              (8, 'Outdoor Sports', 'Outdoor and adventure sports gear', NOW(), NOW()),
              (9, 'Water Sports', 'Swimming and water sports equipment', NOW(), NOW()),
              (10, 'Winter Sports', 'Winter and snow sports equipment', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        `;

        // Note: Suppliers are not linked to products in this schema

        // Create shops
        console.log('🏪 Creating shops...');
        await prisma.$executeRaw`
            INSERT INTO "Shop" (id, name, location, phone, "manager_id", "createdAt", "updatedAt")
            VALUES 
              ('shop1', 'Main Sports Store', '100 Sports Plaza, Downtown', '+1-555-1001', NULL, NOW(), NOW()),
              ('shop2', 'Sports Outlet North', '200 Athletic Center, North District', '+1-555-1002', NULL, NOW(), NOW()),
              ('shop3', 'Pro Sports South', '300 Champion Mall, South Side', '+1-555-1003', NULL, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        `;

        // Generate 2000 products in batches
        console.log('📦 Creating 2000 products...');
        const batchSize = 500;
        for (let i = 0; i < 4; i++) {
            const startId = i * batchSize + 1;
            const endId = (i + 1) * batchSize;
            console.log(`   Creating products ${startId} to ${endId}...`);
            
            await prisma.$executeRaw`
                WITH product_data AS (
                  SELECT 
                    generate_series(${startId}, ${endId}) as id,
                    CASE 
                      WHEN generate_series(${startId}, ${endId}) % 10 = 1 THEN 'Running Shoes Model ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 10 = 2 THEN 'Basketball Jersey #' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 10 = 3 THEN 'Tennis Racket Pro ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 10 = 4 THEN 'Football Cleats ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 10 = 5 THEN 'Yoga Mat Premium ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 10 = 6 THEN 'Dumbbells Set ' || generate_series(${startId}, ${endId}) || 'kg'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 7 THEN 'Swimming Goggles ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 10 = 8 THEN 'Cycling Helmet ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 10 = 9 THEN 'Golf Club Driver ' || generate_series(${startId}, ${endId})
                      ELSE 'Sports Water Bottle ' || generate_series(${startId}, ${endId})
                    END as name,
                    CASE 
                      WHEN generate_series(${startId}, ${endId}) % 10 IN (1, 4) THEN 2
                      WHEN generate_series(${startId}, ${endId}) % 10 = 2 THEN 3
                      WHEN generate_series(${startId}, ${endId}) % 10 IN (3, 9) THEN 6
                      WHEN generate_series(${startId}, ${endId}) % 10 IN (5, 6) THEN 7
                      WHEN generate_series(${startId}, ${endId}) % 10 = 7 THEN 9
                      WHEN generate_series(${startId}, ${endId}) % 10 = 8 THEN 8
                      ELSE 4
                    END as "categoryId",
                    'SKU-' || LPAD(generate_series(${startId}, ${endId})::text, 6, '0') as sku,
                    'Barcode-' || (1000000000 + generate_series(${startId}, ${endId}))::text as barcode,
                    CASE 
                      WHEN generate_series(${startId}, ${endId}) % 10 = 1 THEN 'High-performance running shoes with advanced cushioning technology'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 2 THEN 'Professional basketball jersey with moisture-wicking fabric'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 3 THEN 'Professional tennis racket with carbon fiber construction'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 4 THEN 'Football cleats with superior grip and comfort'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 5 THEN 'Premium yoga mat with non-slip surface'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 6 THEN 'Professional dumbbells set for strength training'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 7 THEN 'Anti-fog swimming goggles with UV protection'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 8 THEN 'Lightweight cycling helmet with ventilation system'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 9 THEN 'Professional golf driver with titanium head'
                      ELSE 'BPA-free sports water bottle with leak-proof design'
                    END as description,
                                         ROUND((RANDOM() * 500 + 10)::numeric, 2) as price,
                     ROUND((RANDOM() * 300 + 5)::numeric, 2) as "weightedAverageCost",
                     FLOOR(RANDOM() * 20 + 5)::int as "minStockLevel",
                    NOW() as "createdAt",
                    NOW() as "updatedAt"
                )
                INSERT INTO "Product" (
                  id, name, "categoryId", sku, barcode, description, 
                  price, "weightedAverageCost", "minStockLevel", "createdAt", "updatedAt"
                )
                SELECT 
                  id, name, "categoryId", sku, barcode, description,
                  price, "weightedAverageCost", "minStockLevel", "createdAt", "updatedAt"
                FROM product_data
                ON CONFLICT (id) DO NOTHING;
            `;
        }

        // Generate 1000 customers in batches
        console.log('👥 Creating 1000 customers...');
        const customerBatchSize = 250;
        for (let i = 0; i < 4; i++) {
            const startId = i * customerBatchSize + 1;
            const endId = (i + 1) * customerBatchSize;
            console.log(`   Creating customers ${startId} to ${endId}...`);
            
            await prisma.$executeRaw`
                WITH customer_data AS (
                  SELECT 
                    generate_series(${startId}, ${endId}) as id,
                    CASE 
                      WHEN generate_series(${startId}, ${endId}) % 20 = 1 THEN 'John Smith ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 2 THEN 'Sarah Johnson ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 3 THEN 'Michael Brown ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 4 THEN 'Emily Davis ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 5 THEN 'David Wilson ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 6 THEN 'Jessica Miller ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 7 THEN 'Christopher Moore ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 8 THEN 'Ashley Taylor ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 9 THEN 'Matthew Anderson ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 10 THEN 'Amanda Thomas ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 11 THEN 'Daniel Jackson ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 12 THEN 'Jennifer White ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 13 THEN 'James Harris ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 14 THEN 'Lisa Martin ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 15 THEN 'Robert Thompson ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 16 THEN 'Michelle Garcia ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 17 THEN 'William Martinez ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 18 THEN 'Stephanie Robinson ' || generate_series(${startId}, ${endId})
                      WHEN generate_series(${startId}, ${endId}) % 20 = 19 THEN 'Joseph Clark ' || generate_series(${startId}, ${endId})
                      ELSE 'Rachel Rodriguez ' || generate_series(${startId}, ${endId})
                    END as name,
                    'customer' || generate_series(${startId}, ${endId}) || '@example.com' as email,
                    '+1-555-' || LPAD((generate_series(${startId}, ${endId}) % 10000)::text, 4, '0') as phone,
                    CASE 
                      WHEN generate_series(${startId}, ${endId}) % 10 = 1 THEN generate_series(${startId}, ${endId}) || ' Main Street, New York, NY 10001'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 2 THEN generate_series(${startId}, ${endId}) || ' Oak Avenue, Los Angeles, CA 90210'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 3 THEN generate_series(${startId}, ${endId}) || ' Pine Road, Chicago, IL 60601'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 4 THEN generate_series(${startId}, ${endId}) || ' Maple Drive, Houston, TX 77001'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 5 THEN generate_series(${startId}, ${endId}) || ' Cedar Lane, Phoenix, AZ 85001'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 6 THEN generate_series(${startId}, ${endId}) || ' Elm Street, Philadelphia, PA 19101'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 7 THEN generate_series(${startId}, ${endId}) || ' Birch Way, San Antonio, TX 78201'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 8 THEN generate_series(${startId}, ${endId}) || ' Willow Court, San Diego, CA 92101'
                      WHEN generate_series(${startId}, ${endId}) % 10 = 9 THEN generate_series(${startId}, ${endId}) || ' Spruce Boulevard, Dallas, TX 75201'
                      ELSE generate_series(${startId}, ${endId}) || ' Poplar Place, San Jose, CA 95101'
                    END as address,
                    CASE 
                      WHEN generate_series(${startId}, ${endId}) % 5 = 0 THEN 'VIP'
                      WHEN generate_series(${startId}, ${endId}) % 3 = 0 THEN 'Premium'
                      ELSE 'Regular'
                    END as "customerType",
                    ROUND((RANDOM() * 10000)::numeric, 2) as "creditLimit",
                    0 as balance,
                    NOW() as "createdAt",
                    NOW() as "updatedAt"
                )
                INSERT INTO "Customer" (
                  id, name, email, phone, address, "customerType", 
                  "creditLimit", balance, "createdAt", "updatedAt"
                )
                SELECT 
                  id, name, email, phone, address, "customerType",
                  "creditLimit", balance, "createdAt", "updatedAt"
                FROM customer_data
                ON CONFLICT (id) DO NOTHING;
            `;
        }

        // Create inventory items for products across shops
        console.log('📊 Creating inventory items...');
        const inventoryBatchSize = 1000;
        for (let i = 0; i < 6; i++) {
            const startProductId = i * inventoryBatchSize + 1;
            const endProductId = Math.min((i + 1) * inventoryBatchSize, 2000);
            console.log(`   Creating inventory for products ${startProductId} to ${endProductId}...`);
            
            await prisma.$executeRaw`
                WITH inventory_data AS (
                  SELECT 
                    ROW_NUMBER() OVER (ORDER BY p.id, s.id) + ${startProductId * 10} as id,
                    p.id as "productId",
                    s.id as "shopId",
                    FLOOR(RANDOM() * 100 + 10)::int as quantity,
                    p."weightedAverageCost" as "shopSpecificCost",
                    NOW() as "createdAt",
                    NOW() as "updatedAt"
                                      FROM "Product" p
                  CROSS JOIN "Shop" s
                  WHERE p.id >= ${startProductId} AND p.id <= ${endProductId} AND s.id IN ('shop1', 'shop2', 'shop3')
                )
                INSERT INTO "InventoryItem" (
                  id, "productId", "shopId", quantity, 
                  "shopSpecificCost", "createdAt", "updatedAt"
                )
                SELECT 
                  id, "productId", "shopId", quantity,
                  "shopSpecificCost", "createdAt", "updatedAt"
                FROM inventory_data
                ON CONFLICT (id) DO NOTHING;
            `;
        }

        // Update sequences
        console.log('🔄 Updating sequences...');
        await prisma.$executeRaw`SELECT setval('"Product_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Product"));`;
        await prisma.$executeRaw`SELECT setval('"Customer_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Customer"));`;
        await prisma.$executeRaw`SELECT setval('"Category_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Category"));`;
        await prisma.$executeRaw`SELECT setval('"InventoryItem_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "InventoryItem"));`;

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