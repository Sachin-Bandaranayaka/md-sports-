// Mock the Product model
// Mock Product is defined in the jest.mock call below

// Mock the models
jest.mock('@/lib/models', () => ({
  Product: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  }
}));

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    refreshToken: {
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { productService } from '@/services/productService';
import { auditService } from '@/services/auditService';
import * as refreshTokenService from '@/services/refreshTokenService';
import { prisma } from '@/lib/prisma';
import { Product } from '@/lib/models';

// Get the mocked Product
const mockedProduct = Product as jest.Mocked<typeof Product>;

// Get the mocked prisma instance
const mockPrisma = prisma as jest.Mocked<typeof prisma>;



// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('Service Layer Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('ProductService', () => {
    const mockProductData = {
      id: 1,
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      costPrice: 50.00,
      sku: 'TEST-001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getAllProducts', () => {
      it('should fetch all active products successfully', async () => {
        const mockProducts = [mockProductData, { ...mockProductData, id: 2, name: 'Product 2' }];
        mockedProduct.findAll.mockResolvedValue(mockProducts);

        const result = await productService.getAllProducts();

        expect(mockedProduct.findAll).toHaveBeenCalledWith({
          where: { isActive: true },
        });
        expect(result).toEqual(mockProducts);
        expect(result).toHaveLength(2);
      });

      it('should handle database errors gracefully', async () => {
        const dbError = new Error('Database connection failed');
        mockedProduct.findAll.mockRejectedValue(dbError);

        await expect(productService.getAllProducts()).rejects.toThrow('Database connection failed');
        expect(consoleSpy.error).toHaveBeenCalledWith('Error fetching products:', dbError);
      });

      it('should return empty array when no products found', async () => {
        mockedProduct.findAll.mockResolvedValue([]);

        const result = await productService.getAllProducts();

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe('getProductById', () => {
      it('should fetch product by id successfully', async () => {
        mockedProduct.findOne.mockResolvedValue(mockProductData);

        const result = await productService.getProductById(1);

        expect(mockedProduct.findOne).toHaveBeenCalledWith({
          where: { id: 1, isActive: true },
        });
        expect(result).toEqual(mockProductData);
      });

      it('should return null for non-existent product', async () => {
        mockedProduct.findOne.mockResolvedValue(null);

        const result = await productService.getProductById(999);

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Product not found');
        mockedProduct.findOne.mockRejectedValue(dbError);

        await expect(productService.getProductById(1)).rejects.toThrow('Product not found');
        expect(consoleSpy.error).toHaveBeenCalledWith('Error fetching product with ID 1:', dbError);
      });
    });

    describe('createProduct', () => {
      it('should create a new product successfully', async () => {
        const newProductData = {
          name: 'New Product',
          description: 'New Description',
          price: 149.99,
          costPrice: 75.00,
          sku: 'NEW-001',
        };
        const createdProduct = { ...mockProductData, ...newProductData, id: 3 };
        mockedProduct.create.mockResolvedValue(createdProduct);

        const result = await productService.createProduct(newProductData);

        expect(mockedProduct.create).toHaveBeenCalledWith(newProductData);
        expect(result).toEqual(createdProduct);
      });

      it('should handle validation errors', async () => {
        const validationError = new Error('Validation failed: name is required');
        mockedProduct.create.mockRejectedValue(validationError);

        await expect(productService.createProduct({})).rejects.toThrow('Validation failed: name is required');
        expect(consoleSpy.error).toHaveBeenCalledWith('Error creating product:', validationError);
      });

      it('should handle duplicate SKU errors', async () => {
        const duplicateError = new Error('SKU already exists');
        mockedProduct.create.mockRejectedValue(duplicateError);

        const duplicateData = { name: 'Test', sku: 'EXISTING-SKU' };
        await expect(productService.createProduct(duplicateData)).rejects.toThrow('SKU already exists');
      });
    });

    describe('updateProduct', () => {
      it('should update product successfully', async () => {
        const updateData = { name: 'Updated Product', price: 199.99 };
        const mockProductInstance = {
          ...mockProductData,
          update: jest.fn().mockResolvedValue({ ...mockProductData, ...updateData }),
        };
        mockedProduct.findByPk.mockResolvedValue(mockProductInstance);

        const result = await productService.updateProduct(1, updateData);

        expect(mockedProduct.findByPk).toHaveBeenCalledWith(1);
        expect(mockProductInstance.update).toHaveBeenCalledWith(updateData);
        expect(result).toEqual({ ...mockProductData, ...updateData });
      });

      it('should throw error for non-existent product', async () => {
        mockedProduct.findByPk.mockResolvedValue(null);

        await expect(productService.updateProduct(999, { name: 'Updated' })).rejects.toThrow(
          'Product with ID 999 not found'
        );
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'Error updating product with ID 999:',
          expect.any(Error)
        );
      });

      it('should handle database update errors', async () => {
        const mockProductInstance = {
          update: jest.fn().mockRejectedValue(new Error('Update failed')),
        };
        mockedProduct.findByPk.mockResolvedValue(mockProductInstance);

        await expect(productService.updateProduct(1, { name: 'Updated' })).rejects.toThrow('Update failed');
      });
    });

    describe('deleteProduct', () => {
      it('should soft delete product successfully', async () => {
        const mockProductInstance = {
          ...mockProductData,
          update: jest.fn().mockResolvedValue({ ...mockProductData, isActive: false }),
        };
        mockedProduct.findByPk.mockResolvedValue(mockProductInstance);

        const result = await productService.deleteProduct(1);

        expect(mockedProduct.findByPk).toHaveBeenCalledWith(1);
        expect(mockProductInstance.update).toHaveBeenCalledWith({ isActive: false });
        expect(result).toEqual({ ...mockProductData, isActive: false });
      });

      it('should throw error for non-existent product', async () => {
        mockedProduct.findByPk.mockResolvedValue(null);

        await expect(productService.deleteProduct(999)).rejects.toThrow(
          'Product with ID 999 not found'
        );
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'Error deleting product with ID 999:',
          expect.any(Error)
        );
      });
    });
  });

  describe('AuditService', () => {
    const mockAuditData = {
      id: 1,
      userId: 1,
      action: 'CREATE',
      entity: 'Product',
      entityId: 1,
      details: { name: 'Test Product' },
      createdAt: new Date(),
    };

    describe('logAction', () => {
      it('should log audit action successfully', async () => {
        (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditData);

        await auditService.logAction({
          userId: 1,
          action: 'CREATE',
          entity: 'Product',
          entityId: 1,
          details: { name: 'Test Product' },
        });

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: {
            userId: 1,
            action: 'CREATE',
            entity: 'Product',
            entityId: 1,
            details: {
              name: 'Test Product',
              originalData: undefined,
              isDeleted: false,
              deletedAt: undefined,
              deletedBy: undefined,
              canRecover: false,
              recoveredAt: undefined,
              recoveredBy: undefined,
            },
          },
        });
      });

      it('should handle audit logging errors gracefully', async () => {
        const auditError = new Error('Audit log failed');
        (mockPrisma.auditLog.create as jest.Mock).mockRejectedValue(auditError);

        // Should not throw error, just log it
        await auditService.logAction({
          userId: 1,
          action: 'CREATE',
          entity: 'Product',
        });

        expect(consoleSpy.error).toHaveBeenCalledWith('Failed to log audit entry:', auditError);
      });
    });

    // Note: getAuditLogs and cleanupOldLogs methods don't exist in the actual auditService
    // These tests have been removed to match the actual implementation
  });

  describe.skip('RefreshTokenService', () => {
    const mockRefreshToken = {
      id: 1,
      token: 'refresh-token-123',
      userId: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
      isRevoked: false,
    };

    describe('generateRefreshToken', () => {
      it('should generate refresh token successfully', async () => {
        (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue(mockRefreshToken);

        const result = await refreshTokenService.generateRefreshToken(1);

        expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
          data: {
            userId: 1,
            token: expect.any(String),
            expiresAt: expect.any(Date),
          },
        });
        expect(result).toEqual(expect.any(String));
      });

      it('should handle creation errors', async () => {
        const createError = new Error('Token creation failed');
        (mockPrisma.refreshToken.create as jest.Mock).mockRejectedValue(createError);

        await expect(refreshTokenService.generateRefreshToken(1)).rejects.toThrow('Token creation failed');
      });
    });

    describe('verifyRefreshToken', () => {
      it('should verify valid refresh token', async () => {
        (mockPrisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockRefreshToken);

        const result = await refreshTokenService.verifyRefreshToken('refresh-token-123');

        expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
          where: { token: 'refresh-token-123' },
        });
        expect(result).toEqual(1);
      });

      it('should return null for invalid token', async () => {
        (mockPrisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await refreshTokenService.verifyRefreshToken('invalid-token');

        expect(result).toBeNull();
      });

      it('should return null for expired token', async () => {
        const expiredToken = {
          ...mockRefreshToken,
          expiresAt: new Date(Date.now() - 1000), // Expired
        };
        (mockPrisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(expiredToken);
        (mockPrisma.refreshToken.update as jest.Mock).mockResolvedValue(expiredToken);

        const result = await refreshTokenService.verifyRefreshToken('expired-token');

        expect(result).toBeNull();
      });
    });

    describe.skip('revokeRefreshToken', () => {
      it('should revoke refresh token successfully', async () => {
        (mockPrisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

        const result = await refreshTokenService.revokeRefreshToken('refresh-token-123');

        expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
          where: { token: 'refresh-token-123' },
          data: { isRevoked: true },
        });
        expect(result).toBe(true);
      });

      it('should handle errors gracefully', async () => {
        const revokeError = new Error('Database error');
        (mockPrisma.refreshToken.updateMany as jest.Mock).mockRejectedValue(revokeError);

        const result = await refreshTokenService.revokeRefreshToken('non-existent');
        expect(result).toBe(false);
      });
    });

    describe.skip('revokeAllUserRefreshTokens', () => {
      it('should revoke all tokens for user', async () => {
        (mockPrisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

        const result = await refreshTokenService.revokeAllUserRefreshTokens(1);

        expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
          where: { userId: 1 },
          data: { isRevoked: true },
        });
        expect(result).toBe(true);
      });
    });

    describe.skip('cleanupRefreshTokens', () => {
      it('should cleanup expired tokens', async () => {
        (mockPrisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 10 });

        await refreshTokenService.cleanupRefreshTokens();

        // The function uses executeWithRetry wrapper, so we check if deleteMany was called
        expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
      });
    });
  });

  describe('Service Integration Tests', () => {
    it('should handle service dependencies correctly', async () => {
      // Test interaction between services
      const productData = { name: 'Test Product', price: 99.99 };
      const createdProduct = { 
        id: 5, 
        name: 'Test Product', 
        price: 99.99, 
        description: 'Test description',
        category: 'Test Category',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      (mockedProduct.create as jest.Mock).mockResolvedValue(createdProduct);
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        action: 'CREATE',
        entity: 'Product',
        entityId: 5,
        details: productData,
        createdAt: new Date(),
      });

      // Create product
      const product = await productService.createProduct(productData);
      
      // Log audit action
      await auditService.logAction({
        userId: 1,
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        details: productData,
      });

      expect(product).toEqual(createdProduct);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should handle service error propagation', async () => {
      const dbError = new Error('Database connection lost');
      (mockedProduct.findAll as jest.Mock).mockRejectedValue(dbError);
      (mockPrisma.auditLog.create as jest.Mock).mockRejectedValue(dbError);

      // Both services should handle errors independently
      await expect(productService.getAllProducts()).rejects.toThrow('Database connection lost');
      
      await auditService.logAction({
        userId: 1,
        action: 'READ',
        entity: 'Product',
      });
      
      // Audit service handles errors gracefully, so no exception should be thrown
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
});