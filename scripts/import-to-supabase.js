#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Initialize Prisma client
const prisma = new PrismaClient();

async function importToSupabase() {
  try {
    console.log('🚀 Starting Supabase import process...');
    
    // Check if we're connected to Supabase
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log('📊 Connected to database:', result[0]);
    
    // Verify this is Supabase (should contain 'supabase' in the connection)
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl.includes('supabase') && !dbUrl.includes('pooler.supabase')) {
      console.warn('⚠️  Warning: This doesn\'t appear to be a Supabase database URL');
      console.log('Current DATABASE_URL pattern:', dbUrl.replace(/\/\/.*@/, '//***:***@'));
    }
    
    // Find the latest backup file
    const backupDir = path.join(process.cwd(), 'migration-backup');
    const files = fs.readdirSync(backupDir);
    const jsonFiles = files.filter(f => f.startsWith('neon-data-') && f.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      throw new Error('No backup JSON files found in migration-backup directory');
    }
    
    // Use the most recent backup file
    const latestBackup = jsonFiles.sort().reverse()[0];
    const backupPath = path.join(backupDir, latestBackup);
    
    console.log(`📂 Using backup file: ${latestBackup}`);
    
    // Read the backup data
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const data = backupData.data;
    
    console.log('📊 Data summary:');
    Object.keys(data).forEach(table => {
      console.log(`  - ${table}: ${data[table].length} records`);
    });
    
    // Import data in the correct order (respecting foreign key constraints)
    const importOrder = [
      'Role',
      'Permission', 
      'User',
      'Shop',
      'Category',
      'Supplier',
      'Product',
      'Customer',
      'InventoryItem',
      'Invoice',
      'InvoiceItem',
      'PurchaseInvoice', 
      'PurchaseInvoiceItem',
      'Quotation',
      'QuotationItem',
      'Receipt',
      'Payment',
      'Transaction',
      'InventoryTransfer',
      'TransferItem',
      'Notification',
      'AuditLog',
      'RefreshToken',
      'Account',
      'SystemSettings',
      '_PermissionToRole'
    ];
    
    let totalImported = 0;
    
    for (const tableName of importOrder) {
      if (data[tableName] && data[tableName].length > 0) {
        console.log(`\n📥 Importing ${tableName}...`);
        
        try {
          // Use createMany for bulk insert
          const result = await prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)].createMany({
            data: data[tableName],
            skipDuplicates: true // Skip if records already exist
          });
          
          console.log(`  ✅ Imported ${result.count} ${tableName} records`);
          totalImported += result.count;
        } catch (error) {
          console.error(`  ❌ Error importing ${tableName}:`, error.message);
          
          // Try individual inserts for better error reporting
          console.log(`  🔄 Trying individual inserts for ${tableName}...`);
          let individualCount = 0;
          
          for (const record of data[tableName]) {
            try {
              await prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)].create({
                data: record
              });
              individualCount++;
            } catch (individualError) {
              console.error(`    ❌ Failed to import record:`, individualError.message);
            }
          }
          
          if (individualCount > 0) {
            console.log(`  ✅ Imported ${individualCount} ${tableName} records individually`);
            totalImported += individualCount;
          }
        }
      } else {
        console.log(`⏭️  Skipping ${tableName} (no data)`);
      }
    }
    
    console.log(`\n🎉 Import completed! Total records imported: ${totalImported}`);
    console.log('\n📋 Next steps:');
    console.log('1. Run: node scripts/verify-migration.js');
    console.log('2. Test your application with the new Supabase database');
    console.log('3. Set up Supabase-specific features (RLS, real-time, etc.)');
    console.log('4. Run: psql "$DATABASE_URL" < migration-backup/supabase-setup.sql');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importToSupabase();
}

module.exports = { importToSupabase };