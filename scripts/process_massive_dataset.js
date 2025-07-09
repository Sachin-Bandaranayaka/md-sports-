const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Current counts from our previous work
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

// Partial dataset (first batch)
const completeDataset = `BAGS	YONEX BOX TYPE (22931 WT)
BAGS	HUNDRED 3 ZIPPER LEVEL-UP BAG (2M145/144)
BAGS	HUNDRED 4M260/4M261
BAGS	HUNDRED 4M260/4M261 BLUE
BAGS	HUNDRED 4M260/4M261 RED
BAGS	HUNDRED 4M260/4M261 YELLOW
BAGS	HUNDRED BACKPACK 3M007
BAGS	HUNDRED BOX TYPE - 3M121
BAGS	HUNDRED BOX TYPE - 3M121 BLACK
BAGS	HUNDRED BOX TYPE - 3M121 BLUE
BAGS	HUNDRED BOX TYPE 2 POCKET - 3M120
BAGS	HUNDRED BOX TYPE 2 POCKET - 3M120 BLACK
BAGS	HUNDRED BOX TYPE 2 POCKET - 3M120 WHITE
BAGS	HUNDRED BOX TYPE 3M009-1
BAGS	HUNDRED COSMO RACKET BAG- 3M085
BAGS	HUNDRED COSMO RACKET BAG- 3M085 BLACK/ASH
BAGS	HUNDRED COSMO RACKET BAG- 3M085 BLACK/RED
BAGS	HUNDRED COSMO RACKET BAG- 3M085 BLUE/BLACK
BAGS	HUNDRED COSMO RACKET BAG- 3M085 BLUE/GOLD
BAGS	HUNDRED IDEAL BAG - 2M148/147/146
BAGS	HUNDRED NUCLEAR EDGE BAG 2M090
BAGS	HUNDRED URBAN POD BAG - 3M152
BAGS	LI NING 2 ZIPPER BLACK -  ABDS681-1
BAGS	LI NING 2 ZIPPER BLUE -  ABDT359-3
BAGS	LI NING 2 ZIPPER BLUE/GREEN -  ABDS681-2
BAGS	LI NING 2 ZIPPER RED -  ABDS681-5
BAGS	LI NING 2 ZIPPER WHITE -  ABDS681-4
BAGS	LI NING 3 POCKET BAG(661/853)
BAGS	LI NING 3 ZIPPER BAG (837/365/687)
BAGS	LI NING BACK PACK ABSU385
BAGS	LI NING BAG ABDU309
BAGS	LI NING BAG ABDU313
BAGS	LI NING BAG ABJS059
BAGS	LI NING BAG ABJU013
BAGS	LI NING BAG ABJU033
BAGS	LI NING BAG ABLU069
BAGS	LI NING BAG ABLV029
BAGS	LI NING BAG LU067
BAGS	LI NING BOX BAG 397 BLACK
BAGS	LI NING BOX BAG 399
BAGS	LI NING MAXIMUS 667/647
BAGS	LI NING SHOE BAG (285)
BAGS	MAXBOLT BOX 4013 BAG
BAGS	YONEX  BACKPACK ACE 2312
BAGS	YONEX 2 ZIPPER BAG (BT6)
BAGS	YONEX 3 ZIP PRO PERFORM BAG - 92429EX
BAGS	YONEX 3 ZIPPER (BT 9)
BAGS	YONEX 3D B1 ZIPPER BOX TYPE BAG
BAGS	YONEX 3D BOX TYPE BAG (3D-2231)
BAGS	YONEX ACE 2326 BAG
BAGS	YONEX BAG 2331WEX
BAGS	YONEX BASIC KITBAG BLACK GRAY
BAGS	YONEX BASIC KITBAG BLACK GRAY YELLOW
BAGS	YONEX BASIC KITBAG NAVY BLUE CYBER LIME
BAGS	YONEX BASIC KITBAG RED BLACK
BAGS	YONEX BASIC KITBAG ROYAL BLUE BLACK
BAGS	YONEX BOX TOURNAMENT BAG 2331
BAGS	YONEX CLUB BACK PACK (22412S)
BAGS	3D 3 ZIPPER  TOURNAMENT BAG
BAGS	APACS 2 ZIPPER BAG
BAGS	LI NING 2 ZIPPER BAG (361/403/359/677/681/839/841)
BAGS	LI NING 2 ZIPPER BAG (SIN)
BAGS	LI NING BACK PACK (BLUE) 269
BAGS	LI NING BACKPACK (IND)
BAGS	LI NING BAG 315
BAGS	LI NING BOX TYPE BAG (363)
BAGS	LIN NING BOX TYPE (319)
BAGS	LIN NING BOX TYPE CRUZE
BAGS	MAXBOLT 1 ZIPPER BAG
BAGS	MAXBOLT 2 ZIPPER BAG
BAGS	VSE RACKET BAG
BAGS	YONEX 2 ZIPPER PERFORMANCE BAG
BAGS	YONEX 3 ZIPPER PERFORMANCE BAG (BA922229EX)
BAGS	YONEX 3D 2 ZIPPER GR 1
BAGS	YONEX 3D 2 ZIPPER GR 2
BAGS	YONEX 3D PERFORMANCE BOX TYPE (22931WT)
BAGS	YONEX BACK PACK (GREEN)
BAGS	YONEX BASIC KITBAG 2215 / 2225/ 23015 / 24015
BAGS	YONEX BOX  BAG 22831
BAGS	YONEX EVOLVING BACK PACK (BLACK)
BAGS	YONEX EXPERT BAG - 2326EX
BAGS	YONEX LEAGE BACK PACK
CLOTHS	HUNDRED SHORTS (3M130/131)
CLOTHS	HUNDRED SHORTS (4M016/017)
CLOTHS	HUNDRED T.SHIRTS (3M123/124/125/126/127/129)
CLOTHS	LI NING / YONEX  T SHIRT (963/707/995/993)
CLOTHS	LI NING / YONEX SHORTS(725/727/745/723)
CLOTHS	LI NING BOTTOM
CLOTHS	LI NING TOP
CLOTHS	ADDIDAS BODY ARMOUR
CLOTHS	BADMINTON SHORTS(DBI)
CLOTHS	BADMINTON T SHIRT
CLOTHS	BADMINTON T SHIRT (CHN)
CLOTHS	BADMINTON T SHIRTS(DBI)
CLOTHS	BADMINTON T-SHIRTS (SA)
CLOTHS	DRY FIT SKINNIES
CLOTHS	DRY FIT T SHIRTS
CLOTHS	LADIES TIGHT LEGGINGS
CLOTHS	LI NING POLO T.SHIRT (691)
CLOTHS	LI NING POLO T.SHIRT (997)
CLOTHS	LI NING T SHIRT (IND)
CLOTHS	LI NING TRACK PANT
CLOTHS	LI NING V NECK T.SHIRT (701)
CLOTHS	MAXBOLT SHORTS
CLOTHS	MAXBOLT T SHIRTS
CLOTHS	OLD LI NING T SHIRT WITH COLOR
CLOTHS	OLD ORIGINAL T - SHIRTS
CLOTHS	ORIGINAL SHORTS
CLOTHS	VSE SKIRTS
CLOTHS	YONEX SHORTS (CHN)
CLOTHS	YONEX SHORTS (MLSYA)
CLOTHS	YONEX T SHIRTS
GRIPS	FELET GRIP
GRIPS	HUNDRED GRIP - GTO 20
GRIPS	HUNDRED GRIP - GTR 17/18/19/34
GRIPS	KONEX TOWEL GRIP
GRIPS	LI NING  GP 20
GRIPS	LI NING  GP 24
GRIPS	LI NING CUSHION WRAP SINGLE
GRIPS	LI NING GP 16/17/18/19
GRIPS	LI NING GP 2000
GRIPS	LI NING TOWEL GRIP (L)
GRIPS	LI NING TOWEL GRIP (S)
GRIPS	LI NING TOWEL GRIP ROLL (GC-200R)
GRIPS	LI NING TOWEL GRIPS(GC 001)
GRIPS	MAXBOLT PU GRIP
GRIPS	MAXBOLT TOWEL GRIP ROLL
GRIPS	MAXBOLT TOWEL GRIP SINGLE
GRIPS	OQO OVER GRIP
GRIPS	SPACESHIP OVER GRIP
GRIPS	YONEX SUPER GRAP OVER GRIP
GRIPS	YONEX TOWEL GRIPS
GRIPS	GOSEN OVER GRIP
GRIPS	GOSEN REPLACMENT GRIP
GRIPS	HUNDRED GRIPS - GTD 25
OTHER	OUT GUTING
OTHER	LI NING K-TAPE BOX
OTHER	APACS GRIP POWDER
OTHER	BADMINTON KEY TAG
OTHER	GOLD KEY TAG
OTHER	GROMMET BOX
OTHER	HUNDRED INSOLE
OTHER	HUNDRED INSOLE PRO
OTHER	IODEX RAPID SPARAY
OTHER	LI NING FLIP-FLOPS
OTHER	LI NING INSOLE
OTHER	LI NING MASK
OTHER	LI NING SKIPPING ROPE (SP333)
OTHER	LI NING SKIPPING ROPE (SP421)
OTHER	LI NING SKIPPING ROPE 776/778
OTHER	LI NING SLIPPERS
OTHER	LI NING TOWEL (L)
OTHER	LI NING TOWEL (S)
OTHER	LI NING TOWEL (YY216)
OTHER	LI NING WATER BOTTLE
OTHER	LI-NING KEY TAG
OTHER	Li-Ning Skipping Rope
OTHER	SHUTTLE KEY TAG
OTHER	SILVER KEY TAG
OTHER	STAY SAFE ICE COLD SPRAY
OTHER	YONEX KEY TAG
OTHER	YONEX WATER BOTTLE
OTHER	DUNLOP SQUASH BALLS
OTHER	LI NING FLASK (RED)
OTHER	MIRRORS
OTHER	OTHER
OTHER	YONEX ANKLE SUPPORT
OTHER	YONEX KNEE SUPPORT
OTHER	FORM ROLLER
OTHER	YOGA MAT (8MM)
NETS	HUNDRED BADMINTON NET BNT-80
NETS	LI NING BADMINTON NET BN450L
NETS	LI NING BADMINTON NET BN600L
NETS	YONEX BADMINTON NET (AC152EX/139A)
NETS	YONEX BN-152 PRO HQ NET
NETS	YONEX BN139R NET
NETS	YONEX HIGH QUALITY NET`;

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

async function processMassiveDataset() {
  try {
    console.log('🚀 Processing massive product dataset (Batch 1)...');
    
    // Get existing products to avoid duplicates
    const existingProducts = await prisma.product.findMany({
      select: { name: true }
    });
    const existingNames = new Set(existingProducts.map(p => p.name));
    console.log(`📋 Found ${existingNames.size} existing products`);
    
    // Get categories and shops
    const categories = await prisma.category.findMany();
    const shops = await prisma.shop.findMany();
    const defaultShopId = shops[0]?.id;
    
    if (!defaultShopId) {
      throw new Error('No shops found!');
    }
    
    // Parse the dataset
    const lines = completeDataset.trim().split('\n');
    const allProducts = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split('\t');
      if (parts.length < 2) continue;
      
      const category = parts[0].trim();
      const name = parts[1].trim();
      
      allProducts.push({ category, name });
    }
    
    console.log(`📦 Parsed ${allProducts.length} products from dataset`);
    
    // Filter out existing products
    const newProducts = allProducts.filter(p => !existingNames.has(p.name));
    console.log(`✨ Found ${newProducts.length} NEW products to add`);
    console.log(`⏭️  Skipping ${allProducts.length - newProducts.length} existing products`);
    
    if (newProducts.length === 0) {
      console.log('🎉 All products in this batch are already in the database!');
      return;
    }
    
    // Group by category
    const productsByCategory = {};
    for (const product of newProducts) {
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
    
    let totalProcessed = 0;
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
          totalProcessed++;
          
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
    
    console.log(`\n🎉 Successfully processed ${totalProcessed} NEW products!`);
    console.log('\n📊 Updated category counts:');
    console.log(categoryCounter);
    
    const newTotal = Object.values(categoryCounter).reduce((sum, count) => sum + count, 0);
    console.log(`\n📈 Total products in database: ${newTotal}`);
    console.log('\n⚠️  NOTE: This was batch 1. More batches needed for complete dataset.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processMassiveDataset(); 