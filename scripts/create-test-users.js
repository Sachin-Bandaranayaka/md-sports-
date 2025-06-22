#!/usr/bin/env node

/**
 * Create Test Users for Reliability Testing
 * 
 * Creates the test users needed for the reliability test suite:
 * - admin@test.com (Admin role)
 * - admin1@test.com, admin2@test.com (Admin roles)
 * - staff1@test.com, staff2@test.com (Shop staff roles)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔧 Creating test users for reliability testing...\n');

  try {
    // First, ensure we have the required roles and permissions
    console.log('📋 Setting up roles and permissions...');
    
    // Create permissions if they don't exist
    const permissions = [
      { name: 'admin:all', description: 'Full admin access' },
      { name: 'dashboard:view', description: 'View dashboard' },
      { name: 'sales:view', description: 'View sales' },
      { name: 'sales:manage', description: 'Manage sales' },
      { name: 'invoice:create', description: 'Create invoices' },
      { name: 'invoice:view', description: 'View invoices' },
      { name: 'customer:create', description: 'Create customers' },
      { name: 'customer:view', description: 'View customers' },
      { name: 'inventory:view', description: 'View inventory' },
      { name: 'inventory:manage', description: 'Manage inventory' },
      { name: 'shop:assigned_only', description: 'Restricts user access to only their assigned shop' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    }

    // Create Admin role
    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        id: 'admin-role',
        name: 'Admin',
        description: 'Administrator with full access',
      },
    });

    // Create Shop Staff role
    const shopStaffRole = await prisma.role.upsert({
      where: { name: 'Shop Staff' },
      update: {},
      create: {
        id: 'shop-staff-role',
        name: 'Shop Staff',
        description: 'Shop operations staff with limited access',
      },
    });

    // Get all permissions for admin role
    const allPermissions = await prisma.permission.findMany();
    const allPermissionNames = allPermissions.map(p => p.name);

    // Shop staff permissions
    const shopStaffPermissionNames = [
      'dashboard:view',
      'sales:view',
      'sales:manage',
      'invoice:create',
      'invoice:view',
      'customer:create',
      'customer:view',
      'inventory:view',
      'shop:assigned_only'
    ];

    // Create test shops if they don't exist
    console.log('🏪 Creating test shops...');
    
    const testShops = [
      { id: 'shop-1', name: 'Main Store', location: 'Downtown' },
      { id: 'shop-2', name: 'Branch Store', location: 'Mall' },
      { id: 'shop-3', name: 'Warehouse', location: 'Industrial Area' }
    ];

    for (const shop of testShops) {
      await prisma.shop.upsert({
        where: { id: shop.id },
        update: {},
        create: shop,
      });
    }

    // Create test users
    console.log('👥 Creating test users...');
    
    const testUsers = [
      {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: 'admin123',
        role: 'Admin',
        roleId: adminRole.id,
        shopId: null,
        permissions: allPermissionNames
      },
      {
        email: 'admin1@test.com',
        name: 'Admin User 1',
        password: 'admin123',
        role: 'Admin',
        roleId: adminRole.id,
        shopId: null,
        permissions: allPermissionNames
      },
      {
        email: 'admin2@test.com',
        name: 'Admin User 2',
        password: 'admin123',
        role: 'Admin',
        roleId: adminRole.id,
        shopId: null,
        permissions: allPermissionNames
      },
      {
        email: 'staff1@test.com',
        name: 'Shop Staff 1',
        password: 'staff123',
        role: 'Shop Staff',
        roleId: shopStaffRole.id,
        shopId: 'shop-1',
        permissions: shopStaffPermissionNames
      },
      {
        email: 'staff2@test.com',
        name: 'Shop Staff 2',
        password: 'staff123',
        role: 'Shop Staff',
        roleId: shopStaffRole.id,
        shopId: 'shop-2',
        permissions: shopStaffPermissionNames
      }
    ];

    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const createdUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          password: hashedPassword,
          roleId: user.roleId,
          roleName: user.role,
          shopId: user.shopId,
          permissions: user.permissions,
          isActive: true,
        },
        create: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          roleId: user.roleId,
          roleName: user.role,
          shopId: user.shopId,
          permissions: user.permissions,
          isActive: true,
        },
      });

      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }

    // Create some test customers
    console.log('👤 Creating test customers...');
    
    const testCustomers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        address: '456 Oak Ave'
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1234567892',
        address: '789 Pine Rd'
      }
    ];

    for (const customer of testCustomers) {
      await prisma.customer.upsert({
        where: { email: customer.email },
        update: {},
        create: customer,
      });
    }

    // Create some test products
    console.log('📦 Creating test products...');
    
    const testProducts = [
      {
        name: 'Nike Air Max',
        description: 'Popular running shoes',
        price: 120.00,
        sku: 'NIKE-001',
        category: 'Footwear'
      },
      {
        name: 'Adidas Football',
        description: 'Professional football',
        price: 25.00,
        sku: 'ADIDAS-001',
        category: 'Sports Equipment'
      },
      {
        name: 'Sports T-Shirt',
        description: 'Comfortable sports t-shirt',
        price: 15.00,
        sku: 'SHIRT-001',
        category: 'Apparel'
      }
    ];

    for (const product of testProducts) {
      const createdProduct = await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product,
      });

      // Create inventory items for each shop
      for (const shop of testShops) {
        await prisma.inventoryItem.upsert({
          where: {
            productId_shopId: {
              productId: createdProduct.id,
              shopId: shop.id
            }
          },
          update: {},
          create: {
            productId: createdProduct.id,
            shopId: shop.id,
            quantity: Math.floor(Math.random() * 100) + 10, // 10-110 items
            minStockLevel: 5,
            shopSpecificCost: product.price * 0.6 // 60% of selling price
          },
        });
      }
    }

    console.log('\n✅ Test data creation completed successfully!');
    console.log('\n📋 Created Test Users:');
    console.log('   admin@test.com / admin123 (Admin)');
    console.log('   admin1@test.com / admin123 (Admin)');
    console.log('   admin2@test.com / admin123 (Admin)');
    console.log('   staff1@test.com / staff123 (Shop Staff - shop-1)');
    console.log('   staff2@test.com / staff123 (Shop Staff - shop-2)');
    console.log('\n🏪 Created Test Shops:');
    console.log('   shop-1 (Main Store)');
    console.log('   shop-2 (Branch Store)');
    console.log('   shop-3 (Warehouse)');
    console.log('\n📦 Created Test Products with inventory');
    console.log('👤 Created Test Customers');
    
    console.log('\n🚀 Ready for reliability testing!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createTestUsers().catch(error => {
    console.error('Failed to create test users:', error);
    process.exit(1);
  });
}

module.exports = createTestUsers; 