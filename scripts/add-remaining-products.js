const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const remainingProducts = [
  // Continue from where it failed - YONEX NANOFLARE products and beyond
  { name: 'YONEX NANOFLARE NEXTAGE', description: 'YONEX Nanoflare Nextage badminton racket', category: 'RACKETS' },
  { name: 'YONEX NANORAY  LIte / HL', description: 'YONEX Nanoray Lite badminton racket head light', category: 'RACKETS' },
  { name: 'YONEX NANORAY 20', description: 'YONEX Nanoray 20 badminton racket', category: 'RACKETS' },
  { name: 'YONEX NANORAY 9 / ACE', description: 'YONEX Nanoray 9 Ace badminton racket', category: 'RACKETS' },
  { name: 'YONEX VOLTRIC  LITE 40i', description: 'YONEX Voltric Lite 40i badminton racket', category: 'RACKETS' },
  { name: 'YONEX VOLTRIC LITE 20I/25I/35i/37i/40i/47i / HH', description: 'YONEX Voltric Lite series badminton rackets heavy head', category: 'RACKETS' },
  { name: 'YOUNG GT / ENERGY', description: 'Young GT Energy badminton racket', category: 'RACKETS' },

  // Additional RACKETS from second list
  { name: 'APACS COMMANDER 80', description: 'APACS Commander 80 badminton racket', category: 'RACKETS' },
  { name: 'APACS RACKET', description: 'APACS badminton racket', category: 'RACKETS' },
  { name: 'APACS SATELLITE', description: 'APACS Satellite badminton racket', category: 'RACKETS' },
  { name: 'FELET TJ 1000', description: 'FELET TJ 1000 badminton racket', category: 'RACKETS' },
  { name: 'FLEX RACKETS', description: 'Flex badminton rackets', category: 'RACKETS' },
  { name: 'GONGKE K1/K3/K5', description: 'GONGKE badminton rackets K1/K3/K5', category: 'RACKETS' },
  { name: 'HNDRD MEDAL MASTER', description: 'HUNDRED Medal Master badminton racket', category: 'RACKETS' },
  { name: 'HUNDRED BATTLE 900', description: 'HUNDRED Battle 900 badminton racket', category: 'RACKETS' },
  { name: 'HUNDRED CULT 77', description: 'HUNDRED Cult 77 badminton racket', category: 'RACKETS' },
  { name: 'HUNDRED CULT 79', description: 'HUNDRED Cult 79 badminton racket', category: 'RACKETS' },
  { name: 'HUNDRED CULT 82', description: 'HUNDRED Cult 82 badminton racket', category: 'RACKETS' },
  { name: 'POWERMAX', description: 'POWERMAX badminton racket', category: 'RACKETS' },
  { name: 'YONEX ASTROX 10 DG', description: 'YONEX Astrox 10 DG badminton racket', category: 'RACKETS' },
  { name: 'YONEX GR 202', description: 'YONEX GR 202 badminton racket', category: 'RACKETS' },
  { name: 'YONEX MUSCLE POWER 55', description: 'YONEX Muscle Power 55 badminton racket', category: 'RACKETS' },

  // Additional SHOES section - major additions here
  { name: 'KONNEX EUR-30 BLUE', description: 'KONNEX badminton shoes EUR size 30 blue', category: 'SHOES' },
  { name: 'KONNEX EUR-30 MIDNIGHT BLUE', description: 'KONNEX badminton shoes EUR size 30 midnight blue', category: 'SHOES' },
  { name: 'LI NING ALMIGHTY V', description: 'LI NING Almighty V badminton shoes', category: 'SHOES' },
  { name: 'LI NING BLAST LITE', description: 'LI NING Blast Lite badminton shoes', category: 'SHOES' },
  { name: 'LI NING DF LITE', description: 'LI NING DF Lite badminton shoes', category: 'SHOES' },
  { name: 'LI NING DF PRO', description: 'LI NING DF Pro badminton shoes', category: 'SHOES' },
  { name: 'Li Ning Energy 10', description: 'Li Ning Energy 10 badminton shoes', category: 'SHOES' },
  { name: 'LI NING ERUPT SHOE', description: 'LI NING Erupt badminton shoe', category: 'SHOES' },
  { name: 'LI NING FLY', description: 'LI NING Fly badminton shoes', category: 'SHOES' },
  { name: 'LI NING HALBERD III SHOE', description: 'LI NING Halberd III badminton shoe', category: 'SHOES' },
  { name: 'LI NING HYPERSONIC SHOE', description: 'LI NING Hypersonic badminton shoe', category: 'SHOES' },
  { name: 'LI NING JF-1 SE', description: 'LI NING JF-1 SE badminton shoes', category: 'SHOES' },
  { name: 'LI NING LT LITE', description: 'LI NING LT Lite badminton shoes', category: 'SHOES' },
  { name: 'LI NING MIRAGE PRO', description: 'LI NING Mirage Pro badminton shoes', category: 'SHOES' },
  { name: 'LI NING MIRAGE SE', description: 'LI NING Mirage SE badminton shoes', category: 'SHOES' },
  { name: 'LI NING SAGA LITE 8', description: 'LI NING Saga Lite 8 badminton shoes', category: 'SHOES' },
  { name: 'LI NING SAGA TF 02', description: 'LI NING Saga TF 02 badminton shoes', category: 'SHOES' },
  { name: 'LI NING THUNDER JR', description: 'LI NING Thunder JR badminton shoes', category: 'SHOES' },
  { name: 'LI NING ULTRA FLY 2', description: 'LI NING Ultra Fly 2 badminton shoes', category: 'SHOES' },
  { name: 'LI NING ULTRA FLY 3', description: 'LI NING Ultra Fly 3 badminton shoes', category: 'SHOES' },

  // YONEX shoes with many size variations
  { name: 'YONEX AERUS Z', description: 'YONEX Aerus Z badminton shoes', category: 'SHOES' },
  { name: 'YONEX BLAZE 2 I', description: 'YONEX Blaze 2 I badminton shoes', category: 'SHOES' },
  { name: 'YONEX BLAZE III', description: 'YONEX Blaze III badminton shoes', category: 'SHOES' },
  { name: 'YONEX CASCADE DRIVE', description: 'YONEX Cascade Drive badminton shoes', category: 'SHOES' },
  { name: 'YONEX CASCADE DRIVE 2', description: 'YONEX Cascade Drive 2 badminton shoes', category: 'SHOES' },
  { name: 'YONEX COMFORT Z UK-10 WHITE/GREEN', description: 'YONEX Comfort Z badminton shoes UK size 10 white/green', category: 'SHOES' },
  { name: 'YONEX DIAL 88', description: 'YONEX Dial 88 badminton shoes', category: 'SHOES' },
  { name: 'YONEX DOMINANT 2', description: 'YONEX Dominant 2 badminton shoes', category: 'SHOES' },
  { name: 'YONEX DUAL SHOES', description: 'YONEX Dual badminton shoes', category: 'SHOES' },
  { name: 'YONEX ECLIPTION Z', description: 'YONEX Ecliption Z badminton shoes', category: 'SHOES' },
  { name: 'YONEX INFINITY 2', description: 'YONEX Infinity 2 badminton shoes', category: 'SHOES' },

  // Additional STRINGS
  { name: 'MAVIS 600 (BLUE)', description: 'MAVIS 600 blue shuttlecocks', category: 'SHUTTLECOCKS' },
  { name: 'RSL', description: 'RSL shuttlecocks', category: 'SHUTTLECOCKS' },
  
  // Additional STRINGS
  { name: 'APACS STRINGS', description: 'APACS badminton strings', category: 'STRINGS' },
  { name: 'GOSEN RY 65/58 SINGLE', description: 'GOSEN RY 65/58 single badminton strings', category: 'STRINGS' },
  { name: 'HUNDRED 700S/600S', description: 'HUNDRED badminton strings 700S/600S', category: 'STRINGS' },
  { name: 'HUNDRED HYBRID', description: 'HUNDRED hybrid badminton strings', category: 'STRINGS' },
  { name: 'HUNDRED JP 70', description: 'HUNDRED JP 70 badminton strings', category: 'STRINGS' },
  { name: 'HUNDRED Z70 STRINGS', description: 'HUNDRED Z70 badminton strings', category: 'STRINGS' },
  { name: 'HUNRED 66X BOOST', description: 'HUNDRED 66X Boost badminton strings', category: 'STRINGS' },
  { name: 'HUNRED 70X BOOST', description: 'HUNDRED 70X Boost badminton strings', category: 'STRINGS' },
  { name: 'YONEX AEROBITE', description: 'YONEX Aerobite badminton strings', category: 'STRINGS' },
  { name: 'YONEX AEROBITE BOOST', description: 'YONEX Aerobite Boost badminton strings', category: 'STRINGS' },
  { name: 'YONEX AEROSONIC', description: 'YONEX Aerosonic badminton strings', category: 'STRINGS' },
  { name: 'YONEX BG 65 GOLD', description: 'YONEX BG 65 gold badminton strings', category: 'STRINGS' },
  { name: 'YONEX BG 65 GREEN', description: 'YONEX BG 65 green badminton strings', category: 'STRINGS' },
  { name: 'YONEX BG 65 ORANGE', description: 'YONEX BG 65 orange badminton strings', category: 'STRINGS' },
  { name: 'YONEX BG 65 PINK', description: 'YONEX BG 65 pink badminton strings', category: 'STRINGS' },
  { name: 'YONEX NANOGY 95', description: 'YONEX Nanogy 95 badminton strings', category: 'STRINGS' },
  { name: 'YONEX NANOGY 99', description: 'YONEX Nanogy 99 badminton strings', category: 'STRINGS' },
  
  // Additional WRISTBANDS
  { name: 'GR 2 WRISTBAND', description: 'GR 2 badminton wristband', category: 'WRISTBANDS' }
];

async function addRemainingProducts() {
  console.log('Adding remaining products...');
  
  try {
    let productIndex = 500; // Start from a high number to avoid conflicts
    
    for (const product of remainingProducts) {
      const category = await prisma.category.findFirst({
        where: { name: product.category }
      });
      
      if (category) {
        // Check if product already exists
        const existingProduct = await prisma.product.findFirst({
          where: { 
            name: product.name,
            categoryId: category.id
          }
        });
        
        if (!existingProduct) {
          // Generate unique SKU
          const timestamp = Date.now().toString().slice(-6); // Last 6 digits for more uniqueness
          const sku = `${product.category.substring(0,3)}-${timestamp}-${productIndex}`;
          
          const result = await prisma.product.create({
            data: {
              name: product.name,
              description: product.description,
              price: 0,
              sku: sku,
              categoryId: category.id
            }
          });
          console.log(`Created product: ${result.name} (SKU: ${result.sku})`);
          productIndex++;
        } else {
          console.log(`Product already exists: ${existingProduct.name}`);
        }
      } else {
        console.log(`Category not found: ${product.category}`);
      }
    }
    
    console.log('✅ Successfully added remaining products!');
    
  } catch (error) {
    console.error('❌ Error adding remaining products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRemainingProducts(); 