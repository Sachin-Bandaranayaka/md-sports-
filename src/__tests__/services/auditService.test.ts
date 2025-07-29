import { AuditService } from '@/services/auditService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    product: {
      create: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('AuditService', () => {
  let auditService: AuditService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    auditService = AuditService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getRecycleBinItems', () => {
    const mockAuditLogItems = [
      {
        id: 1,
        entity: 'product',
        entityId: 123,
        action: 'DELETE',
        userId: 'user1',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        details: {
          isDeleted: true,
          canRecover: true,
          deletedAt: '2024-01-15T10:00:00Z',
          deletedBy: 'user1',
          originalData: { name: 'Test Product', price: 100 },
        },
      },
      {
        id: 2,
        entity: 'customer',
        entityId: 456,
        action: 'DELETE',
        userId: 'user2',
        createdAt: new Date('2024-01-16T11:00:00Z'),
        details: {
          isDeleted: true,
          canRecover: true,
          deletedAt: '2024-01-16T11:00:00Z',
          deletedBy: 'user2',
          originalData: { name: 'Test Customer', email: 'test@example.com' },
        },
      },
    ];

    const mockUsers = [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
    ];

    beforeEach(() => {
      (mockPrisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockAuditLogItems);
      (mockPrisma.auditLog.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
    });

    it('should return all recycle bin items without filters', async () => {
      const result = await auditService.getRecycleBinItems();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.items[0].entity).toBe('product');
      expect(result.items[1].entity).toBe('customer');
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { action: 'DELETE' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by entity type', async () => {
      const result = await auditService.getRecycleBinItems('product');

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { action: 'DELETE', entity: 'product' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by date range', async () => {
      const dateFrom = '2024-01-15T00:00:00Z';
      const dateTo = '2024-01-15T23:59:59Z';
      
      await auditService.getRecycleBinItems(undefined, 50, 0, dateFrom, dateTo);

      const expectedEndDate = new Date(dateTo);
      expectedEndDate.setDate(expectedEndDate.getDate() + 1);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          action: 'DELETE',
          createdAt: {
            gte: new Date(dateFrom),
            lt: expectedEndDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by entity and date range combined', async () => {
      const dateFrom = '2024-01-15T00:00:00Z';
      const dateTo = '2024-01-16T23:59:59Z';
      
      await auditService.getRecycleBinItems('product', 20, 10, dateFrom, dateTo);

      const expectedEndDate = new Date(dateTo);
      expectedEndDate.setDate(expectedEndDate.getDate() + 1);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          action: 'DELETE',
          entity: 'product',
          createdAt: {
            gte: new Date(dateFrom),
            lt: expectedEndDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 10,
      });
    });

    it('should include user details for deleted items', async () => {
      const result = await auditService.getRecycleBinItems();

      expect(result.items[0].deletedByUser).toEqual({
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(result.items[1].deletedByUser).toEqual({
        id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
      });
    });
  });

  describe('getAuditEntries', () => {
    const mockAuditEntries = [
      {
        id: 1,
        entity: 'product',
        entityId: 123,
        action: 'CREATE',
        userId: 'user1',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        details: { name: 'Test Product' },
      },
      {
        id: 2,
        entity: 'customer',
        entityId: 456,
        action: 'UPDATE',
        userId: 'user2',
        createdAt: new Date('2024-01-16T11:00:00Z'),
        details: { name: 'Updated Customer' },
      },
    ];

    beforeEach(() => {
      (mockPrisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockAuditEntries);
      (mockPrisma.auditLog.count as jest.Mock).mockResolvedValue(2);
    });

    it('should return all audit entries without filters', async () => {
      const result = await auditService.getAuditEntries();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
    });

    it('should filter by entity type', async () => {
      await auditService.getAuditEntries('product');

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { entity: 'product' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
    });

    it('should filter by date range', async () => {
      const dateFrom = '2024-01-15T00:00:00Z';
      const dateTo = '2024-01-15T23:59:59Z';
      
      await auditService.getAuditEntries(undefined, 50, 0, dateFrom, dateTo);

      const expectedEndDate = new Date(dateTo);
      expectedEndDate.setDate(expectedEndDate.getDate() + 1);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date(dateFrom),
            lt: expectedEndDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
    });

    it('should filter by entity and date range combined', async () => {
      const dateFrom = '2024-01-15T00:00:00Z';
      const dateTo = '2024-01-16T23:59:59Z';
      
      await auditService.getAuditEntries('customer', 20, 10, dateFrom, dateTo);

      const expectedEndDate = new Date(dateTo);
      expectedEndDate.setDate(expectedEndDate.getDate() + 1);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entity: 'customer',
          createdAt: {
            gte: new Date(dateFrom),
            lt: expectedEndDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 20,
      });
    });
  });

  describe('getEntityHistory', () => {
    const mockEntityHistory = [
      {
        id: 1,
        entity: 'product',
        entityId: 123,
        action: 'CREATE',
        userId: 'user1',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        details: { name: 'Test Product' },
      },
      {
        id: 2,
        entity: 'product',
        entityId: 123,
        action: 'UPDATE',
        userId: 'user2',
        createdAt: new Date('2024-01-16T11:00:00Z'),
        details: { name: 'Updated Product' },
      },
    ];

    beforeEach(() => {
      (mockPrisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockEntityHistory);
    });

    it('should return entity history without date filters', async () => {
      const result = await auditService.getEntityHistory('product', 123);

      expect(result).toHaveLength(2);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entity: 'product',
          entityId: 123,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          deletedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recoveredByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });

    it('should filter entity history by date range', async () => {
      const dateFrom = '2024-01-15T00:00:00Z';
      const dateTo = '2024-01-16T23:59:59Z';
      
      await auditService.getEntityHistory('product', 123, 10, dateFrom, dateTo);

      const expectedEndDate = new Date(dateTo);
      expectedEndDate.setDate(expectedEndDate.getDate() + 1);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entity: 'product',
          entityId: 123,
          createdAt: {
            gte: new Date(dateFrom),
            lt: expectedEndDate,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          deletedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recoveredByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });
});