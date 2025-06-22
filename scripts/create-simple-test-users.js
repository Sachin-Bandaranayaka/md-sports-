#!/usr/bin/env node

/**
 * Simple Test Users Creation
 * Creates just the essential test users needed for reliability testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createSimpleTestUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Creating essential test users...\n');

    // Get existing roles
    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
    const shopStaffRole = await prisma.role.findFirst({ where: { name: 'Shop Staff' } });
    
    if (!adminRole) {
      console.log('❌ Admin role not found. Please ensure roles exist in the database.');
      return;
    }

    // Create test users with simple data
    const testUsers = [
      {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: 'admin123',
        roleId: adminRole.id,
        roleName: 'Admin',
        permissions: ['admin:all', 'dashboard:view', 'sales:view', 'sales:manage', 'invoice:create', 'invoice:view']
      },
      {
        email: 'admin1@test.com',
        name: 'Admin User 1',
        password: 'admin123',
        roleId: adminRole.id,
        roleName: 'Admin',
        permissions: ['admin:all', 'dashboard:view', 'sales:view', 'sales:manage', 'invoice:create', 'invoice:view']
      },
      {
        email: 'admin2@test.com',
        name: 'Admin User 2',
        password: 'admin123',
        roleId: adminRole.id,
        roleName: 'Admin',
        permissions: ['admin:all', 'dashboard:view', 'sales:view', 'sales:manage', 'invoice:create', 'invoice:view']
      }
    ];

    // Add shop staff users if shop staff role exists
    if (shopStaffRole) {
      testUsers.push(
        {
          email: 'staff1@test.com',
          name: 'Shop Staff 1',
          password: 'staff123',
          roleId: shopStaffRole.id,
          roleName: 'Shop Staff',
          permissions: ['dashboard:view', 'sales:view', 'invoice:create', 'invoice:view']
        },
        {
          email: 'staff2@test.com',
          name: 'Shop Staff 2',
          password: 'staff123',
          roleId: shopStaffRole.id,
          roleName: 'Shop Staff',
          permissions: ['dashboard:view', 'sales:view', 'invoice:create', 'invoice:view']
        }
      );
    }

    // Create users one by one
    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user
        const newUser = await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            roleId: userData.roleId,
            roleName: userData.roleName,
            permissions: userData.permissions,
            isActive: true
          }
        });

        console.log(`✅ Created user: ${userData.email} (${userData.roleName})`);

      } catch (userError) {
        console.error(`❌ Failed to create user ${userData.email}:`, userError.message);
      }
    }

    console.log('\n🎉 Test user creation completed!');
    console.log('\n📋 Test Credentials:');
    console.log('   admin@test.com / admin123');
    console.log('   admin1@test.com / admin123');
    console.log('   admin2@test.com / admin123');
    if (shopStaffRole) {
      console.log('   staff1@test.com / staff123');
      console.log('   staff2@test.com / staff123');
    }
    console.log('\n🚀 Ready for reliability testing!');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createSimpleTestUsers().catch(error => {
    console.error('Failed to create test users:', error);
    process.exit(1);
  });
}

module.exports = createSimpleTestUsers; 