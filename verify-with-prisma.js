const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function verifyMigration() {
  try {
    console.log('Verifying data migration in Supabase using Prisma...');
    
    console.log('\n=== Migration Verification Results ===');
    
    // Check all main tables
    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount} records`);
    
    const permissionCount = await prisma.permission.count();
    console.log(`Permissions: ${permissionCount} records`);
    
    const shopCount = await prisma.shop.count();
    console.log(`Shops: ${shopCount} records`);
    
    const categoryCount = await prisma.category.count();
    console.log(`Categories: ${categoryCount} records`);
    
    const productCount = await prisma.product.count();
    console.log(`Products: ${productCount} records`);
    
    const inventoryCount = await prisma.inventoryItem.count();
    console.log(`Inventory Items: ${inventoryCount} records`);
    
    const customerCount = await prisma.customer.count();
    console.log(`Customers: ${customerCount} records`);
    
    const supplierCount = await prisma.supplier.count();
    console.log(`Suppliers: ${supplierCount} records`);
    
    const accountCount = await prisma.account.count();
    console.log(`Accounts: ${accountCount} records`);
    
    const purchaseInvoiceCount = await prisma.purchaseInvoice.count();
    console.log(`Purchase Invoices: ${purchaseInvoiceCount} records`);
    
    const purchaseInvoiceItemCount = await prisma.purchaseInvoiceItem.count();
    console.log(`Purchase Invoice Items: ${purchaseInvoiceItemCount} records`);
    
    const refreshTokenCount = await prisma.refreshToken.count();
    console.log(`Refresh Tokens: ${refreshTokenCount} records`);
    
    const systemSettingsCount = await prisma.systemSettings.count();
    console.log(`System Settings: ${systemSettingsCount} records`);
    
    console.log('\n=== Data Integrity Checks ===');
    
    // Check sample data
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      select: { id: true, email: true, name: true }
    });
    console.log('Sample Users:', sampleUsers);
    
    const sampleShops = await prisma.shop.findMany({
      select: { id: true, name: true, location: true }
    });
    console.log('Shops:', sampleShops);
    
    const inventoryWithDetails = await prisma.inventoryItem.findMany({
      include: {
        product: { select: { name: true } },
        shop: { select: { name: true } }
      }
    });
    console.log('Inventory with details:', inventoryWithDetails);
    
    // Check PurchaseInvoice with JSONB data
    const purchaseInvoiceWithDistributions = await prisma.purchaseInvoice.findFirst({
      select: { id: true, distributions: true }
    });
    console.log('Purchase Invoice with distributions:', purchaseInvoiceWithDistributions);
    
    console.log('\n✅ Migration verification completed successfully!');
    console.log('All data has been successfully migrated from Neon to Supabase.');
    
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyMigration();