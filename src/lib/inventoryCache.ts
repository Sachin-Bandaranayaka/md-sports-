/**
 * Enterprise-grade Inventory Cache Service
 * Multi-layer caching with smart invalidation and predictive warming
 */

import { Redis } from 'ioredis';
import { cacheService } from './cache';

// Cache configuration for inventory
const INVENTORY_CACHE_CONFIG = {
  // Cache layers with different TTLs
  LAYERS: {
    L1_BROWSER: { ttl: 5, strategy: 'stale-while-revalidate' },
    L2_CDN: { ttl: 30, strategy: 'cache-first' },
    L3_REDIS: { ttl: 60, strategy: 'cache-aside' },
    L4_DB_QUERY: { ttl: 300, strategy: 'materialized-view' }
  },

  // Cache keys for inventory
  KEYS: {
    INVENTORY_SUMMARY: 'inventory:summary',
    INVENTORY_ITEM: 'inventory:item',
    INVENTORY_SHOP: 'inventory:shop',
    INVENTORY_CATEGORY: 'inventory:category',
    INVENTORY_SEARCH: 'inventory:search',
    INVENTORY_ANALYTICS: 'inventory:analytics',
    LOW_STOCK_ALERTS: 'inventory:alerts:low-stock',
    POPULAR_FILTERS: 'inventory:filters:popular'
  },

  // TTL for different data types
  TTL: {
    SUMMARY: 60, // 1 minute
    ITEM_DETAILS: 300, // 5 minutes
    SEARCH_RESULTS: 120, // 2 minutes
    ANALYTICS: 600, // 10 minutes
    ALERTS: 30, // 30 seconds
    FILTERS: 3600 // 1 hour
  }
};

interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  shopId?: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  avgResponseTime: number;
}

class InventoryCacheService {
  private redis: Redis | null = null;
  private metrics: Map<string, CacheMetrics> = new Map();
  private popularFilters: Map<string, number> = new Map();
  private warmingInProgress: Set<string> = new Set();

  constructor() {
    this.initializeRedis();
    this.startMetricsCollection();
    this.scheduleWarmingTasks();
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
        console.log('✅ Inventory cache Redis connection established');
      }
    } catch (error) {
      console.warn('⚠️ Redis not available, using memory cache fallback');
    }
  }

  /**
   * Generate cache key for inventory data
   */
  generateKey(baseKey: string, filters: InventoryFilters): string {
    const keyParts = [baseKey];

    if (filters.shopId) keyParts.push(`shop:${filters.shopId}`);
    if (filters.category) keyParts.push(`cat:${filters.category}`);
    if (filters.status) keyParts.push(`status:${filters.status}`);
    if (filters.search) keyParts.push(`search:${encodeURIComponent(filters.search)}`);
    if (filters.page) keyParts.push(`page:${filters.page}`);
    if (filters.limit) keyParts.push(`limit:${filters.limit}`);

    return keyParts.join(':');
  }

  /**
   * Get inventory data from cache with fallback
   */
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
      console.error('Cache get error:', error);
      this.recordMetric(key, 'miss', performance.now() - startTime);
      return null;
    }
  }

  /**
   * Set inventory data in cache with multi-layer storage
   */
  async set<T>(key: string, data: T, ttl: number = INVENTORY_CACHE_CONFIG.TTL.SUMMARY): Promise<void> {
    try {
      const serialized = JSON.stringify(data);

      // Store in Redis
      if (this.redis) {
        await this.redis.setex(key, ttl, serialized);
      }

      // Store in memory cache as fallback
      await cacheService.set(key, data, ttl);

    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Smart cache invalidation based on data relationships
   */
  async invalidateInventoryData(productId?: number, shopId?: number, categoryId?: number): Promise<void> {
    const patterns: string[] = [];

    // Base patterns
    patterns.push(`${INVENTORY_CACHE_CONFIG.KEYS.INVENTORY_SUMMARY}:*`);
    patterns.push(`${INVENTORY_CACHE_CONFIG.KEYS.INVENTORY_ANALYTICS}:*`);
    patterns.push(`${INVENTORY_CACHE_CONFIG.KEYS.LOW_STOCK_ALERTS}:*`);

    // Product-specific patterns
    if (productId) {
      patterns.push(`${INVENTORY_CACHE_CONFIG.KEYS.INVENTORY_ITEM}:${productId}:*`);
      patterns.push(`${INVENTORY_CACHE_CONFIG.KEYS.INVENTORY_SEARCH}:*`);
    }

    // Shop-specific patterns
    if (shopId) {
      patterns.push(`${INVENTORY_CACHE_CONFIG.KEYS.INVENTORY_SHOP}:${shopId}:*`);
    }

    // Category-specific patterns
    if (categoryId) {
      patterns.push(`${INVENTORY_CACHE_CONFIG.KEYS.INVENTORY_CATEGORY}:${categoryId}:*`);
    }

    // Invalidate all patterns
    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)));
  }

  /**
   * Invalidate cache by pattern
   */
  private async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Also invalidate memory cache
      await cacheService.invalidatePattern(pattern);
    } catch (error) {
      console.error('Pattern invalidation error:', error);
    }
  }

  /**
   * Predictive cache warming based on popular filters
   */
  async warmPopularInventoryData(): Promise<void> {
    if (this.warmingInProgress.has('popular')) return;

    this.warmingInProgress.add('popular');

    try {
      // Get popular filters from analytics
      const popularFilters = await this.getPopularFilters();

      // Warm cache for each popular filter combination
      await Promise.all(
        popularFilters.map(async (filters) => {
          const key = this.generateKey(INVENTORY_CACHE_CONFIG.KEYS.INVENTORY_SUMMARY, filters);
          const cached = await this.get(key);

          if (!cached) {
            // Pre-load this data (would call actual API)
            console.log(`🔥 Warming cache for filters:`, filters);
            // await this.preloadInventoryData(filters);
          }
        })
      );
    } catch (error) {
      console.error('Cache warming error:', error);
    } finally {
      this.warmingInProgress.delete('popular');
    }
  }

  /**
   * Get popular filter combinations from usage analytics
   */
  private async getPopularFilters(): Promise<InventoryFilters[]> {
    try {
      const popularKey = INVENTORY_CACHE_CONFIG.KEYS.POPULAR_FILTERS;
      const cached = await this.get<InventoryFilters[]>(popularKey);

      if (cached) return cached;

      // Default popular combinations
      const defaultFilters: InventoryFilters[] = [
        { page: 1, limit: 20 }, // Most common pagination
        { page: 1, limit: 20, status: 'Low Stock' }, // Low stock alerts
        { page: 1, limit: 20, status: 'Out of Stock' }, // Out of stock
        { page: 1, limit: 50 }, // Larger page size
      ];

      await this.set(popularKey, defaultFilters, INVENTORY_CACHE_CONFIG.TTL.FILTERS);
      return defaultFilters;
    } catch (error) {
      console.error('Error getting popular filters:', error);
      return [{ page: 1, limit: 20 }];
    }
  }

  /**
   * Track filter usage for analytics
   */
  trackFilterUsage(filters: InventoryFilters): void {
    const filterKey = JSON.stringify(filters);
    const currentCount = this.popularFilters.get(filterKey) || 0;
    this.popularFilters.set(filterKey, currentCount + 1);
  }

  /**
   * Record cache metrics
   */
  private recordMetric(key: string, type: 'hit' | 'miss', responseTime: number): void {
    const baseKey = key.split(':')[0];
    const current = this.metrics.get(baseKey) || { hits: 0, misses: 0, hitRate: 0, avgResponseTime: 0 };

    if (type === 'hit') {
      current.hits++;
    } else {
      current.misses++;
    }

    current.hitRate = current.hits / (current.hits + current.misses);
    current.avgResponseTime = (current.avgResponseTime + responseTime) / 2;

    this.metrics.set(baseKey, current);
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): Map<string, CacheMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      // Log metrics every 5 minutes
      const metrics = this.getMetrics();
      console.log('📊 Inventory Cache Metrics:', Object.fromEntries(metrics));
    }, 5 * 60 * 1000);
  }

  /**
   * Schedule cache warming tasks
   */
  private scheduleWarmingTasks(): void {
    // Warm cache every 10 minutes
    setInterval(() => {
      this.warmPopularInventoryData();
    }, 10 * 60 * 1000);

    // Initial warming after 30 seconds
    setTimeout(() => {
      this.warmPopularInventoryData();
    }, 30 * 1000);
  }

  /**
   * Cache health check
   */
  async healthCheck(): Promise<{ redis: boolean; memory: boolean; metrics: any }> {
    const health = {
      redis: false,
      memory: false,
      metrics: Object.fromEntries(this.metrics)
    };

    try {
      // Test Redis
      if (this.redis) {
        await this.redis.ping();
        health.redis = true;
      }

      // Test memory cache
      await cacheService.set('health-check', 'ok', 1);
      const result = await cacheService.get('health-check');
      health.memory = result === 'ok';

    } catch (error) {
      console.error('Cache health check failed:', error);
    }

    return health;
  }
}

// Export singleton instance
export const inventoryCacheService = new InventoryCacheService();
export { INVENTORY_CACHE_CONFIG };