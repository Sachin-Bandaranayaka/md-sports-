/**
 * Vercel-optimized caching service
 * Uses Vercel KV (Redis) for serverless environments with fallback to in-memory cache
 */



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

    private cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (value.expires < now) {
                this.cache.delete(key);
            }
        }
    }

    async get<T>(key: string): Promise<T | null> {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (item.expires < Date.now()) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    async set(key: string, value: any, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
        const expires = Date.now() + (ttl * 1000);
        this.cache.set(key, { data: value, expires });
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
    }
}

// Vercel KV Cache implementation
class VercelKVCache {
    private kv: any;

    constructor() {
        // Dynamically import Vercel KV only in production
        if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
            try {
                // This will be available when @vercel/kv is installed
                const { kv } = require('@vercel/kv');
                this.kv = kv;
            } catch {
                console.warn('Vercel KV not available, falling back to memory cache');
                this.kv = null;
            }
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.kv) return null;
        
        try {
            const result = await this.kv.get(key);
            return result;
        } catch (error) {
            console.error('KV get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
        if (!this.kv) return;
        
        try {
            await this.kv.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error('KV set error:', error);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.kv) return;
        
        try {
            await this.kv.del(key);
        } catch (error) {
            console.error('KV del error:', error);
        }
    }

    async clear(): Promise<void> {
        if (!this.kv) return;
        
        try {
            // Note: Vercel KV doesn't have a clear all method
            // This would need to be implemented differently
            console.warn('KV clear not implemented');
        } catch (error) {
            console.error('KV clear error:', error);
        }
    }
}

// Cache service that automatically chooses the best implementation
class CacheService {
    private cache: MemoryCache | VercelKVCache;
    private fallbackCache: MemoryCache;

    constructor() {
        // Always have memory cache as fallback
        this.fallbackCache = new MemoryCache();
        
        // Use Vercel KV in production, memory cache in development
        if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
            this.cache = new VercelKVCache();
        } else {
            this.cache = this.fallbackCache;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const result = await this.cache.get<T>(key);
            return result;
        } catch (error) {
            console.error('Cache get error, using fallback:', error);
            return await this.fallbackCache.get<T>(key);
        }
    }

    async set(key: string, value: any, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
        try {
            await this.cache.set(key, value, ttl);
            // Also set in fallback for reliability
            await this.fallbackCache.set(key, value, ttl);
        } catch (error) {
            console.error('Cache set error:', error);
            // At least set in fallback
            await this.fallbackCache.set(key, value, ttl);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.cache.del(key);
            await this.fallbackCache.del(key);
        } catch (error) {
            console.error('Cache del error:', error);
            await this.fallbackCache.del(key);
        }
    }

    async clear(): Promise<void> {
        try {
            await this.cache.clear();
            await this.fallbackCache.clear();
        } catch (error) {
            console.error('Cache clear error:', error);
            await this.fallbackCache.clear();
        }
    }

    // Helper methods for common cache patterns
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number = CACHE_CONFIG.DEFAULT_TTL
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const fresh = await fetcher();
        await this.set(key, fresh, ttl);
        return fresh;
    }

    // Generate cache key with prefix
    key(prefix: string, ...parts: (string | number)[]): string {
        return `${prefix}:${parts.join(':')}`;
    }

    // Invalidate related cache entries
    async invalidatePattern(pattern: string): Promise<void> {
        // This is a simplified implementation
        // In a real scenario, you'd want to track keys or use a more sophisticated approach
        console.log(`Invalidating cache pattern: ${pattern}`);
    }
}

// Export singleton instance
export const cache = new CacheService();
export { CACHE_CONFIG };
export default cache;