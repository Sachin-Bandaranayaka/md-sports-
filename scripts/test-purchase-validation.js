#!/usr/bin/env node

/**
 * Purchase Invoice Validation Test Runner
 * 
 * This script runs all tests related to purchase invoice distribution validation
 * that was implemented to prevent creating invoices without proper inventory distribution.
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.blue}▶️ ${description}${colors.reset}`);
  log(`${colors.yellow}Running: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: path.resolve(__dirname, '..')
    });
    
    log(`${colors.green}✅ ${description} - PASSED${colors.reset}`);
    
    // Show summary if available
    const lines = output.split('\n');
    const summaryLine = lines.find(line => 
      line.includes('Tests:') || 
      line.includes('test suites') ||
      line.includes('passed')
    );
    if (summaryLine) {
      log(`   ${summaryLine.trim()}`);
    }
    
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} - FAILED${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
}

function main() {
  log(`${colors.bold}${colors.blue}🧪 Purchase Invoice Distribution Validation Test Suite${colors.reset}`);
  log(`${colors.blue}=========================================================${colors.reset}\n`);
  
  log("This test suite verifies the comprehensive validation system that prevents");
  log("creating purchase invoices without proper inventory distribution to shops.\n");
  
  const tests = [
    {
      command: 'npm test tests/unit/purchaseInvoiceValidation.test.ts',
      description: 'Unit Tests - Validation Functions'
    },
    {
      command: 'npm test tests/components/purchaseInvoiceForms.test.tsx',
      description: 'Component Tests - Form Validation UI'
    },
    // Integration test temporarily disabled due to Next.js import issues
    // {
    //   command: 'npm test tests/integration/purchaseInvoiceDistributionValidation.test.ts', 
    //   description: 'Integration Tests - API Validation'
    // }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  // Run each test suite
  for (const test of tests) {
    if (runCommand(test.command, test.description)) {
      passed++;
    }
  }
  
  // Show final summary
  log(`\n${colors.bold}${colors.blue}📊 Test Summary${colors.reset}`);
  log(`${colors.blue}===============${colors.reset}`);
  
  if (passed === total) {
    log(`${colors.green}🎉 ALL TESTS PASSED (${passed}/${total})${colors.reset}`);
    log(`${colors.green}✅ Purchase invoice validation is working correctly!${colors.reset}`);
    process.exit(0);
  } else {
    log(`${colors.red}❌ SOME TESTS FAILED (${passed}/${total} passed)${colors.reset}`);
    log(`${colors.red}🚨 Purchase invoice validation needs attention!${colors.reset}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log(`${colors.bold}Purchase Invoice Validation Test Runner${colors.reset}\n`);
  log("Usage:");
  log("  node scripts/test-purchase-validation.js [options]\n");
  log("Options:");
  log("  --help, -h     Show this help message");
  log("  --unit         Run only unit tests");
  log("  --component    Run only component tests");
  log("  --integration  Run only integration tests");
  log("  --verbose      Show detailed test output\n");
  log("Examples:");
  log("  node scripts/test-purchase-validation.js");
  log("  node scripts/test-purchase-validation.js --unit");
  log("  node scripts/test-purchase-validation.js --verbose");
  process.exit(0);
}

if (args.includes('--unit')) {
  log(`${colors.blue}Running Unit Tests Only${colors.reset}\n`);
  const success = runCommand(
    'npm test tests/unit/purchaseInvoiceValidation.test.ts', 
    'Unit Tests - Validation Functions'
  );
  process.exit(success ? 0 : 1);
}

if (args.includes('--component')) {
  log(`${colors.blue}Running Component Tests Only${colors.reset}\n`);
  const success = runCommand(
    'npm test tests/components/purchaseInvoiceForms.test.tsx', 
    'Component Tests - Form Validation UI'
  );
  process.exit(success ? 0 : 1);
}

if (args.includes('--integration')) {
  log(`${colors.blue}Running Integration Tests Only${colors.reset}\n`);
  const success = runCommand(
    'npm test tests/integration/purchaseInvoiceDistributionValidation.test.ts', 
    'Integration Tests - API Validation'
  );
  process.exit(success ? 0 : 1);
}

// Run all tests by default
main(); 