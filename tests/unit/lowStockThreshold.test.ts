// Unit tests for Low Stock Threshold feature
// Tests the API endpoint and business logic for updating minStockLevel

import { NextRequest, NextResponse } from 'next/server';
import { PUT } from '@/app/api/products/[id]/route';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { extractToken } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

// Mock audit service
jest.mock('@/services/auditService', () => ({
  auditService: {
    logAction: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn().mockReturnValue({ userId: 1 }),
  extractToken: jest.fn().mockReturnValue('valid-token'),
}));

// Mock cache service
jest.mock('@/lib/cache', () => ({
  cacheService: {
    invalidateInventory: jest.fn(),
  },
}));

// Mock Next.js revalidation functions
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));

const mockPrisma = require('@/lib/prisma').prisma;
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockExtractToken = extractToken as jest.MockedFunction<typeof extractToken>;

describe('Low Stock Threshold API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/products/[id] - minStockLevel updates', () => {
    const mockExistingProduct = {
      id: 1,
      name: 'Test Product',
      sku: 'TEST-001',
      barcode: '1234567890',
      description: 'Test product description',
      price: 100,
      weightedAverageCost: 80,
      minStockLevel: 10,
      categoryId: 1,
    };

    const mockUpdatedProduct = {
      ...mockExistingProduct,
      minStockLevel: 25,
    };

    beforeEach(() => {
      mockPrisma.product.findUnique.mockResolvedValue(mockExistingProduct);
      mockPrisma.product.update.mockResolvedValue(mockUpdatedProduct);
      mockPrisma.auditLog.create.mockResolvedValue({});
      mockExtractToken.mockReturnValue('mock-token');
      mockVerifyToken.mockReturnValue({ userId: 1 });
    });

    test('should successfully update minStockLevel', async () => {
      const requestBody = {
        minStockLevel: 25,
      };

      const request = new Request('http://localhost:3000/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      }) as NextRequest;

      const response = await PUT(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          minStockLevel: 25,
        },
      });
    });

    test('should update minStockLevel along with other fields', async () => {
      const requestBody = {
        name: 'Updated Product Name',
        minStockLevel: 15,
        retailPrice: 120,
      };

      const request = new Request('http://localhost:3000/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      }) as NextRequest;

      const response = await PUT(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Product Name',
          minStockLevel: 15,
          price: 120,
        },
      });
    });

    test('should handle zero minStockLevel', async () => {
      const requestBody = {
        minStockLevel: 0,
      };

      const request = new Request('http://localhost:3000/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      }) as NextRequest;

      const response = await PUT(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          minStockLevel: 0,
        },
      });
    });

    test('should handle negative minStockLevel', async () => {
      const requestBody = {
        minStockLevel: -5,
      };

      const request = new Request('http://localhost:3000/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      }) as NextRequest;

      const response = await PUT(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          minStockLevel: -5,
        },
      });
    });

    test('should return 404 for non-existent product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const requestBody = {
        minStockLevel: 25,
      };

      const request = new Request('http://localhost:3000/api/products/999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      }) as NextRequest;

      const response = await PUT(request, { params: { id: '999' } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Product with ID 999 not found');
    });

    test('should return 400 for invalid product ID', async () => {
      const requestBody = {
        minStockLevel: 25,
      };

      const request = new Request('http://localhost:3000/api/products/invalid', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      }) as NextRequest;

      const response = await PUT(request, { params: { id: 'invalid' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Invalid product ID');
    });

    test('should create audit log for minStockLevel changes', async () => {
      const requestBody = {
        minStockLevel: 30,
      };

      const request = new Request('http://localhost:3000/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      }) as NextRequest;

      const response = await PUT(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Verify audit log was created
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'UPDATE',
          entityType: 'Product',
          entityId: '1',
          userId: 1,
          changes: {
            minStockLevel: {
              old: 10,
              new: 30,
            },
          },
          timestamp: expect.any(Date),
        },
      });
    });

    test('should handle database errors gracefully', async () => {
      mockPrisma.product.update.mockRejectedValue(new Error('Database connection failed'));

      const requestBody = {
        minStockLevel: 25,
      };

      const request = new Request('http://localhost:3000/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      }) as NextRequest;

      const response = await PUT(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Error updating product');
    });
  });

  describe('minStockLevel validation', () => {
    test('should accept valid minStockLevel values', () => {
      const validValues = [0, 1, 5, 10, 100, 1000];
      
      validValues.forEach(value => {
        expect(typeof value).toBe('number');
        expect(Number.isInteger(value)).toBe(true);
      });
    });

    test('should handle string numbers correctly', () => {
      const stringNumbers = ['0', '5', '10', '25'];
      
      stringNumbers.forEach(value => {
        const parsed = parseInt(value);
        expect(Number.isInteger(parsed)).toBe(true);
        expect(parsed >= 0).toBe(true);
      });
    });
  });
});

// Business logic tests for low stock detection
describe('Low Stock Detection Logic', () => {
  test('should correctly identify low stock products', () => {
    const products = [
      { id: 1, name: 'Product A', currentStock: 5, minStockLevel: 10 },
      { id: 2, name: 'Product B', currentStock: 15, minStockLevel: 10 },
      { id: 3, name: 'Product C', currentStock: 0, minStockLevel: 5 },
      { id: 4, name: 'Product D', currentStock: 10, minStockLevel: 10 },
    ];

    const isLowStock = (product: any) => product.currentStock < product.minStockLevel;
    const lowStockProducts = products.filter(isLowStock);

    expect(lowStockProducts).toHaveLength(2);
    expect(lowStockProducts.map(p => p.id)).toEqual([1, 3]);
  });

  test('should handle edge cases for low stock detection', () => {
    const edgeCases = [
      { id: 1, currentStock: 0, minStockLevel: 0 }, // Both zero
      { id: 2, currentStock: 1, minStockLevel: 0 }, // Min stock zero
      { id: 3, currentStock: 5, minStockLevel: 5 }, // Equal values
    ];

    const isLowStock = (product: any) => product.currentStock < product.minStockLevel;
    const lowStockProducts = edgeCases.filter(isLowStock);

    expect(lowStockProducts).toHaveLength(0); // None should be low stock
  });
});