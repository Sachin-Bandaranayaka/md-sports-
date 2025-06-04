/**
 * Transfer-specific Cache Service
 * Optimized caching for inventory transfer operations
 */

import { Redis } from 'ioredis';
import { cacheService } from './cache';

// Cache configuration for transfers
const TRANSFER_CACHE_CONFIG = {
  TTL: {
    TRANSFER_LIST: 300,     // 5 minutes
    TRANSFER_DETAIL: 600,   // 10 minutes
    SHOP_INVENTORY: 180,    // 3 minutes
    TRANSFER_STATS: 900     // 15 minutes
  },
  KEYS: {
    TRANSFER_LIST: 'transfers:list',
    TRANSFER_DETAIL: 'transfers:detail',
    SHOP_INVENTORY: 'inventory:shop',
    TRANSFER_STATS: 'transfers:stats'
  }
};

interface TransferFilters {
  page?: number;
  limit?: number;
  status?: string;
  sourceShopId?: number;
  destinationShopId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  avgResponseTime: number;
}

class TransferCacheService {
  private redis: Redis | null = null;
  private metrics: Map<string, CacheMetrics> = new Map();
  private warmingInProgress: Set<string> = new Set();

  constructor() {
    this.initializeRedis();
    this.startMetricsCollection();
  }

  private initializeRedis() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        console.log('✓ Transfer cache Redis connection established');
      } catch (error) {
        console.error('✗ Transfer cache Redis connection failed:', error);
      }
    }
  }

  private startMetricsCollection() {
    setInterval(() => {
      this.logMetrics();
    }, 60000); // Log metrics every minute
  }

  generateTransferCacheKey(baseKey: string, filters: TransferFilters): string {
    const keyParts = [baseKey];

    if (filters.page) keyParts.push(`page:${filters.page}`);
    if (filters.limit) keyParts.push(`limit:${filters.limit}`);
    if (filters.status) keyParts.push(`status:${filters.status}`);
    if (filters.sourceShopId) keyParts.push(`src:${filters.sourceShopId}`);
    if (filters.destinationShopId) keyParts.push(`dst:${filters.destinationShopId}`);
    if (filters.search) keyParts.push(`search:${encodeURIComponent(filters.search)}`);
    if (filters.startDate) keyParts.push(`start:${filters.startDate}`);
    if (filters.endDate) keyParts.push(`end:${filters.endDate}`);

    return keyParts.join(':');
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();

    try {
      let data: T | null = null;

      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          data = JSON.parse(cached);
          this.recordMetric(key, 'hit', performance.now() - startTime);
          return data;
        }
      }

      // Fallback to memory cache
      data = await cacheService.get(key);
      if (data) {
        this.recordMetric(key, 'hit', performance.now() - startTime);
        return data;
      }

      this.recordMetric(key, 'miss', performance.now() - startTime);
      return null;
    } catch (error) {
      console.error('Transfer cache get error:', error);
      this.recordMetric(key, 'miss', performance.now() - startTime);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number = TRANSFER_CACHE_CONFIG.TTL.TRANSFER_LIST): Promise<void> {
    try {
      const serialized = JSON.stringify(data);

      // Store in Redis
      if (this.redis) {
        await this.redis.setex(key, ttl, serialized);
      }

      // Store in memory cache as fallback
      await cacheService.set(key, data, ttl);

    } catch (error) {
      console.error('Transfer cache set error:', error);
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    await this.set(key, data, ttl);

    return data;
  }

  async invalidateTransferCache(transferId?: number, shopIds?: number[]): Promise<void> {
    try {
      const patterns = [
        `${TRANSFER_CACHE_CONFIG.KEYS.TRANSFER_LIST}*`,
        `${TRANSFER_CACHE_CONFIG.KEYS.TRANSFER_STATS}*`
      ];

      if (transferId) {
        patterns.push(`${TRANSFER_CACHE_CONFIG.KEYS.TRANSFER_DETAIL}:${transferId}`);
      }

      if (shopIds) {
        shopIds.forEach(shopId => {
          patterns.push(`${TRANSFER_CACHE_CONFIG.KEYS.SHOP_INVENTORY}:${shopId}*`);
        });
      }

      // Invalidate Redis cache
      if (this.redis) {
        for (const pattern of patterns) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }
      }

      // Invalidate memory cache
      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }

      console.log(`✓ Invalidated transfer cache for patterns: ${patterns.join(', ')}`);
    } catch (error) {
      console.error('Transfer cache invalidation error:', error);
    }
  }

  async warmTransferCache(filters: TransferFilters): Promise<void> {
    const cacheKey = this.generateTransferCacheKey(TRANSFER_CACHE_CONFIG.KEYS.TRANSFER_LIST, filters);

    if (this.warmingInProgress.has(cacheKey)) {
      return;
    }

    this.warmingInProgress.add(cacheKey);

    try {
      // This would be implemented with actual transfer fetching logic
      console.log(`🔥 Warming transfer cache: ${cacheKey}`);
      // await this.fetchTransfersFromDB(filters);
    } catch (error) {
      console.error('Transfer cache warming error:', error);
    } finally {
      this.warmingInProgress.delete(cacheKey);
    }
  }

  private recordMetric(key: string, type: 'hit' | 'miss', responseTime: number): void {
    const existing = this.metrics.get(key) || {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      avgResponseTime: 0
    };

    if (type === 'hit') {
      existing.hits++;
    } else {
      existing.misses++;
    }

    existing.totalRequests++;
    existing.avgResponseTime = (
      (existing.avgResponseTime * (existing.totalRequests - 1)) + responseTime
    ) / existing.totalRequests;

    this.metrics.set(key, existing);
  }

  private logMetrics(): void {
    if (this.metrics.size === 0) return;

    console.log('📊 Transfer Cache Metrics:');
    this.metrics.forEach((metric, key) => {
      const hitRate = (metric.hits / metric.totalRequests * 100).toFixed(2);
      console.log(`  ${key}: ${hitRate}% hit rate, ${metric.avgResponseTime.toFixed(2)}ms avg`);
    });
  }

  getMetrics(): Map<string, CacheMetrics> {
    return new Map(this.metrics);
  }

  async clearAllCache(): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys('transfers:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      await cacheService.invalidatePattern('transfers:*');
      console.log('✓ Cleared all transfer cache');
    } catch (error) {
      console.error('Error clearing transfer cache:', error);
    }
  }
}

export const transferCacheService = new TransferCacheService();
export { TRANSFER_CACHE_CONFIG, TransferFilters, CacheMetrics };