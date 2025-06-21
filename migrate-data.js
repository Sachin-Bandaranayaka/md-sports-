const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const fs = require('fs');

// Neon database connection
const neonClient = new Client({
  connectionString: process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_PHLsDZBgYI53@ep-aged-river-a8wvdi7d-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'
});

// Supabase database connection
const supabaseClient = new Client({
  connectionString: process.env.DATABASE_URL
});

// Tables with data that need to be migrated (in dependency order)
const tablesToMigrate = [
  'User',
  'Permission', 
  'Role',
  '_PermissionToRole',
  'Shop',
  'Category',
  'Product',
  'InventoryItem',
  'Customer',
  'Supplier',
  'Account',
  'PurchaseInvoice',
  'PurchaseInvoiceItem',
  'RefreshToken',
  'SystemSettings'
];

async function exportTableData(tableName) {
  try {
    console.log(`Exporting data from ${tableName}...`);
    
    // Get column information to handle JSONB columns properly
    const columnInfo = await neonClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [tableName]);
    
    const jsonbColumns = columnInfo.rows
      .filter(col => col.data_type === 'jsonb')
      .map(col => col.column_name);
    
    let query = `SELECT `;
    if (jsonbColumns.length > 0) {
      // Convert JSONB columns to text for proper serialization
      const columns = columnInfo.rows.map(col => {
        if (col.data_type === 'jsonb') {
          return `"${col.column_name}"::text as "${col.column_name}"`;
        }
        return `"${col.column_name}"`;
      }).join(', ');
      query += `${columns} FROM "${tableName}"`;
    } else {
      query += `* FROM "${tableName}"`;
    }
    
    const result = await neonClient.query(query);
    console.log(`Found ${result.rows.length} records in ${tableName}`);
    return result.rows;
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error.message);
    return [];
  }
}

async function importTableData(tableName, data) {
  if (data.length === 0) {
    console.log(`No data to import for ${tableName}`);
    return;
  }

  try {
    console.log(`Importing ${data.length} records to ${tableName}...`);
    
    // First, clear existing data in Supabase table
    await supabaseClient.query(`DELETE FROM "${tableName}"`);
    
    // Get column information to handle JSONB columns properly
    const columnInfo = await supabaseClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [tableName]);
    
    const jsonbColumns = new Set(columnInfo.rows
      .filter(col => col.data_type === 'jsonb')
      .map(col => col.column_name));
    
    // Get column names from first row
    const columns = Object.keys(data[0]);
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    
    // Prepare values for bulk insert
    const values = [];
    const placeholders = [];
    let paramIndex = 1;
    
    for (const row of data) {
      const rowPlaceholders = [];
      for (const col of columns) {
        let value = row[col];
        
        // Handle JSONB columns - convert string back to JSON if needed
        if (jsonbColumns.has(col) && typeof value === 'string') {
          try {
            // Parse the JSON string to ensure it's valid JSON
            JSON.parse(value);
            // Keep as string, PostgreSQL will handle the conversion
          } catch (e) {
            console.warn(`Invalid JSON in ${tableName}.${col}:`, value);
            value = null;
          }
        }
        
        values.push(value);
        rowPlaceholders.push(`$${paramIndex++}`);
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }
    
    const insertQuery = `
      INSERT INTO "${tableName}" (${columnNames})
      VALUES ${placeholders.join(', ')}
    `;
    
    await supabaseClient.query(insertQuery, values);
    console.log(`Successfully imported ${data.length} records to ${tableName}`);
    
  } catch (error) {
    console.error(`Error importing to ${tableName}:`, error.message);
    throw error;
  }
}

async function resetSequences() {
  console.log('Resetting sequences...');
  
  const sequenceQueries = [
    'SELECT setval(pg_get_serial_sequence(\'"User"\', \'id\'), COALESCE(MAX(id), 1)) FROM "User"',
    'SELECT setval(pg_get_serial_sequence(\'"Permission"\', \'id\'), COALESCE(MAX(id), 1)) FROM "Permission"',
    'SELECT setval(pg_get_serial_sequence(\'"Role"\', \'id\'), COALESCE(MAX(id), 1)) FROM "Role"',
    'SELECT setval(pg_get_serial_sequence(\'"Shop"\', \'id\'), COALESCE(MAX(id), 1)) FROM "Shop"',
    'SELECT setval(pg_get_serial_sequence(\'"Category"\', \'id\'), COALESCE(MAX(id), 1)) FROM "Category"',
    'SELECT setval(pg_get_serial_sequence(\'"Product"\', \'id\'), COALESCE(MAX(id), 1)) FROM "Product"',
    'SELECT setval(pg_get_serial_sequence(\'"InventoryItem"\', \'id\'), COALESCE(MAX(id), 1)) FROM "InventoryItem"',
    'SELECT setval(pg_get_serial_sequence(\'"Customer"\', \'id\'), COALESCE(MAX(id), 1)) FROM "Customer"',
    'SELECT setval(pg_get_serial_sequence(\'"Supplier"\', \'id\'), COALESCE(MAX(id), 1)) FROM "Supplier"',
    'SELECT setval(pg_get_serial_sequence(\'"Account"\', \'id\'), COALESCE(MAX(id), 1)) FROM "Account"',
    'SELECT setval(pg_get_serial_sequence(\'"PurchaseInvoice"\', \'id\'), COALESCE(MAX(id), 1)) FROM "PurchaseInvoice"',
    'SELECT setval(pg_get_serial_sequence(\'"PurchaseInvoiceItem"\', \'id\'), COALESCE(MAX(id), 1)) FROM "PurchaseInvoiceItem"',
    'SELECT setval(pg_get_serial_sequence(\'"SystemSettings"\', \'id\'), COALESCE(MAX(id), 1)) FROM "SystemSettings"'
  ];
  
  for (const query of sequenceQueries) {
    try {
      await supabaseClient.query(query);
    } catch (error) {
      console.log(`Sequence reset query failed (this is normal if table is empty): ${error.message}`);
    }
  }
}

async function migrateData() {
  try {
    console.log('Starting data migration from Neon to Supabase...');
    
    // Connect to both databases
    await neonClient.connect();
    await supabaseClient.connect();
    
    console.log('Connected to both databases');
    
    // Disable foreign key checks temporarily
    await supabaseClient.query('SET session_replication_role = replica');
    
    // Migrate each table
    for (const tableName of tablesToMigrate) {
      const data = await exportTableData(tableName);
      await importTableData(tableName, data);
    }
    
    // Reset sequences to ensure auto-increment continues correctly
    await resetSequences();
    
    // Re-enable foreign key checks
    await supabaseClient.query('SET session_replication_role = DEFAULT');
    
    console.log('\n✅ Data migration completed successfully!');
    console.log('\nMigration Summary:');
    
    // Verify migration by counting records in Supabase
    for (const tableName of tablesToMigrate) {
      const result = await supabaseClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      console.log(`${tableName}: ${result.rows[0].count} records`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await neonClient.end();
    await supabaseClient.end();
  }
}

// Run the migration
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };