const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function calculateWeightedAverageCost() {
  try {
    // Get all purchase invoice items for product ID 7 (YONEX)
    const purchaseItems = await prisma.purchaseInvoiceItem.findMany({
      where: {
        productId: 7
      },
      include: {
        purchaseInvoice: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('\n=== YONEX Product Purchase History ===');
    console.log(`Found ${purchaseItems.length} purchase invoice items:\n`);

    let totalQuantity = 0;
    let totalValue = 0;

    purchaseItems.forEach((item, index) => {
      const quantity = item.quantity;
      const price = item.price;
      const total = quantity * price;
      
      totalQuantity += quantity;
      totalValue += total;

      console.log(`${index + 1}. Invoice: ${item.purchaseInvoice.invoiceNumber}`);
      console.log(`   Supplier: ${item.purchaseInvoice.supplier.name}`);
      console.log(`   Date: ${item.purchaseInvoice.invoiceDate || item.purchaseInvoice.createdAt}`);
      console.log(`   Quantity: ${quantity}`);
      console.log(`   Unit Price: Rs. ${price.toFixed(2)}`);
      console.log(`   Total Value: Rs. ${total.toFixed(2)}`);
      console.log('');
    });

    const weightedAverageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    console.log('=== CALCULATION SUMMARY ===');
    console.log(`Total Quantity Purchased: ${totalQuantity}`);
    console.log(`Total Purchase Value: Rs. ${totalValue.toFixed(2)}`);
    console.log(`Weighted Average Cost: Rs. ${weightedAverageCost.toFixed(2)}`);

    // Get current product data
    const product = await prisma.product.findUnique({
      where: { id: 7 },
      select: {
        name: true,
        sku: true,
        weightedAverageCost: true
      }
    });

    console.log('\n=== CURRENT PRODUCT DATA ===');
    console.log(`Product: ${product?.name}`);
    console.log(`SKU: ${product?.sku}`);
    console.log(`Current WAC in System: Rs. ${product?.weightedAverageCost?.toFixed(2) || '0.00'}`);
    console.log(`Calculated WAC: Rs. ${weightedAverageCost.toFixed(2)}`);
    
    const difference = Math.abs((product?.weightedAverageCost || 0) - weightedAverageCost);
    console.log(`Difference: Rs. ${difference.toFixed(2)}`);

  } catch (error) {
    console.error('Error calculating weighted average cost:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateWeightedAverageCost();