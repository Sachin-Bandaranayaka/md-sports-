const { Client } = require('pg');

// Supabase database connection
const supabaseClient = new Client({
  connectionString: process.env.DATABASE_URL
});

async function verifyMigration() {
  try {
    console.log('Verifying data migration in Supabase...');
    
    await supabaseClient.connect();
    
    // Check all tables and their record counts
    const tables = [
      'User', 'Permission', 'Role', '_PermissionToRole', 'Shop', 
      'Category', 'Product', 'InventoryItem', 'Customer', 'Supplier',
      'Account', 'PurchaseInvoice', 'PurchaseInvoiceItem', 'RefreshToken', 'SystemSettings'
    ];
    
    console.log('\n=== Migration Verification Results ===');
    
    for (const table of tables) {
      const result = await supabaseClient.query(`SELECT COUNT(*) as count FROM "${table}"`);
      console.log(`${table}: ${result.rows[0].count} records`);
    }
    
    // Verify specific data integrity
    console.log('\n=== Data Integrity Checks ===');
    
    // Check Users
    const users = await supabaseClient.query('SELECT id, email, name FROM "User" LIMIT 3');
    console.log('Sample Users:', users.rows);
    
    // Check PurchaseInvoice with JSONB data
    const purchaseInvoice = await supabaseClient.query('SELECT id, distributions FROM "PurchaseInvoice" LIMIT 1');
    console.log('PurchaseInvoice with JSONB:', purchaseInvoice.rows);
    
    // Check Permissions
    const permissions = await supabaseClient.query('SELECT COUNT(*) as count, resource FROM "Permission" GROUP BY resource LIMIT 5');
    console.log('Permission distribution:', permissions.rows);
    
    // Check Products and Inventory
    const inventory = await supabaseClient.query(`
      SELECT p.name as product_name, i.quantity, i."minStockLevel", s.name as shop_name 
      FROM "Product" p 
      JOIN "InventoryItem" i ON p.id = i."productId" 
      JOIN "Shop" s ON i."shopId" = s.id
    `);
    console.log('Inventory items:', inventory.rows);
    
    console.log('\n✅ Migration verification completed successfully!');
    
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await supabaseClient.end();
  }
}

// Run verification
verifyMigration();