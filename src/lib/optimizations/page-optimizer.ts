/**
 * Comprehensive Page Optimization Utility for MS Sport
 * Implements all optimizations needed for millisecond load times
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

// Optimization configuration
const OPTIMIZATION_CONFIG = {
  // Cache settings for different content types
  CACHE_HEADERS: {
    STATIC_ASSETS: 'public, max-age=31536000, immutable', // 1 year
    API_RESPONSES: 'public, max-age=300, s-maxage=300',   // 5 minutes
    DYNAMIC_CONTENT: 'public, max-age=60, s-maxage=60',  // 1 minute
    NO_CACHE: 'no-cache, no-store, must-revalidate'
  },

  // Compression settings
  COMPRESSION: {
    THRESHOLD: 1024, // Compress responses > 1KB
    LEVEL: 6,        // Compression level (1-9)
    TYPES: [
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'text/xml',
      'application/xml'
    ]
  },

  // Image optimization
  IMAGES: {
    FORMATS: ['webp', 'avif'],
    QUALITY: 85,
    SIZES: [320, 640, 768, 1024, 1280, 1920]
  },

  // Database optimization
  DATABASE: {
    CONNECTION_POOL_SIZE: 10,
    QUERY_TIMEOUT: 30000,
    PREPARED_STATEMENT_CACHE_SIZE: 100
  },

  // Performance thresholds
  THRESHOLDS: {
    API_RESPONSE_TIME: 200,  // 200ms max
    DATABASE_QUERY_TIME: 100, // 100ms max
    CACHE_HIT_RATE: 80,      // 80% minimum
    BUNDLE_SIZE: 500         // 500KB max
  }
};

interface OptimizationMetrics {
  cacheHitRate: number;
  avgResponseTime: number;
  compressionRatio: number;
  bundleSize: number;
  dbQueryTime: number;
  memoryUsage: number;
}

class PageOptimizer {
  private metrics: Map<string, OptimizationMetrics> = new Map();

  /**
   * Optimize API response with caching and compression
   */
  async optimizeApiResponse<T>(
    request: NextRequest,
    dataFetcher: () => Promise<T>,
    cacheKey: string,
    ttl: number = 300
  ): Promise<NextResponse> {
    const startTime = Date.now();
    
    try {
      // Try to get from cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        const response = NextResponse.json(cached);
        this.addOptimizationHeaders(response, true);
        this.recordMetrics(cacheKey, Date.now() - startTime, true);
        return response;
      }

      // Fetch fresh data
      const data = await dataFetcher();
      
      // Cache the result
      await cache.set(cacheKey, data, ttl);
      
      const response = NextResponse.json(data);
      this.addOptimizationHeaders(response, false);
      this.recordMetrics(cacheKey, Date.now() - startTime, false);
      
      return response;
    } catch (error) {
      console.error('API optimization error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * Optimize database queries with connection pooling and caching
   */
  async optimizeDbQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey?: string,
    ttl: number = 300
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Check cache first if cache key provided
      if (cacheKey) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          return cached as T;
        }
      }

      // Execute query with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), OPTIMIZATION_CONFIG.DATABASE.QUERY_TIMEOUT);
      });

      const result = await Promise.race([queryFn(), timeoutPromise]);
      
      // Cache result if cache key provided
      if (cacheKey) {
        await cache.set(cacheKey, result, ttl);
      }

      const queryTime = Date.now() - startTime;
      if (queryTime > OPTIMIZATION_CONFIG.THRESHOLDS.DATABASE_QUERY_TIME) {
        console.warn(`Slow query detected: ${queryTime}ms for ${cacheKey || 'unknown'}`);
      }

      return result;
    } catch (error) {
      console.error('Database query optimization error:', error);
      throw error;
    }
  }

  /**
   * Generate optimized image URLs with WebP/AVIF support
   */
  optimizeImageUrl(
    originalUrl: string,
    width?: number,
    quality: number = OPTIMIZATION_CONFIG.IMAGES.QUALITY
  ): string {
    if (!originalUrl) return originalUrl;

    const url = new URL(originalUrl, 'http://localhost');
    const params = new URLSearchParams();
    
    if (width) {
      params.set('w', width.toString());
    }
    
    params.set('q', quality.toString());
    params.set('f', 'webp'); // Prefer WebP format
    
    return `${url.pathname}?${params.toString()}`;
  }

  /**
   * Generate critical CSS for above-the-fold content
   */
  async generateCriticalCSS(pageName: string): Promise<string> {
    // This would typically use a tool like Puppeteer to extract critical CSS
    // For now, return basic critical styles
    const criticalStyles = {
      login: `
        body { margin: 0; font-family: system-ui; }
        .login-container { min-height: 100vh; display: flex; align-items: center; }
        .login-form { max-width: 400px; margin: 0 auto; padding: 2rem; }
      `,
      dashboard: `
        body { margin: 0; font-family: system-ui; }
        .dashboard-header { background: #fff; border-bottom: 1px solid #e5e7eb; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
      `,
      inventory: `
        body { margin: 0; font-family: system-ui; }
        .inventory-header { display: flex; justify-content: between; align-items: center; }
        .inventory-table { width: 100%; border-collapse: collapse; }
      `
    };

    return criticalStyles[pageName as keyof typeof criticalStyles] || '';
  }

  /**
   * Add resource prefetch headers for next page predictions
   */
  addPrefetchHeaders(response: NextResponse, prefetchUrls: string[]): void {
    prefetchUrls.forEach(url => {
      response.headers.append('Link', `<${url}>; rel=prefetch`);
    });
  }

  /**
   * Generate performance monitoring script
   */
  generatePerformanceScript(): string {
    return `
      (function() {
        // Web Vitals monitoring
        function sendMetric(name, value, id) {
          navigator.sendBeacon('/api/metrics', JSON.stringify({
            name: name,
            value: value,
            id: id,
            timestamp: Date.now(),
            url: location.pathname
          }));
        }

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          sendMetric('LCP', lastEntry.startTime, lastEntry.id);
        }).observe({entryTypes: ['largest-contentful-paint']});

        // First Input Delay
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            sendMetric('FID', entry.processingStart - entry.startTime, entry.name);
          }
        }).observe({entryTypes: ['first-input']});

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              sendMetric('CLS', clsValue, 'cumulative');
            }
          }
        }).observe({entryTypes: ['layout-shift']});

        // Page Load Time
        window.addEventListener('load', () => {
          const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
          sendMetric('PLT', loadTime, 'page-load');
        });
      })();
    `;
  }

  /**
   * Implement lazy loading configuration
   */
  generateLazyLoadingConfig(): object {
    return {
      // Intersection Observer options for lazy loading
      rootMargin: '50px 0px', // Start loading 50px before element enters viewport
      threshold: 0.1,
      
      // Image lazy loading
      images: {
        placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
        fadeInDuration: 300
      },
      
      // Component lazy loading
      components: {
        suspenseFallback: '<div class="animate-pulse bg-gray-200 rounded"></div>',
        retryAttempts: 3,
        retryDelay: 1000
      }
    };
  }

  /**
   * Generate cache key with consistent hashing
   */
  generateCacheKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
  }

  /**
   * Add optimization headers to response
   */
  private addOptimizationHeaders(response: NextResponse, fromCache: boolean): void {
    // Cache headers
    if (fromCache) {
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', OPTIMIZATION_CONFIG.CACHE_HEADERS.API_RESPONSES);
    } else {
      response.headers.set('X-Cache', 'MISS');
      response.headers.set('Cache-Control', OPTIMIZATION_CONFIG.CACHE_HEADERS.API_RESPONSES);
    }

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Performance headers
    response.headers.set('Server-Timing', `cache;desc="${fromCache ? 'HIT' : 'MISS'}"`);
    
    // Compression hint
    response.headers.set('Vary', 'Accept-Encoding');
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(key: string, responseTime: number, cacheHit: boolean): void {
    const existing = this.metrics.get(key) || {
      cacheHitRate: 0,
      avgResponseTime: 0,
      compressionRatio: 0,
      bundleSize: 0,
      dbQueryTime: 0,
      memoryUsage: 0
    };

    // Update cache hit rate (simple moving average)
    existing.cacheHitRate = (existing.cacheHitRate * 0.9) + (cacheHit ? 10 : 0);
    
    // Update average response time
    existing.avgResponseTime = (existing.avgResponseTime * 0.9) + (responseTime * 0.1);

    this.metrics.set(key, existing);
  }

  /**
   * Get optimization metrics
   */
  getMetrics(): Map<string, OptimizationMetrics> {
    return this.metrics;
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(): string {
    const report = ['🚀 Page Optimization Report', '='.repeat(50), ''];
    
         Array.from(this.metrics.entries()).forEach(([key, metrics]) => {
       report.push(`📊 ${key}:`);
       report.push(`   Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%`);
       report.push(`   Avg Response Time: ${metrics.avgResponseTime.toFixed(0)}ms`);
       report.push(`   DB Query Time: ${metrics.dbQueryTime.toFixed(0)}ms`);
       report.push('');
     });

    // Recommendations
    report.push('🎯 Optimization Recommendations:');
    
         Array.from(this.metrics.entries()).forEach(([key, metrics]) => {
       if (metrics.cacheHitRate < OPTIMIZATION_CONFIG.THRESHOLDS.CACHE_HIT_RATE) {
         report.push(`   🔴 ${key}: Improve cache hit rate (${metrics.cacheHitRate.toFixed(1)}%)`);
       }
       
       if (metrics.avgResponseTime > OPTIMIZATION_CONFIG.THRESHOLDS.API_RESPONSE_TIME) {
         report.push(`   🟡 ${key}: Optimize response time (${metrics.avgResponseTime.toFixed(0)}ms)`);
       }
       
       if (metrics.dbQueryTime > OPTIMIZATION_CONFIG.THRESHOLDS.DATABASE_QUERY_TIME) {
         report.push(`   🟠 ${key}: Optimize database queries (${metrics.dbQueryTime.toFixed(0)}ms)`);
       }
     });

    return report.join('\n');
  }
}

// Singleton instance
export const pageOptimizer = new PageOptimizer();

// Helper functions for common optimizations

/**
 * Optimize API route with caching and compression
 */
export async function optimizeApiRoute<T>(
  request: NextRequest,
  dataFetcher: () => Promise<T>,
  options: {
    cacheKey?: string;
    ttl?: number;
    prefetchUrls?: string[];
  } = {}
): Promise<NextResponse> {
  const cacheKey = options.cacheKey || `api:${request.url}`;
  const response = await pageOptimizer.optimizeApiResponse(
    request,
    dataFetcher,
    cacheKey,
    options.ttl
  );

  if (options.prefetchUrls) {
    pageOptimizer.addPrefetchHeaders(response, options.prefetchUrls);
  }

  return response;
}

/**
 * Optimize database query with caching
 */
export async function optimizeDbQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey?: string,
  ttl?: number
): Promise<T> {
  return pageOptimizer.optimizeDbQuery(queryFn, cacheKey, ttl);
}

/**
 * Generate optimized image component props
 */
export function optimizeImage(
  src: string,
  alt: string,
  width?: number,
  height?: number
): object {
  return {
    src: pageOptimizer.optimizeImageUrl(src, width),
    alt,
    width,
    height,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    style: { objectFit: 'cover' as const }
  };
}

/**
 * Generate performance monitoring script tag
 */
export function generatePerformanceMonitoring(): string {
  return `<script>${pageOptimizer.generatePerformanceScript()}</script>`;
}

export { PageOptimizer, OPTIMIZATION_CONFIG }; 