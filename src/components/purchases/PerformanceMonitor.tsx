'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, Database, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  pageName: string;
  showDetails?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export default function PerformanceMonitor({
  pageName,
  showDetails = false,
  onMetricsUpdate
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(showDetails);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;

    const newMetrics: PerformanceMetrics = {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
      apiResponseTime: getAverageApiResponseTime(),
      renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0, // MB
      cacheHitRate: getCacheHitRate(),
      errorRate: getErrorRate(),
      timestamp: Date.now()
    };

    setMetrics(newMetrics);
    setHistory(prev => [...prev.slice(-9), newMetrics]); // Keep last 10 entries

    if (onMetricsUpdate) {
      onMetricsUpdate(newMetrics);
    }
  }, [onMetricsUpdate]);

  // Get average API response time from performance entries
  const getAverageApiResponseTime = useCallback(() => {
    const apiCalls = performance.getEntriesByType('fetch') as PerformanceResourceTiming[];
    if (apiCalls.length === 0) return 0;

    const totalTime = apiCalls.reduce((sum, entry) => {
      return sum + (entry.responseEnd - entry.requestStart);
    }, 0);

    return totalTime / apiCalls.length;
  }, []);

  // Simulate cache hit rate (in real app, this would come from your caching layer)
  const getCacheHitRate = useCallback(() => {
    // This is a simulation - in real implementation, you'd track actual cache hits
    const cacheEntries = performance.getEntriesByType('resource').filter(
      entry => entry.transferSize === 0 && entry.decodedBodySize > 0
    );
    const totalEntries = performance.getEntriesByType('resource').length;

    return totalEntries > 0 ? (cacheEntries.length / totalEntries) * 100 : 0;
  }, []);

  // Simulate error rate (in real app, this would come from error tracking)
  const getErrorRate = useCallback(() => {
    // This is a simulation - in real implementation, you'd track actual errors
    return Math.random() * 2; // 0-2% error rate
  }, []);

  // Collect metrics on mount and periodically
  useEffect(() => {
    const timer = setTimeout(collectMetrics, 1000); // Initial collection after 1s
    const interval = setInterval(collectMetrics, 30000); // Update every 30s

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [collectMetrics]);

  // Performance status based on metrics
  const getPerformanceStatus = useCallback((metrics: PerformanceMetrics) => {
    const score = calculatePerformanceScore(metrics);

    if (score >= 90) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 75) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 60) return { status: 'fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'poor', color: 'text-red-600', bg: 'bg-red-50' };
  }, []);

  // Calculate overall performance score
  const calculatePerformanceScore = useCallback((metrics: PerformanceMetrics) => {
    let score = 100;

    // Page load time penalty
    if (metrics.pageLoadTime > 3000) score -= 20;
    else if (metrics.pageLoadTime > 2000) score -= 10;
    else if (metrics.pageLoadTime > 1000) score -= 5;

    // API response time penalty
    if (metrics.apiResponseTime > 1000) score -= 15;
    else if (metrics.apiResponseTime > 500) score -= 8;
    else if (metrics.apiResponseTime > 200) score -= 3;

    // Memory usage penalty
    if (metrics.memoryUsage > 100) score -= 15;
    else if (metrics.memoryUsage > 50) score -= 8;
    else if (metrics.memoryUsage > 25) score -= 3;

    // Cache hit rate bonus/penalty
    if (metrics.cacheHitRate > 80) score += 5;
    else if (metrics.cacheHitRate < 50) score -= 10;

    // Error rate penalty
    if (metrics.errorRate > 5) score -= 20;
    else if (metrics.errorRate > 2) score -= 10;
    else if (metrics.errorRate > 1) score -= 5;

    return Math.max(0, Math.min(100, score));
  }, []);

  if (!metrics) {
    return null;
  }

  const performanceStatus = getPerformanceStatus(metrics);
  const score = calculatePerformanceScore(metrics);

  return (
    <>
      {/* Performance Badge */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(!isVisible)}
          variant="outline"
          size="sm"
          className={`${performanceStatus.bg} ${performanceStatus.color} border-current shadow-lg`}
        >
          <Activity className="h-4 w-4 mr-2" />
          {score}%
        </Button>
      </div>

      {/* Detailed Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Performance Monitor
              </h3>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-1">{pageName}</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Overall Score */}
            <div className={`p-3 rounded-lg ${performanceStatus.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Overall Score</span>
                <span className={`text-lg font-bold ${performanceStatus.color}`}>
                  {score}%
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1 capitalize">
                {performanceStatus.status} performance
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Page Load Time */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-xs text-gray-600">Load Time</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {(metrics.pageLoadTime / 1000).toFixed(2)}s
                </div>
              </div>

              {/* API Response Time */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Database className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-gray-600">API Time</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {metrics.apiResponseTime.toFixed(0)}ms
                </div>
              </div>

              {/* Memory Usage */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Zap className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-xs text-gray-600">Memory</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {metrics.memoryUsage.toFixed(1)}MB
                </div>
              </div>

              {/* Cache Hit Rate */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-xs text-gray-600">Cache Hit</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {metrics.cacheHitRate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Error Rate */}
            {metrics.errorRate > 0 && (
              <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">Error Rate</span>
                </div>
                <span className="text-sm font-semibold text-red-700">
                  {metrics.errorRate.toFixed(2)}%
                </span>
              </div>
            )}

            {/* Performance Tips */}
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-medium">Optimization Tips:</div>
              {score < 90 && (
                <ul className="space-y-1 ml-2">
                  {metrics.pageLoadTime > 2000 && (
                    <li>• Consider code splitting or lazy loading</li>
                  )}
                  {metrics.apiResponseTime > 500 && (
                    <li>• Optimize API queries or add caching</li>
                  )}
                  {metrics.memoryUsage > 50 && (
                    <li>• Check for memory leaks or large objects</li>
                  )}
                  {metrics.cacheHitRate < 70 && (
                    <li>• Improve caching strategy</li>
                  )}
                </ul>
              )}
              {score >= 90 && (
                <div className="text-green-600">✓ Excellent performance!</div>
              )}
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hook for using performance monitoring
export function usePerformanceMonitoring(pageName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  const handleMetricsUpdate = useCallback((newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);

    // Log performance data (in production, send to analytics service)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metrics for ${pageName}:`, newMetrics);
    }
  }, [pageName]);

  return {
    metrics,
    PerformanceMonitor: (props: Omit<PerformanceMonitorProps, 'pageName' | 'onMetricsUpdate'>) => (
      <PerformanceMonitor
        {...props}
        pageName={pageName}
        onMetricsUpdate={handleMetricsUpdate}
      />
    )
  };
}