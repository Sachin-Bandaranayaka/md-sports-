/**
 * Inventory Reconciliation Script
 * 
 * This script reconciles inventory data with purchase invoice data to fix discrepancies.
 * 
 * To run: 
 * 1. Make sure prisma client is installed: npm install @prisma/client
 * 2. Run the script with Node.js: node reconcile-inventory.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reconcileInventory() {
  console.log('Starting inventory reconciliation...');
  
  try {
    // Get the current state for reporting
    const beforeTotal = await getTotalInventoryValue();
    console.log(`Current total inventory value: ${beforeTotal}`);
    
    const purchaseTotal = await getTotalPurchaseValue();
    console.log(`Current total purchase invoice value: ${purchaseTotal}`);
    
    console.log(`Current discrepancy: ${beforeTotal - purchaseTotal}`);
    
    // Get raw database values for comparison
    const rawProducts = await prisma.$queryRaw`
      SELECT id, name, weightedaveragecost 
      FROM "Product" 
      WHERE id IN (SELECT DISTINCT "productId" FROM "InventoryItem")
    `;
    
    // Start a transaction for all our updates
    await prisma.$transaction(async (tx) => {
      // Get all products with inventory
      const productsWithInventory = await tx.product.findMany({
        where: {
          inventoryItems: {
            some: {}
          }
        },
        include: {
          inventoryItems: true
        }
      });
      
      console.log(`Found ${productsWithInventory.length} products with inventory records`);
      
      // Process each product
      for (const product of productsWithInventory) {
        // Get all purchase invoice items for this product
        const purchaseItems = await tx.purchaseInvoiceItem.findMany({
          where: {
            productId: product.id
          }
        });
        
        // Get raw product data
        const rawProduct = rawProducts.find(p => p.id === product.id);
        
        console.log(`Product ${product.id} (${product.name}): ${purchaseItems.length} purchase items found`);
        console.log(`Current raw DB weighted average cost: ${rawProduct?.weightedaveragecost}`);
        
        // Calculate the correct weighted average cost
        let totalQuantity = 0;
        let totalValue = 0;
        
        purchaseItems.forEach(item => {
          totalQuantity += item.quantity;
          totalValue += item.quantity * item.price;
        });
        
        let newWeightedAverageCost = 0;
        if (totalQuantity > 0) {
          newWeightedAverageCost = totalValue / totalQuantity;
        }
        
        // Update the product's weighted average cost using raw query
        // This avoids Prisma model naming issues
        await prisma.$executeRaw`
          UPDATE "Product" 
          SET weightedaveragecost = ${newWeightedAverageCost} 
          WHERE id = ${product.id}
        `;
        
        console.log(`Updated weighted average cost for product ${product.id} from ${rawProduct?.weightedaveragecost} to ${newWeightedAverageCost}`);
        
        // Reconcile inventory quantities
        // For simplicity, we'll ensure that the total inventory quantity 
        // matches the total quantity from purchase invoices
        
        // Calculate the total inventory quantity this product should have
        const currentInventoryTotal = product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
        
        if (currentInventoryTotal !== totalQuantity) {
          console.log(`Inventory quantity discrepancy for product ${product.id}: Current=${currentInventoryTotal}, Should be=${totalQuantity}`);
          
          // If there's a mismatch, adjust the quantities
          // For simplicity, we'll adjust the first inventory item to match the total
          if (product.inventoryItems.length > 0 && totalQuantity > 0) {
            // We'll put all inventory in the first shop record
            const firstInventoryItem = product.inventoryItems[0];
            
            await tx.inventoryItem.update({
              where: { id: firstInventoryItem.id },
              data: { quantity: totalQuantity }
            });
            
            // Delete any other inventory items for this product
            if (product.inventoryItems.length > 1) {
              for (let i = 1; i < product.inventoryItems.length; i++) {
                await tx.inventoryItem.delete({
                  where: { id: product.inventoryItems[i].id }
                });
              }
            }
            
            console.log(`Adjusted inventory for product ${product.id} to ${totalQuantity} items in shop ${firstInventoryItem.shopId}`);
          } else if (totalQuantity > 0) {
            // No inventory items exist but should have some - create a new one in shop 11
            await tx.inventoryItem.create({
              data: {
                productId: product.id,
                shopId: 11, // Default to shop ID 11 based on earlier checks
                quantity: totalQuantity
              }
            });
            
            console.log(`Created new inventory record for product ${product.id} with ${totalQuantity} items in shop 11`);
          }
        }
      }
    });
    
    // Get the final state for reporting
    const afterTotal = await getTotalInventoryValue();
    console.log(`\nReconciliation complete!`);
    console.log(`New total inventory value: ${afterTotal}`);
    console.log(`New total purchase invoice value: ${purchaseTotal}`);
    console.log(`New discrepancy: ${afterTotal - purchaseTotal}`);
    
  } catch (error) {
    console.error('Error during reconciliation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function getTotalInventoryValue() {
  const result = await prisma.$queryRaw`
    SELECT SUM(ii.quantity * p.weightedaveragecost) as total
    FROM "InventoryItem" ii 
    JOIN "Product" p ON ii."productId" = p.id
  `;
  return result[0].total || 0;
}

async function getTotalPurchaseValue() {
  const result = await prisma.$queryRaw`
    SELECT SUM(total) as total FROM "PurchaseInvoice"
  `;
  return result[0].total || 0;
}

// Run the reconciliation
reconcileInventory()
  .then(() => console.log('Reconciliation script finished'))
  .catch(e => console.error('Reconciliation script failed:', e)); 