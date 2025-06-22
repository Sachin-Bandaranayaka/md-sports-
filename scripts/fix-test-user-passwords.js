#!/usr/bin/env node

/**
 * Fix Test User Passwords
 * This script generates proper bcrypt hashes and updates the test user passwords
 */

const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config();

async function fixTestUserPasswords() {
  console.log('🔧 Fixing test user passwords with proper bcrypt hashes...\n');

  // Create PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Generate proper bcrypt hashes
    console.log('🔒 Generating bcrypt hashes...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);
    
    console.log('Admin hash:', adminHash);
    console.log('Staff hash:', staffHash);

    // Update test users with correct password hashes
    const updatePasswordsSQL = `
      UPDATE "User" 
      SET password = CASE 
        WHEN email IN ('admin@test.com', 'admin1@test.com', 'admin2@test.com') THEN $1
        WHEN email IN ('staff1@test.com', 'staff2@test.com') THEN $2
        ELSE password
      END,
      "updatedAt" = CURRENT_TIMESTAMP
      WHERE email LIKE '%@test.com';
    `;

    console.log('🔄 Updating test user passwords...');
    const result = await client.query(updatePasswordsSQL, [adminHash, staffHash]);
    console.log(`✅ Updated ${result.rowCount} test user passwords`);

    // Verify the updates
    const verifyResult = await client.query(`
      SELECT name, email, "roleName", LEFT(password, 10) as password_start
      FROM "User" 
      WHERE email LIKE '%@test.com' 
      ORDER BY email;
    `);

    console.log('\n📋 Updated Test Users:');
    verifyResult.rows.forEach(user => {
      console.log(`   ${user.email} - ${user.name} (${user.roleName}) - ${user.password_start}...`);
    });

    console.log('\n🔑 Test Credentials:');
    console.log('   admin@test.com / admin123 (Admin)');
    console.log('   admin1@test.com / admin123 (Admin)');
    console.log('   admin2@test.com / admin123 (Admin)');
    console.log('   staff1@test.com / staff123 (Shop Staff)');
    console.log('   staff2@test.com / staff123 (Shop Staff)');
    
    console.log('\n🚀 Test user passwords fixed! Ready for reliability testing!');

  } catch (error) {
    console.error('❌ Error fixing test user passwords:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixTestUserPasswords().catch(error => {
    console.error('Failed to fix test user passwords:', error);
    process.exit(1);
  });
}

module.exports = fixTestUserPasswords; 