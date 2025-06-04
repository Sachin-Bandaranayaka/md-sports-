/**
 * Transfer Performance Monitor
 * Tracks and analyzes performance metrics for inventory transfer operations
 */

import { PerformanceMonitor } from './performance';
import { transferCacheService } from './transferCache';

interface TransferMetrics {
  operationType: 'create' | 'complete' | 'cancel' | 'list' | 'detail' | 'batch';
  duration: number;
  itemCount?: number;
  shopCount?: number;
  success: boolean;
  errorType?: string;
  cacheHit?: boolean;
  timestamp: number;
}

interface TransferPerformanceStats {
  totalOperations: number;
  averageDuration: number;
  successRate: number;
  cacheHitRate: number;
  operationBreakdown: Record<string, {
    count: number;
    averageDuration: number;
    successRate: number;
  }>;
  recentErrors: Array<{
    timestamp: number;
    operation: string;
    error: string;
    duration: number;
  }>;
  performanceTrends: Array<{
    timestamp: number;
    averageDuration: number;
    operationCount: number;
  }>;
}

class TransferPerformanceMonitor {
  private metrics: TransferMetrics[] = [];
  private maxMetricsHistory = 1000;
  private performanceMonitor: PerformanceMonitor;
  private alertThresholds = {
    slowOperationMs: 5000, // 5 seconds
    highErrorRate: 0.1, // 10%
    lowCacheHitRate: 0.5 // 50%
  };

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.startPeriodicCleanup();
  }

  /**
   * Start tracking a transfer operation
   */
  startOperation(operationType: TransferMetrics['operationType'], metadata?: {
    itemCount?: number;
    shopCount?: number;
  }) {
    const timer = this.performanceMonitor.startTimer(`transfer-${operationType}`);

    return {
      timer,
      end: (success: boolean, errorType?: string, cacheHit?: boolean) => {
        const duration = this.performanceMonitor.endTimer(timer);

        this.recordMetric({
          operationType,
          duration,
          itemCount: metadata?.itemCount,
          shopCount: metadata?.shopCount,
          success,
          errorType,
          cacheHit,
          timestamp: Date.now()
        });

        // Check for performance alerts
        this.checkPerformanceAlerts(operationType, duration, success);

        return duration;
      }
    };
  }

  /**
   * Record a transfer operation metric
   */
  private recordMetric(metric: TransferMetrics) {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log slow operations
    if (metric.duration > this.alertThresholds.slowOperationMs) {
      console.warn(`🐌 Slow transfer operation detected:`, {
        operation: metric.operationType,
        duration: `${metric.duration}ms`,
        itemCount: metric.itemCount,
        shopCount: metric.shopCount,
        success: metric.success
      });
    }
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(operationType: string, duration: number, success: boolean) {
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    const operationMetrics = recentMetrics.filter(m => m.operationType === operationType);

    if (operationMetrics.length >= 5) {
      const errorRate = operationMetrics.filter(m => !m.success).length / operationMetrics.length;

      if (errorRate > this.alertThresholds.highErrorRate) {
        console.error(`🚨 High error rate detected for ${operationType}:`, {
          errorRate: `${(errorRate * 100).toFixed(1)}%`,
          recentOperations: operationMetrics.length,
          timeWindow: '5 minutes'
        });
      }
    }

    // Check cache hit rate
    const cacheableOperations = recentMetrics.filter(m =>
      ['list', 'detail'].includes(m.operationType) && m.cacheHit !== undefined
    );

    if (cacheableOperations.length >= 10) {
      const cacheHitRate = cacheableOperations.filter(m => m.cacheHit).length / cacheableOperations.length;

      if (cacheHitRate < this.alertThresholds.lowCacheHitRate) {
        console.warn(`📊 Low cache hit rate detected:`, {
          cacheHitRate: `${(cacheHitRate * 100).toFixed(1)}%`,
          operations: cacheableOperations.length,
          timeWindow: '5 minutes'
        });
      }
    }
  }

  /**
   * Get metrics from a specific time window
   */
  private getRecentMetrics(timeWindowMs: number): TransferMetrics[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Get comprehensive performance statistics
   */
  getPerformanceStats(timeWindowMs: number = 60 * 60 * 1000): TransferPerformanceStats {
    const recentMetrics = this.getRecentMetrics(timeWindowMs);

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        cacheHitRate: 0,
        operationBreakdown: {},
        recentErrors: [],
        performanceTrends: []
      };
    }

    const totalOperations = recentMetrics.length;
    const averageDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const successRate = recentMetrics.filter(m => m.success).length / totalOperations;

    const cacheableMetrics = recentMetrics.filter(m => m.cacheHit !== undefined);
    const cacheHitRate = cacheableMetrics.length > 0
      ? cacheableMetrics.filter(m => m.cacheHit).length / cacheableMetrics.length
      : 0;

    // Operation breakdown
    const operationBreakdown: Record<string, any> = {};
    const operationTypes = [...new Set(recentMetrics.map(m => m.operationType))];

    for (const opType of operationTypes) {
      const opMetrics = recentMetrics.filter(m => m.operationType === opType);
      operationBreakdown[opType] = {
        count: opMetrics.length,
        averageDuration: opMetrics.reduce((sum, m) => sum + m.duration, 0) / opMetrics.length,
        successRate: opMetrics.filter(m => m.success).length / opMetrics.length
      };
    }

    // Recent errors
    const recentErrors = recentMetrics
      .filter(m => !m.success)
      .slice(-10)
      .map(m => ({
        timestamp: m.timestamp,
        operation: m.operationType,
        error: m.errorType || 'Unknown error',
        duration: m.duration
      }));

    // Performance trends (hourly buckets)
    const performanceTrends = this.calculatePerformanceTrends(recentMetrics);

    return {
      totalOperations,
      averageDuration,
      successRate,
      cacheHitRate,
      operationBreakdown,
      recentErrors,
      performanceTrends
    };
  }

  /**
   * Calculate performance trends over time
   */
  private calculatePerformanceTrends(metrics: TransferMetrics[]): Array<{
    timestamp: number;
    averageDuration: number;
    operationCount: number;
  }> {
    const hourlyBuckets = new Map<number, TransferMetrics[]>();

    // Group metrics by hour
    for (const metric of metrics) {
      const hourBucket = Math.floor(metric.timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
      if (!hourlyBuckets.has(hourBucket)) {
        hourlyBuckets.set(hourBucket, []);
      }
      hourlyBuckets.get(hourBucket)!.push(metric);
    }

    // Calculate trends
    const trends = Array.from(hourlyBuckets.entries())
      .map(([timestamp, bucketMetrics]) => ({
        timestamp,
        averageDuration: bucketMetrics.reduce((sum, m) => sum + m.duration, 0) / bucketMetrics.length,
        operationCount: bucketMetrics.length
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return trends;
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): Array<{
    type: 'warning' | 'info' | 'critical';
    message: string;
    action?: string;
  }> {
    const stats = this.getPerformanceStats();
    const recommendations: Array<{
      type: 'warning' | 'info' | 'critical';
      message: string;
      action?: string;
    }> = [];

    // Check average duration
    if (stats.averageDuration > 3000) {
      recommendations.push({
        type: 'warning',
        message: `Average operation duration is ${stats.averageDuration.toFixed(0)}ms`,
        action: 'Consider optimizing database queries or adding more caching'
      });
    }

    // Check success rate
    if (stats.successRate < 0.95) {
      recommendations.push({
        type: 'critical',
        message: `Success rate is ${(stats.successRate * 100).toFixed(1)}%`,
        action: 'Investigate recent errors and improve error handling'
      });
    }

    // Check cache hit rate
    if (stats.cacheHitRate < 0.7) {
      recommendations.push({
        type: 'info',
        message: `Cache hit rate is ${(stats.cacheHitRate * 100).toFixed(1)}%`,
        action: 'Consider increasing cache TTL or warming cache more frequently'
      });
    }

    // Check for slow operations
    const slowOperations = Object.entries(stats.operationBreakdown)
      .filter(([_, data]) => data.averageDuration > 2000);

    if (slowOperations.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `Slow operations detected: ${slowOperations.map(([op]) => op).join(', ')}`,
        action: 'Optimize these specific operations with batch processing or better indexing'
      });
    }

    return recommendations;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(timeWindowMs?: number): TransferMetrics[] {
    return timeWindowMs ? this.getRecentMetrics(timeWindowMs) : [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Start periodic cleanup of old metrics
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Get real-time performance dashboard data
   */
  getDashboardData() {
    const last5Minutes = this.getPerformanceStats(5 * 60 * 1000);
    const lastHour = this.getPerformanceStats(60 * 60 * 1000);
    const last24Hours = this.getPerformanceStats(24 * 60 * 60 * 1000);

    return {
      current: {
        activeOperations: this.performanceMonitor.getActiveTimers().length,
        cacheStats: transferCacheService.getStats()
      },
      last5Minutes,
      lastHour,
      last24Hours,
      recommendations: this.getPerformanceRecommendations()
    };
  }
}

// Global instance
export const transferPerformanceMonitor = new TransferPerformanceMonitor();

// Utility functions for easy usage
export const trackTransferOperation = (
  operationType: TransferMetrics['operationType'],
  metadata?: { itemCount?: number; shopCount?: number }
) => {
  return transferPerformanceMonitor.startOperation(operationType, metadata);
};

export const getTransferPerformanceStats = (timeWindowMs?: number) => {
  return transferPerformanceMonitor.getPerformanceStats(timeWindowMs);
};

export const getTransferDashboardData = () => {
  return transferPerformanceMonitor.getDashboardData();
};

// Export types
export type {
  TransferMetrics,
  TransferPerformanceStats
};