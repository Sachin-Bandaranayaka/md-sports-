import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

// Initialize test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_ADMIN_TOKEN = 'test-admin-token';
const TEST_USER_TOKEN = 'test-user-token';

// Mock data for testing
const mockTestData = {
  categories: [
    {
      id: 999901,
      name: 'Test Category 1',
      description: 'Test category for backup/restore testing',
    },
    {
      id: 999902,
      name: 'Test Category 2',
      description: 'Another test category',
    }
  ],
  suppliers: [
    {
      id: 999901,
      name: 'Test Supplier 1',
      email: 'supplier1@test.com',
      phone: '1234567890',
      address: '123 Test Street',
      city: 'Test City',
      status: 'active',
    }
  ],
  customers: [
    {
      id: 999901,
      name: 'Test Customer 1',
      email: 'customer1@test.com',
      phone: '0987654321',
      address: '456 Test Avenue',
      city: 'Test City',
    }
  ],
  products: [
    {
      id: 999901,
      name: 'Test Product 1',
      description: 'Test product for backup/restore',
      price: 99.99,
      sku: 'TEST-001',
      categoryId: 999901,
      weightedAverageCost: 50.00,
    }
  ],
  inventoryItems: [
    {
      id: 999901,
      productId: 999901,
      shopId: 'test-shop-1',
      quantity: 100,
      shopSpecificCost: 45.00,
    }
  ],
  invoices: [
    {
      id: 999901,
      invoiceNumber: 'TEST-INV-001',
      customerId: 999901,
      total: 199.98,
      status: 'paid',
      shopId: 'test-shop-1',
    }
  ]
};

// Mock authentication middleware
jest.mock('@/lib/auth', () => ({
  extractToken: jest.fn((request) => {
    const authHeader = request.headers.get?.('authorization') || request.headers.authorization;
    return authHeader?.replace('Bearer ', '');
  }),
  verifyToken: jest.fn((token) => {
    if (token === TEST_ADMIN_TOKEN) {
      return Promise.resolve({ sub: 'admin-user-id' });
    } else if (token === TEST_USER_TOKEN) {
      return Promise.resolve({ sub: 'regular-user-id' });
    }
    return Promise.resolve(null);
  }),
}));

// Mock user permissions
jest.mock('@/lib/utils/permissions', () => ({
  hasPermission: jest.fn((permissions, permission) => {
    if (permission === 'admin:all') {
      return permissions.includes('admin:all');
    }
    return false;
  }),
}));

describe('Backup and Restore Integration Tests', () => {
  let testShopId: string;
  let backupFilePath: string;

  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
    
    // Create test shop if it doesn't exist
    const existingShop = await prisma.shop.findFirst({
      where: { id: 'test-shop-1' }
    });
    
    if (!existingShop) {
      await prisma.shop.create({
        data: {
          id: 'test-shop-1',
          name: 'Test Shop 1',
          location: 'Test Location',
        }
      });
    }
    testShopId = 'test-shop-1';

    // Create backup directory
    backupFilePath = path.join(__dirname, '../temp/test-backup.json');
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await prisma.$disconnect();
    
    // Clean up backup file
    try {
      await fs.unlink(backupFilePath);
    } catch (error) {
      // File doesn't exist, ignore
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  async function cleanupTestData() {
    // Delete in proper order to respect foreign key constraints
    await prisma.inventoryItem.deleteMany({
      where: { id: { gte: 999900 } }
    });
    await prisma.invoice.deleteMany({
      where: { id: { gte: 999900 } }
    });
    await prisma.product.deleteMany({
      where: { id: { gte: 999900 } }
    });
    await prisma.customer.deleteMany({
      where: { id: { gte: 999900 } }
    });
    await prisma.category.deleteMany({
      where: { id: { gte: 999900 } }
    });
    await prisma.supplier.deleteMany({
      where: { id: { gte: 999900 } }
    });
  }

  async function createTestData() {
    // Create test data in proper order
    for (const category of mockTestData.categories) {
      await prisma.category.create({ data: category });
    }
    
    for (const supplier of mockTestData.suppliers) {
      await prisma.supplier.create({ data: supplier });
    }
    
    for (const customer of mockTestData.customers) {
      await prisma.customer.create({ data: customer });
    }
    
    for (const product of mockTestData.products) {
      await prisma.product.create({ data: product });
    }
    
    for (const item of mockTestData.inventoryItems) {
      await prisma.inventoryItem.create({ data: item });
    }
    
    for (const invoice of mockTestData.invoices) {
      await prisma.invoice.create({ data: invoice });
    }
  }

  describe('Backup Functionality (GET /api/backup)', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should successfully generate a backup with admin permissions', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      
      const backupData = await response.json();
      
      // Verify backup structure
      expect(backupData).toHaveProperty('timestamp');
      expect(backupData).toHaveProperty('version', '1.0');
      expect(backupData).toHaveProperty('users');
      expect(backupData).toHaveProperty('products');
      expect(backupData).toHaveProperty('shops');
      expect(backupData).toHaveProperty('inventoryItems');
      expect(backupData).toHaveProperty('invoices');
      expect(backupData).toHaveProperty('customers');
      expect(backupData).toHaveProperty('categories');
      expect(backupData).toHaveProperty('suppliers');

      // Verify test data is included
      expect(backupData.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Test Category 1' })
        ])
      );
      expect(backupData.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Test Product 1' })
        ])
      );

      // Save backup for restore tests
      await fs.mkdir(path.dirname(backupFilePath), { recursive: true });
      await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2));
    });

    it('should reject backup request with insufficient permissions', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(403);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('Insufficient permissions');
    });

    it('should reject backup request without authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('No authorization token provided');
    });

    it('should reject backup request with invalid token', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('Invalid or expired token');
    });

    it('should include proper headers for file download', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(response.headers.get('content-disposition')).toBe('attachment; filename=backup.json');
    });
  });

  describe('Restore Functionality (POST /api/backup)', () => {
    let validBackupData: any;

    beforeEach(async () => {
      // Create some initial data and generate a backup
      await createTestData();
      
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      validBackupData = await response.json();
      
      // Clear database for restore tests
      await cleanupTestData();
    });

    it('should successfully restore from valid backup data', async () => {
      // Verify database is empty
      const initialCategoryCount = await prisma.category.count({
        where: { id: { gte: 999900 } }
      });
      expect(initialCategoryCount).toBe(0);

      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validBackupData),
      });

      expect(response.status).toBe(200);
      
      const restoreResult = await response.json();
      expect(restoreResult).toHaveProperty('success', true);
      expect(restoreResult).toHaveProperty('message', 'Database restored successfully');
      expect(restoreResult).toHaveProperty('restoredCounts');

      // Verify data was restored
      const restoredCategories = await prisma.category.findMany({
        where: { id: { gte: 999900 } }
      });
      expect(restoredCategories).toHaveLength(2);
      
      const restoredProducts = await prisma.product.findMany({
        where: { id: { gte: 999900 } }
      });
      expect(restoredProducts).toHaveLength(1);
      expect(restoredProducts[0].name).toBe('Test Product 1');
    });

    it('should reject restore with insufficient permissions', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validBackupData),
      });

      expect(response.status).toBe(403);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('Insufficient permissions');
    });

    it('should reject restore without authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validBackupData),
      });

      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('No authorization token provided');
    });

    it('should reject invalid backup data format', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' }),
      });

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('Invalid backup data format');
    });

    it('should reject incompatible backup version', async () => {
      const incompatibleBackup = {
        ...validBackupData,
        version: '2.0'
      };

      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incompatibleBackup),
      });

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('Backup version incompatible');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: '{ invalid json',
      });

      expect(response.status).toBe(400);
    });

    it('should restore data in correct order respecting foreign key constraints', async () => {
      // Create a backup with complex relationships
      const complexBackupData = {
        ...validBackupData,
        categories: [
          { id: 999903, name: 'Parent Category', description: 'Parent' },
          { id: 999904, name: 'Child Category', description: 'Child', parentId: 999903 }
        ],
        products: [
          { 
            id: 999903, 
            name: 'Complex Product', 
            price: 150.00, 
            categoryId: 999904,
            weightedAverageCost: 75.00 
          }
        ]
      };

      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complexBackupData),
      });

      expect(response.status).toBe(200);

      // Verify relationships are maintained
      const restoredProduct = await prisma.product.findUnique({
        where: { id: 999903 },
        include: { category: true }
      });
      
      expect(restoredProduct).toBeDefined();
      expect(restoredProduct?.category?.name).toBe('Child Category');
    });

    it('should provide detailed restore counts', async () => {
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validBackupData),
      });

      expect(response.status).toBe(200);
      
      const restoreResult = await response.json();
      expect(restoreResult.restoredCounts).toEqual({
        users: 0, // We don't restore users in this implementation
        products: expect.any(Number),
        shops: 0, // We don't restore shops in this implementation
        inventoryItems: expect.any(Number),
        invoices: expect.any(Number),
        customers: expect.any(Number),
        categories: expect.any(Number),
        suppliers: expect.any(Number),
      });
    });
  });

  describe('End-to-End Backup and Restore Workflow', () => {
    it('should complete full backup and restore cycle maintaining data integrity', async () => {
      // Step 1: Create initial test data
      await createTestData();
      
      // Step 2: Generate backup
      const backupResponse = await fetch(`${BASE_URL}/api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
      });
      
      expect(backupResponse.status).toBe(200);
      const backupData = await backupResponse.json();
      
      // Step 3: Verify initial data exists
      const initialProductCount = await prisma.product.count({
        where: { id: { gte: 999900 } }
      });
      expect(initialProductCount).toBeGreaterThan(0);
      
      // Step 4: Clear all data (simulating data loss)
      await cleanupTestData();
      
      // Step 5: Verify data is gone
      const afterClearCount = await prisma.product.count({
        where: { id: { gte: 999900 } }
      });
      expect(afterClearCount).toBe(0);
      
      // Step 6: Restore from backup
      const restoreResponse = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });
      
      expect(restoreResponse.status).toBe(200);
      
      // Step 7: Verify data is restored correctly
      const restoredProductCount = await prisma.product.count({
        where: { id: { gte: 999900 } }
      });
      expect(restoredProductCount).toBe(initialProductCount);
      
      // Step 8: Verify data integrity
      const restoredProduct = await prisma.product.findFirst({
        where: { name: 'Test Product 1' },
        include: { 
          category: true,
          inventoryItems: true 
        }
      });
      
      expect(restoredProduct).toBeDefined();
      expect(restoredProduct?.name).toBe('Test Product 1');
      expect(restoredProduct?.category?.name).toBe('Test Category 1');
      expect(restoredProduct?.inventoryItems).toHaveLength(1);
      expect(restoredProduct?.inventoryItems[0].quantity).toBe(100);
    });

    it('should handle large dataset backup and restore', async () => {
      // Create larger dataset
      const largeDataset = {
        categories: Array.from({ length: 10 }, (_, i) => ({
          id: 999910 + i,
          name: `Large Test Category ${i + 1}`,
          description: `Description for category ${i + 1}`,
        })),
        products: Array.from({ length: 50 }, (_, i) => ({
          id: 999910 + i,
          name: `Large Test Product ${i + 1}`,
          price: 10.00 + i,
          sku: `LARGE-${(i + 1).toString().padStart(3, '0')}`,
          categoryId: 999910 + (i % 10),
          weightedAverageCost: 5.00 + i,
        })),
      };

      // Create large dataset
      for (const category of largeDataset.categories) {
        await prisma.category.create({ data: category });
      }
      for (const product of largeDataset.products) {
        await prisma.product.create({ data: product });
      }

      // Test backup performance
      const startTime = Date.now();
      const backupResponse = await fetch(`${BASE_URL}/api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
      });
      const backupTime = Date.now() - startTime;
      
      expect(backupResponse.status).toBe(200);
      expect(backupTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      const backupData = await backupResponse.json();
      expect(backupData.categories.length).toBeGreaterThanOrEqual(10);
      expect(backupData.products.length).toBeGreaterThanOrEqual(50);

      // Clean and restore
      await cleanupTestData();
      
      const restoreStartTime = Date.now();
      const restoreResponse = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });
      const restoreTime = Date.now() - restoreStartTime;
      
      expect(restoreResponse.status).toBe(200);
      expect(restoreTime).toBeLessThan(15000); // Should complete within 15 seconds
      
      // Verify all data was restored
      const restoredCategories = await prisma.category.count({
        where: { id: { gte: 999910 } }
      });
      const restoredProducts = await prisma.product.count({
        where: { id: { gte: 999910 } }
      });
      
      expect(restoredCategories).toBe(10);
      expect(restoredProducts).toBe(50);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection issues during backup', async () => {
      // This test would need to mock database failures
      // For now, we'll test the basic error handling structure
      
      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
      });
      
      // Should either succeed or return a proper error response
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 500) {
        const errorData = await response.json();
        expect(errorData).toHaveProperty('error');
        expect(errorData.error).toContain('Failed to generate backup');
      }
    });

    it('should handle database transaction failures during restore', async () => {
      // Create a backup with invalid foreign key references
      const invalidBackupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        categories: [],
        suppliers: [],
        customers: [],
        users: [],
        shops: [],
        products: [
          {
            id: 999950,
            name: 'Invalid Product',
            price: 100.00,
            categoryId: 999999, // Non-existent category
            weightedAverageCost: 50.00,
          }
        ],
        inventoryItems: [],
        invoices: [],
      };

      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidBackupData),
      });

      expect(response.status).toBe(500);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('Failed to restore backup');
    });

    it('should handle empty backup data gracefully', async () => {
      const emptyBackupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        categories: [],
        suppliers: [],
        customers: [],
        users: [],
        shops: [],
        products: [],
        inventoryItems: [],
        invoices: [],
      };

      const response = await fetch(`${BASE_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emptyBackupData),
      });

      expect(response.status).toBe(200);
      
      const restoreResult = await response.json();
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restoredCounts).toEqual({
        users: 0,
        products: 0,
        shops: 0,
        inventoryItems: 0,
        invoices: 0,
        customers: 0,
        categories: 0,
        suppliers: 0,
      });
    });
  });
}); 