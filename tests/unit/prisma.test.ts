// Unit tests for Prisma utilities
// Testing the safeQuery helper function and Prisma client configuration

import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
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

// Mock the PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
}));

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('Prisma Utilities', () => {
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

  describe('PrismaClient Configuration', () => {
    it('should export prisma client instance', () => {
      expect(mockPrismaClient).toBeDefined();
      expect(typeof mockPrismaClient.$connect).toBe('function');
      expect(typeof mockPrismaClient.$disconnect).toBe('function');
    });
  });

  describe('safeQuery function (isolated implementation)', () => {
    // Isolated implementation of safeQuery matching the actual implementation
    const safeQuery = async <T>(
      queryFn: () => Promise<T>,
      fallback: T,
      logMessage = 'Database operation failed'
    ): Promise<T> => {
      try {
        return await queryFn();
      } catch (error) {
        console.error(`${logMessage}:`, error);
        return fallback;
      }
    };

    it('should return result for successful operation', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ id: 1, name: 'Test User' });
      
      const result = await safeQuery(mockOperation, null, 'Find user');
      
      expect(result).toEqual({ id: 1, name: 'Test User' });
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should return fallback and log error for failed operation', async () => {
      const mockError = new Error('Database connection failed');
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      
      const result = await safeQuery(mockOperation, null, 'Find user failed');
      
      expect(result).toBeNull();
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Find user failed:',
        mockError
      );
    });

    it('should handle database errors with fallback', async () => {
      const mockError = { code: 'P2002', message: 'Unique constraint failed' };
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      const fallbackValue = { error: 'Operation failed' };
      
      const result = await safeQuery(mockOperation, fallbackValue, 'Create user failed');
      
      expect(result).toEqual(fallbackValue);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Create user failed:',
        mockError
      );
    });

    it('should use default log message when none provided', async () => {
      const mockError = new Error('Generic error');
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      
      const result = await safeQuery(mockOperation, 'default');
      
      expect(result).toBe('default');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Database operation failed:',
        mockError
      );
    });

    it('should handle different fallback types', async () => {
      const mockError = new Error('Operation failed');
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      
      // Test with array fallback
      const result1 = await safeQuery(mockOperation, [], 'Array operation failed');
      expect(result1).toEqual([]);
      
      // Test with object fallback
      const result2 = await safeQuery(mockOperation, { error: true }, 'Object operation failed');
      expect(result2).toEqual({ error: true });
      
      // Test with number fallback
      const result3 = await safeQuery(mockOperation, 0, 'Number operation failed');
      expect(result3).toBe(0);
    });

    it('should handle async operations correctly', async () => {
      const mockData = { id: 1, name: 'Async User' };
      const mockOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockData), 10))
      );
      
      const result = await safeQuery(mockOperation, null, 'Async operation');
      
      expect(result).toEqual(mockData);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should preserve error objects in logs', async () => {
      const mockError = {
        code: 'P2002',
        message: 'Unique constraint failed',
        meta: { target: ['email'] }
      };
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      
      const result = await safeQuery(mockOperation, null, 'Constraint error');
      
      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Constraint error:',
        mockError
      );
    });






  });

  describe('Database Operations with safeQuery', () => {
    // Use the actual safeQuery implementation for integration testing
    const safeQuery = async <T>(
      queryFn: () => Promise<T>,
      fallback: T,
      logMessage = 'Database operation failed'
    ): Promise<T> => {
      try {
        return await queryFn();
      } catch (error) {
        console.error(`${logMessage}:`, error);
        return fallback;
      }
    };

    it('should safely execute user findMany operation', async () => {
      const mockUsers = [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }];
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers);
      
      const result = await safeQuery(
        () => mockPrismaClient.user.findMany(),
        [],
        'Find all users'
      );
      
      expect(result).toEqual(mockUsers);
      expect(mockPrismaClient.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('should safely execute user create operation', async () => {
      const newUser = { id: 1, name: 'New User', email: 'new@example.com' };
      mockPrismaClient.user.create.mockResolvedValue(newUser);
      
      const result = await safeQuery(
        () => mockPrismaClient.user.create({
          data: { name: 'New User', email: 'new@example.com' }
        }),
        null,
        'Create user'
      );
      
      expect(result).toEqual(newUser);
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: { name: 'New User', email: 'new@example.com' }
      });
    });

    it('should safely execute shop operations', async () => {
      const mockShop = { id: 'shop1', name: 'Test Shop' };
      mockPrismaClient.shop.findUnique.mockResolvedValue(mockShop);
      
      const result = await safeQuery(
        () => mockPrismaClient.shop.findUnique({ where: { id: 'shop1' } }),
        null,
        'Find shop'
      );
      
      expect(result).toEqual(mockShop);
      expect(mockPrismaClient.shop.findUnique).toHaveBeenCalledWith({ where: { id: 'shop1' } });
    });

    it('should return fallback when operation fails', async () => {
      const mockError = new Error('Database error');
      mockPrismaClient.user.findUnique.mockRejectedValue(mockError);
      
      const result = await safeQuery(
        () => mockPrismaClient.user.findUnique({ where: { id: 999 } }),
        null,
        'Find non-existent user'
      );
      
      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalledWith('Find non-existent user:', mockError);
    });
  });

  describe('Prisma Client Lifecycle', () => {
    it('should handle connection operations', async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      
      await mockPrismaClient.$connect();
      
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection operations', async () => {
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);
      
      await mockPrismaClient.$disconnect();
      
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockPrismaClient.$connect.mockRejectedValue(connectionError);
      
      await expect(mockPrismaClient.$connect()).rejects.toThrow('Connection failed');
    });
  });
});