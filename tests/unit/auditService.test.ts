import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuditService, AuditLogEntry, RecycleBinItem } from '@/services/auditService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('AuditService', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = AuditService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = AuditService.getInstance();
      const instance2 = AuditService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('logAction', () => {
    it('should successfully log an audit entry', async () => {
      const entry: AuditLogEntry = {
        userId: 1,
        action: 'CREATE',
        entity: 'Product',
        entityId: 123,
        details: { name: 'Test Product' },
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 1, ...entry });

      await auditService.logAction(entry);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          action: 'CREATE',
          entity: 'Product',
          entityId: 123,
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

    it('should handle errors gracefully without throwing', async () => {
      const entry: AuditLogEntry = {
        userId: 1,
        action: 'CREATE',
        entity: 'Product',
        entityId: 123,
      };

      mockPrisma.auditLog.create.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(auditService.logAction(entry)).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to log audit entry:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should log soft delete with all required fields', async () => {
      const entry: AuditLogEntry = {
        userId: 1,
        action: 'DELETE',
        entity: 'Product',
        entityId: 123,
        originalData: { name: 'Test Product', price: 100 },
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: 1,
        canRecover: true,
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 1, ...entry });

      await auditService.logAction(entry);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          action: 'DELETE',
          entity: 'Product',
          entityId: 123,
          details: expect.objectContaining({
            originalData: { name: 'Test Product', price: 100 },
            isDeleted: true,
            deletedBy: 1,
            canRecover: true,
          }),
        },
      });
    });
  });

  describe('softDelete', () => {
    it('should log a soft delete action', async () => {
      const originalData = { name: 'Test Product', price: 100 };
      mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });

      await auditService.softDelete('Product', 123, originalData, 1, true);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          action: 'DELETE',
          entity: 'Product',
          entityId: 123,
          details: expect.objectContaining({
            originalData,
            isDeleted: true,
            deletedBy: 1,
            canRecover: true,
            deletedAt: expect.any(Date),
          }),
        },
      });
    });

    it('should default canRecover to true', async () => {
      const originalData = { name: 'Test Product' };
      mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });

      await auditService.softDelete('Product', 123, originalData, 1);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          details: expect.objectContaining({
            canRecover: true,
          }),
        }),
      });
    });
  });

  describe('getDeletedEntityIds', () => {
    it('should return array of deleted entity IDs', async () => {
      const mockAuditLogs = [
        { entityId: 1, details: { isDeleted: true } },
        { entityId: 2, details: { isDeleted: true } },
        { entityId: 3, details: { isDeleted: true } },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await auditService.getDeletedEntityIds('Product');

      expect(result).toEqual([1, 2, 3]);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entity: 'Product',
          action: 'DELETE',
          details: {
            path: ['isDeleted'],
            equals: true,
          },
        },
        select: {
          entityId: true,
        },
      });
    });

    it('should return empty array when no deleted entities found', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const result = await auditService.getDeletedEntityIds('Product');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockPrisma.auditLog.findMany.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await auditService.getDeletedEntityIds('Product');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching deleted entity IDs:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getRecycleBinItems', () => {
    it('should return paginated recycle bin items with user information', async () => {
      const mockAuditLogs = [
        {
          id: 1,
          entity: 'Product',
          entityId: 123,
          details: {
            originalData: { name: 'Test Product' },
            deletedAt: new Date('2023-01-01'),
            deletedBy: 1,
            canRecover: true,
          },
        },
      ];

      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      };

      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);
      mockPrisma.auditLog.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await auditService.getRecycleBinItems(1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0]).toEqual({
        id: 1,
        entity: 'Product',
        entityId: 123,
        originalData: { name: 'Test Product' },
        deletedAt: new Date('2023-01-01'),
        deletedBy: 1,
        deletedByUser: mockUser,
        canRecover: true,
      });
    });

    it('should handle pagination correctly', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await auditService.getRecycleBinItems(2, 5);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          action: 'DELETE',
          details: {
            path: ['isDeleted'],
            equals: true,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 5, // (page - 1) * limit = (2 - 1) * 5
        take: 5,
      });
    });

    it('should handle missing user information gracefully', async () => {
      const mockAuditLogs = [
        {
          id: 1,
          entity: 'Product',
          entityId: 123,
          details: {
            originalData: { name: 'Test Product' },
            deletedAt: new Date('2023-01-01'),
            deletedBy: 999, // Non-existent user
            canRecover: true,
          },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);
      mockPrisma.auditLog.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await auditService.getRecycleBinItems(1, 10);

      expect(result.items[0].deletedByUser).toBeUndefined();
    });
  });

  describe('recoverEntity', () => {
    it('should log recovery action for an entity', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });

      await auditService.recoverEntity('Product', 123, 1);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          action: 'RECOVER',
          entity: 'Product',
          entityId: 123,
          details: expect.objectContaining({
            recoveredAt: expect.any(Date),
            recoveredBy: 1,
          }),
        },
      });
    });
  });

  describe.skip('getAuditHistory', () => {
    it('should return audit history for an entity', async () => {
      const mockAuditLogs = [
        {
          id: 1,
          action: 'CREATE',
          userId: 1,
          createdAt: new Date('2023-01-01'),
          details: { name: 'Test Product' },
        },
        {
          id: 2,
          action: 'UPDATE',
          userId: 1,
          createdAt: new Date('2023-01-02'),
          details: { name: 'Updated Product' },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await auditService.getAuditHistory('Product', 123);

      expect(result).toEqual(mockAuditLogs);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entity: 'Product',
          entityId: 123,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.auditLog.findMany.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await auditService.getAuditHistory('Product', 123);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching audit history:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});