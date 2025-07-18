
import { POST as bulkImportPOST } from '@/app/api/products/bulk-import/route';
import { POST as bulkCreatePOST } from '@/app/api/products/bulk-create/route';
import { GET as shopNamesGET } from '@/app/api/shops/names/route';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

// This would be your test database instance
// You might use a separate test database or use database transactions
// that get rolled back after each test

describe('Bulk Import Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Initialize test database connection
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.inventoryItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.shop.deleteMany();

    // Set up test data
    await prisma.shop.createMany({
      data: [
        { id: 'shop-1', name: 'Test Shop 1', location: 'Location 1', is_active: true },
        { id: 'shop-2', name: 'Test Shop 2', location: 'Location 2', is_active: true },
      ],
    });

    await prisma.category.createMany({
      data: [
        { id: 1, name: 'Sports', description: 'Sports equipment' },
        { id: 2, name: 'Equipment', description: 'General equipment' },
      ],
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.inventoryItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.shop.deleteMany();
  });

  describe('End-to-End Excel Upload Flow', () => {
    const createTestExcelFile = (data: any[]) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return buffer;
    };

    const createTestRequest = (buffer: Buffer) => {
      const formData = new FormData();
      const file = new File([buffer], 'test-products.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      formData.append('file', file);

      return new Request('http://localhost:3000/api/products/bulk-import', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });
    };

    it('should successfully import products with inventory', async () => {
      const testData = [
        {
          Name: 'Integration Test Product 1',
          SKU: 'ITP001',
          Description: 'Test description 1',
          RetailPrice: 100,
          CostPrice: 80,
          CategoryName: 'Sports',
          InitialQuantity: 50,
          ShopName: 'Test Shop 1',
        },
        {
          Name: 'Integration Test Product 2',
          SKU: 'ITP002',
          Description: 'Test description 2',
          RetailPrice: 200,
          CostPrice: 160,
          CategoryName: 'Equipment',
          InitialQuantity: 25,
          ShopName: 'Test Shop 2',
        },
      ];

      const buffer = createTestExcelFile(testData);
      const request = createTestRequest(buffer);

      // Mock authentication to pass
      jest.mock('@/lib/auth', () => ({
        validateTokenPermission: jest.fn().mockResolvedValue({ isValid: true }),
      }));

      const response = await bulkImportPOST(request as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.details).toHaveLength(2);

      // Verify products were created in database
      const products = await prisma.product.findMany({
        include: {
          category: true,
          inventoryItems: {
            include: {
              shop: true,
            },
          },
        },
      });

      expect(products).toHaveLength(2);

      const product1 = products.find(p => p.sku === 'ITP001');
      expect(product1).toBeDefined();
      expect(product1?.name).toBe('Integration Test Product 1');
      expect(product1?.price).toBe(100);
      expect(product1?.weightedaveragecost).toBe(80);
      expect(product1?.category?.name).toBe('Sports');
      expect(product1?.inventoryItems).toHaveLength(1);
      expect(product1?.inventoryItems[0].quantity).toBe(50);
      expect(product1?.inventoryItems[0].shop?.name).toBe('Test Shop 1');

      const product2 = products.find(p => p.sku === 'ITP002');
      expect(product2).toBeDefined();
      expect(product2?.name).toBe('Integration Test Product 2');
      expect(product2?.inventoryItems[0].quantity).toBe(25);
      expect(product2?.inventoryItems[0].shop?.name).toBe('Test Shop 2');
    });

    it('should handle validation errors in real database context', async () => {
      const testData = [
        {
          Name: 'Valid Product',
          SKU: 'VP001',
          RetailPrice: 100,
          CategoryName: 'Sports',
        },
        {
          Name: 'Invalid Product - Bad Shop',
          SKU: 'IP001',
          RetailPrice: 200,
          InitialQuantity: 50,
          ShopName: 'Nonexistent Shop',
        },
        {
          Name: 'Invalid Product - Bad Category',
          SKU: 'IP002',
          RetailPrice: 150,
          CategoryName: 'Nonexistent Category',
        },
      ];

      const buffer = createTestExcelFile(testData);
      const request = createTestRequest(buffer);

      jest.mock('@/lib/auth', () => ({
        validateTokenPermission: jest.fn().mockResolvedValue({ isValid: true }),
      }));

      const response = await bulkImportPOST(request as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.details).toHaveLength(3);

      // First product should succeed
      expect(result.details[0].success).toBe(true);

      // Second product should fail due to invalid shop
      expect(result.details[1].success).toBe(false);
      expect(result.details[1].message).toContain('Shop \'Nonexistent Shop\' not found');

      // Third product should fail due to invalid category
      expect(result.details[2].success).toBe(false);
      expect(result.details[2].message).toContain('Category \'Nonexistent Category\' not found');

      // Verify only one product was created
      const products = await prisma.product.findMany();
      expect(products).toHaveLength(1);
      expect(products[0].sku).toBe('VP001');
    });

    it('should handle duplicate SKU validation', async () => {
      // First, create a product
      await prisma.product.create({
        data: {
          name: 'Existing Product',
          sku: 'EXISTING001',
          price: 100,
          weightedaveragecost: 80,
        },
      });

      const testData = [
        {
          Name: 'New Product',
          SKU: 'NEW001',
          RetailPrice: 100,
        },
        {
          Name: 'Duplicate SKU Product',
          SKU: 'EXISTING001', // This SKU already exists
          RetailPrice: 200,
        },
      ];

      const buffer = createTestExcelFile(testData);
      const request = createTestRequest(buffer);

      jest.mock('@/lib/auth', () => ({
        validateTokenPermission: jest.fn().mockResolvedValue({ isValid: true }),
      }));

      const response = await bulkImportPOST(request as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.details).toHaveLength(2);

      // First product should succeed
      expect(result.details[0].success).toBe(true);

      // Second product should fail due to duplicate SKU
      expect(result.details[1].success).toBe(false);
      expect(result.details[1].message).toContain('SKU \'EXISTING001\' already exists');

      // Verify only the new product was created (plus the existing one)
      const products = await prisma.product.findMany();
      expect(products).toHaveLength(2); // existing + new
    });
  });

  describe('JSON API Integration', () => {
    it('should create products via JSON API with database persistence', async () => {
      const products = [
        {
          name: 'JSON API Product 1',
          sku: 'JAP001',
          price: 100,
          weightedAverageCost: 80,
          categoryId: 1,
          initialQuantity: 30,
          shopId: 'shop-1',
        },
        {
          name: 'JSON API Product 2',
          sku: 'JAP002',
          price: 200,
          weightedAverageCost: 160,
          categoryId: 2,
        },
      ];

      const request = new Request('http://localhost:3000/api/products/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ products }),
      });

      jest.mock('@/lib/auth', () => ({
        validateTokenPermission: jest.fn().mockResolvedValue({ isValid: true }),
      }));

      const response = await bulkCreatePOST(request as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);

      // Verify products in database
      const dbProducts = await prisma.product.findMany({
        include: {
          inventoryItems: true,
        },
      });

      expect(dbProducts).toHaveLength(2);

      const product1 = dbProducts.find(p => p.sku === 'JAP001');
      expect(product1).toBeDefined();
      expect(product1?.inventoryItems).toHaveLength(1);
      expect(product1?.inventoryItems[0].quantity).toBe(30);

      const product2 = dbProducts.find(p => p.sku === 'JAP002');
      expect(product2).toBeDefined();
      expect(product2?.inventoryItems).toHaveLength(0); // No initial quantity
    });
  });

  describe('Shop Names API Integration', () => {
    it('should return actual shop names from database', async () => {
      const request = new Request('http://localhost:3000/api/shops/names');
      const response = await shopNamesGET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.shopNames).toEqual(['Test Shop 1', 'Test Shop 2']);
    });

    it('should only return active shops', async () => {
      // Add an inactive shop
      await prisma.shop.create({
        data: {
          id: 'shop-3',
          name: 'Inactive Shop',
          location: 'Location 3',
          is_active: false,
        },
      });

      const request = new Request('http://localhost:3000/api/shops/names');
      const response = await shopNamesGET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.shopNames).toEqual(['Test Shop 1', 'Test Shop 2']);
      expect(result.shopNames).not.toContain('Inactive Shop');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large batch import efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        Name: `Bulk Product ${i + 1}`,
        SKU: `BULK${String(i + 1).padStart(3, '0')}`,
        RetailPrice: 100 + i,
        CostPrice: 80 + i,
        CategoryName: i % 2 === 0 ? 'Sports' : 'Equipment',
      }));

      const buffer = createTestExcelFile(largeDataset);
      const request = createTestRequest(buffer);

      jest.mock('@/lib/auth', () => ({
        validateTokenPermission: jest.fn().mockResolvedValue({ isValid: true }),
      }));

      const startTime = Date.now();
      const response = await bulkImportPOST(request as any);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.details).toHaveLength(100);

      // Should complete within reasonable time (adjust based on your performance requirements)
      expect(duration).toBeLessThan(10000); // 10 seconds

      // Verify all products were created
      const products = await prisma.product.count();
      expect(products).toBe(100);
    });

    it('should handle transaction rollback on partial failures', async () => {
      const testData = [
        {
          Name: 'Valid Product 1',
          SKU: 'VP001',
          RetailPrice: 100,
        },
        {
          Name: 'Valid Product 2',
          SKU: 'VP002',
          RetailPrice: 200,
        },
      ];

      // First import should succeed
      let buffer = createTestExcelFile(testData);
      let request = createTestRequest(buffer);

      jest.mock('@/lib/auth', () => ({
        validateTokenPermission: jest.fn().mockResolvedValue({ isValid: true }),
      }));

      await bulkImportPOST(request as any);

      // Second import with duplicate SKUs should handle failures properly
      const duplicateData = [
        {
          Name: 'New Valid Product',
          SKU: 'NVP001',
          RetailPrice: 300,
        },
        {
          Name: 'Duplicate Product',
          SKU: 'VP001', // This will fail
          RetailPrice: 400,
        },
      ];

      buffer = createTestExcelFile(duplicateData);
      request = createTestRequest(buffer);

      const response = await bulkImportPOST(request as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.details[0].success).toBe(true);
      expect(result.details[1].success).toBe(false);

      // Verify that only valid products exist
      const products = await prisma.product.findMany();
      expect(products).toHaveLength(3); // 2 from first import + 1 from second
      expect(products.map(p => p.sku).sort()).toEqual(['NVP001', 'VP001', 'VP002']);
    });
  });
}); 