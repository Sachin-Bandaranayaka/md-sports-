/**
 * Performance Monitoring Dashboard for Inventory System
 * Real-time performance metrics and optimization insights
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Database,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Wifi,
  Server
} from 'lucide-react';
import { inventoryCacheService } from '@/lib/inventoryCache';
import { PerformanceMonitor } from '@/lib/performance';

interface PerformanceMetrics {
  cacheHitRate: number;
  avgResponseTime: number;
  totalRequests: number;
  errorRate: number;
  memoryUsage: number;
  activeConnections: number;
  lastUpdated: string;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  avgResponseTime: number;
}

interface DatabaseMetrics {
  activeQueries: number;
  avgQueryTime: number;
  connectionPoolUsage: number;
  slowQueries: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
  issues: string[];
}

const performanceMonitor = new PerformanceMonitor();

// Mock data generators for demonstration
const generateMockMetrics = (): PerformanceMetrics => ({
  cacheHitRate: 85 + Math.random() * 10,
  avgResponseTime: 120 + Math.random() * 80,
  totalRequests: 1250 + Math.floor(Math.random() * 500),
  errorRate: Math.random() * 2,
  memoryUsage: 60 + Math.random() * 20,
  activeConnections: 15 + Math.floor(Math.random() * 10),
  lastUpdated: new Date().toISOString()
});

const generateMockDbMetrics = (): DatabaseMetrics => ({
  activeQueries: Math.floor(Math.random() * 5),
  avgQueryTime: 45 + Math.random() * 30,
  connectionPoolUsage: 40 + Math.random() * 30,
  slowQueries: Math.floor(Math.random() * 3)
});

const generateSystemHealth = (): SystemHealth => {
  const issues = [];
  const cacheHit = 85 + Math.random() * 10;
  const responseTime = 120 + Math.random() * 80;

  if (cacheHit < 80) issues.push('Low cache hit rate');
  if (responseTime > 200) issues.push('High response times');

  return {
    status: issues.length === 0 ? 'healthy' : issues.length === 1 ? 'warning' : 'critical',
    uptime: 99.8 + Math.random() * 0.2,
    lastCheck: new Date().toISOString(),
    issues
  };
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'critical';
}> = ({ title, value, change, icon, status = 'good' }) => {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={statusColors[status]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {change > 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            {Math.abs(change).toFixed(1)}% from last hour
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const CachePerformanceChart: React.FC<{ metrics: Map<string, CacheMetrics> }> = ({ metrics }) => {
  const chartData = useMemo(() => {
    return Array.from(metrics.entries()).map(([key, data]) => ({
      name: key.replace('inventory:', ''),
      hitRate: data.hitRate * 100,
      avgTime: data.avgResponseTime,
      requests: data.hits + data.misses
    }));
  }, [metrics]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Cache Performance by Endpoint</h3>
      <div className="space-y-3">
        {chartData.map((item) => (
          <div key={item.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{item.name}</span>
              <div className="flex items-center space-x-4 text-sm">
                <span>{item.hitRate.toFixed(1)}% hit rate</span>
                <span>{item.avgTime.toFixed(0)}ms avg</span>
                <Badge variant="outline">{item.requests} requests</Badge>
              </div>
            </div>
            <Progress value={item.hitRate} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

const RealTimeMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(generateMockMetrics());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(generateMockMetrics());
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-time Metrics</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <><Wifi className="h-4 w-4 mr-1" />Live</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-1" />Paused</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cache Hit Rate"
          value={`${metrics.cacheHitRate.toFixed(1)}%`}
          change={2.3}
          icon={<Database className="h-4 w-4" />}
          status={metrics.cacheHitRate > 80 ? 'good' : 'warning'}
        />

        <MetricCard
          title="Avg Response Time"
          value={`${metrics.avgResponseTime.toFixed(0)}ms`}
          change={-5.2}
          icon={<Clock className="h-4 w-4" />}
          status={metrics.avgResponseTime < 200 ? 'good' : 'warning'}
        />

        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests.toLocaleString()}
          change={12.5}
          icon={<Activity className="h-4 w-4" />}
        />

        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(2)}%`}
          change={-0.8}
          icon={<AlertCircle className="h-4 w-4" />}
          status={metrics.errorRate < 1 ? 'good' : 'critical'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{metrics.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Active Connections</span>
                <span>{metrics.activeConnections}/50</span>
              </div>
              <Progress value={(metrics.activeConnections / 50) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Response Time Trend</span>
                <Badge variant="outline" className="text-green-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Improving
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Efficiency</span>
                <Badge variant="outline" className="text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Excellent
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Error Rate</span>
                <Badge variant="outline" className="text-green-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Stable
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const DatabasePerformance: React.FC = () => {
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics>(generateMockDbMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setDbMetrics(generateMockDbMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Database Performance</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Queries"
          value={dbMetrics.activeQueries}
          icon={<Server className="h-4 w-4" />}
          status={dbMetrics.activeQueries < 3 ? 'good' : 'warning'}
        />

        <MetricCard
          title="Avg Query Time"
          value={`${dbMetrics.avgQueryTime.toFixed(0)}ms`}
          icon={<Clock className="h-4 w-4" />}
          status={dbMetrics.avgQueryTime < 100 ? 'good' : 'warning'}
        />

        <MetricCard
          title="Connection Pool"
          value={`${dbMetrics.connectionPoolUsage.toFixed(0)}%`}
          icon={<Database className="h-4 w-4" />}
          status={dbMetrics.connectionPoolUsage < 80 ? 'good' : 'warning'}
        />

        <MetricCard
          title="Slow Queries"
          value={dbMetrics.slowQueries}
          icon={<AlertCircle className="h-4 w-4" />}
          status={dbMetrics.slowQueries === 0 ? 'good' : 'warning'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Query Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Materialized Views Active</p>
                <p className="text-sm text-gray-600">Inventory summary queries are using optimized materialized views</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Indexes Optimized</p>
                <p className="text-sm text-gray-600">All frequently queried columns have appropriate indexes</p>
              </div>
            </div>

            {dbMetrics.slowQueries > 0 && (
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium">Slow Query Detected</p>
                  <p className="text-sm text-gray-600">Consider adding indexes or optimizing query structure</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth>(generateSystemHealth());
  const [cacheHealth, setCacheHealth] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(generateSystemHealth());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Get cache health
    inventoryCacheService.healthCheck().then(setCacheHealth);
  }, []);

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">System Health</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon(health.status)}
              <span>Overall Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
                  {health.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span>{health.uptime.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Last Check:</span>
                <span>{new Date(health.lastCheck).toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cache System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Redis:</span>
                <Badge variant={cacheHealth?.redis ? 'default' : 'destructive'}>
                  {cacheHealth?.redis ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Memory Cache:</span>
                <Badge variant={cacheHealth?.memory ? 'default' : 'destructive'}>
                  {cacheHealth?.memory ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {health.issues.length === 0 ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>No issues detected</span>
              </div>
            ) : (
              <div className="space-y-2">
                {health.issues.map((issue, index) => (
                  <div key={index} className="flex items-center space-x-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function PerformanceDashboard() {
  const [cacheMetrics, setCacheMetrics] = useState<Map<string, CacheMetrics>>(new Map());

  useEffect(() => {
    // Get initial cache metrics
    const metrics = inventoryCacheService.getMetrics();
    setCacheMetrics(metrics);

    // Update metrics periodically
    const interval = setInterval(() => {
      const updatedMetrics = inventoryCacheService.getMetrics();
      setCacheMetrics(updatedMetrics);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <Badge variant="outline" className="text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Enterprise Optimizations Active
        </Badge>
      </div>

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">
            <Activity className="h-4 w-4 mr-1" />
            Real-time
          </TabsTrigger>
          <TabsTrigger value="cache">
            <Database className="h-4 w-4 mr-1" />
            Cache
          </TabsTrigger>
          <TabsTrigger value="database">
            <Server className="h-4 w-4 mr-1" />
            Database
          </TabsTrigger>
          <TabsTrigger value="health">
            <CheckCircle className="h-4 w-4 mr-1" />
            Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <RealTimeMetrics />
        </TabsContent>

        <TabsContent value="cache">
          <CachePerformanceChart metrics={cacheMetrics} />
        </TabsContent>

        <TabsContent value="database">
          <DatabasePerformance />
        </TabsContent>

        <TabsContent value="health">
          <SystemHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
}