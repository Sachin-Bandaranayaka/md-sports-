/**
 * Performance monitoring utility for tracking function execution times
 * and identifying performance bottlenecks
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start timing a function or operation
   * @param name - Unique identifier for the timer
   * @param metadata - Optional metadata to store with the metric
   */
  startTimer(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.timers.set(name, performance.now());
    if (metadata) {
      console.log(`⏱️  Started: ${name}`, metadata);
    }
  }

  /**
   * End timing and record the metric
   * @param name - Timer identifier
   * @param metadata - Optional metadata to store with the metric
   * @returns Duration in milliseconds
   */
  endTimer(name: string, metadata?: Record<string, any>): number {
    if (!this.enabled) return 0;

    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`⚠️  Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      metadata
    };

    this.metrics.push(metric);

    // Log performance metric
    const color = duration > 1000 ? '🔴' : duration > 500 ? '🟡' : '🟢';
    console.log(`${color} Completed: ${name} - ${duration.toFixed(2)}ms`, metadata);

    return duration;
  }

  /**
   * Measure the execution time of an async function
   * @param name - Identifier for the measurement
   * @param fn - Async function to measure
   * @param metadata - Optional metadata
   * @returns Promise with the function result
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) return fn();

    this.startTimer(name, metadata);
    try {
      const result = await fn();
      this.endTimer(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endTimer(name, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Measure the execution time of a synchronous function
   * @param name - Identifier for the measurement
   * @param fn - Function to measure
   * @param metadata - Optional metadata
   * @returns Function result
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    if (!this.enabled) return fn();

    this.startTimer(name, metadata);
    try {
      const result = fn();
      this.endTimer(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endTimer(name, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   * @returns Array of performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics filtered by name pattern
   * @param pattern - String or regex pattern to match
   * @returns Filtered metrics
   */
  getMetricsByName(pattern: string | RegExp): PerformanceMetric[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.metrics.filter(metric => regex.test(metric.name));
  }

  /**
   * Get performance statistics for a specific metric name
   * @param name - Metric name
   * @returns Statistics object
   */
  getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    total: number;
  } {
    const metrics = this.metrics.filter(m => m.name === name);

    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, total: 0 };
    }

    const durations = metrics.map(m => m.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);

    return {
      count: metrics.length,
      avg: total / metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      total
    };
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Generate a performance report
   * @returns Formatted performance report
   */
  generateReport(): string {
    if (this.metrics.length === 0) {
      return 'No performance metrics recorded.';
    }

    const uniqueNames = [...new Set(this.metrics.map(m => m.name))];
    const report = ['\n📊 Performance Report', '='.repeat(50)];

    uniqueNames.forEach(name => {
      const stats = this.getStats(name);
      report.push(
        `\n🔍 ${name}:`,
        `   Count: ${stats.count}`,
        `   Average: ${stats.avg.toFixed(2)}ms`,
        `   Min: ${stats.min.toFixed(2)}ms`,
        `   Max: ${stats.max.toFixed(2)}ms`,
        `   Total: ${stats.total.toFixed(2)}ms`
      );
    });

    return report.join('\n');
  }

  /**
   * Enable or disable performance monitoring
   * @param enabled - Whether to enable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if performance monitoring is enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export convenience functions
export const startTimer = (name: string, metadata?: Record<string, any>) =>
  performanceMonitor.startTimer(name, metadata);

export const endTimer = (name: string, metadata?: Record<string, any>) =>
  performanceMonitor.endTimer(name, metadata);

export const measureAsync = <T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
) => performanceMonitor.measureAsync(name, fn, metadata);

export const measureSync = <T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
) => performanceMonitor.measureSync(name, fn, metadata);

// Export types
export type { PerformanceMetric };