import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

// Health check types
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  duration: number;
  details?: any;
  error?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
    disk: HealthCheckResult;
    external_apis: HealthCheckResult;
    cache: HealthCheckResult;
  };
  metadata: {
    version: string;
    environment: string;
    uptime: number;
    node_version: string;
  };
}

// Health check implementations
class HealthChecker {
  private prisma: PrismaClient;
  private startTime: number;

  constructor() {
    this.prisma = new PrismaClient();
    this.startTime = Date.now();
  }

  async checkDatabase(): Promise<HealthCheckResult> {
    const start = performance.now();
    
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Test read performance
      const userCount = await this.prisma.user.count();
      
      // Test write performance (if needed)
      // await this.prisma.$executeRaw`SELECT pg_stat_reset()`;
      
      const duration = performance.now() - start;
      
      return {
        status: duration < 1000 ? 'healthy' : duration < 3000 ? 'degraded' : 'unhealthy',
        timestamp: new Date().toISOString(),
        duration,
        details: {
          userCount,
          connectionPool: {
            // Add connection pool stats if available
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  async checkMemory(): Promise<HealthCheckResult> {
    const start = performance.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      const duration = performance.now() - start;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (memoryUsagePercent > 90) status = 'unhealthy';
      else if (memoryUsagePercent > 75) status = 'degraded';
      
      return {
        status,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
          heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
          usagePercent: Math.round(memoryUsagePercent),
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown memory error'
      };
    }
  }

  async checkDisk(): Promise<HealthCheckResult> {
    const start = performance.now();
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Check if we can write to temp directory
      const tempFile = path.join(process.cwd(), 'temp-health-check.txt');
      const testData = 'health-check-' + Date.now();
      
      await fs.writeFile(tempFile, testData);
      const readData = await fs.readFile(tempFile, 'utf-8');
      await fs.unlink(tempFile);
      
      const duration = performance.now() - start;
      
      const isHealthy = readData === testData;
      
      return {
        status: isHealthy ? (duration < 100 ? 'healthy' : 'degraded') : 'unhealthy',
        timestamp: new Date().toISOString(),
        duration,
        details: {
          writeTest: isHealthy,
          workingDirectory: process.cwd()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown disk error'
      };
    }
  }

  async checkExternalAPIs(): Promise<HealthCheckResult> {
    const start = performance.now();
    
    try {
      const checks = [];
      
      // Example: Check payment gateway
      // if (process.env.PAYMENT_GATEWAY_URL) {
      //   const paymentCheck = await fetch(`${process.env.PAYMENT_GATEWAY_URL}/health`, {
      //     method: 'GET',
      //     timeout: 5000
      //   });
      //   checks.push({
      //     service: 'payment_gateway',
      //     status: paymentCheck.ok ? 'healthy' : 'unhealthy',
      //     responseTime: paymentCheck.headers.get('x-response-time')
      //   });
      // }
      
      // Example: Check email service
      // if (process.env.EMAIL_SERVICE_URL) {
      //   const emailCheck = await fetch(`${process.env.EMAIL_SERVICE_URL}/health`, {
      //     method: 'GET',
      //     timeout: 5000
      //   });
      //   checks.push({
      //     service: 'email_service',
      //     status: emailCheck.ok ? 'healthy' : 'unhealthy'
      //   });
      // }
      
      const duration = performance.now() - start;
      
      // Determine overall status
      const unhealthyServices = checks.filter(c => c.status === 'unhealthy');
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (unhealthyServices.length > 0) {
        status = unhealthyServices.length === checks.length ? 'unhealthy' : 'degraded';
      }
      
      return {
        status,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          services: checks,
          totalServices: checks.length,
          healthyServices: checks.filter(c => c.status === 'healthy').length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown external API error'
      };
    }
  }

  async checkCache(): Promise<HealthCheckResult> {
    const start = performance.now();
    
    try {
      // If using Redis or other cache
      // const redis = new Redis(process.env.REDIS_URL);
      // await redis.set('health-check', 'test', 'EX', 10);
      // const result = await redis.get('health-check');
      // await redis.del('health-check');
      
      // For now, simulate cache check
      const testKey = 'health-check-' + Date.now();
      const testValue = 'test-value';
      
      // Simulate cache operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = performance.now() - start;
      
      return {
        status: duration < 100 ? 'healthy' : duration < 500 ? 'degraded' : 'unhealthy',
        timestamp: new Date().toISOString(),
        duration,
        details: {
          cacheType: 'memory', // or 'redis', 'memcached', etc.
          testKey,
          operations: ['set', 'get', 'delete']
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown cache error'
      };
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkExternalAPIs(),
      this.checkCache()
    ]);

    const [database, memory, disk, external_apis, cache] = checks;

    // Determine overall health
    const allStatuses = checks.map(c => c.status);
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (allStatuses.includes('unhealthy')) {
      overall = 'unhealthy';
    } else if (allStatuses.includes('degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        memory,
        disk,
        external_apis,
        cache
      },
      metadata: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Date.now() - this.startTime,
        node_version: process.version
      }
    };
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// Performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private readonly maxSamples = 100;

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const samples = this.metrics.get(name)!;
    samples.push(value);
    
    // Keep only the last N samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getMetricStats(name: string) {
    const samples = this.metrics.get(name) || [];
    
    if (samples.length === 0) {
      return null;
    }
    
    const sorted = [...samples].sort((a, b) => a - b);
    const sum = samples.reduce((a, b) => a + b, 0);
    
    return {
      count: samples.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / samples.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    
    for (const [name] of this.metrics) {
      result[name] = this.getMetricStats(name);
    }
    
    return result;
  }

  reset() {
    this.metrics.clear();
  }
}

// Error tracking
class ErrorTracker {
  private errors: Array<{
    timestamp: string;
    error: string;
    stack?: string;
    context?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> = [];
  
  private readonly maxErrors = 1000;

  trackError(
    error: Error | string, 
    context?: any, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      severity
    };
    
    this.errors.push(errorEntry);
    
    // Keep only the last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // Log critical errors immediately
    if (severity === 'critical') {
      console.error('CRITICAL ERROR:', errorEntry);
      // Here you could send to external monitoring service
      // await this.sendToMonitoringService(errorEntry);
    }
  }

  getRecentErrors(limit = 50) {
    return this.errors
      .slice(-limit)
      .reverse(); // Most recent first
  }

  getErrorStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    const recentErrors = this.errors.filter(
      e => now - new Date(e.timestamp).getTime() < oneHour
    );
    
    const dailyErrors = this.errors.filter(
      e => now - new Date(e.timestamp).getTime() < oneDay
    );
    
    return {
      total: this.errors.length,
      lastHour: recentErrors.length,
      lastDay: dailyErrors.length,
      bySeverity: {
        critical: this.errors.filter(e => e.severity === 'critical').length,
        high: this.errors.filter(e => e.severity === 'high').length,
        medium: this.errors.filter(e => e.severity === 'medium').length,
        low: this.errors.filter(e => e.severity === 'low').length
      }
    };
  }

  clearErrors() {
    this.errors = [];
  }
}

// Global instances
const healthChecker = new HealthChecker();
const performanceMonitor = new PerformanceMonitor();
const errorTracker = new ErrorTracker();

// API route handlers
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const check = url.searchParams.get('check');
    
    switch (check) {
      case 'health':
        const health = await healthChecker.getSystemHealth();
        return NextResponse.json(health, {
          status: health.overall === 'healthy' ? 200 : 
                 health.overall === 'degraded' ? 200 : 503
        });
        
      case 'metrics':
        const metrics = performanceMonitor.getAllMetrics();
        return NextResponse.json({
          timestamp: new Date().toISOString(),
          metrics
        });
        
      case 'errors':
        const errorStats = errorTracker.getErrorStats();
        const recentErrors = errorTracker.getRecentErrors(20);
        return NextResponse.json({
          timestamp: new Date().toISOString(),
          stats: errorStats,
          recentErrors
        });
        
      case 'ready':
        // Readiness probe - check if app is ready to serve traffic
        const dbCheck = await healthChecker.checkDatabase();
        return NextResponse.json(
          { ready: dbCheck.status !== 'unhealthy' },
          { status: dbCheck.status !== 'unhealthy' ? 200 : 503 }
        );
        
      case 'live':
        // Liveness probe - check if app is alive
        return NextResponse.json(
          { alive: true, timestamp: new Date().toISOString() },
          { status: 200 }
        );
        
      default:
        // Default health check
        const quickHealth = await healthChecker.getSystemHealth();
        return NextResponse.json({
          status: quickHealth.overall,
          timestamp: quickHealth.timestamp,
          uptime: quickHealth.metadata.uptime
        });
    }
  } catch (error) {
    errorTracker.trackError(error as Error, { endpoint: 'health-check' }, 'high');
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

// Middleware for performance monitoring
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  metricName: string
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    
    try {
      const result = fn(...args);
      
      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result
          .then(value => {
            performanceMonitor.recordMetric(metricName, performance.now() - start);
            return value;
          })
          .catch(error => {
            performanceMonitor.recordMetric(`${metricName}_error`, performance.now() - start);
            errorTracker.trackError(error, { function: metricName });
            throw error;
          });
      } else {
        performanceMonitor.recordMetric(metricName, performance.now() - start);
        return result;
      }
    } catch (error) {
      performanceMonitor.recordMetric(`${metricName}_error`, performance.now() - start);
      errorTracker.trackError(error as Error, { function: metricName });
      throw error;
    }
  }) as T;
}

// Export instances for use in other parts of the application
export {
  healthChecker,
  performanceMonitor,
  errorTracker,
  HealthChecker,
  PerformanceMonitor,
  ErrorTracker
};

// Cleanup function for graceful shutdown
export async function cleanup() {
  await healthChecker.cleanup();
  performanceMonitor.reset();
  errorTracker.clearErrors();
}

// Process event handlers for monitoring
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (error) => {
    errorTracker.trackError(error, { type: 'uncaughtException' }, 'critical');
    console.error('Uncaught Exception:', error);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    errorTracker.trackError(
      reason instanceof Error ? reason : new Error(String(reason)),
      { type: 'unhandledRejection', promise },
      'critical'
    );
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, cleaning up...');
    await cleanup();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('SIGINT received, cleaning up...');
    await cleanup();
    process.exit(0);
  });
}