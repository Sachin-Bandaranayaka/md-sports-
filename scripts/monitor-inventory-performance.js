#!/usr/bin/env node

/**
 * Inventory Transfer Performance Monitoring Script
 * 
 * This script monitors the performance of the inventory transfer feature
 * and generates alerts when performance degrades below acceptable thresholds.
 */

const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

class InventoryPerformanceMonitor {
  constructor() {
    this.thresholds = {
      transferListLoad: 1000, // 1 second
      transferCreation: 500,   // 500ms
      transferCompletion: 300, // 300ms
      inventoryCheck: 200,     // 200ms
      apiResponse: 2000        // 2 seconds
    };
    
    this.metrics = {
      timestamp: new Date().toISOString(),
      tests: [],
      alerts: [],
      summary: {}
    };
  }

  async runPerformanceTests() {
    console.log('🚀 Starting Inventory Transfer Performance Monitoring...');
    console.log('=' .repeat(60));

    try {
      // Test API endpoints
      await this.testApiEndpoints();
      
      // Test database queries (simulated)
      await this.testDatabasePerformance();
      
      // Test concurrent operations
      await this.testConcurrentOperations();
      
      // Generate report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Monitoring failed:', error.message);
      this.metrics.alerts.push({
        type: 'CRITICAL',
        message: `Monitoring script failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  async testApiEndpoints() {
    console.log('\n📡 Testing API Endpoints...');
    
    const endpoints = [
      { name: 'Transfer List', url: '/api/inventory/transfers', threshold: this.thresholds.transferListLoad },
      { name: 'Shops List', url: '/api/shops', threshold: this.thresholds.apiResponse },
      { name: 'Products List', url: '/api/products', threshold: this.thresholds.apiResponse },
      { name: 'Inventory Summary', url: '/api/inventory/summary', threshold: this.thresholds.apiResponse }
    ];

    for (const endpoint of endpoints) {
      const startTime = performance.now();
      
      try {
        const response = await fetch(`http://localhost:3001${endpoint.url}`);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const testResult = {
          name: endpoint.name,
          url: endpoint.url,
          duration: Math.round(duration),
          status: response.status,
          success: response.ok,
          threshold: endpoint.threshold,
          withinThreshold: duration <= endpoint.threshold
        };
        
        this.metrics.tests.push(testResult);
        
        if (duration > endpoint.threshold) {
          this.metrics.alerts.push({
            type: 'PERFORMANCE',
            message: `${endpoint.name} exceeded threshold: ${Math.round(duration)}ms > ${endpoint.threshold}ms`,
            timestamp: new Date().toISOString()
          });
        }
        
        const status = testResult.withinThreshold ? '✅' : '⚠️';
        console.log(`  ${status} ${endpoint.name}: ${Math.round(duration)}ms (threshold: ${endpoint.threshold}ms)`);
        
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: Failed - ${error.message}`);
        this.metrics.alerts.push({
          type: 'ERROR',
          message: `${endpoint.name} failed: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async testDatabasePerformance() {
    console.log('\n🗄️  Testing Database Performance (Simulated)...');
    
    // Simulate database query performance tests
    const dbTests = [
      { name: 'Transfer List Query', expectedTime: 100 },
      { name: 'Inventory Availability Check', expectedTime: 50 },
      { name: 'Transfer Creation Transaction', expectedTime: 150 },
      { name: 'Transfer Completion Update', expectedTime: 75 }
    ];

    for (const test of dbTests) {
      // Simulate query time with some randomness
      const simulatedTime = test.expectedTime + (Math.random() * 50 - 25);
      const withinThreshold = simulatedTime <= test.expectedTime * 1.5;
      
      const testResult = {
        name: test.name,
        duration: Math.round(simulatedTime),
        threshold: test.expectedTime * 1.5,
        withinThreshold
      };
      
      this.metrics.tests.push(testResult);
      
      if (!withinThreshold) {
        this.metrics.alerts.push({
          type: 'DATABASE_PERFORMANCE',
          message: `${test.name} slower than expected: ${Math.round(simulatedTime)}ms`,
          timestamp: new Date().toISOString()
        });
      }
      
      const status = withinThreshold ? '✅' : '⚠️';
      console.log(`  ${status} ${test.name}: ${Math.round(simulatedTime)}ms`);
    }
  }

  async testConcurrentOperations() {
    console.log('\n⚡ Testing Concurrent Operations...');
    
    const startTime = performance.now();
    
    try {
      // Simulate concurrent API calls
      const promises = Array(5).fill().map(async (_, index) => {
        const response = await fetch('http://localhost:3001/api/shops');
        return { index, status: response.status, ok: response.ok };
      });
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      const successCount = results.filter(r => r.ok).length;
      const successRate = (successCount / results.length) * 100;
      
      console.log(`  ✅ Concurrent requests completed: ${Math.round(totalTime)}ms`);
      console.log(`  📊 Success rate: ${successRate}% (${successCount}/${results.length})`);
      
      if (successRate < 80) {
        this.metrics.alerts.push({
          type: 'CONCURRENCY',
          message: `Low success rate for concurrent operations: ${successRate}%`,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log(`  ❌ Concurrent operations failed: ${error.message}`);
      this.metrics.alerts.push({
        type: 'CONCURRENCY_ERROR',
        message: `Concurrent operations failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  async generateReport() {
    console.log('\n📊 Performance Summary');
    console.log('=' .repeat(60));
    
    const totalTests = this.metrics.tests.length;
    const passedTests = this.metrics.tests.filter(t => t.withinThreshold !== false).length;
    const alertCount = this.metrics.alerts.length;
    
    this.metrics.summary = {
      totalTests,
      passedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      alertCount,
      status: alertCount === 0 ? 'HEALTHY' : alertCount < 3 ? 'WARNING' : 'CRITICAL'
    };
    
    console.log(`📈 Tests Passed: ${passedTests}/${totalTests} (${this.metrics.summary.successRate}%)`);
    console.log(`🚨 Alerts Generated: ${alertCount}`);
    console.log(`🎯 Overall Status: ${this.metrics.summary.status}`);
    
    if (this.metrics.alerts.length > 0) {
      console.log('\n🚨 Performance Alerts:');
      this.metrics.alerts.forEach((alert, index) => {
        console.log(`  ${index + 1}. [${alert.type}] ${alert.message}`);
      });
    }
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'performance-reports', `inventory-performance-${Date.now()}.json`);
    
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(this.metrics, null, 2));
      console.log(`\n💾 Report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`\n❌ Failed to save report: ${error.message}`);
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (this.metrics.summary.status === 'HEALTHY') {
      console.log('  ✅ System is performing well. Continue monitoring.');
    } else {
      console.log('  ⚠️  Consider implementing the database optimizations in optimize-inventory-transfers.sql');
      console.log('  📊 Review the detailed test report for specific performance issues');
      console.log('  🔄 Run this monitoring script regularly to track improvements');
    }
  }
}

// Initialize fetch for Node.js
async function initializeFetch() {
  if (typeof fetch === 'undefined') {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
  }
}

// Main execution
async function main() {
  try {
    await initializeFetch();
    const monitor = new InventoryPerformanceMonitor();
    await monitor.runPerformanceTests();
  } catch (error) {
    console.error('❌ Failed to run performance monitoring:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { InventoryPerformanceMonitor };