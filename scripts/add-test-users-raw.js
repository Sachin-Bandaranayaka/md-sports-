#!/usr/bin/env node

/**
 * Add Test Users Using Raw SQL
 * This script adds test users directly to the database using raw SQL queries
 */

const { Client } = require('pg');
require('dotenv').config();

async function addTestUsersRawSQL() {
  console.log('🔧 Adding test users using raw SQL...\n');

  // Create PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // SQL to create test users with pre-computed bcrypt hashes
    const createUsersSQL = `
      -- Create test users for reliability testing
      -- Using pre-computed bcrypt hashes for passwords:
      -- admin123 -> $2a$10$N9qo8uLOickgx2ZMRZoMye/Zo1VBJ8K9pBnGgGdEFx7Q1X5bXKfma
      -- staff123 -> $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

      INSERT INTO "User" (id, name, email, password, "roleId", "roleName", permissions, "isActive", "updatedAt")
      VALUES 
        (gen_random_uuid(), 'Test Admin', 'admin@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/Zo1VBJ8K9pBnGgGdEFx7Q1X5bXKfma', 'admin-role-id', 'Admin', 
         ARRAY['admin:all', 'dashboard:view', 'sales:view', 'sales:manage', 'invoice:create', 'invoice:view', 'customer:create', 'customer:view', 'inventory:view', 'inventory:manage'], true, CURRENT_TIMESTAMP),
        
        (gen_random_uuid(), 'Admin User 1', 'admin1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/Zo1VBJ8K9pBnGgGdEFx7Q1X5bXKfma', 'admin-role-id', 'Admin', 
         ARRAY['admin:all', 'dashboard:view', 'sales:view', 'sales:manage', 'invoice:create', 'invoice:view', 'customer:create', 'customer:view', 'inventory:view', 'inventory:manage'], true, CURRENT_TIMESTAMP),
         
        (gen_random_uuid(), 'Admin User 2', 'admin2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/Zo1VBJ8K9pBnGgGdEFx7Q1X5bXKfma', 'admin-role-id', 'Admin', 
         ARRAY['admin:all', 'dashboard:view', 'sales:view', 'sales:manage', 'invoice:create', 'invoice:view', 'customer:create', 'customer:view', 'inventory:view', 'inventory:manage'], true, CURRENT_TIMESTAMP),
         
        (gen_random_uuid(), 'Shop Staff 1', 'staff1@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'shop-staff-role-id', 'Shop Staff', 
         ARRAY['dashboard:view', 'sales:view', 'sales:manage', 'invoice:create', 'invoice:view', 'customer:create', 'customer:view', 'inventory:view', 'shop:assigned_only'], true, CURRENT_TIMESTAMP),
         
        (gen_random_uuid(), 'Shop Staff 2', 'staff2@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'shop-staff-role-id', 'Shop Staff', 
         ARRAY['dashboard:view', 'sales:view', 'sales:manage', 'invoice:create', 'invoice:view', 'customer:create', 'customer:view', 'inventory:view', 'shop:assigned_only'], true, CURRENT_TIMESTAMP)

      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        "roleId" = EXCLUDED."roleId",
        "roleName" = EXCLUDED."roleName",
        permissions = EXCLUDED.permissions,
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = EXCLUDED."updatedAt";
    `;

    // SQL to create test shops
    const createShopsSQL = `
      -- Create test shops if they don't exist
      INSERT INTO "Shop" (id, name, location, "is_active", "updatedAt")
      VALUES 
        ('test-shop-1', 'Test Main Store', 'Downtown Test Area', true, CURRENT_TIMESTAMP),
        ('test-shop-2', 'Test Branch Store', 'Mall Test Area', true, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        location = EXCLUDED.location,
        "is_active" = EXCLUDED."is_active",
        "updatedAt" = EXCLUDED."updatedAt";
    `;

    // SQL to create test customers
    const createCustomersSQL = `
      -- Create test customers for testing
      INSERT INTO "Customer" (name, email, phone, address, "updatedAt")
      VALUES 
        ('Test Customer 1', 'customer1@test.com', '+1234567890', '123 Test Street', CURRENT_TIMESTAMP),
        ('Test Customer 2', 'customer2@test.com', '+1234567891', '456 Test Avenue', CURRENT_TIMESTAMP),
        ('Test Customer 3', 'customer3@test.com', '+1234567892', '789 Test Road', CURRENT_TIMESTAMP);
    `;

    // Execute the SQL queries
    console.log('👥 Creating test users...');
    const usersResult = await client.query(createUsersSQL);
    console.log(`✅ Users query executed successfully`);

    console.log('🏪 Creating test shops...');
    const shopsResult = await client.query(createShopsSQL);
    console.log(`✅ Shops query executed successfully`);

    console.log('👤 Creating test customers...');
    const customersResult = await client.query(createCustomersSQL);
    console.log(`✅ Customers query executed successfully`);

    // Verify the users were created
    const verifyResult = await client.query(`
      SELECT name, email, "roleName", "isActive" 
      FROM "User" 
      WHERE email LIKE '%@test.com' 
      ORDER BY email;
    `);

    console.log('\n🎉 Test data creation completed successfully!');
    console.log('\n📋 Created Test Users:');
    verifyResult.rows.forEach(user => {
      console.log(`   ${user.email} - ${user.name} (${user.roleName})`);
    });

    console.log('\n🔑 Test Credentials:');
    console.log('   admin@test.com / admin123 (Admin)');
    console.log('   admin1@test.com / admin123 (Admin)');
    console.log('   admin2@test.com / admin123 (Admin)');
    console.log('   staff1@test.com / staff123 (Shop Staff)');
    console.log('   staff2@test.com / staff123 (Shop Staff)');
    
    console.log('\n🚀 Ready for reliability testing!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  addTestUsersRawSQL().catch(error => {
    console.error('Failed to create test users:', error);
    process.exit(1);
  });
}

module.exports = addTestUsersRawSQL; 