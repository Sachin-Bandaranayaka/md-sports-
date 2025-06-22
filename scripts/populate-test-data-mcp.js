// This script uses direct SQL to populate test data
// avoiding Prisma connection pooling issues

const categories = [
  { name: 'Running Equipment', description: 'Athletic footwear and running gear' },
  { name: 'Basketball Equipment', description: 'Basketball equipment and gear' },
  { name: 'Tennis Equipment', description: 'Tennis rackets, balls, and accessories' },
  { name: 'Swimming Gear', description: 'Swimming gear and accessories' },
  { name: 'Football Equipment', description: 'Football boots and equipment' },
  { name: 'Badminton Equipment', description: 'Badminton rackets and shuttlecocks' },
  { name: 'Gym Equipment', description: 'Fitness and gym equipment' },
  { name: 'Sports Apparel', description: 'Athletic clothing and sportswear' },
  { name: 'Outdoor Sports', description: 'Equipment for outdoor activities' },
  { name: 'Water Sports', description: 'Equipment for water-based sports' }
];

const productTypes = [
  'Running Shoes', 'Basketball Jersey', 'Tennis Racket', 'Swimming Goggles', 'Football Boots',
  'Badminton Racket', 'Gym Weights', 'Sports T-Shirt', 'Cycling Helmet', 'Yoga Mat',
  'Soccer Ball', 'Basketball', 'Tennis Ball', 'Swimming Cap', 'Track Pants',
  'Sports Shorts', 'Athletic Socks', 'Water Bottle', 'Sports Bag', 'Fitness Tracker'
];

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

const malaysianCities = [
  'Kuala Lumpur', 'Selangor', 'Johor Bahru', 'Penang', 'Ipoh', 'Kuching', 'Kota Kinabalu',
  'Shah Alam', 'Malacca', 'Alor Setar', 'Miri', 'Sandakan', 'Kuantan', 'Tawau', 'Sibu'
];

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

console.log('🚀 Starting to populate test data using direct SQL...');
console.log('📝 This script will generate SQL statements that can be executed manually');
console.log('');

// 1. Categories SQL
console.log('-- =====================================================');
console.log('-- CATEGORIES');
console.log('-- =====================================================');

categories.forEach((category, index) => {
  console.log(`INSERT INTO "Category" (name, description) VALUES ('${category.name}', '${category.description}');`);
});

console.log('');

// 2. Additional Shops SQL
console.log('-- =====================================================');
console.log('-- ADDITIONAL SHOPS');
console.log('-- =====================================================');

const shopNames = [
  'Athletic Central', 'Sports World East', 'Champions Sports', 'Elite Athletics'
];

shopNames.forEach((shopName, index) => {
  const city = getRandomElement(malaysianCities);
  const shopId = `shop_${Date.now()}_${index}`;
  
  console.log(`INSERT INTO "Shop" (id, name, location, address_line1, city, state, postal_code, phone, email, is_active, status) VALUES (
    '${shopId}',
    '${shopName}',
    '${city}',
    '${getRandomNumber(1, 999)} ${getRandomElement(['Jalan', 'Lorong', 'Persiaran'])} ${getRandomElement(['Bukit', 'Taman', 'Bandar'])}',
    '${city}',
    '${getRandomElement(['Selangor', 'Kuala Lumpur', 'Johor', 'Penang', 'Perak'])}',
    '${getRandomNumber(10000, 99999)}',
    '${generatePhoneNumber()}',
    'shop${index + 3}@mdsports.com',
    true,
    'open'
  );`);
});

console.log('');

// 3. Products SQL (generate 100 at a time for manageability)
console.log('-- =====================================================');
console.log('-- PRODUCTS (Sample batch of 100)');
console.log('-- =====================================================');
console.log('-- Note: Repeat this pattern for more products, adjusting category and shop IDs');

for (let i = 1; i <= 100; i++) {
  const productType = getRandomElement(productTypes);
  const categoryId = getRandomNumber(1, 10); // Assuming we have 10 categories
  const shopId = getRandomElement(['cmc4nqcog0000unnqei52hlhs', 'cmc4nqj9b0001unnq2fqc59ci']); // Use existing shop IDs
  
  console.log(`INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    '${productType} ${i}',
    'High quality ${productType.toLowerCase()} for sports enthusiasts',
    ${getRandomPrice(20, 500)},
    'SKU${String(i).padStart(6, '0')}',
    '${getRandomNumber(100000000000, 999999999999)}',
    ${categoryId},
    '${shopId}',
    ${getRandomPrice(10, 200)},
    ${getRandomNumber(5, 50)}
  );`);
}

console.log('');

// 4. Customers SQL (generate 50 at a time)
console.log('-- =====================================================');
console.log('-- CUSTOMERS (Sample batch of 50)');
console.log('-- =====================================================');

for (let i = 1; i <= 50; i++) {
  const name = getRandomElement(allNames);
  const city = getRandomElement(malaysianCities);
  
  console.log(`INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    '${name} ${i}',
    '${generateEmail(`${name} ${i}`)}',
    '${generatePhoneNumber()}',
    '${getRandomNumber(1, 999)} ${getRandomElement(['Jalan', 'Lorong', 'Persiaran'])} ${getRandomElement(['Bukit', 'Taman', 'Bandar'])}, ${city}',
    '${city}',
    '${getRandomElement(['retail', 'wholesale', 'corporate'])}',
    '${getRandomElement(['active', 'inactive'])}',
    ${getRandomPrice(1000, 10000)},
    ${getRandomNumber(7, 90)},
    '${getRandomNumber(10000, 99999)}'
  );`);
}

console.log('');
console.log('-- =====================================================');
console.log('-- INVENTORY ITEMS');
console.log('-- =====================================================');
console.log('-- Run this after products are created:');
console.log(`-- INSERT INTO "InventoryItem" ("productId", "shopId", quantity, shopspecificcost)
-- SELECT 
--   p.id,
--   s.id,
--   floor(random() * 100),
--   (random() * 290 + 10)::numeric(10,2)
-- FROM "Product" p
-- CROSS JOIN "Shop" s
-- WHERE NOT EXISTS (
--   SELECT 1 FROM "InventoryItem" i 
--   WHERE i."productId" = p.id AND i."shopId" = s.id
-- );`);

console.log('');
console.log('🎉 SQL generation completed!');
console.log('📋 Instructions:');
console.log('1. Copy the SQL statements above');
console.log('2. Execute them in your database client');
console.log('3. Repeat the product and customer sections to reach 2000 products and 1000 customers');
console.log('4. Run the inventory items query at the end'); 