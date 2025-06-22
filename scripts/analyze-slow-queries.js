#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

class SlowQueryAnalyzer {
  constructor() {
    this.queries = [];
    this.slowQueries = [];
    this.queryStats = new Map();
    this.setupQueryLogging();
  }

  setupQueryLogging() {
    prisma.$on('query', (e) => {
      const query = {
        query: e.query,
        params: e.params,
        duration: e.duration,
        timestamp: e.timestamp,
        target: e.target
      };
      
      this.queries.push(query);
      
      // Track slow queries (>100ms)
      if (e.duration > 100) {
        this.slowQueries.push(query);
        console.log(`🐌 Slow query detected: ${e.duration}ms`);
        console.log(`   Query: ${e.query.substring(0, 100)}...`);
      }

      // Update statistics
      const queryKey = this.normalizeQuery(e.query);
      const stats = this.queryStats.get(queryKey) || {
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        minDuration: Infinity
      };
      
      stats.count++;
      stats.totalDuration += e.duration;
      stats.maxDuration = Math.max(stats.maxDuration, e.duration);
      stats.minDuration = Math.min(stats.minDuration, e.duration);
      
      this.queryStats.set(queryKey, stats);
    });
  }

  normalizeQuery(query) {
    // Remove specific values and normalize for pattern matching
    return query
      .replace(/\$\d+/g, '$?')
      .replace(/\d+/g, 'N')
      .replace(/['"][^'"]*['"]/g, 'STRING')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async runCriticalPathAnalysis() {
    console.log('🔍 Running Critical Path Analysis...\n');

    // Simulate dashboard load queries
    console.log('📊 Testing Dashboard Queries...');
    await this.testDashboardQueries();

    console.log('\n📦 Testing Inventory Queries...');
    await this.testInventoryQueries();

    console.log('\n🧾 Testing Invoice Queries...');
    await this.testInvoiceQueries();

    console.log('\n👥 Testing User/Auth Queries...');
    await this.testUserQueries();

    this.generateReport();
  }

  async testDashboardQueries() {
    const tests = [
      {
        name: 'Dashboard Summary Count',
        query: async () => {
          const start = Date.now();
          const result = await prisma.user.count();
          return { result, duration: Date.now() - start };
        }
      },
      {
        name: 'Product Count',
        query: async () => {
          const start = Date.now();
          const result = await prisma.product.count();
          return { result, duration: Date.now() - start };
        }
      },
      {
        name: 'Inventory Value Calculation',
        query: async () => {
          const start = Date.now();
          const result = await prisma.inventoryItem.findMany({
            take: 100,
            include: {
              product: true,
              shop: true
            }
          });
          return { result: result.length, duration: Date.now() - start };
        }
      },
      {
        name: 'Recent Transfers',
        query: async () => {
          const start = Date.now();
          const result = await prisma.inventoryTransfer.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              fromShop: true,
              toShop: true,
              user: true
            }
          });
          return { result: result.length, duration: Date.now() - start };
        }
      }
    ];

    for (const test of tests) {
      try {
        const { result, duration } = await test.query();
        const status = duration > 500 ? '🔴' : duration > 200 ? '🟡' : '🟢';
        console.log(`   ${status} ${test.name}: ${duration}ms (${result} records)`);
      } catch (error) {
        console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
  }

  async testInventoryQueries() {
    const tests = [
      {
        name: 'Inventory List with Filters',
        query: async () => {
          const start = Date.now();
          const result = await prisma.inventoryItem.findMany({
            where: {
              quantity: { gt: 0 }
            },
            include: {
              product: {
                include: {
                  category: true
                }
              },
              shop: true
            },
            take: 50
          });
          return { result: result.length, duration: Date.now() - start };
        }
      },
      {
        name: 'Low Stock Items',
        query: async () => {
          const start = Date.now();
          const result = await prisma.inventoryItem.findMany({
            where: {
              quantity: { lt: 10 }
            },
            include: {
              product: true,
              shop: true
            }
          });
          return { result: result.length, duration: Date.now() - start };
        }
      },
      {
        name: 'Inventory by Category',
        query: async () => {
          const start = Date.now();
          const result = await prisma.inventoryItem.groupBy({
            by: ['productId'],
            _sum: {
              quantity: true
            },
            take: 20
          });
          return { result: result.length, duration: Date.now() - start };
        }
      }
    ];

    for (const test of tests) {
      try {
        const { result, duration } = await test.query();
        const status = duration > 500 ? '🔴' : duration > 200 ? '🟡' : '🟢';
        console.log(`   ${status} ${test.name}: ${duration}ms (${result} records)`);
      } catch (error) {
        console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
  }

  async testInvoiceQueries() {
    const tests = [
      {
        name: 'Recent Invoices',
        query: async () => {
          const start = Date.now();
          const result = await prisma.invoice.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              customer: true,
              user: true,
              shop: true
            }
          });
          return { result: result.length, duration: Date.now() - start };
        }
      },
      {
        name: 'Invoice with Items',
        query: async () => {
          const start = Date.now();
          const result = await prisma.invoice.findFirst({
            include: {
              invoiceItems: {
                include: {
                  product: true
                }
              },
              customer: true,
              user: true,
              shop: true
            }
          });
          return { result: result ? 1 : 0, duration: Date.now() - start };
        }
      }
    ];

    for (const test of tests) {
      try {
        const { result, duration } = await test.query();
        const status = duration > 500 ? '🔴' : duration > 200 ? '🟡' : '🟢';
        console.log(`   ${status} ${test.name}: ${duration}ms (${result} records)`);
      } catch (error) {
        console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
  }

  async testUserQueries() {
    const tests = [
      {
        name: 'User Authentication',
        query: async () => {
          const start = Date.now();
          const result = await prisma.user.findFirst({
            include: {
              permissions: true
            }
          });
          return { result: result ? 1 : 0, duration: Date.now() - start };
        }
      },
      {
        name: 'User with Role',
        query: async () => {
          const start = Date.now();
          const result = await prisma.user.findMany({
            take: 10,
            include: {
              permissions: true
            }
          });
          return { result: result.length, duration: Date.now() - start };
        }
      }
    ];

    for (const test of tests) {
      try {
        const { result, duration } = await test.query();
        const status = duration > 500 ? '🔴' : duration > 200 ? '🟡' : '🟢';
        console.log(`   ${status} ${test.name}: ${duration}ms (${result} records)`);
      } catch (error) {
        console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
  }

  generateReport() {
    console.log('\n📈 SLOW QUERY ANALYSIS REPORT');
    console.log('================================\n');

    // Overall statistics
    const totalQueries = this.queries.length;
    const slowQueriesCount = this.slowQueries.length;
    const slowPercentage = totalQueries > 0 ? (slowQueriesCount / totalQueries * 100).toFixed(1) : 0;

    console.log(`📊 Query Statistics:`);
    console.log(`   Total Queries: ${totalQueries}`);
    console.log(`   Slow Queries (>100ms): ${slowQueriesCount} (${slowPercentage}%)`);
    console.log(`   Average Duration: ${this.getAverageDuration().toFixed(2)}ms\n`);

    // Top slow queries
    if (this.slowQueries.length > 0) {
      console.log(`🐌 Top 5 Slowest Queries:`);
      const sortedSlow = this.slowQueries
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);

      sortedSlow.forEach((query, index) => {
        console.log(`   ${index + 1}. ${query.duration}ms - ${query.query.substring(0, 80)}...`);
      });
      console.log('');
    }

    // Query patterns analysis
    console.log(`🔍 Query Pattern Analysis:`);
    const sortedPatterns = Array.from(this.queryStats.entries())
      .sort((a, b) => b[1].totalDuration - a[1].totalDuration)
      .slice(0, 10);

    sortedPatterns.forEach(([pattern, stats]) => {
      const avgDuration = stats.totalDuration / stats.count;
      const status = avgDuration > 200 ? '🔴' : avgDuration > 100 ? '🟡' : '🟢';
      console.log(`   ${status} ${avgDuration.toFixed(1)}ms avg (${stats.count}x) - ${pattern.substring(0, 60)}...`);
    });

    // Recommendations
    console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
    console.log('=================================\n');

    if (slowQueriesCount > 0) {
      console.log('🎯 Immediate Actions:');
      console.log('   1. Add database indexes for frequently queried columns');
      console.log('   2. Optimize JOIN operations and reduce N+1 queries');
      console.log('   3. Implement query result caching for repeated queries');
      console.log('   4. Consider using database views for complex aggregations');
      console.log('   5. Enable query optimization in Supabase dashboard\n');
    }

    console.log('🚀 Performance Improvements:');
    console.log('   1. Implement connection pooling (pgBouncer)');
    console.log('   2. Use read replicas for read-heavy operations');
    console.log('   3. Consider migrating to a faster database provider');
    console.log('   4. Implement materialized views for dashboard data');
    console.log('   5. Add query monitoring and alerting\n');

    // Save detailed report
    this.saveDetailedReport();
  }

  getAverageDuration() {
    if (this.queries.length === 0) return 0;
    const totalDuration = this.queries.reduce((sum, query) => sum + query.duration, 0);
    return totalDuration / this.queries.length;
  }

  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: this.queries.length,
        slowQueries: this.slowQueries.length,
        averageDuration: this.getAverageDuration()
      },
      slowQueries: this.slowQueries.map(q => ({
        duration: q.duration,
        query: q.query,
        timestamp: q.timestamp
      })),
      queryPatterns: Array.from(this.queryStats.entries()).map(([pattern, stats]) => ({
        pattern,
        count: stats.count,
        totalDuration: stats.totalDuration,
        averageDuration: stats.totalDuration / stats.count,
        maxDuration: stats.maxDuration,
        minDuration: stats.minDuration
      }))
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'slow-query-analysis.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('📄 Detailed report saved to: slow-query-analysis.json');
  }
}

async function main() {
  console.log('🔍 Starting Slow Query Analysis...\n');
  
  const analyzer = new SlowQueryAnalyzer();
  
  try {
    await analyzer.runCriticalPathAnalysis();
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { SlowQueryAnalyzer }; 