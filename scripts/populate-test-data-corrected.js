const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Malaysian cities for realistic addresses
const malaysianCities = [
  'Kuala Lumpur', 'Selangor', 'Johor Bahru', 'Penang', 'Ipoh', 'Kuching', 'Kota Kinabalu',
  'Shah Alam', 'Malacca', 'Alor Setar', 'Miri', 'Sandakan', 'Kuantan', 'Tawau', 'Sibu'
];

// Product categories that match existing ones
const categories = [
  { name: 'Running Shoes', description: 'Athletic footwear for running and jogging' },
  { name: 'Basketball', description: 'Basketball equipment and gear' },
  { name: 'Tennis', description: 'Tennis rackets, balls, and accessories' },
  { name: 'Swimming', description: 'Swimming gear and accessories' },
  { name: 'Football', description: 'Football boots and equipment' },
  { name: 'Badminton', description: 'Badminton rackets and shuttlecocks' },
  { name: 'Gym Equipment', description: 'Fitness and gym equipment' },
  { name: 'Sports Apparel', description: 'Athletic clothing and sportswear' },
  { name: 'Outdoor Sports', description: 'Equipment for outdoor activities' },
  { name: 'Water Sports', description: 'Equipment for water-based sports' }
];

// Product types for variety
const productTypes = [
  'Running Shoes', 'Basketball Jersey', 'Tennis Racket', 'Swimming Goggles', 'Football Boots',
  'Badminton Racket', 'Gym Weights', 'Sports T-Shirt', 'Cycling Helmet', 'Yoga Mat',
  'Soccer Ball', 'Basketball', 'Tennis Ball', 'Swimming Cap', 'Track Pants',
  'Sports Shorts', 'Athletic Socks', 'Water Bottle', 'Sports Bag', 'Fitness Tracker'
];

// Shop names for variety
const shopNames = [
  'Main Sports Store', 'Sports Outlet North', 'Pro Sports South', 'Athletic Central',
  'Sports World East', 'Champions Sports', 'Elite Athletics', 'Sports Hub West',
  'Victory Sports Center', 'Active Life Sports'
];

// Malaysian names for customers
const malayNames = [
  'Ahmad Rahman', 'Siti Nurhaliza', 'Muhammad Ali', 'Fatimah Zahra', 'Hassan Ibrahim',
  'Aminah Binti Ahmad', 'Omar Abdullah', 'Khadijah Mohamed', 'Yusuf Hakim', 'Zainab Ali',
  'Ismail Daud', 'Maryam Hassan', 'Abdul Aziz', 'Noor Aishah', 'Mohd Farid',
  'Rosnah Ismail', 'Zakaria Osman', 'Halimah Yusof', 'Rashid Mahmud', 'Suraya Ahmad'
];

const chineseNames = [
  'Lim Wei Ming', 'Tan Mei Ling', 'Wong Kok Wai', 'Lee Siew Har', 'Ng Boon Huat',
  'Chan Ai Lian', 'Teo Chin Hock', 'Goh Swee Choo', 'Ong Kah Meng', 'Yap Li Hua',
  'Koh Beng Seng', 'Lau Pei Shan', 'Sim Wee Kiat', 'Chua Mei Fong', 'Tay Hock Seng'
];

const indianNames = [
  'Raj Kumar', 'Priya Devi', 'Suresh Chandra', 'Kamala Devi', 'Ravi Shankar',
  'Meera Nair', 'Arun Prakash', 'Lakshmi Menon', 'Vijay Kumar', 'Radha Krishnan',
  'Anand Raj', 'Kavitha Sharma', 'Deepak Singh', 'Sunita Patel', 'Mohan Das'
];

const allNames = [...malayNames, ...chineseNames, ...indianNames];

// Generate random data
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generatePhoneNumber() {
  const prefixes = ['012', '013', '014', '016', '017', '018', '019'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `${prefix}-${number}`;
}

function generateEmail(name) {
  const domain = getRandomElement(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']);
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  return `${cleanName}@${domain}`;
}

async function main() {
  console.log('🚀 Starting to populate test data...');

  try {
    // 1. Get existing categories or create new ones
    console.log('📁 Setting up categories...');
    const existingCategories = await prisma.category.findMany();
    console.log(`Found ${existingCategories.length} existing categories`);

    // If we need more categories, create them
    let allCategories = existingCategories;
    if (existingCategories.length < 10) {
      const categoriesToCreate = categories.slice(existingCategories.length);
      for (const category of categoriesToCreate) {
        const newCategory = await prisma.category.create({
          data: category
        });
        allCategories.push(newCategory);
        console.log(`✅ Created category: ${category.name}`);
      }
    }

    // 2. Get existing shops or create new ones
    console.log('🏪 Setting up shops...');
    const existingShops = await prisma.shop.findMany();
    console.log(`Found ${existingShops.length} existing shops`);

    let allShops = existingShops;
    const shopsNeeded = Math.max(3 - existingShops.length, 0);
    
    for (let i = 0; i < shopsNeeded; i++) {
      const shopData = {
        name: shopNames[existingShops.length + i] || `Sports Store ${existingShops.length + i + 1}`,
        location: getRandomElement(malaysianCities),
        address_line1: `${getRandomNumber(1, 999)} ${getRandomElement(['Jalan', 'Lorong', 'Persiaran'])} ${getRandomElement(['Bukit', 'Taman', 'Bandar'])}`,
        city: getRandomElement(malaysianCities),
        state: getRandomElement(['Selangor', 'Kuala Lumpur', 'Johor', 'Penang', 'Perak']),
        postal_code: `${getRandomNumber(10000, 99999)}`,
        phone: generatePhoneNumber(),
        email: `shop${existingShops.length + i + 1}@mssports.com`,
        is_active: true,
        status: 'open'
      };

      const newShop = await prisma.shop.create({ data: shopData });
      allShops.push(newShop);
      console.log(`✅ Created shop: ${shopData.name}`);
    }

    // 3. Create products (targeting 2000 total)
    console.log('📦 Creating products...');
    const existingProductCount = await prisma.product.count();
    const productsToCreate = Math.max(2000 - existingProductCount, 0);
    
    console.log(`Creating ${productsToCreate} products...`);
    
    const batchSize = 100;
    for (let i = 0; i < productsToCreate; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, productsToCreate - i);
      
      for (let j = 0; j < currentBatchSize; j++) {
        const productIndex = i + j + 1;
        const productType = getRandomElement(productTypes);
        const category = getRandomElement(allCategories);
        const shop = getRandomElement(allShops);
        
        batch.push({
          name: `${productType} ${productIndex}`,
          description: `High quality ${productType.toLowerCase()} for sports enthusiasts`,
          price: getRandomPrice(20, 500),
          sku: `SKU${String(productIndex).padStart(6, '0')}`,
          barcode: `${getRandomNumber(100000000000, 999999999999)}`,
          categoryId: category.id,
          shopId: shop.id,
          weightedAverageCost: getRandomPrice(10, 200),
          minStockLevel: getRandomNumber(5, 50)
        });
      }

      await prisma.product.createMany({ data: batch });
      console.log(`✅ Created products batch ${i + 1}-${i + currentBatchSize} of ${productsToCreate}`);
    }

    // 4. Create customers (targeting 1000 total)
    console.log('👥 Creating customers...');
    const existingCustomerCount = await prisma.customer.count();
    const customersToCreate = Math.max(1000 - existingCustomerCount, 0);
    
    console.log(`Creating ${customersToCreate} customers...`);
    
    for (let i = 0; i < customersToCreate; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, customersToCreate - i);
      
      for (let j = 0; j < currentBatchSize; j++) {
        const customerIndex = i + j + 1;
        const name = getRandomElement(allNames);
        const city = getRandomElement(malaysianCities);
        
        batch.push({
          name: `${name} ${customerIndex}`,
          email: generateEmail(`${name} ${customerIndex}`),
          phone: generatePhoneNumber(),
          address: `${getRandomNumber(1, 999)} ${getRandomElement(['Jalan', 'Lorong', 'Persiaran'])} ${getRandomElement(['Bukit', 'Taman', 'Bandar'])}, ${city}`,
          city: city,
          customerType: getRandomElement(['retail', 'wholesale', 'corporate']),
          status: getRandomElement(['active', 'inactive']),
          creditLimit: getRandomPrice(1000, 10000),
          creditPeriod: getRandomNumber(7, 90),
          postalCode: `${getRandomNumber(10000, 99999)}`
        });
      }

      await prisma.customer.createMany({ data: batch });
      console.log(`✅ Created customers batch ${i + 1}-${i + currentBatchSize} of ${customersToCreate}`);
    }

    // 5. Create inventory items for products
    console.log('📊 Creating inventory items...');
    const allProducts = await prisma.product.findMany();
    
    // Create inventory for each product in each shop
    const inventoryBatch = [];
    for (const product of allProducts) {
      for (const shop of allShops) {
        // Check if inventory item already exists
        const existingItem = await prisma.inventoryItem.findFirst({
          where: {
            productId: product.id,
            shopId: shop.id
          }
        });

        if (!existingItem) {
          inventoryBatch.push({
            productId: product.id,
            shopId: shop.id,
            quantity: getRandomNumber(0, 100),
            shopSpecificCost: getRandomPrice(10, 300)
          });
        }
      }

      // Process in batches to avoid memory issues
      if (inventoryBatch.length >= 500) {
        await prisma.inventoryItem.createMany({ data: inventoryBatch });
        console.log(`✅ Created ${inventoryBatch.length} inventory items`);
        inventoryBatch.length = 0; // Clear the batch
      }
    }

    // Create remaining inventory items
    if (inventoryBatch.length > 0) {
      await prisma.inventoryItem.createMany({ data: inventoryBatch });
      console.log(`✅ Created final ${inventoryBatch.length} inventory items`);
    }

    // Final count summary
    const finalCounts = await prisma.$transaction([
      prisma.category.count(),
      prisma.shop.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.inventoryItem.count()
    ]);

    console.log('\n🎉 Data population completed successfully!');
    console.log('📊 Final counts:');
    console.log(`   Categories: ${finalCounts[0]}`);
    console.log(`   Shops: ${finalCounts[1]}`);
    console.log(`   Products: ${finalCounts[2]}`);
    console.log(`   Customers: ${finalCounts[3]}`);
    console.log(`   Suppliers: ${finalCounts[4]}`);
    console.log(`   Inventory Items: ${finalCounts[5]}`);

  } catch (error) {
    console.error('❌ Error populating data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });