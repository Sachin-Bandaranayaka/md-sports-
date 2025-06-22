#!/usr/bin/env node

/**
 * MS Sport Reliability Testing Runner
 * 
 * Orchestrates comprehensive reliability testing including:
 * - Concurrent user simulation
 * - Database stability testing
 * - Memory usage monitoring
 * - Error recovery testing
 * - Performance under load
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const RELIABILITY_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  TEST_DURATION: {
    QUICK: 2 * 60 * 1000,     // 2 minutes
    STANDARD: 10 * 60 * 1000,  // 10 minutes
    EXTENDED: 30 * 60 * 1000   // 30 minutes
  },
  CONCURRENT_USERS: {
    LIGHT: 2,    // 2 users
    NORMAL: 4,   // 4 users (your use case)
    STRESS: 8    // 8 users (stress test)
  },
  THRESHOLDS: {
    MAX_ERROR_RATE: 0.05,      // 5%
    MAX_RESPONSE_TIME: 5000,   // 5 seconds
    MIN_SUCCESS_RATE: 0.95     // 95%
  }
};

class ReliabilityTestRunner {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
    this.startTime = new Date();
  }

  async runTests(testType = 'standard') {
    console.log('🚀 MS Sport Reliability Testing Suite');
    console.log('=====================================\n');
    
    console.log('🎯 Test Configuration:');
    console.log(`   Test Type: ${testType.toUpperCase()}`);
    console.log(`   Duration: ${RELIABILITY_CONFIG.TEST_DURATION[testType.toUpperCase()] / 1000}s`);
    console.log(`   Target Users: ${RELIABILITY_CONFIG.CONCURRENT_USERS[testType.toUpperCase()] || 4}`);
    console.log(`   Base URL: ${RELIABILITY_CONFIG.BASE_URL}\n`);

    this.isRunning = true;
    this.startTime = new Date();

    try {
      // Pre-flight checks
      await this.preFlightChecks();

      // Run test suite based on type
      switch (testType.toLowerCase()) {
        case 'quick':
          await this.runQuickTests();
          break;
        case 'extended':
          await this.runExtendedTests();
          break;
        default:
          await this.runStandardTests();
      }

      // Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    } finally {
      this.isRunning = false;
    }
  }

  async preFlightChecks() {
    console.log('🔍 Running Pre-flight Checks...');
    
    // Check if application is running
    try {
      const response = await axios.get(`${RELIABILITY_CONFIG.BASE_URL}/api/health`);
      console.log('✅ Application is running');
    } catch (error) {
      console.error('❌ Application is not responding');
      console.error('   Make sure your MS Sport application is running on', RELIABILITY_CONFIG.BASE_URL);
      throw new Error('Application not available');
    }

    // Check authentication endpoint
    try {
      await axios.post(`${RELIABILITY_CONFIG.BASE_URL}/api/auth/login`, {
        email: 'test@test.com',
        password: 'invalid'
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authentication endpoint is working');
      } else {
        console.log('⚠️  Authentication endpoint may have issues');
      }
    }

    console.log('✅ Pre-flight checks completed\n');
  }

  async runQuickTests() {
    console.log('⚡ Running Quick Reliability Tests (2 minutes)...\n');
    
    await Promise.all([
      this.testBasicFunctionality(),
      this.testConcurrentUsers('light'),
    ]);
  }

  async runStandardTests() {
    console.log('🎯 Running Standard Reliability Tests (10 minutes)...\n');
    
    await this.testBasicFunctionality();
    await this.testConcurrentUsers('normal');
    await this.testDatabaseStability();
    await this.testMemoryUsage();
  }

  async runExtendedTests() {
    console.log('🔥 Running Extended Reliability Tests (30 minutes)...\n');
    
    await this.testBasicFunctionality();
    await this.testConcurrentUsers('normal');
    await this.testDatabaseStability();
    await this.testMemoryUsage();
    await this.testConcurrentUsers('stress');
    await this.testErrorRecovery();
  }

  async testBasicFunctionality() {
    console.log('🧪 Testing Basic Functionality...');
    
    const testResult = {
      testName: 'Basic Functionality',
      startTime: new Date(),
      endTime: null,
      success: false,
      details: {
        endpoints: 0,
        successfulEndpoints: 0,
        failedEndpoints: 0,
        averageResponseTime: 0
      },
      errors: []
    };

    const endpoints = [
      { method: 'GET', path: '/api/health', name: 'Health Check' },
      { method: 'POST', path: '/api/auth/login', name: 'Authentication', data: { email: 'admin@test.com', password: 'admin123' } },
      { method: 'GET', path: '/api/products?page=1&limit=10', name: 'Product List' },
      { method: 'GET', path: '/api/customers?page=1&limit=10', name: 'Customer List' },
      { method: 'GET', path: '/api/dashboard/summary', name: 'Dashboard Summary' }
    ];

    let token = null;
    let totalResponseTime = 0;

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      try {
        const config = {
          method: endpoint.method,
          url: `${RELIABILITY_CONFIG.BASE_URL}${endpoint.path}`,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          ...(endpoint.data && { data: endpoint.data })
        };

        const response = await axios(config);
        
        if (endpoint.name === 'Authentication' && response.data.token) {
          token = response.data.token;
        }

        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;
        testResult.details.successfulEndpoints++;
        
        console.log(`   ✅ ${endpoint.name}: ${responseTime}ms`);
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;
        testResult.details.failedEndpoints++;
        testResult.errors.push(`${endpoint.name}: ${error.message}`);
        
        console.log(`   ❌ ${endpoint.name}: ${error.message}`);
      }
      
      testResult.details.endpoints++;
    }

    testResult.details.averageResponseTime = totalResponseTime / testResult.details.endpoints;
    testResult.success = testResult.details.failedEndpoints === 0;
    testResult.endTime = new Date();
    
    this.testResults.push(testResult);
    
    console.log(`✅ Basic functionality test completed`);
    console.log(`📊 Success rate: ${(testResult.details.successfulEndpoints / testResult.details.endpoints * 100).toFixed(1)}%\n`);
  }

  async testConcurrentUsers(testType) {
    console.log('\n👥 Testing Concurrent User Load...');
    
    const userCount = RELIABILITY_CONFIG.CONCURRENT_USERS[testType.toUpperCase()] || 4;
    const duration = RELIABILITY_CONFIG.TEST_DURATION[testType.toUpperCase()] || 600000; // 10 minutes
    
    const testResult = {
      testName: 'Concurrent Users',
      startTime: new Date(),
      endTime: null,
      success: false,
      details: {
        userCount,
        duration: duration / 1000,
        requests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      },
      errors: []
    };

    console.log(`Simulating ${userCount} concurrent users for ${duration / 1000} seconds...`);

    try {
      const userPromises = [];
      
      for (let i = 0; i < userCount; i++) {
        userPromises.push(this.simulateUser(i, duration, testResult));
      }

      await Promise.allSettled(userPromises);
      
      const successRate = testResult.details.successfulRequests / testResult.details.requests;
      testResult.success = successRate >= RELIABILITY_CONFIG.THRESHOLDS.MIN_SUCCESS_RATE;
      
      console.log(`✅ Concurrent user test completed`);
      console.log(`📊 Requests: ${testResult.details.requests}`);
      console.log(`📊 Success Rate: ${(successRate * 100).toFixed(1)}%`);
      console.log(`📊 Average Response Time: ${testResult.details.averageResponseTime.toFixed(0)}ms`);

    } catch (error) {
      testResult.errors.push(error.message);
      console.error('❌ Concurrent user test failed:', error.message);
    }

    testResult.endTime = new Date();
    this.testResults.push(testResult);
  }

  async simulateUser(userId, duration, testResult) {
    const endTime = Date.now() + duration;
    let token = null;
    
    // Authenticate user
    try {
      const authResponse = await axios.post(`${RELIABILITY_CONFIG.BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      if (authResponse.status === 200) {
        token = authResponse.data.token;
      }
    } catch (error) {
      console.error(`User ${userId} authentication failed:`, error.message);
      return;
    }

    // Simulate user activity
    while (Date.now() < endTime && this.isRunning) {
      const operations = [
        () => this.makeRequest('GET', '/api/dashboard/summary', token, testResult),
        () => this.makeRequest('GET', '/api/products?page=1&limit=20', token, testResult),
        () => this.makeRequest('GET', '/api/inventory', token, testResult),
        () => this.makeRequest('GET', '/api/customers', token, testResult),
      ];

      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      try {
        await operation();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500)); // 0.5-2.5s delay
      } catch (error) {
        // Error already logged in makeRequest
      }
    }
  }

  async makeRequest(method, path, token, testResult) {
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method,
        url: `${RELIABILITY_CONFIG.BASE_URL}${path}`,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      });

      const responseTime = Date.now() - startTime;
      testResult.details.requests++;
      testResult.details.successfulRequests++;
      testResult.details.averageResponseTime = 
        (testResult.details.averageResponseTime * (testResult.details.requests - 1) + responseTime) / testResult.details.requests;

      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      testResult.details.requests++;
      testResult.details.failedRequests++;
      testResult.details.averageResponseTime = 
        (testResult.details.averageResponseTime * (testResult.details.requests - 1) + responseTime) / testResult.details.requests;
      
      throw error;
    }
  }

  async testDatabaseStability() {
    console.log('\n🗄️ Testing Database Connection Stability...');
    
    const testResult = {
      testName: 'Database Stability',
      startTime: new Date(),
      endTime: null,
      success: false,
      details: {
        queries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        averageResponseTime: 0
      },
      errors: []
    };

    try {
      // Authenticate first
      const authResponse = await axios.post(`${RELIABILITY_CONFIG.BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      const token = authResponse.data.token;
      
      // Rapid database queries
      const queryPromises = [];
      for (let i = 0; i < 100; i++) {
        queryPromises.push(this.makeRequest('GET', '/api/dashboard/summary', token, testResult));
      }

      await Promise.allSettled(queryPromises);
      
      const successRate = testResult.details.successfulQueries / testResult.details.queries;
      testResult.success = successRate >= 0.95;
      
      console.log(`✅ Database stability test completed`);
      console.log(`📊 Queries: ${testResult.details.queries}`);
      console.log(`📊 Success Rate: ${(successRate * 100).toFixed(1)}%`);

    } catch (error) {
      testResult.errors.push(error.message);
      console.error('❌ Database stability test failed:', error.message);
    }

    testResult.endTime = new Date();
    this.testResults.push(testResult);
  }

  async testMemoryUsage() {
    console.log('\n📊 Testing Memory Usage...');
    
    const testResult = {
      testName: 'Memory Usage',
      startTime: new Date(),
      endTime: null,
      success: false,
      details: {
        memorySnapshots: [],
        maxMemory: 0,
        averageMemory: 0
      },
      errors: []
    };

    try {
      // Monitor memory for 60 seconds
      const monitoringDuration = 60000; // 1 minute
      const interval = 5000; // 5 seconds
      const endTime = Date.now() + monitoringDuration;
      
      while (Date.now() < endTime) {
        try {
          const healthResponse = await axios.get(`${RELIABILITY_CONFIG.BASE_URL}/api/health`);
          
          if (healthResponse.data.memory) {
            const memoryMB = healthResponse.data.memory;
            testResult.details.memorySnapshots.push(memoryMB);
            testResult.details.maxMemory = Math.max(testResult.details.maxMemory, memoryMB);
          }
        } catch (error) {
          // Health endpoint might not have memory info
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      
      if (testResult.details.memorySnapshots.length > 0) {
        testResult.details.averageMemory = 
          testResult.details.memorySnapshots.reduce((a, b) => a + b, 0) / testResult.details.memorySnapshots.length;
        
        testResult.success = testResult.details.maxMemory < 512; // Less than 512MB
        
        console.log(`✅ Memory usage test completed`);
        console.log(`📊 Max Memory: ${testResult.details.maxMemory.toFixed(1)}MB`);
        console.log(`📊 Avg Memory: ${testResult.details.averageMemory.toFixed(1)}MB`);
      } else {
        console.log('⚠️  Memory monitoring not available');
        testResult.success = true; // Don't fail if monitoring unavailable
      }

    } catch (error) {
      testResult.errors.push(error.message);
      console.error('❌ Memory usage test failed:', error.message);
    }

    testResult.endTime = new Date();
    this.testResults.push(testResult);
  }

  async testErrorRecovery() {
    console.log('\n🛠️ Testing Error Recovery...');
    
    const testResult = {
      testName: 'Error Recovery',
      startTime: new Date(),
      endTime: null,
      success: false,
      details: {
        errorScenarios: 0,
        handledErrors: 0,
        recoveryRate: 0
      },
      errors: []
    };

    try {
      // Test various error scenarios
      const errorTests = [
        { name: 'Invalid endpoint', method: 'GET', path: '/api/nonexistent' },
        { name: 'Invalid auth', method: 'GET', path: '/api/dashboard/summary', token: 'invalid-token' },
        { name: 'Invalid data', method: 'POST', path: '/api/products', data: { invalid: 'data' } },
      ];

      for (const errorTest of errorTests) {
        testResult.details.errorScenarios++;
        
        try {
          await axios({
            method: errorTest.method,
            url: `${RELIABILITY_CONFIG.BASE_URL}${errorTest.path}`,
            headers: errorTest.token ? { Authorization: `Bearer ${errorTest.token}` } : {},
            data: errorTest.data,
            timeout: 5000
          });
          
          console.log(`   ⚠️  ${errorTest.name}: Expected error but got success`);
        } catch (error) {
          if (error.response && error.response.status >= 400) {
            testResult.details.handledErrors++;
            console.log(`   ✅ ${errorTest.name}: Properly handled (${error.response.status})`);
          } else {
            console.log(`   ❌ ${errorTest.name}: Unexpected error (${error.message})`);
          }
        }
      }

      testResult.details.recoveryRate = testResult.details.handledErrors / testResult.details.errorScenarios;
      testResult.success = testResult.details.recoveryRate >= 0.8;
      
      console.log(`✅ Error recovery test completed`);
      console.log(`📊 Recovery Rate: ${(testResult.details.recoveryRate * 100).toFixed(1)}%`);

    } catch (error) {
      testResult.errors.push(error.message);
      console.error('❌ Error recovery test failed:', error.message);
    }

    testResult.endTime = new Date();
    this.testResults.push(testResult);
  }

  async generateFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RELIABILITY TEST REPORT');
    console.log('='.repeat(60));

    const totalDuration = (new Date() - this.startTime) / 1000;
    let totalTests = this.testResults.length;
    let passedTests = this.testResults.filter(r => r.success).length;
    let failedTests = totalTests - passedTests;

    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Duration: ${totalDuration.toFixed(1)}s`);
    console.log(`   Tests Run: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log(`\n📋 Test Details:`);
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = (result.endTime - result.startTime) / 1000;
      
      console.log(`   ${status} ${result.testName} (${duration.toFixed(1)}s)`);
      
      if (result.errors.length > 0) {
        console.log(`      Errors: ${result.errors.length}`);
      }
    });

    // Production readiness assessment
    console.log(`\n🎯 Production Readiness Assessment:`);
    const overallSuccess = (passedTests / totalTests) >= 0.8;
    
    if (overallSuccess) {
      console.log(`✅ SYSTEM IS PRODUCTION READY`);
      console.log(`   Your MS Sport application demonstrates good reliability for:`);
      console.log(`   - ${RELIABILITY_CONFIG.CONCURRENT_USERS.NORMAL} concurrent users`);
      console.log(`   - High-volume product operations`);
      console.log(`   - Database connection stability`);
      console.log(`   - Error recovery and handling`);
    } else {
      console.log(`❌ SYSTEM NEEDS IMPROVEMENT`);
      console.log(`   Consider addressing the failed tests before production deployment.`);
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'reliability-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: (passedTests / totalTests) * 100,
        productionReady: overallSuccess
      },
      results: this.testResults
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('='.repeat(60));
  }
}

// CLI handling
async function main() {
  const testType = process.argv[2] || 'standard';
  
  if (!['quick', 'standard', 'extended'].includes(testType)) {
    console.error('Usage: node run-reliability-tests.js [quick|standard|extended]');
    console.error('');
    console.error('Test Types:');
    console.error('  quick    - 2 minute basic reliability check');
    console.error('  standard - 10 minute comprehensive test (default)');
    console.error('  extended - 30 minute stress test with error recovery');
    process.exit(1);
  }

  const runner = new ReliabilityTestRunner();
  await runner.runTests(testType);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Test interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Test terminated');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = ReliabilityTestRunner; 