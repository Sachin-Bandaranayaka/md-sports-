#!/usr/bin/env node

/**
 * Manual Backup & Restore Testing Script
 * 
 * This script tests the backup and restore functionality manually
 * Usage: node scripts/test-backup-restore.js [backup|restore|full]
 */

const fs = require('fs/promises');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const BACKUP_FILE = path.join(__dirname, '../temp/manual-backup.json');

// Test user tokens (you'll need to replace these with actual tokens)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';
const USER_TOKEN = process.env.USER_TOKEN || 'your-user-token-here';

class BackupRestoreTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    try {
      await this.log(`Testing: ${name}`, 'info');
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      await this.log(`✅ PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      await this.log(`❌ FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async makeRequest(endpoint, options = {}) {
    const fetch = (await import('node-fetch')).default;
    
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    return {
      status: response.status,
      headers: response.headers,
      data,
      ok: response.ok
    };
  }

  async testBackupAuthentication() {
    await this.test('Backup - Valid Admin Token', async () => {
      const response = await this.makeRequest('/api/backup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }

      if (!response.data.timestamp || !response.data.version) {
        throw new Error('Backup data missing required fields');
      }
    });

    await this.test('Backup - Invalid Token', async () => {
      const response = await this.makeRequest('/api/backup', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    });

    await this.test('Backup - No Token', async () => {
      const response = await this.makeRequest('/api/backup', {
        method: 'GET'
      });

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    });
  }

  async testBackupGeneration() {
    await this.test('Backup - Generate and Save', async () => {
      const response = await this.makeRequest('/api/backup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Backup failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }

      // Validate backup structure
      const backup = response.data;
      const requiredFields = ['timestamp', 'version', 'users', 'products', 'shops', 'inventoryItems', 'invoices', 'customers', 'categories', 'suppliers'];
      
      for (const field of requiredFields) {
        if (!backup.hasOwnProperty(field)) {
          throw new Error(`Backup missing required field: ${field}`);
        }
      }

      // Save backup to file
      await fs.mkdir(path.dirname(BACKUP_FILE), { recursive: true });
      await fs.writeFile(BACKUP_FILE, JSON.stringify(backup, null, 2));
      
      await this.log(`Backup saved to: ${BACKUP_FILE}`, 'info');
    });
  }

  async testRestoreAuthentication() {
    // First ensure we have a backup file
    try {
      await fs.access(BACKUP_FILE);
    } catch (error) {
      throw new Error('No backup file found. Run backup test first.');
    }

    const backupData = JSON.parse(await fs.readFile(BACKUP_FILE, 'utf8'));

    await this.test('Restore - Valid Admin Token', async () => {
      const response = await this.makeRequest('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(backupData)
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success) {
        throw new Error('Restore did not report success');
      }
    });

    await this.test('Restore - Invalid Token', async () => {
      const response = await this.makeRequest('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify(backupData)
      });

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    });

    await this.test('Restore - No Token', async () => {
      const response = await this.makeRequest('/api/backup', {
        method: 'POST',
        body: JSON.stringify(backupData)
      });

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    });
  }

  async testRestoreValidation() {
    await this.test('Restore - Invalid JSON', async () => {
      const response = await this.makeRequest('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: '{ invalid json'
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400, got ${response.status}`);
      }
    });

    await this.test('Restore - Invalid Backup Format', async () => {
      const response = await this.makeRequest('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({ invalid: 'format' })
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400, got ${response.status}`);
      }
    });

    await this.test('Restore - Incompatible Version', async () => {
      const invalidBackup = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        users: [],
        products: [],
        shops: [],
        inventoryItems: [],
        invoices: [],
        customers: [],
        categories: [],
        suppliers: []
      };

      const response = await this.makeRequest('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(invalidBackup)
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400, got ${response.status}`);
      }
    });
  }

  async testEndToEndWorkflow() {
    await this.test('End-to-End - Full Backup and Restore Cycle', async () => {
      // Step 1: Generate backup
      await this.log('Step 1: Generating backup...', 'info');
      const backupResponse = await this.makeRequest('/api/backup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      if (!backupResponse.ok) {
        throw new Error(`Backup failed: ${backupResponse.status}`);
      }

      const backupData = backupResponse.data;
      await this.log(`Backup generated with ${Object.keys(backupData).length} data types`, 'info');

      // Step 2: Perform restore
      await this.log('Step 2: Performing restore...', 'info');
      const restoreResponse = await this.makeRequest('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(backupData)
      });

      if (!restoreResponse.ok) {
        throw new Error(`Restore failed: ${restoreResponse.status} - ${JSON.stringify(restoreResponse.data)}`);
      }

      const restoreResult = restoreResponse.data;
      if (!restoreResult.success) {
        throw new Error('Restore did not report success');
      }

      await this.log(`Restore completed. Counts: ${JSON.stringify(restoreResult.restoredCounts)}`, 'info');

      // Step 3: Verify by generating another backup
      await this.log('Step 3: Verifying with second backup...', 'info');
      const verifyResponse = await this.makeRequest('/api/backup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      if (!verifyResponse.ok) {
        throw new Error(`Verification backup failed: ${verifyResponse.status}`);
      }

      await this.log('✅ End-to-end workflow completed successfully', 'success');
    });
  }

  async runBackupTests() {
    await this.log('🚀 Starting Backup Tests', 'info');
    await this.testBackupAuthentication();
    await this.testBackupGeneration();
  }

  async runRestoreTests() {
    await this.log('🚀 Starting Restore Tests', 'info');
    await this.testRestoreAuthentication();
    await this.testRestoreValidation();
  }

  async runFullTests() {
    await this.log('🚀 Starting Full Backup & Restore Test Suite', 'info');
    await this.runBackupTests();
    await this.runRestoreTests();
    await this.testEndToEndWorkflow();
  }

  async printResults() {
    await this.log('\n📊 Test Results Summary', 'info');
    await this.log(`Total Tests: ${this.results.passed + this.results.failed}`, 'info');
    await this.log(`Passed: ${this.results.passed}`, 'success');
    await this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');

    if (this.results.failed > 0) {
      await this.log('\n❌ Failed Tests:', 'error');
      for (const test of this.results.tests) {
        if (test.status === 'FAILED') {
          await this.log(`  - ${test.name}: ${test.error}`, 'error');
        }
      }
    }

    const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
    await this.log(`\nSuccess Rate: ${successRate}%`, successRate === 100 ? 'success' : 'error');
  }
}

// Main execution
async function main() {
  const command = process.argv[2] || 'full';
  const tester = new BackupRestoreTester();

  // Check configuration
  if (ADMIN_TOKEN === 'your-admin-token-here') {
    console.log('⚠️  Warning: Using placeholder admin token. Set ADMIN_TOKEN environment variable with a real token.');
    console.log('   Example: ADMIN_TOKEN=your-real-token node scripts/test-backup-restore.js');
    console.log('');
  }

  try {
    switch (command) {
      case 'backup':
        await tester.runBackupTests();
        break;
      case 'restore':
        await tester.runRestoreTests();
        break;
      case 'full':
        await tester.runFullTests();
        break;
      default:
        console.log('Usage: node scripts/test-backup-restore.js [backup|restore|full]');
        process.exit(1);
    }

    await tester.printResults();
    
    // Exit with error code if tests failed
    if (tester.results.failed > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test runner error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { BackupRestoreTester }; 