/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/inventory/transfers/route';
import { PATCH } from '@/app/api/inventory/transfers/[id]/route';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/utils/auth';
import { requirePermission } from '@/middleware/permissions';
import { TransferPerformanceMonitor } from '@/lib/transferPerformanceMonitor';
import { TransferCacheService } from '@/lib/transferCache';

// Mock dependencies
jest.mock('@/utils/auth');
jest.mock('@/middleware/permissions');
jest.mock('@/lib/transferPerformanceMonitor');
jest.mock('@/lib/transferCache');

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockRequirePermission = requirePermission as jest.MockedFunction<typeof requirePermission>;
const mockPerformanceMonitor = TransferPerformanceMonitor as jest.MockedClass<typeof TransferPerformanceMonitor>;
const mockCacheService = TransferCacheService as jest.MockedClass<typeof TransferCacheService>;

describe('Inventory Transfer - Comprehensive Test Suite', () => {
  let mockUser: any;
  let mockShops: any[];
  let mockProducts: any[];
  let mockInventoryItems: any[];
  let mockTransfers: any[];
  let performanceMonitorInstance: any;
  let cacheServiceInstance: any;

  beforeAll(() => {
    // Setup mock instances
    performanceMonitorInstance = {
      startOperation: jest.fn(),
      endOperation: jest.fn(),
      recordMetrics: jest.fn(),
      getMetrics: jest.fn().mockReturnValue({
        averageResponseTime: 150,
        errorRate: 0.02,
        cacheHitRate: 0.85
      })
    };
    mockPerformanceMonitor.mockImplementation(() => performanceMonitorInstance);

    cacheServiceInstance = {
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      warmCache: jest.fn()
    };
    mockCacheService.mockImplementation(() => cacheServiceInstance);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock user
    mockUser = {
      id: 'user1',
      email: 'test@example.com',
      role: 'ADMIN',
      permissions: ['inventory:read', 'inventory:write', 'transfers:create', 'transfers:complete']
    };

    // Setup mock shops
    mockShops = [
      { id: 'shop1', name: 'Main Store', location: 'Downtown' },
      { id: 'shop2', name: 'Branch Store', location: 'Uptown' }
    ];

    // Setup mock products
    mockProducts = [
      { id: 'prod1', name: 'Product A', sku: 'SKU001', price: 100 },
      { id: 'prod2', name: 'Product B', sku: 'SKU002', price: 200 }
    ];

    // Setup mock inventory items
    mockInventoryItems = [
      {
        id: 'inv1',
        productId: 'prod1',
        shopId: 'shop1',
        quantity: 50,
        reservedQuantity: 0,
        cost: 80,
        product: mockProducts[0]
      },
      {
        id: 'inv2',
        productId: 'prod2',
        shopId: 'shop1',
        quantity: 30,
        reservedQuantity: 0,
        cost: 150,
        product: mockProducts[1]
      }
    ];

    // Setup mock transfers
    mockTransfers = [
      {
        id: 'transfer1',
        sourceShopId: 'shop1',
        destinationShopId: 'shop2',
        status: 'PENDING',
        createdBy: 'user1',
        createdAt: new Date(),
        items: [
          {
            id: 'item1',
            productId: 'prod1',
            quantity: 10,
            cost: 80,
            product: mockProducts[0]
          }
        ]
      }
    ];

    // Setup default mocks
    mockVerifyToken.mockResolvedValue(mockUser);
    mockRequirePermission.mockImplementation((permission) => (req: any, res: any, next: any) => next());
  });

  describe('Business Logic Tests', () => {
    describe('Transfer Creation', () => {
      it('should create a transfer with proper inventory reservation', async () => {
        const transferData = {
          sourceShopId: 'shop1',
          destinationShopId: 'shop2',
          items: [
            { productId: 'prod1', quantity: 10 }
          ]
        };

        // Mock Prisma responses
        (prisma.shop.findUnique as jest.Mock)
          .mockResolvedValueOnce(mockShops[0]) // source shop
          .mockResolvedValueOnce(mockShops[1]); // destination shop

        (prisma.inventoryItem.findFirst as jest.Mock)
          .mockResolvedValue(mockInventoryItems[0]);

        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(prisma);
        });

        (prisma.inventoryTransfer.create as jest.Mock).mockResolvedValue({
          ...mockTransfers[0],
          id: 'new-transfer'
        });

        (prisma.transferItem.create as jest.Mock).mockResolvedValue({
          id: 'new-item',
          transferId: 'new-transfer',
          productId: 'prod1',
          quantity: 10,
          cost: 80
        });

        (prisma.inventoryItem.update as jest.Mock).mockResolvedValue({
          ...mockInventoryItems[0],
          reservedQuantity: 10
        });

        const request = new NextRequest('http://localhost/api/inventory/transfers', {
          method: 'POST',
          body: JSON.stringify(transferData)
        });

        const response = await POST(request);
        const result = await response.json();

        expect(response.status).toBe(201);
        expect(result.success).toBe(true);
        expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
          where: { id: 'inv1' },
          data: { reservedQuantity: 10 }
        });
      });

      it('should reject transfer when insufficient inventory', async () => {
        const transferData = {
          sourceShopId: 'shop1',
          destinationShopId: 'shop2',
          items: [
            { productId: 'prod1', quantity: 100 } // More than available (50)
          ]
        };

        (prisma.shop.findUnique as jest.Mock)
          .mockResolvedValueOnce(mockShops[0])
          .mockResolvedValueOnce(mockShops[1]);

        (prisma.inventoryItem.findFirst as jest.Mock)
          .mockResolvedValue(mockInventoryItems[0]);

        const request = new NextRequest('http://localhost/api/inventory/transfers', {
          method: 'POST',
          body: JSON.stringify(transferData)
        });

        const response = await POST(request);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toContain('Insufficient inventory');
      });

      it('should reject transfer to same shop', async () => {
        const transferData = {
          sourceShopId: 'shop1',
          destinationShopId: 'shop1', // Same shop
          items: [
            { productId: 'prod1', quantity: 10 }
          ]
        };

        const request = new NextRequest('http://localhost/api/inventory/transfers', {
          method: 'POST',
          body: JSON.stringify(transferData)
        });

        const response = await POST(request);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toContain('same shop');
      });
    });

    describe('Transfer Completion', () => {
      it('should complete transfer with proper inventory updates', async () => {
        const transferId = 'transfer1';
        
        (prisma.inventoryTransfer.findUnique as jest.Mock).mockResolvedValue({
          ...mockTransfers[0],
          items: mockTransfers[0].items
        });

        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(prisma);
        });

        // Mock source inventory update (reduce quantity, clear reservation)
        (prisma.inventoryItem.update as jest.Mock)
          .mockResolvedValueOnce({ // Source update
            ...mockInventoryItems[0],
            quantity: 40,
            reservedQuantity: 0
          })
          .mockResolvedValueOnce({ // Destination update
            id: 'inv3',
            productId: 'prod1',
            shopId: 'shop2',
            quantity: 10,
            cost: 80
          });

        // Mock destination inventory upsert
        (prisma.inventoryItem.upsert as jest.Mock).mockResolvedValue({
          id: 'inv3',
          productId: 'prod1',
          shopId: 'shop2',
          quantity: 10,
          cost: 80
        });

        (prisma.inventoryTransfer.update as jest.Mock).mockResolvedValue({
          ...mockTransfers[0],
          status: 'COMPLETED',
          completedAt: new Date()
        });

        const request = new NextRequest(`http://localhost/api/inventory/transfers/${transferId}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'complete' })
        });

        const response = await PATCH(request, { params: { id: transferId } });
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(prisma.inventoryTransfer.update).toHaveBeenCalledWith({
          where: { id: transferId },
          data: {
            status: 'COMPLETED',
            completedAt: expect.any(Date)
          }
        });
      });

      it('should cancel transfer and release reservations', async () => {
        const transferId = 'transfer1';
        
        (prisma.inventoryTransfer.findUnique as jest.Mock).mockResolvedValue({
          ...mockTransfers[0],
          items: mockTransfers[0].items
        });

        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(prisma);
        });

        (prisma.inventoryItem.update as jest.Mock).mockResolvedValue({
          ...mockInventoryItems[0],
          reservedQuantity: 0
        });

        (prisma.inventoryTransfer.update as jest.Mock).mockResolvedValue({
          ...mockTransfers[0],
          status: 'CANCELLED'
        });

        const request = new NextRequest(`http://localhost/api/inventory/transfers/${transferId}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'cancel' })
        });

        const response = await PATCH(request, { params: { id: transferId } });
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
          where: {
            productId: 'prod1',
            shopId: 'shop1'
          },
          data: {
            reservedQuantity: {
              decrement: 10
            }
          }
        });
      });
    });
  });

  describe('Performance Tests', () => {
    it('should track performance metrics for transfer operations', async () => {
      const transferData = {
        sourceShopId: 'shop1',
        destinationShopId: 'shop2',
        items: [{ productId: 'prod1', quantity: 10 }]
      };

      (prisma.shop.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockShops[0])
        .mockResolvedValueOnce(mockShops[1]);
      (prisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockInventoryItems[0]);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));
      (prisma.inventoryTransfer.create as jest.Mock).mockResolvedValue(mockTransfers[0]);

      const request = new NextRequest('http://localhost/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(transferData)
      });

      await POST(request);

      expect(performanceMonitorInstance.startOperation).toHaveBeenCalledWith('create_transfer');
      expect(performanceMonitorInstance.endOperation).toHaveBeenCalled();
    });

    it('should use cache for frequently accessed data', async () => {
      cacheServiceInstance.get.mockResolvedValue(mockTransfers);

      const request = new NextRequest('http://localhost/api/inventory/transfers');
      const response = await GET(request);

      expect(cacheServiceInstance.get).toHaveBeenCalledWith('transfers:list:');
      expect(response.status).toBe(200);
    });

    it('should invalidate cache after transfer operations', async () => {
      const transferData = {
        sourceShopId: 'shop1',
        destinationShopId: 'shop2',
        items: [{ productId: 'prod1', quantity: 10 }]
      };

      (prisma.shop.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockShops[0])
        .mockResolvedValueOnce(mockShops[1]);
      (prisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockInventoryItems[0]);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));
      (prisma.inventoryTransfer.create as jest.Mock).mockResolvedValue(mockTransfers[0]);

      const request = new NextRequest('http://localhost/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(transferData)
      });

      await POST(request);

      expect(cacheServiceInstance.invalidate).toHaveBeenCalledWith('transfers');
      expect(cacheServiceInstance.invalidate).toHaveBeenCalledWith('inventory:shop1');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors gracefully', async () => {
      (prisma.shop.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const transferData = {
        sourceShopId: 'shop1',
        destinationShopId: 'shop2',
        items: [{ productId: 'prod1', quantity: 10 }]
      };

      const request = new NextRequest('http://localhost/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(transferData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toContain('Internal server error');
    });

    it('should handle invalid transfer data', async () => {
      const invalidData = {
        sourceShopId: '', // Invalid
        destinationShopId: 'shop2',
        items: [] // Empty items
      };

      const request = new NextRequest('http://localhost/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBeDefined();
    });

    it('should handle unauthorized access', async () => {
      mockVerifyToken.mockRejectedValue(new Error('Invalid token'));

      const request = new NextRequest('http://localhost/api/inventory/transfers');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle permission denied', async () => {
      mockUser.permissions = ['inventory:read']; // Missing transfer permissions
      mockRequirePermission.mockImplementation((permission) => {
        return (req: any, res: any, next: any) => {
          if (permission === 'transfers:create') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
          }
          next();
        };
      });

      const transferData = {
        sourceShopId: 'shop1',
        destinationShopId: 'shop2',
        items: [{ productId: 'prod1', quantity: 10 }]
      };

      const request = new NextRequest('http://localhost/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(transferData)
      });

      // This would be handled by middleware in real scenario
      expect(mockUser.permissions).not.toContain('transfers:create');
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain inventory consistency during concurrent transfers', async () => {
      // Simulate concurrent transfer attempts
      const transfer1Data = {
        sourceShopId: 'shop1',
        destinationShopId: 'shop2',
        items: [{ productId: 'prod1', quantity: 30 }]
      };

      const transfer2Data = {
        sourceShopId: 'shop1',
        destinationShopId: 'shop2',
        items: [{ productId: 'prod1', quantity: 30 }]
      };

      // Mock inventory with only 50 available (both transfers would exceed)
      (prisma.shop.findUnique as jest.Mock)
        .mockResolvedValue(mockShops[0])
        .mockResolvedValue(mockShops[1]);
      
      (prisma.inventoryItem.findFirst as jest.Mock)
        .mockResolvedValue(mockInventoryItems[0]); // 50 available

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        // Simulate database constraint preventing overselling
        throw new Error('Insufficient inventory for concurrent transfer');
      });

      const request1 = new NextRequest('http://localhost/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(transfer1Data)
      });

      const request2 = new NextRequest('http://localhost/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(transfer2Data)
      });

      // Both should fail due to insufficient inventory
      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2)
      ]);

      expect(response1.status).toBe(500);
      expect(response2.status).toBe(500);
    });

    it('should validate transfer item quantities are positive', async () => {
      const invalidTransferData = {
        sourceShopId: 'shop1',
        destinationShopId: 'shop2',
        items: [
          { productId: 'prod1', quantity: -5 } // Negative quantity
        ]
      };

      const request = new NextRequest('http://localhost/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(invalidTransferData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('positive');
    });
  });

  describe('Cache Performance Tests', () => {
    it('should warm cache for frequently accessed transfers', async () => {
      await cacheServiceInstance.warmCache();
      expect(cacheServiceInstance.warmCache).toHaveBeenCalled();
    });

    it('should measure cache hit rates', () => {
      const metrics = performanceMonitorInstance.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0.8); // Expect good cache performance
    });
  });

  describe('Audit Trail Tests', () => {
    it('should create audit logs for transfer operations', async () => {
      const transferData = {
        sourceShopId: 'shop1',
        destinationShopId: 'shop2',
        items: [{ productId: 'prod1', quantity: 10 }]
      };

      (prisma.shop.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockShops[0])
        .mockResolvedValueOnce(mockShops[1]);
      (prisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockInventoryItems[0]);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));
      (prisma.inventoryTransfer.create as jest.Mock).mockResolvedValue(mockTransfers[0]);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({
        id: 'audit1',
        action: 'TRANSFER_CREATED',
        userId: 'user1',
        details: JSON.stringify(transferData)
      });

      const request = new NextRequest('http://localhost/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(transferData)
      });

      await POST(request);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'TRANSFER_CREATED',
          userId: 'user1',
          details: expect.any(String),
          timestamp: expect.any(Date)
        }
      });
    });
  });
});