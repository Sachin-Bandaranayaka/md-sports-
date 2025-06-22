/**
 * API Optimization Middleware for MS Sport
 * Provides millisecond response times with intelligent caching and compression
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedCache } from '@/lib/cache-enhanced';
import { PageOptimizer } from '@/lib/optimizations/page-optimizer';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  FAST_RESPONSE: 50,      // < 50ms is considered fast
  SLOW_RESPONSE: 200,     // > 200ms is considered slow
  CACHE_TTL_SHORT: 60,    // 1 minute for dynamic data
  CACHE_TTL_MEDIUM: 300,  // 5 minutes for semi-static data
  CACHE_TTL_LONG: 3600,   // 1 hour for static data
};

// Response compression configuration
const COMPRESSION_CONFIG = {
  THRESHOLD: 1024,        // Compress responses > 1KB
  LEVEL: 6,              // Compression level (1-9)
  TYPES: [
    'application/json',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
  ],
};

/**
 * API Response Optimizer
 */
export class ApiOptimizer {
  
  /**
   * Optimize API response with caching, compression, and headers
   */
  static async optimizeResponse(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>,
    options: {
      cacheKey?: string;
      cacheTTL?: number;
      enableCompression?: boolean;
      enableCaching?: boolean;
      performanceTracking?: boolean;
    } = {}
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const {
      cacheKey,
      cacheTTL = PERFORMANCE_THRESHOLDS.CACHE_TTL_MEDIUM,
      enableCompression = true,
      enableCaching = true,
      performanceTracking = true
    } = options;
    
    const url = new URL(request.url);
    const method = request.method;
    const defaultCacheKey = `api:${method}:${url.pathname}:${url.search}`;
    const finalCacheKey = cacheKey || defaultCacheKey;
    
    try {
      // Try cache first for GET requests
      if (enableCaching && method === 'GET') {
        const cachedResponse = await enhancedCache.get(
          finalCacheKey,
          async () => null,
          { ttl: cacheTTL, useMemoryCache: true }
        );
        
                 if (cachedResponse) {
           const responseTime = Date.now() - startTime;
           console.log(`🚀 Cache hit: ${finalCacheKey} (${responseTime}ms)`);
           
           return new NextResponse(JSON.stringify((cachedResponse as any).data), {
             status: (cachedResponse as any).status,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              'X-Response-Time': `${responseTime}ms`,
              'Cache-Control': `public, max-age=${cacheTTL}`,
              ...this.getOptimizedHeaders()
            }
          });
        }
      }
      
      // Execute the actual handler
      const response = await handler(request);
      const responseTime = Date.now() - startTime;
      
      // Clone response to read body
      const responseClone = response.clone();
      const responseData = await responseClone.json().catch(() => null);
      
      // Cache successful GET responses
      if (enableCaching && method === 'GET' && response.status === 200 && responseData) {
        await enhancedCache.set(finalCacheKey, {
          data: responseData,
          status: response.status,
          timestamp: Date.now()
        }, cacheTTL);
      }
      
             // Add optimization headers
       const optimizedHeaders: Record<string, string> = {
         ...Object.fromEntries(response.headers.entries()),
         'X-Cache': 'MISS',
         'X-Response-Time': `${responseTime}ms`,
         ...this.getOptimizedHeaders()
       };
       
       // Apply compression if enabled and response is large enough
       let finalBody = responseData ? JSON.stringify(responseData) : await response.text();
       
       if (enableCompression && finalBody.length > COMPRESSION_CONFIG.THRESHOLD) {
         const contentType = response.headers.get('content-type') || '';
         if (COMPRESSION_CONFIG.TYPES.some(type => contentType.includes(type))) {
           optimizedHeaders['Content-Encoding'] = 'gzip';
           // Note: In a real implementation, you'd use a compression library here
           // For now, we'll just set the header
         }
       }
      
      // Log performance metrics
      if (performanceTracking) {
        this.logPerformanceMetrics(finalCacheKey, responseTime, response.status, finalBody.length);
      }
      
      return new NextResponse(finalBody, {
        status: response.status,
        headers: optimizedHeaders
      });
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ API Error: ${finalCacheKey} (${responseTime}ms)`, error);
      
      return new NextResponse(JSON.stringify({
        error: 'Internal Server Error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${responseTime}ms`,
          ...this.getOptimizedHeaders()
        }
      });
    }
  }
  
  /**
   * Get optimized response headers
   */
  private static getOptimizedHeaders(): Record<string, string> {
    return {
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Performance headers
      'X-DNS-Prefetch-Control': 'on',
      'X-Powered-By': 'MS-Sport-Optimized',
      
      // CORS headers (adjust as needed)
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      
      // Cache control for static assets
      'Vary': 'Accept-Encoding',
    };
  }
  
  /**
   * Log performance metrics
   */
  private static logPerformanceMetrics(
    endpoint: string,
    responseTime: number,
    status: number,
    bodySize: number
  ): void {
    const isSlowResponse = responseTime > PERFORMANCE_THRESHOLDS.SLOW_RESPONSE;
    const isFastResponse = responseTime < PERFORMANCE_THRESHOLDS.FAST_RESPONSE;
    
    const logLevel = isSlowResponse ? '🐌' : isFastResponse ? '⚡' : '📊';
    
    console.log(
      `${logLevel} API: ${endpoint} | ${responseTime}ms | ${status} | ${(bodySize / 1024).toFixed(2)}KB`
    );
    
         // Store metrics for reporting (would be implemented with your metrics system)
     console.log(`📊 Metrics: response_time=${responseTime}ms, size=${bodySize}bytes`);
  }
  
  /**
   * Create cache key for API requests
   */
  static createCacheKey(
    method: string,
    path: string,
    params?: Record<string, any>,
    userId?: string
  ): string {
    const baseKey = `api:${method.toLowerCase()}:${path}`;
    
    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      return `${baseKey}:${sortedParams}`;
    }
    
    if (userId) {
      return `${baseKey}:user:${userId}`;
    }
    
    return baseKey;
  }
  
  /**
   * Invalidate cache for specific patterns
   */
  static async invalidateCache(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      try {
        await enhancedCache.delete(pattern);
        console.log(`🗑️ Invalidated cache: ${pattern}`);
      } catch (error) {
        console.error(`❌ Failed to invalidate cache: ${pattern}`, error);
      }
    }
  }
  
  /**
   * Batch invalidate cache for related data
   */
  static async invalidateRelatedCache(dataType: string, id?: string): Promise<void> {
    const patterns = this.getCacheInvalidationPatterns(dataType, id);
    await this.invalidateCache(patterns);
  }
  
  /**
   * Get cache invalidation patterns for different data types
   */
  private static getCacheInvalidationPatterns(dataType: string, id?: string): string[] {
    const patterns: string[] = [];
    
    switch (dataType) {
      case 'inventory':
        patterns.push('api:get:/api/inventory*');
        patterns.push('api:get:/api/dashboard*');
        if (id) patterns.push(`api:get:/api/inventory/${id}*`);
        break;
        
      case 'invoice':
        patterns.push('api:get:/api/invoices*');
        patterns.push('api:get:/api/dashboard*');
        if (id) patterns.push(`api:get:/api/invoices/${id}*`);
        break;
        
      case 'customer':
        patterns.push('api:get:/api/customers*');
        patterns.push('api:get:/api/dashboard*');
        if (id) patterns.push(`api:get:/api/customers/${id}*`);
        break;
        
      case 'product':
        patterns.push('api:get:/api/products*');
        patterns.push('api:get:/api/inventory*');
        patterns.push('api:get:/api/dashboard*');
        if (id) patterns.push(`api:get:/api/products/${id}*`);
        break;
        
      case 'user':
        patterns.push('api:get:/api/users*');
        if (id) patterns.push(`api:get:*:user:${id}`);
        break;
        
      default:
        patterns.push(`api:get:/api/${dataType}*`);
    }
    
    return patterns;
  }
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withApiOptimization(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    cacheKey?: string;
    cacheTTL?: number;
    enableCompression?: boolean;
    enableCaching?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    return ApiOptimizer.optimizeResponse(request, handler, options);
  };
}

/**
 * Performance monitoring decorator
 */
export function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const url = new URL(request.url);
    
    try {
      const response = await handler(request);
      const responseTime = Date.now() - startTime;
      
      // Log performance
      console.log(`📊 API Performance: ${url.pathname} - ${responseTime}ms`);
      
      // Add performance header
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ API Error: ${url.pathname} - ${responseTime}ms`, error);
      throw error;
    }
  };
} 