/**
 * Enhanced Multi-Layer Caching System for MS Sport
 * Provides millisecond response times with intelligent cache management
 */

import { cache } from '@/lib/cache';

// Cache configuration for different data types
const CACHE_CONFIG = {
  // Ultra-fast cache for frequently accessed data (in-memory)
  MEMORY: {
    ttl: 30,          // 30 seconds
    maxSize: 1000,    // Maximum 1000 entries
  },
  
  // Standard cache for API responses
  STANDARD: {
    ttl: 300,         // 5 minutes
    maxSize: 5000,    // Maximum 5000 entries
  },
  
  // Long-term cache for static data
  LONG_TERM: {
    ttl: 3600,        // 1 hour
    maxSize: 10000,   // Maximum 10000 entries
  },
  
  // User-specific cache
  USER: {
    ttl: 600,         // 10 minutes
    maxSize: 2000,    // Maximum 2000 entries per user
  }
};

// In-memory cache for ultra-fast access
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number; hits: number }>();
  private maxSize: number;
  
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }
  
  set(key: string, data: any, ttlSeconds: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlSeconds * 1000),
      hits: 0
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    entry.hits++;
    return entry.data;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageHits: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.hits, 0) / entries.length : 0
    };
  }
}

// Global memory cache instance
const memoryCache = new MemoryCache(CACHE_CONFIG.MEMORY.maxSize);

// Performance monitoring
class CachePerformanceMonitor {
  private stats = {
    memoryHits: 0,
    memoryMisses: 0,
    redisHits: 0,
    redisMisses: 0,
    totalQueries: 0,
    averageResponseTime: 0,
    totalResponseTime: 0
  };
  
  recordHit(cacheType: 'memory' | 'redis', responseTime: number): void {
    this.stats.totalQueries++;
    this.stats.totalResponseTime += responseTime;
    this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalQueries;
    
    if (cacheType === 'memory') {
      this.stats.memoryHits++;
    } else {
      this.stats.redisHits++;
    }
  }
  
  recordMiss(cacheType: 'memory' | 'redis', responseTime: number): void {
    this.stats.totalQueries++;
    this.stats.totalResponseTime += responseTime;
    this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalQueries;
    
    if (cacheType === 'memory') {
      this.stats.memoryMisses++;
    } else {
      this.stats.redisMisses++;
    }
  }
  
  getStats() {
    const memoryTotal = this.stats.memoryHits + this.stats.memoryMisses;
    const redisTotal = this.stats.redisHits + this.stats.redisMisses;
    
    return {
      ...this.stats,
      memoryHitRate: memoryTotal > 0 ? (this.stats.memoryHits / memoryTotal) * 100 : 0,
      redisHitRate: redisTotal > 0 ? (this.stats.redisHits / redisTotal) * 100 : 0,
      overallHitRate: this.stats.totalQueries > 0 ? 
        ((this.stats.memoryHits + this.stats.redisHits) / this.stats.totalQueries) * 100 : 0
    };
  }
  
  reset(): void {
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      redisHits: 0,
      redisMisses: 0,
      totalQueries: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };
  }
}

const performanceMonitor = new CachePerformanceMonitor();

// Enhanced cache functions
export class EnhancedCache {
  
  /**
   * Get data with multi-layer caching (memory -> Redis -> database)
   */
  static async get<T>(
    key: string, 
    fetchFunction: () => Promise<T>,
    options: {
      ttl?: number;
      useMemoryCache?: boolean;
      cacheType?: 'memory' | 'standard' | 'long-term' | 'user';
      prefetch?: boolean;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const {
      ttl = CACHE_CONFIG.STANDARD.ttl,
      useMemoryCache = true,
      cacheType = 'standard',
      prefetch = false
    } = options;
    
    try {
      // Try memory cache first (fastest)
      if (useMemoryCache) {
        const memoryResult = memoryCache.get(key);
        if (memoryResult !== null) {
          const responseTime = Date.now() - startTime;
          performanceMonitor.recordHit('memory', responseTime);
          return memoryResult;
        }
      }
      
      // Try Redis cache (fast)
      const redisResult = await cache.get(key);
      if (redisResult !== null) {
        const responseTime = Date.now() - startTime;
        performanceMonitor.recordHit('redis', responseTime);
        
        // Store in memory cache for next time
        if (useMemoryCache) {
          memoryCache.set(key, redisResult, CACHE_CONFIG.MEMORY.ttl);
        }
        
        return redisResult;
      }
      
      // Fetch from database (slowest)
      const data = await fetchFunction();
      const responseTime = Date.now() - startTime;
      performanceMonitor.recordMiss('redis', responseTime);
      
      // Store in both caches
      await cache.set(key, data, ttl);
      if (useMemoryCache) {
        memoryCache.set(key, data, CACHE_CONFIG.MEMORY.ttl);
      }
      
      // Prefetch related data if requested
      if (prefetch) {
        this.prefetchRelatedData(key, data);
      }
      
      return data;
    } catch (error) {
      console.error('Enhanced cache error:', error);
      const responseTime = Date.now() - startTime;
      performanceMonitor.recordMiss('memory', responseTime);
      
      // Fallback to direct fetch
      return await fetchFunction();
    }
  }
  
  /**
   * Set data in both memory and Redis cache
   */
  static async set(key: string, data: any, ttl?: number): Promise<void> {
    const cacheTtl = ttl || CACHE_CONFIG.STANDARD.ttl;
    
    // Set in Redis
    await cache.set(key, data, cacheTtl);
    
    // Set in memory with shorter TTL
    memoryCache.set(key, data, Math.min(cacheTtl, CACHE_CONFIG.MEMORY.ttl));
  }
  
  /**
   * Delete from both caches
   */
  static async delete(key: string): Promise<void> {
    await cache.del(key);
    memoryCache.delete(key);
  }
  
  /**
   * Clear all caches
   */
  static async clear(): Promise<void> {
    await cache.invalidatePattern('*');
    memoryCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  static getStats() {
    return {
      performance: performanceMonitor.getStats(),
      memory: memoryCache.getStats(),
      config: CACHE_CONFIG
    };
  }
  
  /**
   * Warm up cache with frequently accessed data
   */
  static async warmUp(warmupData: Array<{ key: string; fetchFn: () => Promise<any>; ttl?: number }>): Promise<void> {
    console.log('🔥 Warming up cache with', warmupData.length, 'items...');
    
    const promises = warmupData.map(async ({ key, fetchFn, ttl }) => {
      try {
        const data = await fetchFn();
        await this.set(key, data, ttl);
        console.log('✅ Warmed up:', key);
      } catch (error) {
        console.error('❌ Failed to warm up:', key, error);
      }
    });
    
    await Promise.all(promises);
    console.log('🔥 Cache warm-up completed');
  }
  
  /**
   * Intelligent prefetching of related data
   */
  private static async prefetchRelatedData(key: string, data: any): Promise<void> {
    // Implement intelligent prefetching based on data patterns
    // This is a placeholder for more sophisticated prefetching logic
    
    if (key.includes('user:')) {
      // Prefetch user's recent orders, preferences, etc.
    } else if (key.includes('product:')) {
      // Prefetch related products, categories, etc.
    } else if (key.includes('invoice:')) {
      // Prefetch customer data, payment history, etc.
    }
  }
  
  /**
   * Batch get multiple keys efficiently
   */
  static async getBatch<T>(
    keys: string[],
    fetchFunctions: Array<() => Promise<T>>,
    options: { ttl?: number; useMemoryCache?: boolean } = {}
  ): Promise<T[]> {
    const { ttl = CACHE_CONFIG.STANDARD.ttl, useMemoryCache = true } = options;
    
    const results: T[] = [];
    const missingKeys: { index: number; key: string; fetchFn: () => Promise<T> }[] = [];
    
    // Check memory cache first
    for (let i = 0; i < keys.length; i++) {
      if (useMemoryCache) {
        const memoryResult = memoryCache.get(keys[i]);
        if (memoryResult !== null) {
          results[i] = memoryResult;
          continue;
        }
      }
      
      missingKeys.push({ index: i, key: keys[i], fetchFn: fetchFunctions[i] });
    }
    
    // Batch fetch missing keys
    if (missingKeys.length > 0) {
      const fetchPromises = missingKeys.map(async ({ index, key, fetchFn }) => {
        try {
          const data = await this.get(key, fetchFn, { ttl, useMemoryCache });
          results[index] = data;
        } catch (error) {
          console.error('Batch fetch error for key:', key, error);
          throw error;
        }
      });
      
      await Promise.all(fetchPromises);
    }
    
    return results;
  }
}

// Export singleton instance
export const enhancedCache = EnhancedCache;

// Export performance monitoring
export const cachePerformance = performanceMonitor; 