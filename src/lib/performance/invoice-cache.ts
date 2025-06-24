/**
 * High-Performance Invoice Cache System
 * Intelligent caching with automatic invalidation
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    tags: string[];
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    evictions: number;
}

class InvoiceCache {
    private cache = new Map<string, CacheEntry<any>>();
    private maxSize = 1000; // Maximum cache entries
    private defaultTTL = 300000; // 5 minutes in milliseconds
    private stats: CacheStats = { hits: 0, misses: 0, size: 0, evictions: 0 };

    /**
     * Generate optimized cache key for invoice queries
     */
    generateKey(prefix: string, params: Record<string, any>): string {
        // Sort parameters for consistent keys
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                    acc[key] = params[key];
                }
                return acc;
            }, {} as Record<string, any>);

        return `${prefix}:${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`;
    }

    /**
     * Get data from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() > entry.timestamp + entry.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.size--;
            return null;
        }

        this.stats.hits++;
        return entry.data;
    }

    /**
     * Set data in cache with optional TTL and tags
     */
    set<T>(key: string, data: T, ttl?: number, tags: string[] = []): void {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
            tags
        };

        this.cache.set(key, entry);
        this.stats.size = this.cache.size;
    }

    /**
     * Invalidate cache entries by tag
     */
    invalidateByTag(tag: string): number {
        let invalidated = 0;
        
        Array.from(this.cache.entries()).forEach(([key, entry]) => {
            if (entry.tags.includes(tag)) {
                this.cache.delete(key);
                invalidated++;
            }
        });

        this.stats.size = this.cache.size;
        return invalidated;
    }

    /**
     * Invalidate cache entries by pattern
     */
    invalidateByPattern(pattern: RegExp): number {
        let invalidated = 0;
        
        Array.from(this.cache.keys()).forEach(key => {
            if (pattern.test(key)) {
                this.cache.delete(key);
                invalidated++;
            }
        });

        this.stats.size = this.cache.size;
        return invalidated;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, size: 0, evictions: 0 };
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats & { hitRate: number } {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
        
        return {
            ...this.stats,
            hitRate: Math.round(hitRate * 100) / 100
        };
    }

    /**
     * Evict oldest cache entries
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Date.now();

        Array.from(this.cache.entries()).forEach(([key, entry]) => {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        });

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): number {
        let cleaned = 0;
        const now = Date.now();

        Array.from(this.cache.entries()).forEach(([key, entry]) => {
            if (now > entry.timestamp + entry.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        });

        this.stats.size = this.cache.size;
        return cleaned;
    }

    /**
     * Warm cache with common queries
     */
    async warmCache(): Promise<void> {
        // Pre-load common invoice queries
        const commonQueries = [
            { status: 'pending' },
            { status: 'paid' },
            { status: 'overdue' },
            { paymentMethod: 'cash' },
            { paymentMethod: 'credit' },
            { sortBy: 'newest' },
            { sortBy: 'amount-high' }
        ];

        console.log('🔥 Warming invoice cache...');
        
        // Note: In a real implementation, you would call your data fetching functions here
        // For now, we're just setting up the cache structure
        commonQueries.forEach(query => {
            const key = this.generateKey('invoices', query);
            // Cache placeholder - would be replaced with actual data in production
            this.set(key, { cached: true, query }, 600000, ['invoices', 'warm']); // 10 minutes
        });

        console.log(`✅ Cache warmed with ${commonQueries.length} entries`);
    }
}

// Singleton instance
const invoiceCache = new InvoiceCache();

// Cache configuration for different query types
export const CACHE_CONFIG = {
    INVOICE_LIST: {
        ttl: 300000, // 5 minutes
        tags: ['invoices', 'list']
    },
    INVOICE_STATS: {
        ttl: 600000, // 10 minutes  
        tags: ['invoices', 'statistics']
    },
    INVOICE_DETAIL: {
        ttl: 1800000, // 30 minutes
        tags: ['invoices', 'detail']
    },
    CUSTOMER_LIST: {
        ttl: 3600000, // 1 hour
        tags: ['customers', 'list']
    },
    SHOP_LIST: {
        ttl: 7200000, // 2 hours
        tags: ['shops', 'list']
    }
};

export { invoiceCache };

/**
 * Cache invalidation hooks for invoice operations
 */
export const cacheInvalidation = {
    onInvoiceCreate: () => {
        invoiceCache.invalidateByTag('invoices');
        console.log('🗑️  Cache invalidated: invoice created');
    },
    
    onInvoiceUpdate: (invoiceId: string) => {
        invoiceCache.invalidateByTag('invoices');
        invoiceCache.invalidateByPattern(new RegExp(`invoice-detail:.*${invoiceId}`));
        console.log(`🗑️  Cache invalidated: invoice ${invoiceId} updated`);
    },
    
    onInvoiceDelete: (invoiceId: string) => {
        invoiceCache.invalidateByTag('invoices');
        invoiceCache.invalidateByPattern(new RegExp(`invoice-detail:.*${invoiceId}`));
        console.log(`🗑️  Cache invalidated: invoice ${invoiceId} deleted`);
    },
    
    onPaymentRecorded: (invoiceId: string) => {
        invoiceCache.invalidateByTag('invoices');
        invoiceCache.invalidateByTag('statistics');
        console.log(`🗑️  Cache invalidated: payment recorded for ${invoiceId}`);
    }
};

/**
 * Cache warming on application startup
 */
export async function initializeInvoiceCache(): Promise<void> {
    try {
        await invoiceCache.warmCache();
        
        // Setup periodic cleanup
        setInterval(() => {
            const cleaned = invoiceCache.cleanup();
            if (cleaned > 0) {
                console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
            }
        }, 300000); // 5 minutes

        console.log('✅ Invoice cache system initialized');
    } catch (error) {
        console.error('❌ Failed to initialize invoice cache:', error);
    }
} 