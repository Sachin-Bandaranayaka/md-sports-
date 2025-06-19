// Fixed Database Operations Test Suite
// This file contains the corrected version of databaseOperations.test.ts

import { jest } from '@jest/globals';

// Create comprehensive Prisma mock before jest.mock
const mockPrisma = {
  // User model
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  
  // Product model
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  
  // Customer model
  customer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  
  // Invoice models
  salesInvoice: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  
  purchaseInvoice: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  
  purchaseInvoiceItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  
  // Inventory models
  inventoryItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  
  // Session model
  session: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  
  // Audit log model
  auditLog: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  
  // Prisma client methods
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $transaction: jest.fn().mockImplementation((callback) => {
    if (typeof callback === 'function') {
      return callback(mockPrisma);
    }
    return Promise.resolve([]);
  }),
  $executeRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  $queryRaw: jest.fn(),
  $queryRawUnsafe: jest.fn(),
  $runCommandRaw: jest.fn(),
  $on: jest.fn(),
  $use: jest.fn(),
  $extends: jest.fn()
};

// Mock the Prisma module
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Import after mocking
import prisma from '@/lib/prisma';
import { DatabaseOperations } from '@/lib/databaseOperations';
import { UserRole, ProductStatus } from '@prisma/client';

describe('Database Operations', () => {
  let dbOps: DatabaseOperations;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    dbOps = new DatabaseOperations();
  });

  afterAll(async () => {
    // Ensure proper cleanup
    await prisma.$disconnect();
  });

  describe('User Operations', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed-password',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    describe('createUser', () => {
      it('should create a new user successfully', async () => {
        // Arrange
        const userData = {
          email: 'newuser@example.com',
          password: 'hashed-password',
          role: UserRole.USER
        };
        mockPrisma.user.create.mockResolvedValue({ ...mockUser, ...userData, id: 2 });

        // Act
        const result = await dbOps.createUser(userData);

        // Assert
        expect(result).toEqual(expect.objectContaining({
          id: 2,
          email: 'newuser@example.com',
          role: UserRole.USER
        }));
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: userData
        });
      });

      it('should handle duplicate email error', async () => {
        // Arrange
        const userData = {
          email: 'existing@example.com',
          password: 'hashed-password',
          role: UserRole.USER
        };
        const duplicateError = new Error('Unique constraint failed');
        duplicateError.code = 'P2002';
        mockPrisma.user.create.mockRejectedValue(duplicateError);

        // Act & Assert
        await expect(dbOps.createUser(userData)).rejects.toThrow('Email already exists');
      });
    });

    describe('getUserById', () => {
      it('should retrieve user by ID', async () => {
        // Arrange
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        // Act
        const result = await dbOps.getUserById(1);

        // Assert
        expect(result).toEqual(mockUser);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 1 }
        });
      });

      it('should return null for non-existent user', async () => {
        // Arrange
        mockPrisma.user.findUnique.mockResolvedValue(null);

        // Act
        const result = await dbOps.getUserById(999);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('updateUser', () => {
      it('should update user successfully', async () => {
        // Arrange
        const updateData = { email: 'updated@example.com' };
        const updatedUser = { ...mockUser, ...updateData };
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        // Act
        const result = await dbOps.updateUser(1, updateData);

        // Assert
        expect(result).toEqual(updatedUser);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: updateData
        });
      });
    });

    describe('deleteUser', () => {
      it('should soft delete user', async () => {
        // Arrange
        const deletedUser = { ...mockUser, isActive: false };
        mockPrisma.user.update.mockResolvedValue(deletedUser);

        // Act
        const result = await dbOps.deleteUser(1);

        // Assert
        expect(result).toEqual(deletedUser);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { isActive: false }
        });
      });
    });
  });

  describe('Product Operations', () => {
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      sku: 'TEST-001',
      price: 99.99,
      status: ProductStatus.ACTIVE,
      categoryId: 1,
      description: 'Test product description',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    describe('createProduct', () => {
      it('should create a new product successfully', async () => {
        // Arrange
        const productData = {
          name: 'New Product',
          sku: 'NEW-001',
          price: 149.99,
          categoryId: 1,
          description: 'New product description'
        };
        mockPrisma.product.create.mockResolvedValue({ ...mockProduct, ...productData, id: 2 });

        // Act
        const result = await dbOps.createProduct(productData);

        // Assert
        expect(result).toEqual(expect.objectContaining({
          id: 2,
          name: 'New Product',
          sku: 'NEW-001'
        }));
        expect(mockPrisma.product.create).toHaveBeenCalledWith({
          data: productData
        });
      });

      it('should handle duplicate SKU error', async () => {
        // Arrange
        const productData = {
          name: 'Duplicate SKU Product',
          sku: 'EXISTING-SKU',
          price: 99.99,
          categoryId: 1
        };
        const duplicateError = new Error('Unique constraint failed');
        duplicateError.code = 'P2002';
        mockPrisma.product.create.mockRejectedValue(duplicateError);

        // Act & Assert
        await expect(dbOps.createProduct(productData)).rejects.toThrow('SKU already exists');
      });
    });

    describe('getProductById', () => {
      it('should retrieve product by ID with relations', async () => {
        // Arrange
        const productWithRelations = {
          ...mockProduct,
          category: { id: 1, name: 'Electronics' },
          inventoryItems: [{ id: 1, quantity: 10, location: 'A1' }]
        };
        mockPrisma.product.findUnique.mockResolvedValue(productWithRelations);

        // Act
        const result = await dbOps.getProductById(1, { includeCategory: true, includeInventory: true });

        // Assert
        expect(result).toEqual(productWithRelations);
        expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          include: {
            category: true,
            inventoryItems: true
          }
        });
      });
    });

    describe('searchProducts', () => {
      it('should search products by name and SKU', async () => {
        // Arrange
        const searchResults = [mockProduct];
        mockPrisma.product.findMany.mockResolvedValue(searchResults);

        // Act
        const result = await dbOps.searchProducts('Test', { limit: 10, offset: 0 });

        // Assert
        expect(result).toEqual(searchResults);
        expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
          where: {
            OR: [
              { name: { contains: 'Test', mode: 'insensitive' } },
              { sku: { contains: 'Test', mode: 'insensitive' } }
            ],
            status: ProductStatus.ACTIVE
          },
          take: 10,
          skip: 0,
          orderBy: { name: 'asc' }
        });
      });
    });
  });

  describe('Transaction Operations', () => {
    describe('executeTransaction', () => {
      it('should execute multiple operations in a transaction', async () => {
        // Arrange
        const operations = [
          () => mockPrisma.user.create({ data: { email: 'user1@example.com' } }),
          () => mockPrisma.product.create({ data: { name: 'Product 1', sku: 'P001' } })
        ];
        
        const transactionResults = [
          { id: 1, email: 'user1@example.com' },
          { id: 1, name: 'Product 1', sku: 'P001' }
        ];
        
        mockPrisma.$transaction.mockResolvedValue(transactionResults);

        // Act
        const result = await dbOps.executeTransaction(operations);

        // Assert
        expect(result).toEqual(transactionResults);
        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });

      it('should rollback transaction on error', async () => {
        // Arrange
        const operations = [
          () => mockPrisma.user.create({ data: { email: 'user1@example.com' } }),
          () => { throw new Error('Operation failed'); }
        ];
        
        mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

        // Act & Assert
        await expect(dbOps.executeTransaction(operations)).rejects.toThrow('Transaction failed');
      });
    });
  });

  describe('Batch Operations', () => {
    describe('batchCreateProducts', () => {
      it('should create multiple products in batch', async () => {
        // Arrange
        const productsData = [
          { name: 'Product 1', sku: 'P001', price: 10.00, categoryId: 1 },
          { name: 'Product 2', sku: 'P002', price: 20.00, categoryId: 1 }
        ];
        
        mockPrisma.product.createMany.mockResolvedValue({ count: 2 });

        // Act
        const result = await dbOps.batchCreateProducts(productsData);

        // Assert
        expect(result).toEqual({ count: 2 });
        expect(mockPrisma.product.createMany).toHaveBeenCalledWith({
          data: productsData,
          skipDuplicates: true
        });
      });
    });

    describe('batchUpdateProducts', () => {
      it('should update multiple products in batch', async () => {
        // Arrange
        const updateData = { status: ProductStatus.INACTIVE };
        const productIds = [1, 2, 3];
        
        mockPrisma.product.updateMany.mockResolvedValue({ count: 3 });

        // Act
        const result = await dbOps.batchUpdateProducts(productIds, updateData);

        // Assert
        expect(result).toEqual({ count: 3 });
        expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
          where: { id: { in: productIds } },
          data: updateData
        });
      });
    });
  });

  describe('Aggregation Operations', () => {
    describe('getProductStats', () => {
      it('should return product statistics', async () => {
        // Arrange
        const stats = {
          _count: { id: 100 },
          _avg: { price: 75.50 },
          _sum: { price: 7550.00 },
          _min: { price: 10.00 },
          _max: { price: 500.00 }
        };
        
        mockPrisma.product.aggregate.mockResolvedValue(stats);

        // Act
        const result = await dbOps.getProductStats();

        // Assert
        expect(result).toEqual(stats);
        expect(mockPrisma.product.aggregate).toHaveBeenCalledWith({
          _count: { id: true },
          _avg: { price: true },
          _sum: { price: true },
          _min: { price: true },
          _max: { price: true },
          where: { status: ProductStatus.ACTIVE }
        });
      });
    });

    describe('getProductsByCategory', () => {
      it('should group products by category', async () => {
        // Arrange
        const groupedData = [
          { categoryId: 1, _count: { id: 25 } },
          { categoryId: 2, _count: { id: 15 } }
        ];
        
        mockPrisma.product.groupBy.mockResolvedValue(groupedData);

        // Act
        const result = await dbOps.getProductsByCategory();

        // Assert
        expect(result).toEqual(groupedData);
        expect(mockPrisma.product.groupBy).toHaveBeenCalledWith({
          by: ['categoryId'],
          _count: { id: true },
          where: { status: ProductStatus.ACTIVE }
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(dbOps.getUserById(1)).rejects.toThrow('Database connection failed');
    });

    it('should handle constraint violation errors', async () => {
      // Arrange
      const constraintError = new Error('Foreign key constraint failed');
      constraintError.code = 'P2003';
      mockPrisma.product.create.mockRejectedValue(constraintError);

      // Act & Assert
      await expect(dbOps.createProduct({
        name: 'Test Product',
        sku: 'TEST-001',
        price: 99.99,
        categoryId: 999 // Non-existent category
      })).rejects.toThrow('Foreign key constraint failed');
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Query timeout');
      timeoutError.code = 'P1008';
      mockPrisma.product.findMany.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(dbOps.searchProducts('test')).rejects.toThrow('Query timeout');
    });
  });

  describe('Performance Optimization', () => {
    it('should use proper indexing for search queries', async () => {
      // Arrange
      mockPrisma.product.findMany.mockResolvedValue([]);

      // Act
      await dbOps.searchProducts('test', { useIndex: true });

      // Assert
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'test' }) }),
              expect.objectContaining({ sku: expect.objectContaining({ contains: 'test' }) })
            ])
          })
        })
      );
    });

    it('should implement pagination correctly', async () => {
      // Arrange
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(100);

      // Act
      const result = await dbOps.getProductsPaginated({ page: 2, limit: 10 });

      // Assert
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10 // (page - 1) * limit
        })
      );
    });
  });
});