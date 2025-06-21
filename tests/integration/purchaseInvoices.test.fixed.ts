// Fixed Purchase Invoices Integration Test Suite
// This file contains the corrected version of purchaseInvoices.test.ts

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { randomUUID } from 'crypto';

// Create a proper test database instance
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Mock the prisma import to use our test instance
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: testPrisma,
}));

// Import after mocking
import prisma from '@/lib/prisma';
import { PurchaseInvoiceService } from '@/services/purchaseInvoiceService';
import { ProductStatus, PurchaseInvoiceStatus } from '@prisma/client';

describe('Purchase Invoices Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let purchaseInvoiceService: PurchaseInvoiceService;
  
  // Test data
  let testSupplier: any;
  let testProduct: any;
  let testUser: any;
  let testCategory: any;

  beforeAll(async () => {
    // Setup Express app for API testing
    app = express();
    app.use(express.json());
    
    // Setup test server
    server = createServer(app);
    
    // Initialize service
    purchaseInvoiceService = new PurchaseInvoiceService();
    
    // Connect to test database
    try {
      await prisma.$connect();
      console.log('Connected to test database');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Clean up database before each test
    try {
      // Delete in correct order to respect foreign key constraints
      await prisma.purchaseInvoiceItem.deleteMany({});
      await prisma.purchaseInvoice.deleteMany({});
      await prisma.inventoryItem.deleteMany({});
      await prisma.product.deleteMany({});
      await prisma.category.deleteMany({});
      await prisma.supplier.deleteMany({});
      await prisma.user.deleteMany({});
      
      console.log('Database cleaned up successfully');
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
      // Continue with test setup even if cleanup fails
    }

    // Create test data
    try {
      // Create test category
      testCategory = await prisma.category.create({
        data: {
          name: 'Test Category',
          description: 'Category for testing'
        }
      });

      // Create test user
      testUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: 'test@example.com',
          password: 'hashed-password',
          role: 'ADMIN',
          isActive: true
        }
      });

      // Create test supplier
      testSupplier = await prisma.supplier.create({
        data: {
          name: 'Test Supplier',
          email: 'supplier@example.com',
          phone: '1234567890',
          address: '123 Test Street',
          isActive: true
        }
      });

      // Create test product
      testProduct = await prisma.product.create({
        data: {
          name: 'Test Product',
          sku: 'TEST-001',
          price: 99.99,
          cost: 50.00,
          categoryId: testCategory.id,
          status: ProductStatus.ACTIVE,
          description: 'Test product for purchase invoice testing'
        }
      });

      console.log('Test data created successfully');
    } catch (error) {
      console.error('Failed to create test data:', error);
      throw error;
    }
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await prisma.purchaseInvoiceItem.deleteMany({});
      await prisma.purchaseInvoice.deleteMany({});
      await prisma.inventoryItem.deleteMany({});
      await prisma.product.deleteMany({});
      await prisma.category.deleteMany({});
      await prisma.supplier.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn('Cleanup error:', error.message);
    }
  });

  afterAll(async () => {
    // Final cleanup and disconnect
    try {
      await prisma.purchaseInvoiceItem.deleteMany({});
      await prisma.purchaseInvoice.deleteMany({});
      await prisma.inventoryItem.deleteMany({});
      await prisma.product.deleteMany({});
      await prisma.category.deleteMany({});
      await prisma.supplier.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn('Final cleanup error:', error.message);
    } finally {
      await prisma.$disconnect();
      console.log('Disconnected from test database');
    }
    
    // Close server
    if (server) {
      server.close();
    }
  });

  describe('Purchase Invoice Creation', () => {
    it('should create a purchase invoice successfully', async () => {
      // Arrange
      const invoiceData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'PI-001',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: PurchaseInvoiceStatus.PENDING,
        subtotal: 500.00,
        taxAmount: 50.00,
        totalAmount: 550.00,
        notes: 'Test purchase invoice',
        createdBy: testUser.id
      };

      // Act
      const result = await purchaseInvoiceService.createPurchaseInvoice(invoiceData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.invoiceNumber).toBe('PI-001');
      expect(result.supplierId).toBe(testSupplier.id);
      expect(result.status).toBe(PurchaseInvoiceStatus.PENDING);
      expect(result.totalAmount).toBe(550.00);

      // Verify in database
      const dbInvoice = await prisma.purchaseInvoice.findUnique({
        where: { id: result.id }
      });
      expect(dbInvoice).toBeDefined();
      expect(dbInvoice?.invoiceNumber).toBe('PI-001');
    });

    it('should create purchase invoice with items', async () => {
      // Arrange
      const invoiceData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'PI-002',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: PurchaseInvoiceStatus.PENDING,
        createdBy: testUser.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 10,
            unitCost: 50.00,
            totalCost: 500.00
          }
        ]
      };

      // Act
      const result = await purchaseInvoiceService.createPurchaseInvoiceWithItems(invoiceData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      
      // Verify items were created
      const invoiceItems = await prisma.purchaseInvoiceItem.findMany({
        where: { purchaseInvoiceId: result.id }
      });
      expect(invoiceItems).toHaveLength(1);
      expect(invoiceItems[0].productId).toBe(testProduct.id);
      expect(invoiceItems[0].quantity).toBe(10);
      expect(invoiceItems[0].unitCost).toBe(50.00);
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidData = {
        // Missing required fields
        invoiceNumber: 'PI-003'
      };

      // Act & Assert
      await expect(
        purchaseInvoiceService.createPurchaseInvoice(invalidData as any)
      ).rejects.toThrow();
    });

    it('should prevent duplicate invoice numbers', async () => {
      // Arrange
      const invoiceData1 = {
        supplierId: testSupplier.id,
        invoiceNumber: 'PI-DUPLICATE',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: PurchaseInvoiceStatus.PENDING,
        subtotal: 100.00,
        totalAmount: 100.00,
        createdBy: testUser.id
      };

      const invoiceData2 = { ...invoiceData1 };

      // Act
      await purchaseInvoiceService.createPurchaseInvoice(invoiceData1);

      // Assert
      await expect(
        purchaseInvoiceService.createPurchaseInvoice(invoiceData2)
      ).rejects.toThrow(/unique constraint/i);
    });
  });

  describe('Purchase Invoice Retrieval', () => {
    let testInvoice: any;

    beforeEach(async () => {
      // Create a test invoice for retrieval tests
      testInvoice = await prisma.purchaseInvoice.create({
        data: {
          supplierId: testSupplier.id,
          invoiceNumber: 'PI-RETRIEVE-001',
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: PurchaseInvoiceStatus.PENDING,
          subtotal: 200.00,
          taxAmount: 20.00,
          totalAmount: 220.00,
          createdBy: testUser.id
        }
      });
    });

    it('should retrieve purchase invoice by ID', async () => {
      // Act
      const result = await purchaseInvoiceService.getPurchaseInvoiceById(testInvoice.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(testInvoice.id);
      expect(result?.invoiceNumber).toBe('PI-RETRIEVE-001');
      expect(result?.totalAmount).toBe(220.00);
    });

    it('should retrieve purchase invoice with supplier details', async () => {
      // Act
      const result = await purchaseInvoiceService.getPurchaseInvoiceWithDetails(testInvoice.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.supplier).toBeDefined();
      expect(result?.supplier.name).toBe('Test Supplier');
    });

    it('should return null for non-existent invoice', async () => {
      // Act
      const result = await purchaseInvoiceService.getPurchaseInvoiceById(99999);

      // Assert
      expect(result).toBeNull();
    });

    it('should retrieve all purchase invoices with pagination', async () => {
      // Arrange - Create additional invoices
      await prisma.purchaseInvoice.createMany({
        data: [
          {
            supplierId: testSupplier.id,
            invoiceNumber: 'PI-PAGE-001',
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: PurchaseInvoiceStatus.PENDING,
            subtotal: 100.00,
            totalAmount: 100.00,
            createdBy: testUser.id
          },
          {
            supplierId: testSupplier.id,
            invoiceNumber: 'PI-PAGE-002',
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: PurchaseInvoiceStatus.PENDING,
            subtotal: 150.00,
            totalAmount: 150.00,
            createdBy: testUser.id
          }
        ]
      });

      // Act
      const result = await purchaseInvoiceService.getPurchaseInvoices({
        page: 1,
        limit: 2
      });

      // Assert
      expect(result.invoices).toHaveLength(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });
  });

  describe('Purchase Invoice Updates', () => {
    let testInvoice: any;

    beforeEach(async () => {
      testInvoice = await prisma.purchaseInvoice.create({
        data: {
          supplierId: testSupplier.id,
          invoiceNumber: 'PI-UPDATE-001',
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: PurchaseInvoiceStatus.PENDING,
          subtotal: 300.00,
          totalAmount: 300.00,
          createdBy: testUser.id
        }
      });
    });

    it('should update purchase invoice status', async () => {
      // Act
      const result = await purchaseInvoiceService.updatePurchaseInvoiceStatus(
        testInvoice.id,
        PurchaseInvoiceStatus.APPROVED
      );

      // Assert
      expect(result.status).toBe(PurchaseInvoiceStatus.APPROVED);
      
      // Verify in database
      const dbInvoice = await prisma.purchaseInvoice.findUnique({
        where: { id: testInvoice.id }
      });
      expect(dbInvoice?.status).toBe(PurchaseInvoiceStatus.APPROVED);
    });

    it('should update purchase invoice details', async () => {
      // Arrange
      const updateData = {
        notes: 'Updated notes',
        subtotal: 350.00,
        taxAmount: 35.00,
        totalAmount: 385.00
      };

      // Act
      const result = await purchaseInvoiceService.updatePurchaseInvoice(
        testInvoice.id,
        updateData
      );

      // Assert
      expect(result.notes).toBe('Updated notes');
      expect(result.totalAmount).toBe(385.00);
    });

    it('should prevent updating approved invoices', async () => {
      // Arrange - First approve the invoice
      await purchaseInvoiceService.updatePurchaseInvoiceStatus(
        testInvoice.id,
        PurchaseInvoiceStatus.APPROVED
      );

      // Act & Assert
      await expect(
        purchaseInvoiceService.updatePurchaseInvoice(testInvoice.id, {
          notes: 'Should not be allowed'
        })
      ).rejects.toThrow(/cannot be modified/i);
    });
  });

  describe('Purchase Invoice Deletion', () => {
    let testInvoice: any;

    beforeEach(async () => {
      testInvoice = await prisma.purchaseInvoice.create({
        data: {
          supplierId: testSupplier.id,
          invoiceNumber: 'PI-DELETE-001',
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: PurchaseInvoiceStatus.PENDING,
          subtotal: 100.00,
          totalAmount: 100.00,
          createdBy: testUser.id
        }
      });
    });

    it('should soft delete purchase invoice', async () => {
      // Act
      const result = await purchaseInvoiceService.deletePurchaseInvoice(testInvoice.id);

      // Assert
      expect(result).toBe(true);
      
      // Verify soft deletion
      const dbInvoice = await prisma.purchaseInvoice.findUnique({
        where: { id: testInvoice.id }
      });
      expect(dbInvoice?.isDeleted).toBe(true);
    });

    it('should prevent deletion of approved invoices', async () => {
      // Arrange
      await purchaseInvoiceService.updatePurchaseInvoiceStatus(
        testInvoice.id,
        PurchaseInvoiceStatus.APPROVED
      );

      // Act & Assert
      await expect(
        purchaseInvoiceService.deletePurchaseInvoice(testInvoice.id)
      ).rejects.toThrow(/cannot be deleted/i);
    });
  });

  describe('Purchase Invoice Search and Filtering', () => {
    beforeEach(async () => {
      // Create multiple test invoices with different statuses and dates
      await prisma.purchaseInvoice.createMany({
        data: [
          {
            supplierId: testSupplier.id,
            invoiceNumber: 'PI-SEARCH-001',
            invoiceDate: new Date('2024-01-01'),
            dueDate: new Date('2024-01-31'),
            status: PurchaseInvoiceStatus.PENDING,
            subtotal: 100.00,
            totalAmount: 100.00,
            createdBy: testUser.id
          },
          {
            supplierId: testSupplier.id,
            invoiceNumber: 'PI-SEARCH-002',
            invoiceDate: new Date('2024-02-01'),
            dueDate: new Date('2024-02-28'),
            status: PurchaseInvoiceStatus.APPROVED,
            subtotal: 200.00,
            totalAmount: 200.00,
            createdBy: testUser.id
          },
          {
            supplierId: testSupplier.id,
            invoiceNumber: 'PI-SEARCH-003',
            invoiceDate: new Date('2024-03-01'),
            dueDate: new Date('2024-03-31'),
            status: PurchaseInvoiceStatus.PAID,
            subtotal: 300.00,
            totalAmount: 300.00,
            createdBy: testUser.id
          }
        ]
      });
    });

    it('should search invoices by invoice number', async () => {
      // Act
      const result = await purchaseInvoiceService.searchPurchaseInvoices({
        invoiceNumber: 'PI-SEARCH-002'
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].invoiceNumber).toBe('PI-SEARCH-002');
    });

    it('should filter invoices by status', async () => {
      // Act
      const result = await purchaseInvoiceService.searchPurchaseInvoices({
        status: PurchaseInvoiceStatus.APPROVED
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(PurchaseInvoiceStatus.APPROVED);
    });

    it('should filter invoices by date range', async () => {
      // Act
      const result = await purchaseInvoiceService.searchPurchaseInvoices({
        dateFrom: new Date('2024-02-01'),
        dateTo: new Date('2024-03-31')
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(invoice => 
        invoice.invoiceDate >= new Date('2024-02-01') &&
        invoice.invoiceDate <= new Date('2024-03-31')
      )).toBe(true);
    });

    it('should filter invoices by supplier', async () => {
      // Act
      const result = await purchaseInvoiceService.searchPurchaseInvoices({
        supplierId: testSupplier.id
      });

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.every(invoice => invoice.supplierId === testSupplier.id)).toBe(true);
    });
  });

  describe('Purchase Invoice Business Logic', () => {
    it('should calculate totals correctly', async () => {
      // Arrange
      const invoiceData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'PI-CALC-001',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: PurchaseInvoiceStatus.PENDING,
        createdBy: testUser.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 5,
            unitCost: 20.00,
            totalCost: 100.00
          },
          {
            productId: testProduct.id,
            quantity: 3,
            unitCost: 30.00,
            totalCost: 90.00
          }
        ],
        taxRate: 0.10 // 10% tax
      };

      // Act
      const result = await purchaseInvoiceService.createPurchaseInvoiceWithCalculations(invoiceData);

      // Assert
      expect(result.subtotal).toBe(190.00); // 100 + 90
      expect(result.taxAmount).toBe(19.00); // 190 * 0.10
      expect(result.totalAmount).toBe(209.00); // 190 + 19
    });

    it('should update inventory when invoice is approved', async () => {
      // Arrange
      const invoice = await prisma.purchaseInvoice.create({
        data: {
          supplierId: testSupplier.id,
          invoiceNumber: 'PI-INVENTORY-001',
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: PurchaseInvoiceStatus.PENDING,
          subtotal: 500.00,
          totalAmount: 500.00,
          createdBy: testUser.id
        }
      });

      await prisma.purchaseInvoiceItem.create({
        data: {
          purchaseInvoiceId: invoice.id,
          productId: testProduct.id,
          quantity: 10,
          unitCost: 50.00,
          totalCost: 500.00
        }
      });

      // Act
      await purchaseInvoiceService.approvePurchaseInvoice(invoice.id);

      // Assert
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: { productId: testProduct.id }
      });
      
      expect(inventoryItems).toHaveLength(1);
      expect(inventoryItems[0].quantity).toBe(10);
      expect(inventoryItems[0].unitCost).toBe(50.00);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent invoice creation', async () => {
      // Arrange
      const invoiceData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'PI-CONCURRENT-001',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: PurchaseInvoiceStatus.PENDING,
        subtotal: 100.00,
        totalAmount: 100.00,
        createdBy: testUser.id
      };

      // Act - Create multiple invoices concurrently
      const promises = Array(3).fill(null).map((_, index) => 
        purchaseInvoiceService.createPurchaseInvoice({
          ...invoiceData,
          invoiceNumber: `PI-CONCURRENT-${index + 1}`
        })
      );

      const results = await Promise.allSettled(promises);

      // Assert
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful).toHaveLength(3);
    });

    it('should handle invalid product references', async () => {
      // Arrange
      const invoiceData = {
        supplierId: testSupplier.id,
        invoiceNumber: 'PI-INVALID-001',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: PurchaseInvoiceStatus.PENDING,
        createdBy: testUser.id,
        items: [
          {
            productId: 99999, // Non-existent product
            quantity: 1,
            unitCost: 10.00,
            totalCost: 10.00
          }
        ]
      };

      // Act & Assert
      await expect(
        purchaseInvoiceService.createPurchaseInvoiceWithItems(invoiceData)
      ).rejects.toThrow();
    });

    it('should handle database transaction failures', async () => {
      // This test would require more sophisticated mocking to simulate transaction failures
      // For now, we'll test that the service handles basic validation errors
      
      // Arrange
      const invalidData = {
        // Missing required supplierId
        invoiceNumber: 'PI-INVALID-002',
        invoiceDate: new Date(),
        status: PurchaseInvoiceStatus.PENDING
      };

      // Act & Assert
      await expect(
        purchaseInvoiceService.createPurchaseInvoice(invalidData as any)
      ).rejects.toThrow();
    });
  });
});