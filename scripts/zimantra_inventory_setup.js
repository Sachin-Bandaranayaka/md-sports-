const fs = require('fs');
const path = require('path');

// Shop and supplier IDs from database
const ZIMANTRA_SHOP_ID = 'cmc7vurx10000x5r4mrml2kh4';
const SUPPLIER_INDIA_ID = 23; // We'll use INDIA as the main supplier

// Category mapping from database
const categoryMap = {
  'BAGS': 20,
  'CLOTHS': 21,
  'GRIPS': 22,
  'OTHER': 23,
  'NETS': 24,
  'RACKETS': 25,
  'SHOES': 26,
  'SHUTTLECOCKS': 27,
  'SOCKS': 28,
  'STRINGS': 29,
  'WRISTBAND': 23, // Map to OTHER
  'K-TAPE': 23, // Map to OTHER  
  'SHUTTLE': 27, // Map to SHUTTLECOCKS
  'SHOE': 26 // Map to SHOES
};

// Generate SKU function
function generateSKU(categoryName, count) {
  const categoryPrefix = {
    'BAGS': 'BAG',
    'CLOTHS': 'CLO', 
    'GRIPS': 'GRP',
    'OTHER': 'OTH',
    'NETS': 'NET',
    'RACKETS': 'RAC',
    'SHOES': 'SHO',
    'SHUTTLECOCKS': 'SHU',
    'SOCKS': 'SOC',
    'STRINGS': 'STR',
    'WRISTBAND': 'WRS',
    'K-TAPE': 'KTP',
    'SHUTTLE': 'SHL',  // Different from SHUTTLECOCKS
    'SHOE': 'SHE'      // Different from SHOES
  };
  
  return `${categoryPrefix[categoryName] || 'OTH'}${String(count).padStart(4, '0')}`;
}

// Parse zimantra.txt file
function parseZimantraData() {
  const filePath = path.join(__dirname, 'zimantra.txt');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const products = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip header lines and separator lines
    if (i === 0 || i === 1 || line.includes('----') || !line.startsWith('|')) {
      continue;
    }
    
    const parts = line.split('|').map(part => part.trim()).filter(part => part);
    if (parts.length < 5) continue;
    
    const [category, name, qtyOwnedStr, avgCostStr, salesPriceStr] = parts;
    
    // Parse quantities and prices
    const qtyOwned = parseInt(qtyOwnedStr.replace(/,/g, '')) || 0;
    const avgCost = parseFloat(avgCostStr.replace(/,/g, '')) || 0;
    const salesPrice = salesPriceStr === '-' ? 0 : parseFloat(salesPriceStr.replace(/,/g, '')) || 0;
    
    // Only include products with quantity > 0 (we have inventory)
    if (qtyOwned > 0) {
      products.push({
        category: category.trim(),
        name: name.trim(),
        qtyOwned,
        avgCost,
        salesPrice
      });
    }
  }
  
  return products;
}

// Group products by category and generate SQL
function generateSQL() {
  const products = parseZimantraData();
  
  // Group by category and count
  const productsByCategory = {};
  // Use SKU prefix as the key for counting to avoid duplicates
  const skuPrefixCounts = {};
  
  products.forEach(product => {
    const cat = product.category;
    if (!productsByCategory[cat]) {
      productsByCategory[cat] = [];
    }
    productsByCategory[cat].push(product);
  });
  
  let productSQL = '';
  let purchaseInvoiceSQL = '';
  let inventorySQL = '';
  
  // Generate product insert statements
  const allProductInserts = [];
  const allPurchaseItems = [];
  let totalInventoryValue = 0;
  
  for (const [categoryName, categoryProducts] of Object.entries(productsByCategory)) {
    const categoryId = categoryMap[categoryName] || 23; // Default to OTHER
    
    categoryProducts.forEach((product, index) => {
      // Get the SKU prefix for this category
      const categoryPrefix = {
        'BAGS': 'BAG',
        'CLOTHS': 'CLO', 
        'GRIPS': 'GRP',
        'OTHER': 'OTH',
        'NETS': 'NET',
        'RACKETS': 'RAC',
        'SHOES': 'SHO',
        'SHUTTLECOCKS': 'SHU',
        'SOCKS': 'SOC',
        'STRINGS': 'STR',
        'WRISTBAND': 'WRS',
        'K-TAPE': 'KTP',
        'SHUTTLE': 'SHL',  // Different from SHUTTLECOCKS
        'SHOE': 'SHE'      // Different from SHOES
      };
      
      const prefix = categoryPrefix[categoryName] || 'OTH';
      
      // Increment count for this prefix
      skuPrefixCounts[prefix] = (skuPrefixCounts[prefix] || 0) + 1;
      const sku = `${prefix}${String(skuPrefixCounts[prefix]).padStart(4, '0')}`;
      
      // Product insert
      allProductInserts.push({
        name: product.name,
        sku: sku,
        price: product.salesPrice,
        categoryId: categoryId,
        shopId: ZIMANTRA_SHOP_ID
      });
      
      // Purchase invoice item (for inventory)
      if (product.qtyOwned > 0 && product.avgCost > 0) {
        const itemTotal = product.qtyOwned * product.avgCost;
        totalInventoryValue += itemTotal;
        
        allPurchaseItems.push({
          productSku: sku,
          productName: product.name,
          quantity: product.qtyOwned,
          cost: product.avgCost,
          total: itemTotal
        });
      }
    });
  }
  
  // Generate SQL for products
  productSQL += `-- Insert Products for Zimantra Shop\n`;
  allProductInserts.forEach(product => {
    productSQL += `INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('${product.name.replace(/'/g, "''")}', '${product.sku}', ${product.price}, ${product.categoryId}, '${product.shopId}', NOW(), NOW());\n`;
  });
  
  // Generate purchase invoice
  const invoiceNumber = `PI-ZIM-${new Date().getFullYear()}-001`;
  const invoiceDate = new Date().toISOString().split('T')[0];
  
  purchaseInvoiceSQL += `\n-- Create Purchase Invoice for Zimantra Initial Inventory\n`;
  purchaseInvoiceSQL += `INSERT INTO "PurchaseInvoice" ("invoiceNumber", "supplierId", total, status, "createdAt", "updatedAt", date) 
VALUES ('${invoiceNumber}', ${SUPPLIER_INDIA_ID}, ${totalInventoryValue.toFixed(2)}, 'completed', NOW(), NOW(), '${invoiceDate}');\n\n`;
  
  // Generate purchase invoice items
  purchaseInvoiceSQL += `-- Purchase Invoice Items\n`;
  allPurchaseItems.forEach(item => {
    purchaseInvoiceSQL += `INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = '${invoiceNumber}'),
  (SELECT id FROM "Product" WHERE sku = '${item.productSku}'),
  ${item.quantity},
  ${item.cost},
  ${item.total.toFixed(2)},
  NOW(),
  NOW();\n`;
  });
  
  // Generate inventory items
  inventorySQL += `\n-- Create Inventory Items for Zimantra Shop\n`;
  allPurchaseItems.forEach(item => {
    inventorySQL += `INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = '${item.productSku}'),
  ${item.quantity},
  '${ZIMANTRA_SHOP_ID}',
  ${item.cost},
  NOW(),
  NOW()
);\n`;
  });
  
  // Calculate category counts for summary
  const categoryCounts = {};
  Object.entries(productsByCategory).forEach(([cat, products]) => {
    categoryCounts[cat] = products.length;
  });

  const summary = `
-- ZIMANTRA INVENTORY SETUP SUMMARY
-- =================================
-- Total Products: ${allProductInserts.length}
-- Total Inventory Value: RM ${totalInventoryValue.toFixed(2)}
-- Expected Total: RM 8,779,108.81
-- 
-- Categories:
${Object.entries(categoryCounts).map(([cat, count]) => `--   ${cat}: ${count} products`).join('\n')}
--
-- This script will:
-- 1. Create ${allProductInserts.length} products for Zimantra shop
-- 2. Create 1 purchase invoice (${invoiceNumber}) 
-- 3. Create ${allPurchaseItems.length} purchase invoice items
-- 4. Create ${allPurchaseItems.length} inventory items
--
`;
  
  return summary + productSQL + purchaseInvoiceSQL + inventorySQL;
}

// Main execution
function main() {
  try {
    console.log('🚀 Starting Zimantra inventory setup...');
    
    const sql = generateSQL();
    
    // Write to file
    const outputPath = path.join(__dirname, 'zimantra_inventory_setup.sql');
    fs.writeFileSync(outputPath, sql);
    
    console.log(`✅ SQL script generated: ${outputPath}`);
    console.log('\nTo execute:');
    console.log('1. Review the generated SQL file');
    console.log('2. Run it against your database');
    console.log('3. Verify the total inventory value matches RM 8,779,108.81');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseZimantraData, generateSQL }; 