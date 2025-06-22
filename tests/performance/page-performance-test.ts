/**
 * Comprehensive Page Performance Testing Suite for MS Sport
 * Tests all pages for millisecond load times and optimization opportunities
 */

import { test, expect, Page, Browser } from '@playwright/test';

// Performance thresholds for millisecond load times
const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: {
    loadTime: 500,        // < 500ms
    lcp: 1200,           // < 1.2s
    fcp: 800,            // < 800ms
    cls: 0.1,            // < 0.1
    fid: 100             // < 100ms
  },
  GOOD: {
    loadTime: 1000,       // < 1s
    lcp: 2500,           // < 2.5s
    fcp: 1800,           // < 1.8s
    cls: 0.25,           // < 0.25
    fid: 300             // < 300ms
  },
  ACCEPTABLE: {
    loadTime: 3000,       // < 3s
    lcp: 4000,           // < 4s
    fcp: 3000,           // < 3s
    cls: 0.5,            // < 0.5
    fid: 500             // < 500ms
  }
};

// All pages to test in MS Sport system
const PAGES_TO_TEST = [
  { name: 'Login', url: '/login', requiresAuth: false },
  { name: 'Dashboard', url: '/dashboard', requiresAuth: true },
  { name: 'Inventory', url: '/inventory', requiresAuth: true },
  { name: 'Inventory Optimized', url: '/inventory/optimized', requiresAuth: true },
  { name: 'Inventory Transfers', url: '/inventory/transfers', requiresAuth: true },
  { name: 'Invoices', url: '/invoices', requiresAuth: true },
  { name: 'Invoices Optimized', url: '/invoices/optimized', requiresAuth: true },
  { name: 'Customers', url: '/customers', requiresAuth: true },
  { name: 'Purchases', url: '/purchases', requiresAuth: true },
  { name: 'Purchases Optimized', url: '/purchases/optimized', requiresAuth: true },
  { name: 'Quotations', url: '/quotations', requiresAuth: true },
  { name: 'Receipts', url: '/receipts', requiresAuth: true },
  { name: 'Payments', url: '/payments', requiresAuth: true },
  { name: 'Reports', url: '/reports', requiresAuth: true },
  { name: 'Shops', url: '/shops', requiresAuth: true },
  { name: 'Suppliers', url: '/suppliers', requiresAuth: true },
  { name: 'Accounting', url: '/accounting', requiresAuth: true }
];

interface PerformanceMetrics {
  pageName: string;
  url: string;
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
  apiResponseTimes: number[];
  avgApiResponseTime: number;
  cacheHitRate: number;
  networkRequests: number;
  bundleSize: number;
  memoryUsage: number;
  timestamp: Date;
}

interface OptimizationSuggestion {
  category: 'critical' | 'important' | 'minor';
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

class PagePerformanceTester {
  private performanceData: PerformanceMetrics[] = [];

  /**
   * Measure comprehensive performance metrics for a page
   */
  async measurePagePerformance(page: Page, pageName: string, url: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    // Clear any existing performance data
    await page.evaluate(() => {
      if (window.performance) {
        window.performance.clearMarks();
        window.performance.clearMeasures();
      }
    });

    // Navigate to page and wait for load
    await page.goto(`http://localhost:3000${url}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for page to be fully interactive
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for any async operations

    // Collect Web Vitals and performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        // Get navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        // Get paint timings
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
        
        // Get resource timings for API calls
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const apiCalls = resources.filter(resource => 
          resource.name.includes('/api/') || 
          resource.name.includes('localhost:3000/api')
        );
        
        const apiResponseTimes = apiCalls.map(call => call.responseEnd - call.requestStart);
        const avgApiResponseTime = apiResponseTimes.length > 0 
          ? apiResponseTimes.reduce((sum, time) => sum + time, 0) / apiResponseTimes.length 
          : 0;

        // Calculate cache hit rate (resources with transferSize 0 but decodedBodySize > 0)
        const cachedResources = resources.filter(resource => 
          resource.transferSize === 0 && resource.decodedBodySize > 0
        );
        const cacheHitRate = resources.length > 0 
          ? (cachedResources.length / resources.length) * 100 
          : 0;

        // Get memory usage if available
        const memory = (performance as any).memory;
        const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB

        // Calculate bundle size from resources
        const bundleSize = resources
          .filter(resource => resource.name.includes('.js') || resource.name.includes('.css'))
          .reduce((total, resource) => total + (resource.decodedBodySize || 0), 0) / 1024; // KB

                 const result = {
           loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
           firstContentfulPaint: fcp,
           largestContentfulPaint: 0, // Will be measured separately
           cumulativeLayoutShift: 0,  // Will be measured separately
           firstInputDelay: 0,        // Will be measured separately
           totalBlockingTime: 0,      // Will be calculated
           apiResponseTimes,
           avgApiResponseTime,
           cacheHitRate,
           networkRequests: resources.length,
           bundleSize,
           memoryUsage
         };

        resolve(result);
      });
    });

    // Measure LCP using PerformanceObserver
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lcpValue = 0;
        
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcpValue = lastEntry.startTime;
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Resolve after a short delay to capture LCP
          setTimeout(() => {
            observer.disconnect();
            resolve(lcpValue);
          }, 1000);
        } else {
          resolve(0);
        }
      });
    });

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          });
          
          observer.observe({ entryTypes: ['layout-shift'] });
          
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 1000);
        } else {
          resolve(0);
        }
      });
    });

    const performanceMetrics: PerformanceMetrics = {
      pageName,
      url,
      loadTime: metrics.loadTime,
      firstContentfulPaint: metrics.firstContentfulPaint,
      largestContentfulPaint: lcp,
      cumulativeLayoutShift: cls,
      firstInputDelay: 0, // Would need user interaction to measure
      totalBlockingTime: metrics.totalBlockingTime,
      apiResponseTimes: metrics.apiResponseTimes,
      avgApiResponseTime: metrics.avgApiResponseTime,
      cacheHitRate: metrics.cacheHitRate,
      networkRequests: metrics.networkRequests,
      bundleSize: metrics.bundleSize,
      memoryUsage: metrics.memoryUsage,
      timestamp: new Date()
    };

    this.performanceData.push(performanceMetrics);
    return performanceMetrics;
  }

  /**
   * Generate optimization suggestions based on performance metrics
   */
  generateOptimizationSuggestions(metrics: PerformanceMetrics): {
    critical: string[];
    important: string[];
    minor: string[];
  } {
    const suggestions = {
      critical: [] as string[],
      important: [] as string[],
      minor: [] as string[]
    };

    // Critical issues (prevent millisecond load times)
    if (metrics.loadTime > PERFORMANCE_THRESHOLDS.GOOD.loadTime) {
      suggestions.critical.push(`Page load time ${metrics.loadTime.toFixed(0)}ms exceeds 1s threshold`);
    }
    
    if (metrics.largestContentfulPaint > PERFORMANCE_THRESHOLDS.GOOD.lcp) {
      suggestions.critical.push(`LCP ${metrics.largestContentfulPaint.toFixed(0)}ms exceeds 2.5s threshold`);
    }

    if (metrics.avgApiResponseTime > 500) {
      suggestions.critical.push(`Average API response time ${metrics.avgApiResponseTime.toFixed(0)}ms is too slow`);
    }

    if (metrics.cacheHitRate < 50) {
      suggestions.critical.push(`Cache hit rate ${metrics.cacheHitRate.toFixed(1)}% is too low`);
    }

    // Important issues
    if (metrics.firstContentfulPaint > PERFORMANCE_THRESHOLDS.GOOD.fcp) {
      suggestions.important.push(`FCP ${metrics.firstContentfulPaint.toFixed(0)}ms could be improved`);
    }

    if (metrics.bundleSize > 1000) {
      suggestions.important.push(`Bundle size ${metrics.bundleSize.toFixed(0)}KB is large`);
    }

    if (metrics.networkRequests > 50) {
      suggestions.important.push(`${metrics.networkRequests} network requests could be reduced`);
    }

    // Minor issues
    if (metrics.cumulativeLayoutShift > PERFORMANCE_THRESHOLDS.EXCELLENT.cls) {
      suggestions.minor.push(`CLS ${metrics.cumulativeLayoutShift.toFixed(3)} could be improved`);
    }

    if (metrics.memoryUsage > 50) {
      suggestions.minor.push(`Memory usage ${metrics.memoryUsage.toFixed(1)}MB is high`);
    }

    return suggestions;
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(): string {
    const report = [`\n🚀 MS Sport Performance Test Report - ${new Date().toISOString()}\n`];
    report.push('=' + '='.repeat(70) + '\n');

    // Summary statistics
    const avgLoadTime = this.performanceData.reduce((sum, m) => sum + m.loadTime, 0) / this.performanceData.length;
    const avgLCP = this.performanceData.reduce((sum, m) => sum + m.largestContentfulPaint, 0) / this.performanceData.length;
    const avgCacheHitRate = this.performanceData.reduce((sum, m) => sum + m.cacheHitRate, 0) / this.performanceData.length;

    report.push(`📊 SUMMARY STATISTICS:`);
    report.push(`   Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
    report.push(`   Average LCP: ${avgLCP.toFixed(0)}ms`);
    report.push(`   Average Cache Hit Rate: ${avgCacheHitRate.toFixed(1)}%`);
    report.push(`   Pages Tested: ${this.performanceData.length}\n`);

    // Performance by page
    report.push(`📈 PERFORMANCE BY PAGE:`);
    report.push('-'.repeat(70));
    
    this.performanceData
      .sort((a, b) => a.loadTime - b.loadTime)
      .forEach(metrics => {
        const status = this.getPerformanceStatus(metrics);
        const suggestions = this.generateOptimizationSuggestions(metrics);
        
        report.push(`${status.emoji} ${metrics.pageName.padEnd(25)} | Load: ${metrics.loadTime.toFixed(0).padStart(4)}ms | LCP: ${metrics.largestContentfulPaint.toFixed(0).padStart(4)}ms | Cache: ${metrics.cacheHitRate.toFixed(0).padStart(2)}%`);
        
        if (suggestions.critical.length > 0) {
          suggestions.critical.forEach(issue => report.push(`     🔴 ${issue}`));
        }
      });

    // Optimization recommendations
    report.push(`\n🎯 OPTIMIZATION RECOMMENDATIONS:`);
    report.push('-'.repeat(70));
    
         const allCritical = this.performanceData.flatMap(m => this.generateOptimizationSuggestions(m).critical);
     const criticalIssues = Array.from(new Set(allCritical));
    
    if (criticalIssues.length > 0) {
      report.push(`🔴 CRITICAL ISSUES (${criticalIssues.length}):`);
      criticalIssues.forEach(issue => report.push(`   • ${issue}`));
      report.push('');
    }

    // Database optimization suggestions
    report.push(`💾 DATABASE OPTIMIZATION SUGGESTIONS:`);
    report.push(`   • Consider migrating from Supabase free tier to PlanetScale or Neon`);
    report.push(`   • Implement connection pooling with pgBouncer`);
    report.push(`   • Add database indexes for frequently queried columns`);
    report.push(`   • Use materialized views for complex aggregations`);
    report.push(`   • Implement read replicas for Singapore region\n`);

    // Caching improvements
    report.push(`⚡ CACHING IMPROVEMENTS:`);
    report.push(`   • Implement CDN for static assets (Cloudflare/AWS CloudFront)`);
    report.push(`   • Use Redis for session and API response caching`);
    report.push(`   • Implement browser caching headers`);
    report.push(`   • Add service worker for offline caching`);
    report.push(`   • Use React Query for client-side data caching\n`);

    return report.join('\n');
  }

  private getPerformanceStatus(metrics: PerformanceMetrics): { emoji: string; status: string } {
    if (metrics.loadTime <= PERFORMANCE_THRESHOLDS.EXCELLENT.loadTime && 
        metrics.largestContentfulPaint <= PERFORMANCE_THRESHOLDS.EXCELLENT.lcp) {
      return { emoji: '🟢', status: 'Excellent' };
    } else if (metrics.loadTime <= PERFORMANCE_THRESHOLDS.GOOD.loadTime && 
               metrics.largestContentfulPaint <= PERFORMANCE_THRESHOLDS.GOOD.lcp) {
      return { emoji: '🟡', status: 'Good' };
    } else if (metrics.loadTime <= PERFORMANCE_THRESHOLDS.ACCEPTABLE.loadTime) {
      return { emoji: '🟠', status: 'Acceptable' };
    } else {
      return { emoji: '🔴', status: 'Poor' };
    }
  }

  /**
   * Save performance data to file
   */
  async savePerformanceData(filename: string = 'performance-report.json'): Promise<void> {
    const fs = require('fs').promises;
    const data = {
      timestamp: new Date().toISOString(),
      summary: {
        avgLoadTime: this.performanceData.reduce((sum, m) => sum + m.loadTime, 0) / this.performanceData.length,
        avgLCP: this.performanceData.reduce((sum, m) => sum + m.largestContentfulPaint, 0) / this.performanceData.length,
        avgCacheHitRate: this.performanceData.reduce((sum, m) => sum + m.cacheHitRate, 0) / this.performanceData.length,
        pagesCount: this.performanceData.length
      },
      metrics: this.performanceData,
      thresholds: PERFORMANCE_THRESHOLDS
    };
    
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`📊 Performance data saved to ${filename}`);
  }
}

test.describe('Page Performance Testing', () => {
  let tester: PagePerformanceTester;

  test.beforeAll(() => {
    tester = new PagePerformanceTester();
  });

  // Test each page individually
  for (const pageConfig of PAGES_TO_TEST) {
    test(`Performance test: ${pageConfig.name}`, async ({ page, browser }) => {
      // Login first for protected pages
      if (pageConfig.requiresAuth) {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[name="email"]', 'admin@test.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
      }

      const metrics = await tester.measurePagePerformance(page, pageConfig.name, pageConfig.url);
      const suggestions = tester.generateOptimizationSuggestions(metrics);

      // Log performance metrics
      console.log(`\n📊 ${pageConfig.name} Performance:`);
      console.log(`   Load Time: ${metrics.loadTime.toFixed(0)}ms`);
      console.log(`   LCP: ${metrics.largestContentfulPaint.toFixed(0)}ms`);
      console.log(`   FCP: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
      console.log(`   Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%`);

      if (suggestions.critical.length > 0) {
        console.log(`   🔴 Critical Issues: ${suggestions.critical.length}`);
        suggestions.critical.forEach(issue => console.log(`      - ${issue}`));
      }

      // Performance assertions
      expect(metrics.loadTime).toBeLessThan(3000); // Fail if > 3 seconds
      expect(metrics.largestContentfulPaint).toBeLessThan(4000); // Fail if LCP > 4 seconds
      expect(metrics.cumulativeLayoutShift).toBeLessThan(0.25); // Fail if CLS > 0.25

      // Warn for suboptimal performance
      if (metrics.loadTime > 1000) {
        console.warn(`⚠️  ${pageConfig.name} load time is ${metrics.loadTime.toFixed(0)}ms - target is <500ms`);
      }
    });
  }

  test.afterAll(async () => {
    // Generate and save performance report
    const report = tester.generatePerformanceReport();
    console.log(report);
    
    await tester.savePerformanceData('test-results/performance-report.json');
  });
});

// Utility function to run performance tests programmatically
export async function runPerformanceTests(): Promise<void> {
  console.log('🚀 Starting MS Sport Performance Tests...\n');
  
  // This would be called by your CI/CD pipeline or npm script
  // The actual test execution happens through Playwright test runner
}

export { PagePerformanceTester, PERFORMANCE_THRESHOLDS, PAGES_TO_TEST }; 