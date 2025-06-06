/**
 * Redis-based caching service for improved performance
 * Falls back to in-memory cache in development
 */

import { Redis } from 'ioredis';

// Cache configuration
const CACHE_CONFIG = {
    // Default TTL in seconds
    DEFAULT_TTL: 300, // 5 minutes

    // Cache keys
    KEYS: {
        INVENTORY_SUMMARY: 'inventory:summary',
        INVOICES: 'invoices:list',
        INVOICE_STATS: 'invoices:stats',
        CATEGORIES: 'categories:list',
        SHOPS: 'shops:list',
        CUSTOMERS: 'customers:list',
        PRODUCTS: 'products:list',
        // Authentication cache keys
        USER_SESSION: 'auth:user:session',
        USER_PERMISSIONS: 'auth:user:permissions',
        ROLE_PERMISSIONS: 'auth:role:permissions',
        TOKEN_VALIDATION: 'auth:token:validation',
    },

    // TTL for different data types
    TTL: {
        INVENTORY: 60, // 1 minute
        INVOICES: 120, // 2 minutes
        STATS: 300, // 5 minutes
        REFERENCE_DATA: 3600, // 1 hour (categories, shops, etc.)
        // Authentication TTLs
        USER_SESSION: 900, // 15 minutes
        USER_PERMISSIONS: 1800, // 30 minutes
        ROLE_PERMISSIONS: 3600, // 1 hour
        TOKEN_VALIDATION: 300, // 5 minutes
    }
};

// In-memory cache fallback for development
class MemoryCache {
    private cache = new Map<string, { data: any; expires: number }>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Clean up expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    async get(key: string): Promise<any> {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    async set(key: string, value: any, ttlSeconds: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
        const expires = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { data: value, expires });
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async invalidatePattern(pattern: string): Promise<void> {
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expires) {
                this.cache.delete(key);
            }
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.cache.clear();
    }
}

// Redis cache implementation
class RedisCache {
    private redis: Redis;
    private isConnected = false;

    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        this.redis = new Redis(redisUrl, {
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });

        this.redis.on('connect', () => {
            console.log('✅ Redis connected');
            this.isConnected = true;
        });

        this.redis.on('error', (error) => {
            console.error('❌ Redis connection error:', error);
            this.isConnected = false;
        });
    }

    async get(key: string): Promise<any> {
        if (!this.isConnected) return null;

        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
        if (!this.isConnected) return;

        try {
            await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected) return;

        try {
            await this.redis.del(key);
        } catch (error) {
            console.error('Redis del error:', error);
        }
    }

    async invalidatePattern(pattern: string): Promise<void> {
        if (!this.isConnected) return;

        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error('Redis invalidatePattern error:', error);
        }
    }

    disconnect(): void {
        this.redis.disconnect();
    }
}

// Cache service interface
interface CacheService {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    invalidatePattern(pattern: string): Promise<void>;
}

// Cache service implementation
class CacheManager implements CacheService {
    private cache: CacheService;
    private useRedis: boolean;

    constructor() {
        this.useRedis = process.env.NODE_ENV === 'production' && !!process.env.REDIS_URL;

        if (this.useRedis) {
            console.log('🚀 Using Redis cache');
            this.cache = new RedisCache();
        } else {
            console.log('💾 Using in-memory cache');
            this.cache = new MemoryCache();
        }
    }

    async get(key: string): Promise<any> {
        return this.cache.get(key);
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        return this.cache.set(key, value, ttlSeconds);
    }

    async del(key: string): Promise<void> {
        return this.cache.del(key);
    }

    async invalidatePattern(pattern: string): Promise<void> {
        return this.cache.invalidatePattern(pattern);
    }

    // Helper methods for common cache operations
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttlSeconds?: number
    ): Promise<T> {
        // Try to get from cache first
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }

        // Fetch fresh data
        const data = await fetcher();

        // Store in cache
        await this.set(key, data, ttlSeconds);

        return data;
    }

    // Generate cache key with parameters
    generateKey(prefix: string, params: Record<string, any> = {}): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|');

        return sortedParams ? `${prefix}:${sortedParams}` : prefix;
    }

    // Invalidate related cache entries
    async invalidateInventory(): Promise<void> {
        await Promise.all([
            this.invalidatePattern(`${CACHE_CONFIG.KEYS.INVENTORY_SUMMARY}*`),
            this.invalidatePattern(`${CACHE_CONFIG.KEYS.PRODUCTS}*`),
        ]);
    }

    async invalidateInvoices(): Promise<void> {
        await Promise.all([
            this.invalidatePattern(`${CACHE_CONFIG.KEYS.INVOICES}*`),
            this.invalidatePattern(`${CACHE_CONFIG.KEYS.INVOICE_STATS}*`),
        ]);
    }

    async invalidateReferenceData(): Promise<void> {
        await Promise.all([
            this.invalidatePattern(`${CACHE_CONFIG.KEYS.CATEGORIES}*`),
            this.invalidatePattern(`${CACHE_CONFIG.KEYS.SHOPS}*`),
            this.invalidatePattern(`${CACHE_CONFIG.KEYS.CUSTOMERS}*`),
        ]);
    }

    // Authentication cache invalidation methods
    async invalidateUserSession(userId: number): Promise<void> {
        const userSessionKey = this.generateKey(CACHE_CONFIG.KEYS.USER_SESSION, { userId });
        await this.del(userSessionKey);
    }

    async invalidateUserPermissions(userId: number): Promise<void> {
        const userPermissionsKey = this.generateKey(CACHE_CONFIG.KEYS.USER_PERMISSIONS, { userId });
        await this.del(userPermissionsKey);
    }

    async invalidateRolePermissions(roleId: number): Promise<void> {
        const rolePermissionsKey = this.generateKey(CACHE_CONFIG.KEYS.ROLE_PERMISSIONS, { roleId });
        await this.del(rolePermissionsKey);
        // Also invalidate all user permissions for users with this role
        await this.invalidatePattern(`${CACHE_CONFIG.KEYS.USER_PERMISSIONS}*`);
    }

    async invalidateTokenValidation(token: string): Promise<void> {
        const tokenKey = this.generateKey(CACHE_CONFIG.KEYS.TOKEN_VALIDATION, { token: token.substring(0, 20) });
        await this.del(tokenKey);
    }

    async invalidateAllUserAuth(userId: number): Promise<void> {
        await Promise.all([
            this.invalidateUserSession(userId),
            this.invalidateUserPermissions(userId),
        ]);
    }
}

// Export singleton instance
const cache = new CacheManager();
export { cache };

// Export as cacheService for backward compatibility
export { cache as cacheService };

// Export types and constants
export { CACHE_CONFIG };
export type { CacheService };

// Cleanup on process exit
process.on('SIGINT', () => {
    if (cache.cache instanceof RedisCache) {
        (cache.cache as any).disconnect();
    } else if (cache.cache instanceof MemoryCache) {
        (cache.cache as any).destroy();
    }
});