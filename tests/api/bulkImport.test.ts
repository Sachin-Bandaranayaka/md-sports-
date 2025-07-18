import { NextRequest } from 'next/server';
import { POST as bulkImportPOST } from '@/app/api/products/bulk-import/route';
import { POST as bulkCreatePOST } from '@/app/api/products/bulk-create/route';
import { GET as shopNamesGET } from '@/app/api/shops/names/route';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

// Mock the authentication module
jest.mock('@/lib/auth', () => ({
  validateTokenPermission: jest.fn(),
}));

// Mock the cache service
jest.mock('@/lib/cache', () => ({
  cacheService: {
    invalidateInventory: jest.fn(),
  },
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    shop: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    inventoryItem: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockValidateTokenPermission = require('@/lib/auth').validateTokenPermission;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Bulk Import API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful auth
    mockValidateTokenPermission.mockResolvedValue({ isValid: true });
  });

  describe('POST /api/products/bulk-import', () => {
    const createMockExcelFile = (data: any[]) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      return new File([buffer], 'products.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    };

    const createMockRequest = (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return new NextRequest('http://localhost:3000/api/products/bulk-import', {
        method: 'POST',
        body: formData,
      });
    };

    it('should successfully import valid products', async () => {
      const productData = [
        {
          Name: 'Test Product 1',
          SKU: 'TP001',
          Description: 'Test description',
          RetailPrice: 100,
          CostPrice: 80,
          CategoryName: 'Sports',
        },
      ];

      const file = createMockExcelFile(productData);
      const request = createMockRequest(file);

      // Mock database responses
      mockPrisma.product.findUnique.mockResolvedValue(null); // SKU doesn't exist
      mockPrisma.category.findFirst.mockResolvedValue({ id: 1, name: 'Sports' });
      
      const mockCreatedProduct = { id: 1, name: 'Test Product 1', sku: 'TP001' };
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            create: jest.fn().mockResolvedValue(mockCreatedProduct),
          },
          inventoryItem: {
            create: jest.fn(),
          },
        };
        return await callback(tx as any);
      });

      const response = await bulkImportPOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.details).toHaveLength(1);
      expect(result.details[0].success).toBe(true);
    });

    it('should handle missing required fields', async () => {
      const productData = [
        {
          Name: '', // Missing name
          RetailPrice: 100,
        },
      ];

      const file = createMockExcelFile(productData);
      const request = createMockRequest(file);

      const response = await bulkImportPOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(false);
      expect(result.details[0].success).toBe(false);
      expect(result.details[0].message).toContain('Product Name is required');
    });

    it('should validate InitialQuantity and ShopName relationship', async () => {
      const productData = [
        {
          Name: 'Test Product',
          RetailPrice: 100,
          InitialQuantity: 50, // Has quantity but no shop
          ShopName: '', // Missing shop name
        },
      ];

      const file = createMockExcelFile(productData);
      const request = createMockRequest(file);

      const response = await bulkImportPOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.details[0].success).toBe(false);
      expect(result.details[0].message).toContain('Shop Name is required when Initial Quantity is greater than 0');
    });

    it('should handle invalid shop names', async () => {
      const productData = [
        {
          Name: 'Test Product',
          RetailPrice: 100,
          InitialQuantity: 50,
          ShopName: 'Nonexistent Shop',
        },
      ];

      const file = createMockExcelFile(productData);
      const request = createMockRequest(file);

      mockPrisma.shop.findFirst.mockResolvedValue(null); // Shop not found
      mockPrisma.shop.findMany.mockResolvedValue([
        { name: 'MBA' },
        { name: 'Zimantra' },
      ]);

      const response = await bulkImportPOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.details[0].success).toBe(false);
      expect(result.details[0].message).toContain('Shop \'Nonexistent Shop\' not found');
      expect(result.details[0].message).toContain('Available shops: MBA, Zimantra');
    });

    it('should handle duplicate SKUs', async () => {
      const productData = [
        {
          Name: 'Test Product 1',
          SKU: 'DUPLICATE',
          RetailPrice: 100,
        },
        {
          Name: 'Test Product 2',
          SKU: 'DUPLICATE', // Duplicate SKU in batch
          RetailPrice: 200,
        },
      ];

      const file = createMockExcelFile(productData);
      const request = createMockRequest(file);

      mockPrisma.product.findUnique.mockResolvedValue(null); // SKU doesn't exist in DB

      const response = await bulkImportPOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.details[1].success).toBe(false);
      expect(result.details[1].message).toContain('SKU \'DUPLICATE\' is duplicated within the import file');
    });

    it('should handle database errors gracefully', async () => {
      const productData = [
        {
          Name: 'Test Product',
          SKU: 'TP001',
          RetailPrice: 100,
        },
      ];

      const file = createMockExcelFile(productData);
      const request = createMockRequest(file);

      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      const response = await bulkImportPOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.details[0].success).toBe(false);
      expect(result.details[0].message).toContain('Database error during import');
    });

    it('should reject requests without proper permissions', async () => {
      mockValidateTokenPermission.mockResolvedValue({ 
        isValid: false, 
        message: 'Insufficient permissions' 
      });

      const productData = [{ Name: 'Test', RetailPrice: 100 }];
      const file = createMockExcelFile(productData);
      const request = createMockRequest(file);

      const response = await bulkImportPOST(request);

      expect(response.status).toBe(401);
    });

    it('should reject requests without file', async () => {
      const formData = new FormData();
      const request = new NextRequest('http://localhost:3000/api/products/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const response = await bulkImportPOST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toContain('No file uploaded');
    });
  });

  describe('POST /api/products/bulk-create', () => {
    const createMockJSONRequest = (products: any[]) => {
      return new NextRequest('http://localhost:3000/api/products/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });
    };

    it('should successfully create products via JSON API', async () => {
      const products = [
        {
          name: 'JSON Product 1',
          sku: 'JP001',
          price: 100,
          weightedAverageCost: 80,
        },
      ];

      const request = createMockJSONRequest(products);

      mockPrisma.product.findUnique.mockResolvedValue(null);
      const mockCreatedProduct = { id: 1, name: 'JSON Product 1', sku: 'JP001' };
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            create: jest.fn().mockResolvedValue(mockCreatedProduct),
          },
          inventoryItem: {
            create: jest.fn(),
          },
        };
        return await callback(tx as any);
      });

      const response = await bulkCreatePOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
      expect(result.results[0].success).toBe(true);
    });

    it('should validate required fields in JSON API', async () => {
      const products = [
        {
          name: 'Valid Product',
          price: 100,
        },
        {
          name: '', // Invalid: empty name
          price: 200,
        },
        {
          name: 'Another Product',
          // Missing price
        },
      ];

      const request = createMockJSONRequest(products);

      const response = await bulkCreatePOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(2);
      
      const failedResults = result.results.filter((r: any) => !r.success);
      expect(failedResults).toHaveLength(2);
      expect(failedResults[0].message).toContain('Product name and price are required');
      expect(failedResults[1].message).toContain('Product name and price are required');
    });

    it('should handle empty products array', async () => {
      const request = createMockJSONRequest([]);

      const response = await bulkCreatePOST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Products array is required and must not be empty');
    });

    it('should detect duplicate SKUs within batch', async () => {
      const products = [
        {
          name: 'Product 1',
          sku: 'DUPLICATE',
          price: 100,
        },
        {
          name: 'Product 2',
          sku: 'DUPLICATE',
          price: 200,
        },
      ];

      const request = createMockJSONRequest(products);
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const response = await bulkCreatePOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].message).toContain('SKU \'DUPLICATE\' is duplicated within the batch');
    });
  });

  describe('GET /api/shops/names', () => {
    it('should return active shop names', async () => {
      const mockShops = [
        { name: 'MBA' },
        { name: 'Zimantra' },
      ];

      mockPrisma.shop.findMany.mockResolvedValue(mockShops);

      const request = new NextRequest('http://localhost:3000/api/shops/names');
      const response = await shopNamesGET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.shopNames).toEqual(['MBA', 'Zimantra']);
      expect(mockPrisma.shop.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        select: { name: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.shop.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/shops/names');
      const response = await shopNamesGET();
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch shop names');
    });
  });
}); 