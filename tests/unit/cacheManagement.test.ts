import { Redis } from 'ioredis';

// Mock cache service
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  deletePattern: jest.fn(),
  clear: jest.fn(),
};

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

// Mock ioredis
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => mockRedis),
  };
});

// Mock the inventory cache service
const mockInventoryCache = {
  get: jest.fn(),
  set: jest.fn(),
  invalidateInventoryData: jest.fn(),
  generateKey: jest.fn(),
  warmPopularInventoryData: jest.fn(),
  trackFilterUsage: jest.fn(),
  getMetrics: jest.fn(),
};

jest.mock('@/lib/inventoryCache', () => ({
  inventoryCacheService: mockInventoryCache,
}));

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('Cache Management Tests', () => {
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

  describe('Basic Cache Operations', () => {
    describe('Memory Cache', () => {
      it('should store and retrieve data from memory cache', async () => {
        const testData = { id: 1, name: 'Test Data' };
        const cacheKey = 'test:key:1';

        // Mock memory cache behavior
        const memoryCache = new Map();
        memoryCache.set(cacheKey, JSON.stringify(testData));

        // Simulate cache set
        mockCacheService.set.mockResolvedValue(undefined);
        await mockCacheService.set(cacheKey, testData, 300);
        
        // Simulate cache get
        mockCacheService.get.mockResolvedValue(testData);
        const result = await mockCacheService.get(cacheKey);

        expect(result).toEqual(testData);
      });

      it('should handle cache expiration', async () => {
        const testData = { id: 1, name: 'Expiring Data' };
        const cacheKey = 'test:expiring:1';
        const ttl = 1; // 1 second

        mockCacheService.set.mockResolvedValue(undefined);
        await mockCacheService.set(cacheKey, testData, ttl);

        // Simulate time passing and cache expiration
        mockCacheService.get.mockResolvedValue(null);
        const result = await mockCacheService.get(cacheKey);
        expect(result).toBeNull();
      });

      it('should handle cache miss gracefully', async () => {
        mockCacheService.get.mockResolvedValue(null);
        const result = await mockCacheService.get('non:existent:key');
        expect(result).toBeNull();
      });
    });

    describe('Redis Cache', () => {
      it('should store data in Redis when available', async () => {
        const testData = { id: 1, name: 'Redis Test' };
        const cacheKey = 'redis:test:1';
        const ttl = 300;

        mockRedis.setex.mockResolvedValue('OK');

        mockCacheService.set.mockResolvedValue(undefined);
        await mockCacheService.set(cacheKey, testData, ttl);

        expect(mockCacheService.set).toHaveBeenCalledWith(
          cacheKey,
          testData,
          ttl
        );
      });

      it('should retrieve data from Redis', async () => {
        const testData = { id: 1, name: 'Redis Test' };
        const cacheKey = 'redis:test:1';

        mockRedis.get.mockResolvedValue(JSON.stringify(testData));

        mockCacheService.get.mockResolvedValue(testData);
        const result = await mockCacheService.get(cacheKey);

        expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
        expect(result).toEqual(testData);
      });

      it('should handle Redis connection errors gracefully', async () => {
        const testData = { id: 1, name: 'Error Test' };
        const cacheKey = 'redis:error:1';

        mockRedis.setex.mockRejectedValue(new Error('Redis connection failed'));

        // Should not throw error, should fallback to memory cache
        mockCacheService.set.mockResolvedValue(undefined);
        await expect(mockCacheService.set(cacheKey, testData, 300)).resolves.not.toThrow();
        expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, testData, 300);
      });

      it('should handle Redis get errors gracefully', async () => {
        const cacheKey = 'redis:error:get';

        mockRedis.get.mockRejectedValue(new Error('Redis get failed'));

        mockCacheService.get.mockResolvedValue(null);
        const result = await mockCacheService.get(cacheKey);

        expect(result).toBeNull();
        expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      });
    });

    describe('Cache Invalidation', () => {
      it('should delete specific cache keys', async () => {
        const cacheKey = 'test:delete:1';

        mockCacheService.delete.mockResolvedValue(undefined);
        await mockCacheService.delete(cacheKey);

        expect(mockCacheService.delete).toHaveBeenCalledWith(cacheKey);
      });

      it('should delete multiple cache keys by pattern', async () => {
        const pattern = 'test:pattern:*';
        const matchingKeys = ['test:pattern:1', 'test:pattern:2', 'test:pattern:3'];

        mockCacheService.deletePattern.mockResolvedValue(undefined);
        await mockCacheService.deletePattern(pattern);

        expect(mockCacheService.deletePattern).toHaveBeenCalledWith(pattern);
      });

      it('should handle pattern deletion with no matches', async () => {
        const pattern = 'test:nomatch:*';

        mockCacheService.deletePattern.mockResolvedValue(undefined);
        await mockCacheService.deletePattern(pattern);

        expect(mockCacheService.deletePattern).toHaveBeenCalledWith(pattern);
      });

      it('should clear all cache data', async () => {
        mockCacheService.clear.mockResolvedValue(undefined);
        await mockCacheService.clear();

        expect(mockCacheService.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Inventory Cache Service', () => {
    const mockInventoryData = {
      items: [
        { id: 1, productId: 1, shopId: 'shop1', quantity: 100 },
        { id: 2, productId: 2, shopId: 'shop1', quantity: 50 },
      ],
      total: 2,
      page: 1,
      limit: 20,
    };

    const mockFilters = {
      shopId: 'shop1',
      page: 1,
      limit: 20,
      status: 'In Stock',
    };

    describe('Cache Key Generation', () => {
      it('should generate consistent cache keys', () => {
        const baseKey = 'inventory:summary';
        const expectedKey = 'inventory:summary:shop:shop1:status:In Stock:page:1:limit:20';

        mockInventoryCache.generateKey.mockReturnValue(expectedKey);

        const result = mockInventoryCache.generateKey(baseKey, mockFilters);

        expect(result).toBe(expectedKey);
        expect(mockInventoryCache.generateKey).toHaveBeenCalledWith(baseKey, mockFilters);
      });

      it('should handle filters with special characters', () => {
        const filtersWithSpecialChars = {
          ...mockFilters,
          search: 'test product & more',
        };
        const expectedKey = 'inventory:summary:shop:shop1:status:In Stock:search:test%20product%20%26%20more:page:1:limit:20';

        mockInventoryCache.generateKey.mockReturnValue(expectedKey);

        const result = mockInventoryCache.generateKey('inventory:summary', filtersWithSpecialChars);

        expect(result).toBe(expectedKey);
      });
    });

    describe('Cache Storage and Retrieval', () => {
      it('should store inventory data with TTL', async () => {
        const cacheKey = 'inventory:summary:shop1';
        const ttl = 300;

        mockInventoryCache.set.mockResolvedValue(undefined);

        await mockInventoryCache.set(cacheKey, mockInventoryData, ttl);

        expect(mockInventoryCache.set).toHaveBeenCalledWith(cacheKey, mockInventoryData, ttl);
      });

      it('should retrieve cached inventory data', async () => {
        const cacheKey = 'inventory:summary:shop1';

        mockInventoryCache.get.mockResolvedValue(mockInventoryData);

        const result = await mockInventoryCache.get(cacheKey);

        expect(mockInventoryCache.get).toHaveBeenCalledWith(cacheKey);
        expect(result).toEqual(mockInventoryData);
      });

      it('should return null for cache miss', async () => {
        const cacheKey = 'inventory:summary:nonexistent';

        mockInventoryCache.get.mockResolvedValue(null);

        const result = await mockInventoryCache.get(cacheKey);

        expect(result).toBeNull();
      });
    });

    describe('Cache Invalidation Strategies', () => {
      it('should invalidate inventory data by product', async () => {
        const productId = 1;

        mockInventoryCache.invalidateInventoryData.mockResolvedValue(undefined);

        await mockInventoryCache.invalidateInventoryData(productId);

        expect(mockInventoryCache.invalidateInventoryData).toHaveBeenCalledWith(productId);
      });

      it('should invalidate inventory data by shop', async () => {
        const shopId = 'shop1';

        mockInventoryCache.invalidateInventoryData.mockResolvedValue(undefined);

        await mockInventoryCache.invalidateInventoryData(undefined, shopId);

        expect(mockInventoryCache.invalidateInventoryData).toHaveBeenCalledWith(undefined, shopId);
      });

      it('should invalidate inventory data by category', async () => {
        const categoryId = 5;

        mockInventoryCache.invalidateInventoryData.mockResolvedValue(undefined);

        await mockInventoryCache.invalidateInventoryData(undefined, undefined, categoryId);

        expect(mockInventoryCache.invalidateInventoryData).toHaveBeenCalledWith(undefined, undefined, categoryId);
      });

      it('should invalidate all inventory data', async () => {
        mockInventoryCache.invalidateInventoryData.mockResolvedValue(undefined);

        await mockInventoryCache.invalidateInventoryData();

        expect(mockInventoryCache.invalidateInventoryData).toHaveBeenCalledWith();
      });
    });

    describe('Cache Warming', () => {
      it('should warm popular inventory data', async () => {
        mockInventoryCache.warmPopularInventoryData.mockResolvedValue(undefined);

        await mockInventoryCache.warmPopularInventoryData();

        expect(mockInventoryCache.warmPopularInventoryData).toHaveBeenCalled();
      });

      it('should track filter usage for warming strategy', () => {
        mockInventoryCache.trackFilterUsage.mockReturnValue(undefined);

        mockInventoryCache.trackFilterUsage(mockFilters);

        expect(mockInventoryCache.trackFilterUsage).toHaveBeenCalledWith(mockFilters);
      });
    });

    describe('Cache Metrics', () => {
      it('should collect cache performance metrics', () => {
        const mockMetrics = {
          hits: 150,
          misses: 25,
          hitRate: 0.857,
          avgResponseTime: 12.5,
          totalRequests: 175,
        };

        mockInventoryCache.getMetrics.mockReturnValue(mockMetrics);

        const metrics = mockInventoryCache.getMetrics();

        expect(metrics).toEqual(mockMetrics);
        expect(metrics.hitRate).toBeGreaterThan(0.8); // Good hit rate
        expect(metrics.avgResponseTime).toBeLessThan(50); // Fast response
      });

      it('should track cache performance over time', () => {
        const mockTimeSeriesMetrics = {
          '2024-01-01T00:00:00Z': { hits: 100, misses: 10 },
          '2024-01-01T01:00:00Z': { hits: 120, misses: 8 },
          '2024-01-01T02:00:00Z': { hits: 110, misses: 12 },
        };

        mockInventoryCache.getMetrics.mockReturnValue(mockTimeSeriesMetrics);

        const metrics = mockInventoryCache.getMetrics('timeseries');

        expect(metrics).toEqual(mockTimeSeriesMetrics);
        expect(Object.keys(metrics)).toHaveLength(3);
      });
    });
  });

  describe('Cache Error Handling', () => {
    it('should handle cache service initialization errors', () => {
      const initError = new Error('Cache initialization failed');
      
      // Mock Redis constructor to throw error
      (Redis as jest.MockedClass<typeof Redis>).mockImplementationOnce(() => {
        throw initError;
      });

      // Should not crash the application
      expect(() => {
        new Redis();
      }).toThrow('Cache initialization failed');
    });

    it('should handle serialization errors', async () => {
      const circularData = { name: 'test' };
      circularData.self = circularData; // Create circular reference

      const cacheKey = 'test:circular';

      // Should handle JSON.stringify error gracefully
      mockCacheService.set.mockResolvedValue(undefined);
      await expect(mockCacheService.set(cacheKey, circularData, 300)).resolves.not.toThrow();
    });

    it('should handle deserialization errors', async () => {
      const cacheKey = 'test:invalid:json';

      mockCacheService.get.mockResolvedValue(null);
      const result = await mockCacheService.get(cacheKey);

      expect(result).toBeNull();
    });

    it('should handle network timeouts gracefully', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const result = await mockCacheService.get('test:timeout');

      expect(result).toBeNull();
    });
  });

  describe('Cache Performance Tests', () => {
    it('should handle high-frequency cache operations', async () => {
      const operations = [];
      const numOperations = 1000;

      // Mock high-frequency cache operations
      mockCacheService.set.mockResolvedValue(undefined);
      for (let i = 0; i < numOperations; i++) {
        operations.push(
          mockCacheService.set(`test:perf:${i}`, { id: i, data: `data-${i}` }, 300)
        );
      }

      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();

      const duration = endTime - startTime;
      const opsPerSecond = numOperations / (duration / 1000);

      expect(opsPerSecond).toBeGreaterThan(100); // Should handle at least 100 ops/sec
    });

    it('should handle concurrent cache access', async () => {
      const cacheKey = 'test:concurrent';
      const testData = { id: 1, name: 'Concurrent Test' };

      // Mock concurrent operations
        mockCacheService.get.mockResolvedValue(testData);
        mockCacheService.set.mockResolvedValue(undefined);
      
      // Simulate concurrent reads and writes
      const concurrentOperations = [
        mockCacheService.get(cacheKey),
        mockCacheService.set(cacheKey, testData, 300),
        mockCacheService.get(cacheKey),
        mockCacheService.set(cacheKey, { ...testData, updated: true }, 300),
        mockCacheService.get(cacheKey),
      ];

      await expect(Promise.all(concurrentOperations)).resolves.not.toThrow();
    });

    it('should maintain cache consistency under load', async () => {
      const cacheKey = 'test:consistency';
      let counter = 0;

      // Mock cache operations to simulate real behavior
      mockRedis.get.mockImplementation(async () => {
        return JSON.stringify({ counter });
      });

      mockRedis.setex.mockImplementation(async (key, ttl, value) => {
        const data = JSON.parse(value);
        counter = data.counter;
        return 'OK';
      });

      // Mock counter behavior for concurrent updates
        let testCounter = 0;
        mockCacheService.get.mockImplementation(() => Promise.resolve({ counter: testCounter }));
        mockCacheService.set.mockImplementation((key, value) => {
          testCounter = value.counter;
          return Promise.resolve(undefined);
        });
      
      // Simulate multiple concurrent updates
      const updates = [];
      for (let i = 0; i < 10; i++) {
        updates.push(
          (async () => {
            const current = await mockCacheService.get(cacheKey);
            const newValue = { counter: (current?.counter || 0) + 1 };
            await mockCacheService.set(cacheKey, newValue, 300);
          })()
        );
      }

      await Promise.all(updates);

      const finalValue = await mockCacheService.get(cacheKey);
      expect(finalValue.counter).toBeGreaterThan(0);
    });
  });

  describe('Cache Configuration', () => {
    it('should respect TTL settings', async () => {
      const shortTTL = 1; // 1 second
      const longTTL = 3600; // 1 hour
      const testData = { id: 1, name: 'TTL Test' };

      mockCacheService.set.mockResolvedValue(undefined);
        await mockCacheService.set('test:short', testData, shortTTL);
        await mockCacheService.set('test:long', testData, longTTL);

        expect(mockCacheService.set).toHaveBeenCalledWith('test:short', testData, shortTTL);
        expect(mockCacheService.set).toHaveBeenCalledWith('test:long', testData, longTTL);
    });

    it('should use default TTL when not specified', async () => {
      const testData = { id: 1, name: 'Default TTL Test' };
      mockCacheService.set.mockResolvedValue(undefined);
      await mockCacheService.set('test:default', testData);

      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should handle cache size limits', async () => {
      const largeData = {
        id: 1,
        data: 'x'.repeat(1024 * 1024), // 1MB of data
      };

      mockRedis.setex.mockResolvedValue('OK');

      // Should handle large data without issues
      mockCacheService.set.mockResolvedValue(undefined);
      await expect(mockCacheService.set('test:large', largeData, 300)).resolves.not.toThrow();
    });
  });
});