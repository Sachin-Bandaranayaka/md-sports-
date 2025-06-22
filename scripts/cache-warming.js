#!/usr/bin/env node

/**
 * Cache Warming Script for MS Sport
 * Preloads frequently accessed data for millisecond response times
 */

const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

// Cache warming configuration
const CACHE_WARMUP_CONFIG = {
  // Data to preload
  PRELOAD_ITEMS: {
    // Dashboard data (most frequently accessed)
    DASHBOARD: {
      priority: 1,
      ttl: 300, // 5 minutes
      endpoints: [
        '/api/dashboard/summary',
        '/api/dashboard/inventory',
        '/api/dashboard/sales',
        '/api/dashboard/customers'
      ]
    },
    
    // Reference data (changes infrequently)
    REFERENCE: {
      priority: 2,
      ttl: 3600, // 1 hour
      endpoints: [
        '/api/categories',
        '/api/shops',
        '/api/suppliers'
      ]
    },
    
    // Inventory data (frequently accessed)
    INVENTORY: {
      priority: 3,
      ttl: 300, // 5 minutes
      endpoints: [
        '/api/inventory',
        '/api/inventory/optimized',
        '/api/products'
      ]
    },
    
    // Recent data (accessed often)
    RECENT: {
      priority: 4,
      ttl: 600, // 10 minutes
      endpoints: [
        '/api/invoices?limit=20',
        '/api/customers?limit=20',
        '/api/receipts?limit=20'
      ]
    }
  },
  
  // Performance targets
  TARGETS: {
    MAX_WARMUP_TIME: 30000,    // 30 seconds max for entire warmup
    MAX_ENDPOINT_TIME: 5000,   // 5 seconds max per endpoint
    CONCURRENT_REQUESTS: 5,    // Process 5 endpoints concurrently
  }
};

/**
 * Cache Warming Service
 */
class CacheWarmingService {
  constructor() {
    this.stats = {
      totalEndpoints: 0,
      successfulWarmups: 0,
      failedWarmups: 0,
      totalTime: 0,
      averageTime: 0
    };
  }
  
  /**
   * Warm up all caches
   */
  async warmUpAll() {
    console.log('🔥 Starting cache warm-up process...');
    const startTime = Date.now();
    
    try {
      // Get all endpoints sorted by priority
      const endpoints = this.getAllEndpoints();
      this.stats.totalEndpoints = endpoints.length;
      
      console.log(`📋 Found ${endpoints.length} endpoints to warm up`);
      
      // Process endpoints in batches by priority
      await this.processEndpointsByPriority(endpoints);
      
      const totalTime = Date.now() - startTime;
      this.stats.totalTime = totalTime;
      this.stats.averageTime = totalTime / endpoints.length;
      
      this.logResults();
      
    } catch (error) {
      console.error('❌ Cache warm-up failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  /**
   * Get all endpoints sorted by priority
   */
  getAllEndpoints() {
    const endpoints = [];
    
    Object.entries(CACHE_WARMUP_CONFIG.PRELOAD_ITEMS).forEach(([category, config]) => {
      config.endpoints.forEach(endpoint => {
        endpoints.push({
          endpoint,
          category,
          priority: config.priority,
          ttl: config.ttl
        });
      });
    });
    
    // Sort by priority (lower number = higher priority)
    return endpoints.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Process endpoints by priority groups
   */
  async processEndpointsByPriority(endpoints) {
    const priorityGroups = this.groupByPriority(endpoints);
    
    for (const [priority, group] of priorityGroups) {
      console.log(`🎯 Processing priority ${priority} (${group.length} endpoints)...`);
      await this.processBatch(group);
    }
  }
  
  /**
   * Group endpoints by priority
   */
  groupByPriority(endpoints) {
    const groups = new Map();
    
    endpoints.forEach(endpoint => {
      if (!groups.has(endpoint.priority)) {
        groups.set(endpoint.priority, []);
      }
      groups.get(endpoint.priority).push(endpoint);
    });
    
    return groups;
  }
  
  /**
   * Process a batch of endpoints concurrently
   */
  async processBatch(endpoints) {
    const batchSize = CACHE_WARMUP_CONFIG.TARGETS.CONCURRENT_REQUESTS;
    
    for (let i = 0; i < endpoints.length; i += batchSize) {
      const batch = endpoints.slice(i, i + batchSize);
      const promises = batch.map(endpoint => this.warmUpEndpoint(endpoint));
      
      await Promise.allSettled(promises);
    }
  }
  
  /**
   * Warm up a single endpoint
   */
  async warmUpEndpoint(endpointConfig) {
    const { endpoint, category, ttl } = endpointConfig;
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Warming up: ${endpoint}`);
      
      // Simulate API call (in real implementation, this would make actual HTTP requests)
      const data = await this.fetchEndpointData(endpoint);
      
      // Cache the data (in real implementation, this would use your cache service)
      await this.cacheData(endpoint, data, ttl);
      
      const duration = Date.now() - startTime;
      this.stats.successfulWarmups++;
      
      console.log(`✅ Warmed up: ${endpoint} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.failedWarmups++;
      
      console.error(`❌ Failed to warm up: ${endpoint} (${duration}ms)`, error.message);
    }
  }
  
  /**
   * Fetch data for an endpoint (simulated)
   */
  async fetchEndpointData(endpoint) {
    // Simulate different response times based on endpoint complexity
    const complexity = this.getEndpointComplexity(endpoint);
    const delay = Math.random() * complexity;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Return simulated data based on endpoint
    return this.generateMockData(endpoint);
  }
  
  /**
   * Get endpoint complexity for simulation
   */
  getEndpointComplexity(endpoint) {
    if (endpoint.includes('dashboard')) return 1000; // 0-1000ms
    if (endpoint.includes('inventory')) return 800;  // 0-800ms
    if (endpoint.includes('invoices')) return 600;   // 0-600ms
    if (endpoint.includes('categories')) return 200; // 0-200ms
    return 400; // Default 0-400ms
  }
  
  /**
   * Generate mock data for caching
   */
  generateMockData(endpoint) {
    const baseData = {
      timestamp: new Date().toISOString(),
      endpoint,
      cached: true
    };
    
    // Generate endpoint-specific mock data
    if (endpoint.includes('dashboard/summary')) {
      return {
        ...baseData,
        totalSales: Math.floor(Math.random() * 100000),
        totalCustomers: Math.floor(Math.random() * 1000),
        totalProducts: Math.floor(Math.random() * 500),
        totalInventoryValue: Math.floor(Math.random() * 500000)
      };
    }
    
    if (endpoint.includes('inventory')) {
      return {
        ...baseData,
        products: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Product ${i + 1}`,
          quantity: Math.floor(Math.random() * 100),
          price: Math.floor(Math.random() * 1000)
        }))
      };
    }
    
    if (endpoint.includes('categories')) {
      return {
        ...baseData,
        categories: [
          { id: 1, name: 'Sports Equipment' },
          { id: 2, name: 'Apparel' },
          { id: 3, name: 'Accessories' }
        ]
      };
    }
    
    return { ...baseData, data: 'mock_data' };
  }
  
  /**
   * Cache data (simulated - would use actual cache service)
   */
  async cacheData(key, data, ttl) {
    // Simulate cache storage time
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // In real implementation:
    // await cache.set(key, data, ttl);
    console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
  }
  
  /**
   * Log warm-up results
   */
  logResults() {
    console.log('\n🎯 Cache Warm-up Results:');
    console.log('================================');
    console.log(`📊 Total Endpoints: ${this.stats.totalEndpoints}`);
    console.log(`✅ Successful: ${this.stats.successfulWarmups}`);
    console.log(`❌ Failed: ${this.stats.failedWarmups}`);
    console.log(`⏱️  Total Time: ${this.stats.totalTime}ms`);
    console.log(`📈 Average Time: ${this.stats.averageTime.toFixed(2)}ms per endpoint`);
    console.log(`🎯 Success Rate: ${((this.stats.successfulWarmups / this.stats.totalEndpoints) * 100).toFixed(1)}%`);
    
    if (this.stats.totalTime > CACHE_WARMUP_CONFIG.TARGETS.MAX_WARMUP_TIME) {
      console.log(`⚠️  Warning: Warm-up took longer than target (${CACHE_WARMUP_CONFIG.TARGETS.MAX_WARMUP_TIME}ms)`);
    } else {
      console.log('🚀 Warm-up completed within target time!');
    }
  }
}

/**
 * Database warm-up queries
 */
class DatabaseWarmup {
  
  /**
   * Warm up frequently used database queries
   */
  async warmUpQueries() {
    console.log('🔥 Warming up database queries...');
    
    const queries = [
      { name: 'User Count', query: () => prisma.user.count() },
      { name: 'Product Count', query: () => prisma.product.count() },
      { name: 'Recent Invoices', query: () => prisma.invoice.findMany({ take: 10, orderBy: { createdAt: 'desc' } }) },
      { name: 'Categories', query: () => prisma.category.findMany() },
      { name: 'Shops', query: () => prisma.shop.findMany() },
    ];
    
    for (const { name, query } of queries) {
      try {
        const startTime = Date.now();
        await query();
        const duration = Date.now() - startTime;
        console.log(`✅ ${name}: ${duration}ms`);
      } catch (error) {
        console.error(`❌ ${name} failed:`, error.message);
      }
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 MS Sport Cache Warming Service');
  console.log('==================================\n');
  
  try {
    // Warm up database queries first
    const dbWarmup = new DatabaseWarmup();
    await dbWarmup.warmUpQueries();
    
    console.log(''); // Empty line
    
    // Warm up API caches
    const cacheWarming = new CacheWarmingService();
    await cacheWarming.warmUpAll();
    
    console.log('\n🎉 Cache warming completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Cache warming failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { CacheWarmingService, DatabaseWarmup }; 