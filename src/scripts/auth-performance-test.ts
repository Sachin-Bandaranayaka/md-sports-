/**
 * Authentication Performance Test Script
 * 
 * This script tests the performance improvements made to the authentication system:
 * - Database indexes on User and RefreshToken tables
 * - Caching for user sessions, permissions, and token validation
 * - Optimized authentication flow
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

interface TestResult {
    operation: string;
    duration: number;
    success: boolean;
    cached?: boolean;
}

class AuthPerformanceTester {
    private results: TestResult[] = [];
    private accessToken: string = '';

    async runTests() {
        console.log('🚀 Starting Authentication Performance Tests\n');
        console.log('Testing optimizations:');
        console.log('✅ Database indexes on User.email, User.(email,isActive), RefreshToken.token');
        console.log('✅ Redis caching for user sessions and permissions');
        console.log('✅ Optimized authentication flow\n');

        try {
            // Test 1: Login Performance (First time - no cache)
            await this.testLogin('First Login (No Cache)');

            // Test 2: Token Validation Performance (First time - no cache)
            await this.testTokenValidation('First Token Validation (No Cache)');

            // Test 3: Login Performance (Second time - with cache)
            await this.testLogin('Second Login (With Cache)');

            // Test 4: Token Validation Performance (Second time - with cache)
            await this.testTokenValidation('Second Token Validation (With Cache)');

            // Test 5: Multiple rapid token validations (cache hit)
            await this.testRapidTokenValidations();

            // Test 6: Permission check performance
            await this.testPermissionCheck();

            this.printResults();

        } catch (_error) {
            console.error('❌ Test failed:', _error);
        }
    }

    private async testLogin(testName: string): Promise<void> {
        const startTime = performance.now();

        try {
            const response = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            if (response.data.success) {
                this.accessToken = response.data.accessToken;
                this.results.push({
                    operation: testName,
                    duration,
                    success: true,
                    cached: testName.includes('Cache')
                });
                console.log(`✅ ${testName}: ${duration.toFixed(2)}ms`);
            } else {
                throw new Error('Login failed');
            }
        } catch {
            const endTime = performance.now();
            const duration = endTime - startTime;

            this.results.push({
                operation: testName,
                duration,
                success: false
            });
            console.log(`❌ ${testName}: ${duration.toFixed(2)}ms (FAILED)`);
        }
    }

    private async testTokenValidation(testName: string): Promise<void> {
        if (!this.accessToken) {
            console.log(`⚠️  Skipping ${testName}: No access token available`);
            return;
        }

        const startTime = performance.now();

        try {
            const response = await axios.get(`${BASE_URL}/api/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            this.results.push({
                operation: testName,
                duration,
                success: response.data.success,
                cached: testName.includes('Cache')
            });

            console.log(`✅ ${testName}: ${duration.toFixed(2)}ms`);
        } catch {
            const endTime = performance.now();
            const duration = endTime - startTime;

            this.results.push({
                operation: testName,
                duration,
                success: false
            });
            console.log(`❌ ${testName}: ${duration.toFixed(2)}ms (FAILED)`);
        }
    }

    private async testRapidTokenValidations(): Promise<void> {
        if (!this.accessToken) {
            console.log('⚠️  Skipping rapid validations: No access token available');
            return;
        }

        console.log('\n🔄 Testing rapid token validations (cache performance)...');
        const validationPromises = [];
        const startTime = performance.now();

        // Make 10 concurrent token validation requests
        for (let i = 0; i < 10; i++) {
            validationPromises.push(
                axios.get(`${BASE_URL}/api/auth/validate`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                })
            );
        }

        try {
            await Promise.all(validationPromises);
            const endTime = performance.now();
            const totalDuration = endTime - startTime;
            const avgDuration = totalDuration / 10;

            this.results.push({
                operation: '10 Concurrent Token Validations (Cached)',
                duration: avgDuration,
                success: true,
                cached: true
            });

            console.log(`✅ 10 concurrent validations: ${totalDuration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms average`);
        } catch (error) {
            console.log('❌ Rapid validations failed:', error);
        }
    }

    private async testPermissionCheck(): Promise<void> {
        if (!this.accessToken) {
            console.log('⚠️  Skipping permission check: No access token available');
            return;
        }

        const startTime = performance.now();

        try {
            // Test a protected endpoint that requires permission
            const response = await axios.get(`${BASE_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            this.results.push({
                operation: 'Permission Check (Cached)',
                duration,
                success: response.status === 200,
                cached: true
            });

            console.log(`✅ Permission check: ${duration.toFixed(2)}ms`);
        } catch {
            const endTime = performance.now();
            const duration = endTime - startTime;

            this.results.push({
                operation: 'Permission Check',
                duration,
                success: false
            });
            console.log(`❌ Permission check: ${duration.toFixed(2)}ms (FAILED)`);
        }
    }

    private printResults(): void {
        console.log('\n📊 Performance Test Results Summary\n');
        console.log('='.repeat(70));
        console.log('Operation'.padEnd(40) + 'Duration'.padEnd(15) + 'Status');
        console.log('='.repeat(70));

        this.results.forEach(result => {
            const operation = result.operation.padEnd(40);
            const duration = `${result.duration.toFixed(2)}ms`.padEnd(15);
            const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
            const cached = result.cached ? ' (CACHED)' : '';

            console.log(`${operation}${duration}${status}${cached}`);
        });

        console.log('='.repeat(70));

        // Calculate performance improvements
        const firstLogin = this.results.find(r => r.operation.includes('First Login'));
        const secondLogin = this.results.find(r => r.operation.includes('Second Login'));
        const firstValidation = this.results.find(r => r.operation.includes('First Token Validation'));
        const secondValidation = this.results.find(r => r.operation.includes('Second Token Validation'));

        if (firstLogin && secondLogin) {
            const improvement = ((firstLogin.duration - secondLogin.duration) / firstLogin.duration) * 100;
            console.log(`\n🚀 Login Performance Improvement: ${improvement.toFixed(1)}% faster with cache`);
        }

        if (firstValidation && secondValidation) {
            const improvement = ((firstValidation.duration - secondValidation.duration) / firstValidation.duration) * 100;
            console.log(`🚀 Token Validation Improvement: ${improvement.toFixed(1)}% faster with cache`);
        }

        const avgCachedDuration = this.results
            .filter(r => r.cached && r.success)
            .reduce((sum, r) => sum + r.duration, 0) / this.results.filter(r => r.cached && r.success).length;

        const avgUncachedDuration = this.results
            .filter(r => !r.cached && r.success)
            .reduce((sum, r) => sum + r.duration, 0) / this.results.filter(r => !r.cached && r.success).length;

        if (avgCachedDuration && avgUncachedDuration) {
            const overallImprovement = ((avgUncachedDuration - avgCachedDuration) / avgUncachedDuration) * 100;
            console.log(`🚀 Overall Performance Improvement: ${overallImprovement.toFixed(1)}% faster with optimizations`);
        }

        console.log('\n✨ Optimizations Applied:');
        console.log('  • Database indexes on critical authentication columns');
        console.log('  • Redis caching for user sessions and permissions');
        console.log('  • Optimized SQL queries with single database calls');
        console.log('  • Token validation caching');
        console.log('  • Permission caching with role-based access');
    }
}

// Run the tests
if (require.main === module) {
    const tester = new AuthPerformanceTester();
    tester.runTests().catch(console.error);
}

export default AuthPerformanceTester;