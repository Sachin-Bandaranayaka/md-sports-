// Fixed Database Connection Test Suite
// This file contains the corrected version of db.test.ts

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  supplier: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  customer: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  salesInvoice: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  purchaseInvoice: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  inventoryItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  }
};

// Mock the Prisma import
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Mock database configuration
jest.mock('@/lib/config/database', () => ({
  databaseConfig: {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
    dialect: 'postgresql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
}));

// Import after mocking
import prisma from '@/lib/prisma';
import { DatabaseService } from '@/services/databaseService';

describe('Database Connection Tests', () => {
  let databaseService: DatabaseService;

  beforeAll(() => {
    databaseService = new DatabaseService();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up any connections
    await databaseService.disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      // Arrange
      (mockPrisma.$connect as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await databaseService.connect();

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors gracefully', async () => {
      // Arrange
      const connectionError = new Error('Connection failed');
      (mockPrisma.$connect as jest.Mock).mockRejectedValue(connectionError);

      // Act & Assert
      await expect(databaseService.connect()).rejects.toThrow('Connection failed');
      expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
    });

    it('should disconnect from database successfully', async () => {
      // Arrange
      (mockPrisma.$disconnect as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await databaseService.disconnect();

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection errors gracefully', async () => {
      // Arrange
      const disconnectionError = new Error('Disconnection failed');
      (mockPrisma.$disconnect as jest.Mock).mockRejectedValue(disconnectionError);

      // Act & Assert
      await expect(databaseService.disconnect()).rejects.toThrow('Disconnection failed');
      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Database Health Check', () => {
    it('should perform health check successfully', async () => {
      // Arrange
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);

      // Act
      const result = await databaseService.healthCheck();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeDefined();
      expect(result.responseTime).toBeGreaterThan(0);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith`SELECT 1 as result`;
    });

    it('should detect unhealthy database', async () => {
      // Arrange
      const healthError = new Error('Database unavailable');
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(healthError);

      // Act
      const result = await databaseService.healthCheck();

      // Assert
      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Database unavailable');
      expect(result.responseTime).toBeDefined();
    });

    it('should measure response time accurately', async () => {
      // Arrange
      (mockPrisma.$queryRaw as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([{ result: 1 }]), 100))
      );

      // Act
      const result = await databaseService.healthCheck();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(100);
      expect(result.responseTime).toBeLessThan(200); // Allow some margin
    });
  });

  describe('Database Transactions', () => {
    it('should execute transaction successfully', async () => {
      // Arrange
      const mockTransactionResult = { id: 1, name: 'Test' };
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue(mockTransactionResult);

      const transactionCallback = jest.fn().mockResolvedValue(mockTransactionResult);

      // Act
      const result = await databaseService.executeTransaction(transactionCallback);

      // Assert
      expect(result).toEqual(mockTransactionResult);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(transactionCallback);
    });

    it('should handle transaction rollback on error', async () => {
      // Arrange
      const transactionError = new Error('Transaction failed');
      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(transactionError);

      const transactionCallback = jest.fn();

      // Act & Assert
      await expect(
        databaseService.executeTransaction(transactionCallback)
      ).rejects.toThrow('Transaction failed');
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle nested transactions', async () => {
      // Arrange
      const nestedResult = { nested: true };
      (mockPrisma.$transaction as jest.Mock)
        .mockResolvedValueOnce({ outer: true })
        .mockResolvedValueOnce(nestedResult);

      const nestedCallback = jest.fn().mockResolvedValue(nestedResult);
      const outerCallback = jest.fn().mockImplementation(async () => {
        return await databaseService.executeTransaction(nestedCallback);
      });

      // Act
      const result = await databaseService.executeTransaction(outerCallback);

      // Assert
      expect(result).toEqual(nestedResult);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('Database Queries', () => {
    it('should execute raw SQL query successfully', async () => {
      // Arrange
      const mockQueryResult = [{ count: 5 }];
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockQueryResult);

      // Act
      const result = await databaseService.executeRawQuery('SELECT COUNT(*) as count FROM users');

      // Assert
      expect(result).toEqual(mockQueryResult);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should execute raw SQL with parameters', async () => {
      // Arrange
      const mockQueryResult = [{ id: 1, name: 'John' }];
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockQueryResult);

      // Act
      const result = await databaseService.executeRawQuery(
        'SELECT * FROM users WHERE id = $1',
        [1]
      );

      // Assert
      expect(result).toEqual(mockQueryResult);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should handle query errors gracefully', async () => {
      // Arrange
      const queryError = new Error('Invalid SQL syntax');
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(queryError);

      // Act & Assert
      await expect(
        databaseService.executeRawQuery('INVALID SQL')
      ).rejects.toThrow('Invalid SQL syntax');
    });

    it('should execute raw SQL commands successfully', async () => {
      // Arrange
      const mockExecuteResult = 3; // Number of affected rows
      (mockPrisma.$executeRaw as jest.Mock).mockResolvedValue(mockExecuteResult);

      // Act
      const result = await databaseService.executeRawCommand(
        'UPDATE users SET last_login = NOW() WHERE active = true'
      );

      // Assert
      expect(result).toBe(mockExecuteResult);
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('Database Schema Operations', () => {
    it('should check if table exists', async () => {
      // Arrange
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ exists: true }]);

      // Act
      const result = await databaseService.tableExists('users');

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('information_schema.tables')
      );
    });

    it('should return false for non-existent table', async () => {
      // Arrange
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await databaseService.tableExists('non_existent_table');

      // Assert
      expect(result).toBe(false);
    });

    it('should get table schema information', async () => {
      // Arrange
      const mockSchemaInfo = [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'name', data_type: 'character varying', is_nullable: 'YES' },
        { column_name: 'email', data_type: 'character varying', is_nullable: 'NO' }
      ];
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockSchemaInfo);

      // Act
      const result = await databaseService.getTableSchema('users');

      // Assert
      expect(result).toEqual(mockSchemaInfo);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('information_schema.columns')
      );
    });

    it('should get database statistics', async () => {
      // Arrange
      const mockStats = {
        totalTables: 10,
        totalRecords: 1000,
        databaseSize: '50MB'
      };
      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ count: 10 }]) // table count
        .mockResolvedValueOnce([{ total: 1000 }]) // record count
        .mockResolvedValueOnce([{ size: '50MB' }]); // database size

      // Act
      const result = await databaseService.getDatabaseStatistics();

      // Assert
      expect(result.totalTables).toBe(10);
      expect(result.totalRecords).toBe(1000);
      expect(result.databaseSize).toBe('50MB');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
    });
  });

  describe('Database Performance', () => {
    it('should measure query performance', async () => {
      // Arrange
      const mockResult = [{ id: 1 }];
      (mockPrisma.$queryRaw as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResult), 50))
      );

      // Act
      const result = await databaseService.measureQueryPerformance(
        'SELECT * FROM users LIMIT 1'
      );

      // Assert
      expect(result.data).toEqual(mockResult);
      expect(result.executionTime).toBeGreaterThanOrEqual(50);
      expect(result.executionTime).toBeLessThan(100);
    });

    it('should identify slow queries', async () => {
      // Arrange
      (mockPrisma.$queryRaw as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 1500))
      );

      // Act
      const result = await databaseService.measureQueryPerformance(
        'SELECT * FROM large_table',
        1000 // 1 second threshold
      );

      // Assert
      expect(result.isSlow).toBe(true);
      expect(result.executionTime).toBeGreaterThan(1000);
    });

    it('should optimize query execution plan', async () => {
      // Arrange
      const mockExplainResult = [
        {
          'QUERY PLAN': 'Seq Scan on users  (cost=0.00..15.00 rows=500 width=32)'
        }
      ];
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockExplainResult);

      // Act
      const result = await databaseService.explainQuery('SELECT * FROM users');

      // Assert
      expect(result).toEqual(mockExplainResult);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('EXPLAIN')
      );
    });
  });

  describe('Database Backup and Recovery', () => {
    it('should create database backup metadata', async () => {
      // Arrange
      const mockBackupInfo = {
        id: 'backup_123',
        timestamp: new Date(),
        size: '100MB',
        tables: ['users', 'products', 'orders']
      };

      // Act
      const result = await databaseService.createBackupMetadata();

      // Assert
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.tables).toBeInstanceOf(Array);
    });

    it('should validate backup integrity', async () => {
      // Arrange
      const backupId = 'backup_123';
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ checksum: 'valid' }]);

      // Act
      const result = await databaseService.validateBackupIntegrity(backupId);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.checksum).toBe('valid');
    });

    it('should detect corrupted backup', async () => {
      // Arrange
      const backupId = 'backup_corrupted';
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Checksum mismatch'));

      // Act
      const result = await databaseService.validateBackupIntegrity(backupId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Checksum mismatch');
    });
  });

  describe('Database Connection Pool', () => {
    it('should manage connection pool effectively', async () => {
      // Arrange
      const mockPoolStats = {
        total: 10,
        idle: 5,
        active: 3,
        waiting: 2
      };

      // Act
      const result = await databaseService.getConnectionPoolStats();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.total).toBe('number');
      expect(typeof result.idle).toBe('number');
      expect(typeof result.active).toBe('number');
    });

    it('should handle connection pool exhaustion', async () => {
      // Arrange
      const poolError = new Error('Connection pool exhausted');
      (mockPrisma.$connect as jest.Mock).mockRejectedValue(poolError);

      // Act & Assert
      await expect(databaseService.connect()).rejects.toThrow('Connection pool exhausted');
    });

    it('should recover from connection pool issues', async () => {
      // Arrange
      (mockPrisma.$connect as jest.Mock)
        .mockRejectedValueOnce(new Error('Pool exhausted'))
        .mockResolvedValueOnce(undefined);

      // Act
      const result = await databaseService.connectWithRetry(2);

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.$connect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Database Migration Support', () => {
    it('should check migration status', async () => {
      // Arrange
      const mockMigrations = [
        { name: '001_initial', applied_at: new Date() },
        { name: '002_add_users', applied_at: new Date() }
      ];
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockMigrations);

      // Act
      const result = await databaseService.getMigrationStatus();

      // Assert
      expect(result).toEqual(mockMigrations);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('_prisma_migrations')
      );
    });

    it('should detect pending migrations', async () => {
      // Arrange
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await databaseService.hasPendingMigrations();

      // Assert
      expect(typeof result).toBe('boolean');
    });

    it('should validate schema consistency', async () => {
      // Arrange
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ consistent: true }]);

      // Act
      const result = await databaseService.validateSchemaConsistency();

      // Assert
      expect(result.isConsistent).toBe(true);
    });
  });
});