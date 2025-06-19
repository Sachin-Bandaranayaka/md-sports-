// Mock Prisma before imports
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shop: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  
  return {
    __esModule: true,
    default: mockPrisma,
    prisma: mockPrisma,
  };
});

import { db, prisma } from '@/lib/db';
import mockPrismaClient from '@/lib/prisma';

const mockPrisma = mockPrismaClient as jest.Mocked<typeof mockPrismaClient>;

describe('Database Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('db export', () => {
    it('should export db as the prisma client', () => {
      expect(db).toBeDefined();
      expect(db).toBe(mockPrismaClient);
    });

    it('should have user methods', () => {
      expect(db.user).toBeDefined();
      expect(db.user.findMany).toBeDefined();
      expect(db.user.findUnique).toBeDefined();
      expect(db.user.create).toBeDefined();
      expect(db.user.update).toBeDefined();
      expect(db.user.delete).toBeDefined();
    });

    it('should have shop methods', () => {
      expect(db.shop).toBeDefined();
      expect(db.shop.findMany).toBeDefined();
      expect(db.shop.findUnique).toBeDefined();
      expect(db.shop.create).toBeDefined();
      expect(db.shop.update).toBeDefined();
      expect(db.shop.delete).toBeDefined();
    });

    it('should have connection methods', () => {
      expect(db.$connect).toBeDefined();
      expect(db.$disconnect).toBeDefined();
      expect(db.$transaction).toBeDefined();
    });
  });

  describe('prisma export', () => {
    it('should export prisma as the same client', () => {
      expect(prisma).toBeDefined();
      expect(prisma).toBe(mockPrismaClient);
      expect(prisma).toBe(db);
    });
  });

  describe('database operations', () => {
    it('should allow user queries', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await db.user.findUnique({ where: { id: 1 } });
      
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should allow shop queries', async () => {
      const mockShop = { id: 'shop1', name: 'Test Shop' };
      mockPrisma.shop.findUnique.mockResolvedValue(mockShop);

      const result = await db.shop.findUnique({ where: { id: 'shop1' } });
      
      expect(result).toEqual(mockShop);
      expect(mockPrisma.shop.findUnique).toHaveBeenCalledWith({ where: { id: 'shop1' } });
    });

    it('should allow transactions', async () => {
      const mockResult = { success: true };
      mockPrisma.$transaction.mockResolvedValue(mockResult);

      const transactionFn = jest.fn().mockResolvedValue(mockResult);
      const result = await db.$transaction(transactionFn);
      
      expect(result).toEqual(mockResult);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(transactionFn);
    });

    it('should handle connection operations', async () => {
      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.$disconnect.mockResolvedValue(undefined);

      await db.$connect();
      await db.$disconnect();
      
      expect(mockPrisma.$connect).toHaveBeenCalled();
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.user.findUnique.mockRejectedValue(dbError);

      await expect(db.user.findUnique({ where: { id: 1 } })).rejects.toThrow('Database connection failed');
    });

    it('should propagate transaction errors', async () => {
      const transactionError = new Error('Transaction failed');
      mockPrisma.$transaction.mockRejectedValue(transactionError);

      const transactionFn = jest.fn();
      await expect(db.$transaction(transactionFn)).rejects.toThrow('Transaction failed');
    });
  });
});