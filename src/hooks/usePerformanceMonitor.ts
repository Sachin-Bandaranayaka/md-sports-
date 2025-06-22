import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  // Web Vitals
  lcp?: number; // Largest Contentful Paint
  fcp?: number; // First Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime?: number;
  apiResponseTime?: number;
  cacheHitRate?: number;
  
  // Navigation timing
  domContentLoaded?: number;
  loadComplete?: number;
  
  // Resource timing
  totalResources?: number;
  totalResourceSize?: number;
}

interface PerformanceHookResult {
  metrics: PerformanceMetrics;
  startMeasurement: (name: string) => void;
  endMeasurement: (name: string) => number;
  trackApiCall: (url: string, responseTime: number, fromCache?: boolean) => void;
  getPerformanceGrade: () => 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

export const usePerformanceMonitor = (): PerformanceHookResult => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [measurements, setMeasurements] = useState<Map<string, number>>(new Map());
  const [apiCalls, setApiCalls] = useState<Array<{ url: string; time: number; cached: boolean }>>([]);

  // Start a performance measurement
  const startMeasurement = useCallback((name: string) => {
    const startTime = performance.now();
    setMeasurements(prev => new Map(prev).set(name, startTime));
  }, []);

  // End a performance measurement and return duration
  const endMeasurement = useCallback((name: string): number => {
    const endTime = performance.now();
    const startTime = measurements.get(name);
    
    if (startTime) {
      const duration = endTime - startTime;
      setMeasurements(prev => {
        const newMap = new Map(prev);
        newMap.delete(name);
        return newMap;
      });
      return duration;
    }
    
    return 0;
  }, [measurements]);

  // Track API call performance
  const trackApiCall = useCallback((url: string, responseTime: number, fromCache = false) => {
    setApiCalls(prev => [...prev, { url, time: responseTime, cached: fromCache }]);
    
    // Update average API response time
    setMetrics(prev => {
      const allCalls = [...apiCalls, { url, time: responseTime, cached: fromCache }];
      const avgResponseTime = allCalls.reduce((sum, call) => sum + call.time, 0) / allCalls.length;
      const cacheHitRate = (allCalls.filter(call => call.cached).length / allCalls.length) * 100;
      
      return {
        ...prev,
        apiResponseTime: avgResponseTime,
        cacheHitRate
      };
    });
  }, [apiCalls]);

  // Get performance grade based on metrics
  const getPerformanceGrade = useCallback((): 'excellent' | 'good' | 'needs-improvement' | 'poor' => {
    const { lcp, fcp, cls, pageLoadTime } = metrics;
    
    let score = 0;
    let totalChecks = 0;
    
    // LCP scoring (2.5s excellent, 4s good)
    if (lcp !== undefined) {
      totalChecks++;
      if (lcp <= 2500) score += 4;
      else if (lcp <= 4000) score += 3;
      else if (lcp <= 6000) score += 2;
      else score += 1;
    }
    
    // FCP scoring (1.8s excellent, 3s good)
    if (fcp !== undefined) {
      totalChecks++;
      if (fcp <= 1800) score += 4;
      else if (fcp <= 3000) score += 3;
      else if (fcp <= 4500) score += 2;
      else score += 1;
    }
    
    // CLS scoring (0.1 excellent, 0.25 good)
    if (cls !== undefined) {
      totalChecks++;
      if (cls <= 0.1) score += 4;
      else if (cls <= 0.25) score += 3;
      else if (cls <= 0.4) score += 2;
      else score += 1;
    }
    
    // Page load time scoring (1s excellent, 3s good)
    if (pageLoadTime !== undefined) {
      totalChecks++;
      if (pageLoadTime <= 1000) score += 4;
      else if (pageLoadTime <= 3000) score += 3;
      else if (pageLoadTime <= 5000) score += 2;
      else score += 1;
    }
    
    if (totalChecks === 0) return 'poor';
    
    const avgScore = score / totalChecks;
    
    if (avgScore >= 3.5) return 'excellent';
    if (avgScore >= 2.5) return 'good';
    if (avgScore >= 1.5) return 'needs-improvement';
    return 'poor';
  }, [metrics]);

  // Collect Web Vitals and navigation timing
  useEffect(() => {
    // Navigation Timing API
    const updateNavigationMetrics = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          setMetrics(prev => ({
            ...prev,
            ttfb: navigation.responseStart - navigation.requestStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
            loadComplete: navigation.loadEventEnd - navigation.startTime,
            pageLoadTime: navigation.loadEventEnd - navigation.startTime
          }));
        }
      }
    };

    // Resource Timing API
    const updateResourceMetrics = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const resources = performance.getEntriesByType('resource');
        const totalSize = resources.reduce((sum, resource: any) => {
          return sum + (resource.transferSize || 0);
        }, 0);
        
        setMetrics(prev => ({
          ...prev,
          totalResources: resources.length,
          totalResourceSize: totalSize
        }));
      }
    };

    // Web Vitals (simplified implementation)
    const observeWebVitals = () => {
      if (typeof window !== 'undefined') {
        // Largest Contentful Paint
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // First Contentful Paint
            const fcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
              if (fcpEntry) {
                setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
              }
            });
            fcpObserver.observe({ entryTypes: ['paint'] });

            // Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
              let clsValue = 0;
              for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  clsValue += (entry as any).value;
                }
              }
              setMetrics(prev => ({ ...prev, cls: clsValue }));
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const firstInput = entries[0];
              if (firstInput) {
                const fid = (firstInput as any).processingStart - firstInput.startTime;
                setMetrics(prev => ({ ...prev, fid }));
              }
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
          } catch (error) {
            console.warn('PerformanceObserver not fully supported:', error);
          }
        }
      }
    };

    // Wait for page load to collect metrics
    if (document.readyState === 'complete') {
      updateNavigationMetrics();
      updateResourceMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          updateNavigationMetrics();
          updateResourceMetrics();
        }, 0);
      });
    }

    observeWebVitals();
  }, []);

  return {
    metrics,
    startMeasurement,
    endMeasurement,
    trackApiCall,
    getPerformanceGrade
  };
};

export default usePerformanceMonitor; 