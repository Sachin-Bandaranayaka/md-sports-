const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Current counts from database
const currentCounts = {
  'BAGS': 62,
  'CLOTHS': 7,  
  'GRIPS': 22,
  'NETS': 2,
  'OTHER': 15,
  'RACKETS': 94,
  'SHOES': 133,
  'SHUTTLECOCKS': 8,
  'SOCKS': 7,
  'STRINGS': 61,
  'WRISTBANDS': 2
};

// Complete massive product dataset from user
const productLines = [
  "BAGS\tYONEX BOX TYPE (22931 WT)",
  "BAGS\tHUNDRED 3 ZIPPER LEVEL-UP BAG (2M145/144)",
  "BAGS\tHUNDRED 4M260/4M261",
  "BAGS\tHUNDRED 4M260/4M261 BLUE",
  "BAGS\tHUNDRED 4M260/4M261 RED",
  "BAGS\tHUNDRED 4M260/4M261 YELLOW",
  "BAGS\tHUNDRED BACKPACK 3M007",
  "BAGS\tHUNDRED BOX TYPE - 3M121",
  "BAGS\tHUNDRED BOX TYPE - 3M121 BLACK",
  "BAGS\tHUNDRED BOX TYPE - 3M121 BLUE",
  "BAGS\tHUNDRED BOX TYPE 2 POCKET - 3M120",
  "BAGS\tHUNDRED BOX TYPE 2 POCKET - 3M120 BLACK",
  "BAGS\tHUNDRED BOX TYPE 2 POCKET - 3M120 WHITE",
  "BAGS\tHUNDRED BOX TYPE 3M009-1",
  "BAGS\tHUNDRED COSMO RACKET BAG- 3M085",
  "BAGS\tHUNDRED COSMO RACKET BAG- 3M085 BLACK/ASH",
  "BAGS\tHUNDRED COSMO RACKET BAG- 3M085 BLACK/RED",
  "BAGS\tHUNDRED COSMO RACKET BAG- 3M085 BLUE/BLACK",
  "BAGS\tHUNDRED COSMO RACKET BAG- 3M085 BLUE/GOLD",
  "BAGS\tHUNDRED IDEAL BAG - 2M148/147/146",
  "BAGS\tHUNDRED NUCLEAR EDGE BAG 2M090",
  "BAGS\tHUNDRED URBAN POD BAG - 3M152",
  "BAGS\tLI NING 2 ZIPPER BLACK -  ABDS681-1",
  "BAGS\tLI NING 2 ZIPPER BLUE -  ABDT359-3",
  "BAGS\tLI NING 2 ZIPPER BLUE/GREEN -  ABDS681-2",
  "BAGS\tLI NING 2 ZIPPER RED -  ABDS681-5",
  "BAGS\tLI NING 2 ZIPPER WHITE -  ABDS681-4",
  "BAGS\tLI NING 3 POCKET BAG(661/853)",
  "BAGS\tLI NING 3 ZIPPER BAG (837/365/687)",
  "BAGS\tLI NING BACK PACK ABSU385",
  "BAGS\tLI NING BAG ABDU309",
  "BAGS\tLI NING BAG ABDU313",
  "BAGS\tLI NING BAG ABJS059",
  "BAGS\tLI NING BAG ABJU013",
  "BAGS\tLI NING BAG ABJU033",
  "BAGS\tLI NING BAG ABLU069",
  "BAGS\tLI NING BAG ABLV029",
  "BAGS\tLI NING BAG LU067",
  "BAGS\tLI NING BOX BAG 397 BLACK",
  "BAGS\tLI NING BOX BAG 399",
  "BAGS\tLI NING MAXIMUS 667/647",
  "BAGS\tLI NING SHOE BAG (285)",
  "BAGS\tMAXBOLT BOX 4013 BAG",
  "BAGS\tYONEX  BACKPACK ACE 2312",
  "BAGS\tYONEX 2 ZIPPER BAG (BT6)",
  "BAGS\tYONEX 3 ZIP PRO PERFORM BAG - 92429EX",
  "BAGS\tYONEX 3 ZIPPER (BT 9)",
  "BAGS\tYONEX 3D B1 ZIPPER BOX TYPE BAG",
  "BAGS\tYONEX 3D BOX TYPE BAG (3D-2231)",
  "BAGS\tYONEX ACE 2326 BAG",
  "BAGS\tYONEX BAG 2331WEX",
  "BAGS\tYONEX BASIC KITBAG BLACK GRAY",
  "BAGS\tYONEX BASIC KITBAG BLACK GRAY YELLOW",
  "BAGS\tYONEX BASIC KITBAG NAVY BLUE CYBER LIME",
  "BAGS\tYONEX BASIC KITBAG RED BLACK",
  "BAGS\tYONEX BASIC KITBAG ROYAL BLUE BLACK",
  "BAGS\tYONEX BOX TOURNAMENT BAG 2331",
  "BAGS\tYONEX CLUB BACK PACK (22412S)",
  "BAGS\t3D 3 ZIPPER  TOURNAMENT BAG",
  "BAGS\tAPACS 2 ZIPPER BAG",
  "BAGS\tLI NING 2 ZIPPER BAG (361/403/359/677/681/839/841)",
  "BAGS\tLI NING 2 ZIPPER BAG (SIN)",
  "BAGS\tLI NING BACK PACK (BLUE) 269",
  "BAGS\tLI NING BACKPACK (IND)",
  "BAGS\tLI NING BAG 315",
  "BAGS\tLI NING BOX TYPE BAG (363)",
  "BAGS\tLIN NING BOX TYPE (319)",
  "BAGS\tLIN NING BOX TYPE CRUZE",
  "BAGS\tMAXBOLT 1 ZIPPER BAG",
  "BAGS\tMAXBOLT 2 ZIPPER BAG",
  "BAGS\tVSE RACKET BAG",
  "BAGS\tYONEX 2 ZIPPER PERFORMANCE BAG",
  "BAGS\tYONEX 3 ZIPPER PERFORMANCE BAG (BA922229EX)",
  "BAGS\tYONEX 3D 2 ZIPPER GR 1",
  "BAGS\tYONEX 3D 2 ZIPPER GR 2",
  "BAGS\tYONEX 3D PERFORMANCE BOX TYPE (22931WT)",
  "BAGS\tYONEX BACK PACK (GREEN)",
  "BAGS\tYONEX BASIC KITBAG 2215 / 2225/ 23015 / 24015",
  "BAGS\tYONEX BOX  BAG 22831",
  "BAGS\tYONEX EVOLVING BACK PACK (BLACK)",
  "BAGS\tYONEX EXPERT BAG - 2326EX",
  "BAGS\tYONEX LEAGE BACK PACK",
  "CLOTHS\tHUNDRED SHORTS (3M130/131)",
  "CLOTHS\tHUNDRED SHORTS (4M016/017)",
  "CLOTHS\tHUNDRED T.SHIRTS (3M123/124/125/126/127/129)",
  "CLOTHS\tLI NING / YONEX  T SHIRT (963/707/995/993)",
  "CLOTHS\tLI NING / YONEX SHORTS(725/727/745/723)",
  "CLOTHS\tLI NING BOTTOM",
  "CLOTHS\tLI NING TOP",
  "CLOTHS\tADDIDAS BODY ARMOUR",
  "CLOTHS\tBADMINTON SHORTS(DBI)",
  "CLOTHS\tBADMINTON T SHIRT",
  "CLOTHS\tBADMINTON T SHIRT (CHN)",
  "CLOTHS\tBADMINTON T SHIRTS(DBI)",
  "CLOTHS\tBADMINTON T-SHIRTS (SA)",
  "CLOTHS\tDRY FIT SKINNIES",
  "CLOTHS\tDRY FIT T SHIRTS",
  "CLOTHS\tLADIES TIGHT LEGGINGS",
  "CLOTHS\tLI NING POLO T.SHIRT (691)",
  "CLOTHS\tLI NING POLO T.SHIRT (997)",
  "CLOTHS\tLI NING T SHIRT (IND)",
  "CLOTHS\tLI NING TRACK PANT",
  "CLOTHS\tLI NING V NECK T.SHIRT (701)",
  "CLOTHS\tMAXBOLT SHORTS",
  "CLOTHS\tMAXBOLT T SHIRTS",
  "CLOTHS\tOLD LI NING T SHIRT WITH COLOR",
  "CLOTHS\tOLD ORIGINAL T - SHIRTS",
  "CLOTHS\tORIGINAL SHORTS",
  "CLOTHS\tVSE SKIRTS",
  "CLOTHS\tYONEX SHORTS (CHN)",
  "CLOTHS\tYONEX SHORTS (MLSYA)",
  "CLOTHS\tYONEX T SHIRTS"
];

// Add all other categories here...
const remainingCategories = [
  "GRIPS\tFELET GRIP",
  "GRIPS\tHUNDRED GRIP - GTO 20",
  "GRIPS\tHUNDRED GRIP - GTR 17/18/19/34",
  "GRIPS\tKONEX TOWEL GRIP",
  "GRIPS\tLI NING  GP 20",
  "GRIPS\tLI NING  GP 24",
  "GRIPS\tLI NING CUSHION WRAP SINGLE",
  "GRIPS\tLI NING GP 16/17/18/19",
  "GRIPS\tLI NING GP 2000",
  "GRIPS\tLI NING TOWEL GRIP (L)",
  "GRIPS\tLI NING TOWEL GRIP (S)",
  "GRIPS\tLI NING TOWEL GRIP ROLL (GC-200R)",
  "GRIPS\tLI NING TOWEL GRIPS(GC 001)",
  "GRIPS\tMAXBOLT PU GRIP",
  "GRIPS\tMAXBOLT TOWEL GRIP ROLL",
  "GRIPS\tMAXBOLT TOWEL GRIP SINGLE",
  "GRIPS\tOQO OVER GRIP",
  "GRIPS\tSPACESHIP OVER GRIP",
  "GRIPS\tYONEX SUPER GRAP OVER GRIP",
  "GRIPS\tYONEX TOWEL GRIPS",
  "GRIPS\tGOSEN OVER GRIP",
  "GRIPS\tGOSEN REPLACMENT GRIP",
  "GRIPS\tHUNDRED GRIPS - GTD 25"
];

// Continue with more products...
// I'll create a batch processing approach since this is a very large dataset

// Generate SKU
function generateSKU(category, index) {
  const categoryAbbrev = {
    'GRIPS': 'GRP',
    'STRINGS': 'STR',
    'SOCKS': 'SOK',
    'SHUTTLECOCKS': 'SHU',
    'RACKETS': 'RAC',
    'WRISTBANDS': 'WRS',
    'OTHER': 'OTH',
    'NETS': 'NET',
    'SHOES': 'SHO',
    'BAGS': 'BAG',
    'CLOTHS': 'CLO'
  };
  
  const abbrev = categoryAbbrev[category] || 'OTH';
  const paddedIndex = String(index).padStart(4, '0');
  return `${abbrev}${paddedIndex}`;
}

// Parse product data
function parseProductLines(lines) {
  const products = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    
    const category = parts[0].trim();
    const name = parts[1].trim();
    
    products.push({
      category,
      name: name.replace(/'/g, "'").replace(/"/g, '"') // Clean quotes
    });
  }
  
  return products;
}

async function addCompleteRemainingProducts() {
  try {
    console.log('🚀 Starting to add remaining products from COMPLETE dataset...');
    
    // Get existing products to avoid duplicates
    const existingProducts = await prisma.product.findMany({
      select: { name: true }
    });
    const existingNames = new Set(existingProducts.map(p => p.name));
    console.log(`📋 Found ${existingNames.size} existing products to check against`);
    
    // Get categories and shops
    const categories = await prisma.category.findMany();
    const shops = await prisma.shop.findMany();
    const defaultShopId = shops[0]?.id;
    
    if (!defaultShopId) {
      throw new Error('No shops found!');
    }
    
    // Parse all products from the batch we have so far
    const products = parseProductLines([...productLines, ...remainingCategories]);
    console.log(`📦 Parsed ${products.length} products from current batch`);
    
    // Filter out duplicates
    const uniqueProducts = products.filter(p => !existingNames.has(p.name));
    console.log(`✨ Found ${uniqueProducts.length} NEW products to add`);
    console.log(`⏭️  Skipping ${products.length - uniqueProducts.length} existing products`);
    
    if (uniqueProducts.length === 0) {
      console.log('🎉 All products in this batch are already in the database!');
      return;
    }
    
    // Group by category
    const productsByCategory = {};
    for (const product of uniqueProducts) {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    }
    
    // Show what we'll be adding
    console.log('\n📊 New products by category:');
    for (const [cat, prods] of Object.entries(productsByCategory)) {
      console.log(`  ${cat}: ${prods.length} new products`);
    }
    
    let totalInserted = 0;
    const categoryCounter = { ...currentCounts };
    
    // Process each category
    for (const [categoryName, products] of Object.entries(productsByCategory)) {
      console.log(`\n📁 Processing ${categoryName}: ${products.length} products`);
      
      const category = categories.find(c => c.name === categoryName);
      if (!category) {
        console.log(`⚠️  Category ${categoryName} not found, skipping...`);
        continue;
      }
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const currentCount = categoryCounter[categoryName] + i + 1;
        const sku = generateSKU(categoryName, currentCount);
        
        try {
          await prisma.product.create({
            data: {
              name: product.name,
              sku: sku,
              price: 0,
              category: { connect: { id: category.id } },
              shop: { connect: { id: defaultShopId } }
            }
          });
          
          console.log(`✅ ${sku}: ${product.name}`);
          totalInserted++;
          
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️  Duplicate: ${product.name}`);
          } else {
            console.log(`❌ Failed: ${product.name} - ${error.message}`);
          }
        }
      }
      
      categoryCounter[categoryName] += products.length;
    }
    
    console.log(`\n🎉 Successfully added ${totalInserted} NEW products!`);
    console.log('\n📊 Updated category counts:');
    console.log(categoryCounter);
    
    const newTotal = Object.values(categoryCounter).reduce((sum, count) => sum + count, 0);
    console.log(`\n📈 Total products in database: ${newTotal}`);
    console.log('\n⚠️  NOTE: This was a partial batch. You may need to run additional scripts for the complete dataset.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCompleteRemainingProducts(); 