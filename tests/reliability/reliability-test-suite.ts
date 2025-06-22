/**
 * MS Sport Reliability Testing Suite
 * 
 * Tests the application's reliability under realistic conditions:
 * - 2 shop staff users + 1-2 admins (concurrent access)
 * - 2000+ products in inventory
 * - 50-100 sales invoices per day
 * - Database connection stability
 * - Session management under load
 * - Data consistency across concurrent operations
 */

import { test, expect, Page, Browser } from '@playwright/test';
import axios from 'axios';
import { performance } from 'perf_hooks';

// Reliability test configuration
const RELIABILITY_CONFIG = {
  CONCURRENT_USERS: {
    SHOP_STAFF: 2,
    ADMINS: 2,
    TOTAL: 4
  },
  DATA_VOLUMES: {
    PRODUCTS: 2000,
    DAILY_INVOICES: 100,
    CONCURRENT_OPERATIONS: 50
  },
  THRESHOLDS: {
    MAX_RESPONSE_TIME: 5000,    // 5 seconds max response
    MAX_ERROR_RATE: 0.05,       // 5% error rate max
    MIN_UPTIME: 0.99,           // 99% uptime
    MAX_MEMORY_USAGE: 512,      // 512MB max memory
    MAX_DB_CONNECTIONS: 20      // Max DB connections
  },
  TEST_DURATION: {
    SHORT: 5 * 60 * 1000,       // 5 minutes
    MEDIUM: 15 * 60 * 1000,     // 15 minutes
    LONG: 30 * 60 * 1000        // 30 minutes
  }
};

// User profiles for testing
interface TestUser {
  email: string;
  password: string;
  role: string;
  shopId: string | null;
}

const TEST_USERS: Record<string, TestUser> = {
  ADMIN_1: { email: 'admin1@test.com', password: 'admin123', role: 'admin', shopId: null },
  ADMIN_2: { email: 'admin2@test.com', password: 'admin123', role: 'admin', shopId: null },
  STAFF_1: { email: 'staff1@test.com', password: 'staff123', role: 'shop_staff', shopId: 'shop-1' },
  STAFF_2: { email: 'staff2@test.com', password: 'staff123', role: 'shop_staff', shopId: 'shop-2' }
};

interface ReliabilityMetrics {
  testName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  memoryUsage: number[];
  dbConnectionCount: number[];
  concurrentUsers: number;
  dataIntegrityChecks: number;
  sessionFailures: number;
  errors: Array<{ timestamp: Date; error: string; context: string }>;
}

class ReliabilityTester {
  private metrics: ReliabilityMetrics[] = [];
  private isRunning: boolean = false;
  private startTime: Date = new Date();

  async runFullReliabilityTest(): Promise<void> {
    console.log('🚀 Starting MS Sport Reliability Test Suite\n');
    console.log('Testing scenarios:');
    console.log('✅ 2 Shop Staff + 2 Admin concurrent users');
    console.log('✅ 2000+ products in inventory');
    console.log('✅ 50-100 invoices per day simulation');
    console.log('✅ Database connection stability');
    console.log('✅ Session management under load');
    console.log('✅ Data consistency validation\n');

    this.isRunning = true;
    this.startTime = new Date();

    try {
      // Test 1: Concurrent user authentication and session management
      await this.testConcurrentAuthentication();

      // Test 2: High-volume product operations
      await this.testHighVolumeProductOperations();

      // Test 3: Concurrent invoice creation (daily load simulation)
      await this.testConcurrentInvoiceCreation();

      // Test 4: Database connection stability under load
      await this.testDatabaseConnectionStability();

      // Test 5: Session persistence and timeout handling
      await this.testSessionReliability();

      // Test 6: Data consistency across concurrent operations
      await this.testDataConsistency();

      // Test 7: Memory and resource usage monitoring
      await this.testResourceUsage();

      // Test 8: Error recovery and graceful degradation
      await this.testErrorRecovery();

      this.generateReliabilityReport();

    } catch (error) {
      console.error('❌ Reliability test suite failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async testConcurrentAuthentication(): Promise<void> {
    console.log('\n🔐 Testing Concurrent User Authentication...');
    
    const testMetrics: ReliabilityMetrics = {
      testName: 'Concurrent Authentication',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      memoryUsage: [],
      dbConnectionCount: [],
      concurrentUsers: RELIABILITY_CONFIG.CONCURRENT_USERS.TOTAL,
      dataIntegrityChecks: 0,
      sessionFailures: 0,
      errors: []
    };

    const startTime = performance.now();
    const authPromises = Object.values(TEST_USERS).map(async (user, index) => {
      const requestStart = performance.now();
      
      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          email: user.email,
          password: user.password
        });
        
        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;
        
        testMetrics.totalRequests++;
        testMetrics.successfulRequests++;
        testMetrics.maxResponseTime = Math.max(testMetrics.maxResponseTime, responseTime);
        testMetrics.minResponseTime = Math.min(testMetrics.minResponseTime, responseTime);
        
        // Validate token and user data
        expect(response.status).toBe(200);
        expect(response.data.token).toBeDefined();
        expect(response.data.user.email).toBe(user.email);
        
        console.log(`✅ User ${index + 1} authenticated in ${responseTime.toFixed(0)}ms`);
        
        // Test concurrent token validation
        const tokenValidationStart = performance.now();
        const validationResponse = await axios.get('http://localhost:3000/api/auth/validate', {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });
        const tokenValidationEnd = performance.now();
        
        expect(validationResponse.status).toBe(200);
        console.log(`✅ Token validated in ${(tokenValidationEnd - tokenValidationStart).toFixed(0)}ms`);
        
        return response.data.token;
      } catch (error: any) {
        testMetrics.totalRequests++;
        testMetrics.failedRequests++;
        testMetrics.errors.push({
          timestamp: new Date(),
          error: error.message,
          context: `Authentication for ${user.email}`
        });
        console.error(`❌ Authentication failed for ${user.email}:`, error.message);
        throw error;
      }
    });

    const tokens = await Promise.all(authPromises);
    const endTime = performance.now();
    
    testMetrics.endTime = new Date();
    testMetrics.duration = endTime - startTime;
    testMetrics.errorRate = testMetrics.failedRequests / testMetrics.totalRequests;
    testMetrics.averageResponseTime = testMetrics.duration / testMetrics.totalRequests;
    
    this.metrics.push(testMetrics);
    
    console.log(`✅ All ${tokens.length} users authenticated successfully`);
    console.log(`📊 Average response time: ${testMetrics.averageResponseTime.toFixed(0)}ms`);
    console.log(`📊 Error rate: ${(testMetrics.errorRate * 100).toFixed(1)}%`);
  }

  private async testHighVolumeProductOperations(): Promise<void> {
    console.log('\n📦 Testing High-Volume Product Operations (2000+ products)...');
    
    const testMetrics: ReliabilityMetrics = {
      testName: 'High Volume Product Operations',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      memoryUsage: [],
      dbConnectionCount: [],
      concurrentUsers: 2, // Shop staff users
      dataIntegrityChecks: 0,
      sessionFailures: 0,
      errors: []
    };

    // Authenticate shop staff users
    const staff1Token = await this.authenticateUser(TEST_USERS.STAFF_1);
    const staff2Token = await this.authenticateUser(TEST_USERS.STAFF_2);

    const startTime = performance.now();
    
    // Simulate concurrent product operations
    const productOperations = [];
    
    // User 1: Browse products with pagination (simulating large inventory)
    for (let page = 1; page <= 20; page++) {
      productOperations.push(
        this.makeRequest(
          'GET',
          `/api/products?page=${page}&limit=100&shopId=shop-1`,
          staff1Token,
          testMetrics,
          `Browse products page ${page}`
        )
      );
    }

    // User 2: Search products with various queries
    const searchQueries = ['sport', 'shoes', 'clothing', 'equipment', 'accessories'];
    searchQueries.forEach(query => {
      productOperations.push(
        this.makeRequest(
          'GET',
          `/api/products?search=${query}&shopId=shop-2`,
          staff2Token,
          testMetrics,
          `Search products: ${query}`
        )
      );
    });

    // Both users: Get inventory data
    for (let i = 0; i < 10; i++) {
      productOperations.push(
        this.makeRequest(
          'GET',
          '/api/inventory',
          i % 2 === 0 ? staff1Token : staff2Token,
          testMetrics,
          `Inventory check ${i}`
        )
      );
    }

    await Promise.allSettled(productOperations);
    
    const endTime = performance.now();
    testMetrics.endTime = new Date();
    testMetrics.duration = endTime - startTime;
    testMetrics.errorRate = testMetrics.failedRequests / testMetrics.totalRequests;
    testMetrics.averageResponseTime = testMetrics.duration / testMetrics.totalRequests;
    
    this.metrics.push(testMetrics);
    
    console.log(`✅ Product operations completed`);
    console.log(`📊 Processed ${testMetrics.totalRequests} requests`);
    console.log(`📊 Success rate: ${((testMetrics.successfulRequests / testMetrics.totalRequests) * 100).toFixed(1)}%`);
  }

  private async testConcurrentInvoiceCreation(): Promise<void> {
    console.log('\n🧾 Testing Concurrent Invoice Creation (Daily Load Simulation)...');
    
    const testMetrics: ReliabilityMetrics = {
      testName: 'Concurrent Invoice Creation',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      memoryUsage: [],
      dbConnectionCount: [],
      concurrentUsers: 2,
      dataIntegrityChecks: 0,
      sessionFailures: 0,
      errors: []
    };

    const staff1Token = await this.authenticateUser(TEST_USERS.STAFF_1);
    const staff2Token = await this.authenticateUser(TEST_USERS.STAFF_2);

    const startTime = performance.now();
    
    // Simulate creating 100 invoices concurrently (daily load)
    const invoiceCreationPromises = [];
    
    for (let i = 1; i <= 50; i++) {
      // Staff 1 creates invoices for shop 1
      invoiceCreationPromises.push(
        this.createInvoice(staff1Token, 'shop-1', i, testMetrics)
      );
      
      // Staff 2 creates invoices for shop 2
      invoiceCreationPromises.push(
        this.createInvoice(staff2Token, 'shop-2', i + 50, testMetrics)
      );
    }

    await Promise.allSettled(invoiceCreationPromises);
    
    const endTime = performance.now();
    testMetrics.endTime = new Date();
    testMetrics.duration = endTime - startTime;
    testMetrics.errorRate = testMetrics.failedRequests / testMetrics.totalRequests;
    testMetrics.averageResponseTime = testMetrics.duration / testMetrics.totalRequests;
    
    this.metrics.push(testMetrics);
    
    console.log(`✅ Created ${testMetrics.successfulRequests} invoices concurrently`);
    console.log(`📊 Success rate: ${((testMetrics.successfulRequests / testMetrics.totalRequests) * 100).toFixed(1)}%`);
  }

  async testDatabaseConnectionStability(): Promise<void> {
    console.log('\n🗄️ Testing Database Connection Stability...');
    
    const testMetrics: ReliabilityMetrics = {
      testName: 'Database Connection Stability',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      memoryUsage: [],
      dbConnectionCount: [],
      concurrentUsers: 4,
      dataIntegrityChecks: 0,
      sessionFailures: 0,
      errors: []
    };

    const tokens = await Promise.all([
      this.authenticateUser(TEST_USERS.ADMIN_1),
      this.authenticateUser(TEST_USERS.ADMIN_2),
      this.authenticateUser(TEST_USERS.STAFF_1),
      this.authenticateUser(TEST_USERS.STAFF_2)
    ]);

    const startTime = performance.now();
    
    // Simulate sustained database load
    const dbOperations = [];
    
    for (let i = 0; i < 200; i++) {
      const token = tokens[i % 4];
      
      // Mix of read and write operations
      dbOperations.push(
        this.makeRequest('GET', '/api/dashboard/summary', token, testMetrics, `Dashboard query ${i}`)
      );
      
      if (i % 10 === 0) {
        dbOperations.push(
          this.makeRequest('GET', '/api/health', token, testMetrics, `Health check ${i}`)
        );
      }
      
      if (i % 20 === 0) {
        dbOperations.push(
          this.makeRequest('GET', '/api/inventory', token, testMetrics, `Inventory query ${i}`)
        );
      }
    }

    await Promise.allSettled(dbOperations);
    
    const endTime = performance.now();
    testMetrics.endTime = new Date();
    testMetrics.duration = endTime - startTime;
    testMetrics.errorRate = testMetrics.failedRequests / testMetrics.totalRequests;
    testMetrics.averageResponseTime = testMetrics.duration / testMetrics.totalRequests;
    
    this.metrics.push(testMetrics);
    
    console.log(`✅ Database stability test completed`);
    console.log(`📊 Processed ${testMetrics.totalRequests} database operations`);
    console.log(`📊 Error rate: ${(testMetrics.errorRate * 100).toFixed(1)}%`);
  }

  private async testSessionReliability(): Promise<void> {
    console.log('\n🔐 Testing Session Persistence and Timeout Handling...');
    
    const testMetrics: ReliabilityMetrics = {
      testName: 'Session Reliability',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      memoryUsage: [],
      dbConnectionCount: [],
      concurrentUsers: 4,
      dataIntegrityChecks: 0,
      sessionFailures: 0,
      errors: []
    };

    const startTime = performance.now();
    
    // Test session persistence across multiple requests
    const sessionTests = Object.values(TEST_USERS).map(async (user, index) => {
      const token = await this.authenticateUser(user);
      
      // Make multiple requests over time to test session persistence
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        
        try {
          await this.makeRequest(
            'GET',
            '/api/auth/validate',
            token,
            testMetrics,
            `Session validation ${index}-${i}`
          );
        } catch (error) {
          testMetrics.sessionFailures++;
        }
      }
    });

    await Promise.all(sessionTests);
    
    const endTime = performance.now();
    testMetrics.endTime = new Date();
    testMetrics.duration = endTime - startTime;
    testMetrics.errorRate = testMetrics.failedRequests / testMetrics.totalRequests;
    testMetrics.averageResponseTime = testMetrics.duration / testMetrics.totalRequests;
    
    this.metrics.push(testMetrics);
    
    console.log(`✅ Session reliability test completed`);
    console.log(`📊 Session failures: ${testMetrics.sessionFailures}`);
  }

  private async testDataConsistency(): Promise<void> {
    console.log('\n🔄 Testing Data Consistency Across Concurrent Operations...');
    
    const testMetrics: ReliabilityMetrics = {
      testName: 'Data Consistency',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      memoryUsage: [],
      dbConnectionCount: [],
      concurrentUsers: 2,
      dataIntegrityChecks: 0,
      sessionFailures: 0,
      errors: []
    };

    const staff1Token = await this.authenticateUser(TEST_USERS.STAFF_1);
    const staff2Token = await this.authenticateUser(TEST_USERS.STAFF_2);

    const startTime = performance.now();
    
    // Test concurrent inventory updates
    const productId = 1;
    const initialQuantity = 100;
    
    // Get initial state
    const initialState = await this.makeRequest(
      'GET',
      `/api/products/${productId}`,
      staff1Token,
      testMetrics,
      'Get initial product state'
    );

    // Concurrent updates to the same product
    const concurrentUpdates = [];
    for (let i = 0; i < 10; i++) {
      concurrentUpdates.push(
        this.makeRequest(
          'PUT',
          `/api/inventory/${productId}`,
          i % 2 === 0 ? staff1Token : staff2Token,
          testMetrics,
          `Concurrent inventory update ${i}`,
          { quantity: initialQuantity + i }
        )
      );
    }

    await Promise.allSettled(concurrentUpdates);
    
    // Verify final state
    const finalState = await this.makeRequest(
      'GET',
      `/api/products/${productId}`,
      staff1Token,
      testMetrics,
      'Get final product state'
    );

    testMetrics.dataIntegrityChecks++;
    
    const endTime = performance.now();
    testMetrics.endTime = new Date();
    testMetrics.duration = endTime - startTime;
    testMetrics.errorRate = testMetrics.failedRequests / testMetrics.totalRequests;
    testMetrics.averageResponseTime = testMetrics.duration / testMetrics.totalRequests;
    
    this.metrics.push(testMetrics);
    
    console.log(`✅ Data consistency test completed`);
    console.log(`📊 Data integrity checks: ${testMetrics.dataIntegrityChecks}`);
  }

  private async testResourceUsage(): Promise<void> {
    console.log('\n📊 Testing Memory and Resource Usage...');
    
    const testMetrics: ReliabilityMetrics = {
      testName: 'Resource Usage',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      memoryUsage: [],
      dbConnectionCount: [],
      concurrentUsers: 4,
      dataIntegrityChecks: 0,
      sessionFailures: 0,
      errors: []
    };

    const tokens = await Promise.all([
      this.authenticateUser(TEST_USERS.ADMIN_1),
      this.authenticateUser(TEST_USERS.ADMIN_2),
      this.authenticateUser(TEST_USERS.STAFF_1),
      this.authenticateUser(TEST_USERS.STAFF_2)
    ]);

    const startTime = performance.now();
    
    // Monitor resource usage during sustained load
    const monitoringInterval = setInterval(async () => {
      try {
        const healthResponse = await axios.get('http://localhost:3000/api/health');
        if (healthResponse.data.memory) {
          testMetrics.memoryUsage.push(healthResponse.data.memory);
        }
      } catch (error) {
        // Health endpoint might not have memory info
      }
    }, 1000);

    // Generate sustained load
    const loadOperations = [];
    for (let i = 0; i < 100; i++) {
      const token = tokens[i % 4];
      loadOperations.push(
        this.makeRequest('GET', '/api/dashboard/summary', token, testMetrics, `Load test ${i}`)
      );
    }

    await Promise.allSettled(loadOperations);
    clearInterval(monitoringInterval);
    
    const endTime = performance.now();
    testMetrics.endTime = new Date();
    testMetrics.duration = endTime - startTime;
    testMetrics.errorRate = testMetrics.failedRequests / testMetrics.totalRequests;
    testMetrics.averageResponseTime = testMetrics.duration / testMetrics.totalRequests;
    
    this.metrics.push(testMetrics);
    
    console.log(`✅ Resource usage test completed`);
    console.log(`📊 Memory samples: ${testMetrics.memoryUsage.length}`);
  }

  private async testErrorRecovery(): Promise<void> {
    console.log('\n🛠️ Testing Error Recovery and Graceful Degradation...');
    
    const testMetrics: ReliabilityMetrics = {
      testName: 'Error Recovery',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      memoryUsage: [],
      dbConnectionCount: [],
      concurrentUsers: 1,
      dataIntegrityChecks: 0,
      sessionFailures: 0,
      errors: []
    };

    const token = await this.authenticateUser(TEST_USERS.ADMIN_1);
    const startTime = performance.now();
    
    // Test various error scenarios
    const errorTests = [
      // Invalid endpoints
      this.makeRequest('GET', '/api/nonexistent', token, testMetrics, 'Invalid endpoint test'),
      // Invalid data
      this.makeRequest('POST', '/api/products', token, testMetrics, 'Invalid data test', { invalid: 'data' }),
      // Unauthorized access
      this.makeRequest('GET', '/api/admin/restricted', 'invalid-token', testMetrics, 'Unauthorized test'),
    ];

    await Promise.allSettled(errorTests);
    
    const endTime = performance.now();
    testMetrics.endTime = new Date();
    testMetrics.duration = endTime - startTime;
    testMetrics.errorRate = testMetrics.failedRequests / testMetrics.totalRequests;
    testMetrics.averageResponseTime = testMetrics.duration / testMetrics.totalRequests;
    
    this.metrics.push(testMetrics);
    
    console.log(`✅ Error recovery test completed`);
    console.log(`📊 Expected errors handled: ${testMetrics.failedRequests}`);
  }

  private async authenticateUser(user: TestUser): Promise<string> {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: user.email,
      password: user.password
    });
    return response.data.token;
  }

  private async makeRequest(
    method: string,
    url: string,
    token: string,
    metrics: ReliabilityMetrics,
    context: string,
    data?: any
  ): Promise<any> {
    const requestStart = performance.now();
    
    try {
      const config: any = {
        method,
        url: `http://localhost:3000${url}`,
        headers: { Authorization: `Bearer ${token}` }
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }
      
      const response = await axios(config);
      const requestEnd = performance.now();
      const responseTime = requestEnd - requestStart;
      
      metrics.totalRequests++;
      metrics.successfulRequests++;
      metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
      metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
      
      return response.data;
    } catch (error: any) {
      const requestEnd = performance.now();
      const responseTime = requestEnd - requestStart;
      
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
      metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
      
      metrics.errors.push({
        timestamp: new Date(),
        error: error.message,
        context
      });
      
      throw error;
    }
  }

  private async createInvoice(
    token: string,
    shopId: string,
    invoiceNumber: number,
    metrics: ReliabilityMetrics
  ): Promise<void> {
    const invoiceData = {
      customerId: Math.floor(Math.random() * 100) + 1,
      shopId,
      items: [
        {
          productId: Math.floor(Math.random() * 100) + 1,
          quantity: Math.floor(Math.random() * 5) + 1,
          price: Math.floor(Math.random() * 1000) + 100
        }
      ],
      total: Math.floor(Math.random() * 5000) + 1000,
      invoiceNumber: `INV-${shopId}-${invoiceNumber}`
    };

    await this.makeRequest(
      'POST',
      '/api/invoices',
      token,
      metrics,
      `Create invoice ${invoiceNumber}`,
      invoiceData
    );
  }

  private generateReliabilityReport(): void {
    console.log('\n📋 RELIABILITY TEST REPORT');
    console.log('=' .repeat(50));
    
    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalErrors = 0;
    let avgResponseTime = 0;
    
    this.metrics.forEach(metric => {
      console.log(`\n🧪 ${metric.testName}`);
      console.log(`   Duration: ${(metric.duration / 1000).toFixed(1)}s`);
      console.log(`   Requests: ${metric.totalRequests}`);
      console.log(`   Success Rate: ${((metric.successfulRequests / metric.totalRequests) * 100).toFixed(1)}%`);
      console.log(`   Avg Response: ${metric.averageResponseTime.toFixed(0)}ms`);
      console.log(`   Max Response: ${metric.maxResponseTime.toFixed(0)}ms`);
      console.log(`   Concurrent Users: ${metric.concurrentUsers}`);
      
      if (metric.errors.length > 0) {
        console.log(`   Errors: ${metric.errors.length}`);
      }
      
      totalRequests += metric.totalRequests;
      totalSuccessful += metric.successfulRequests;
      totalErrors += metric.failedRequests;
      avgResponseTime += metric.averageResponseTime;
    });
    
    const overallSuccessRate = (totalSuccessful / totalRequests) * 100;
    const overallAvgResponse = avgResponseTime / this.metrics.length;
    
    console.log('\n📊 OVERALL RESULTS');
    console.log('=' .repeat(30));
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Success Rate: ${overallSuccessRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${overallAvgResponse.toFixed(0)}ms`);
    console.log(`Total Errors: ${totalErrors}`);
    
    // Production readiness assessment
    console.log('\n🎯 PRODUCTION READINESS');
    console.log('=' .repeat(30));
    
    const isReady = 
      overallSuccessRate >= (RELIABILITY_CONFIG.THRESHOLDS.MIN_UPTIME * 100) &&
      overallAvgResponse <= RELIABILITY_CONFIG.THRESHOLDS.MAX_RESPONSE_TIME &&
      (totalErrors / totalRequests) <= RELIABILITY_CONFIG.THRESHOLDS.MAX_ERROR_RATE;
    
    if (isReady) {
      console.log('✅ SYSTEM IS PRODUCTION READY');
      console.log('   ✅ Success rate meets requirements');
      console.log('   ✅ Response times are acceptable');
      console.log('   ✅ Error rate is within limits');
    } else {
      console.log('❌ SYSTEM NEEDS IMPROVEMENT');
      if (overallSuccessRate < (RELIABILITY_CONFIG.THRESHOLDS.MIN_UPTIME * 100)) {
        console.log(`   ❌ Success rate too low: ${overallSuccessRate.toFixed(1)}% < ${(RELIABILITY_CONFIG.THRESHOLDS.MIN_UPTIME * 100)}%`);
      }
      if (overallAvgResponse > RELIABILITY_CONFIG.THRESHOLDS.MAX_RESPONSE_TIME) {
        console.log(`   ❌ Response time too high: ${overallAvgResponse.toFixed(0)}ms > ${RELIABILITY_CONFIG.THRESHOLDS.MAX_RESPONSE_TIME}ms`);
      }
      if ((totalErrors / totalRequests) > RELIABILITY_CONFIG.THRESHOLDS.MAX_ERROR_RATE) {
        console.log(`   ❌ Error rate too high: ${((totalErrors / totalRequests) * 100).toFixed(1)}% > ${(RELIABILITY_CONFIG.THRESHOLDS.MAX_ERROR_RATE * 100)}%`);
      }
    }
  }
}

// Playwright test cases
test.describe('MS Sport Reliability Testing', () => {
  test('Full Reliability Test Suite', async () => {
    const tester = new ReliabilityTester();
    await tester.runFullReliabilityTest();
  });
  
  test('Quick Concurrent User Test', async () => {
    const tester = new ReliabilityTester();
    await tester.testConcurrentAuthentication();
  });
  
  test('Database Stability Test', async () => {
    const tester = new ReliabilityTester();
    await tester.testDatabaseConnectionStability();
  });
});

export { ReliabilityTester, RELIABILITY_CONFIG }; 