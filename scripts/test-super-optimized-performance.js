#!/usr/bin/env node

/**
 * Super-Optimized Invoice Performance Test
 * Tests and compares performance metrics between versions
 */

const { default: lighthouse } = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;

// Performance test configuration
const URLS_TO_TEST = [
    {
        name: 'Original Invoices',
        url: 'http://localhost:3000/invoices',
        description: 'Original invoice page implementation'
    },
    {
        name: 'Optimized Invoices',
        url: 'http://localhost:3000/invoices/optimized',
        description: 'Previously optimized invoice page'
    },
    {
        name: 'Super-Optimized Invoices',
        url: 'http://localhost:3000/invoices/super-optimized',
        description: 'New super-optimized invoice page'
    }
];

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
    EXCELLENT: {
        lcp: 1200,           // < 1.2s
        fcp: 800,            // < 800ms
        cls: 0.1,            // < 0.1
        tbt: 200,            // < 200ms
        speedIndex: 1300     // < 1.3s
    },
    GOOD: {
        lcp: 2500,           // < 2.5s
        fcp: 1800,           // < 1.8s
        cls: 0.25,           // < 0.25
        tbt: 600,            // < 600ms
        speedIndex: 3400     // < 3.4s
    },
    POOR: {
        lcp: 4000,           // > 4s
        fcp: 3000,           // > 3s
        cls: 0.5,            // > 0.5
        tbt: 600,            // > 600ms
        speedIndex: 5800     // > 5.8s
    }
};

function getPerformanceStatus(value, metric) {
    if (value <= PERFORMANCE_THRESHOLDS.EXCELLENT[metric]) {
        return { status: 'EXCELLENT', emoji: '🟢', color: '\x1b[32m' };
    } else if (value <= PERFORMANCE_THRESHOLDS.GOOD[metric]) {
        return { status: 'GOOD', emoji: '🟡', color: '\x1b[33m' };
    } else {
        return { status: 'POOR', emoji: '🔴', color: '\x1b[31m' };
    }
}

async function runLighthouseAudit(url, name) {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    
    const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance'],
        port: chrome.port,
    };

    try {
        console.log(`🚀 Testing ${name}...`);
        const runnerResult = await lighthouse(url, options);
        
        // Extract key metrics
        const metrics = runnerResult.lhr.audits;
        const performanceScore = runnerResult.lhr.categories.performance.score * 100;

        const results = {
            name,
            url,
            performanceScore: Math.round(performanceScore),
            metrics: {
                firstContentfulPaint: Math.round(metrics['first-contentful-paint'].numericValue),
                largestContentfulPaint: Math.round(metrics['largest-contentful-paint'].numericValue),
                speedIndex: Math.round(metrics['speed-index'].numericValue),
                totalBlockingTime: Math.round(metrics['total-blocking-time'].numericValue),
                cumulativeLayoutShift: Math.round(metrics['cumulative-layout-shift'].numericValue * 1000) / 1000,
            },
            timestamp: new Date().toISOString()
        };

        await chrome.kill();
        return results;

    } catch (error) {
        await chrome.kill();
        throw error;
    }
}

function displayResults(results) {
    const reset = '\x1b[0m';
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUPER-OPTIMIZED INVOICE PERFORMANCE TEST RESULTS');
    console.log('='.repeat(80));

    results.forEach(result => {
        console.log(`\n🔍 ${result.name}`);
        console.log(`📍 URL: ${result.url}`);
        console.log(`⭐ Performance Score: ${result.performanceScore}/100`);
        console.log('');

        const metrics = [
            { name: 'First Contentful Paint', key: 'firstContentfulPaint', unit: 'ms', threshold: 'fcp' },
            { name: 'Largest Contentful Paint', key: 'largestContentfulPaint', unit: 'ms', threshold: 'lcp' },
            { name: 'Speed Index', key: 'speedIndex', unit: 'ms', threshold: 'speedIndex' },
            { name: 'Total Blocking Time', key: 'totalBlockingTime', unit: 'ms', threshold: 'tbt' },
            { name: 'Cumulative Layout Shift', key: 'cumulativeLayoutShift', unit: '', threshold: 'cls' }
        ];

        metrics.forEach(metric => {
            const value = result.metrics[metric.key];
            const status = getPerformanceStatus(value, metric.threshold);
            console.log(`  ${status.emoji} ${metric.name}: ${status.color}${value}${metric.unit} (${status.status})${reset}`);
        });
    });

    // Performance comparison
    if (results.length > 1) {
        console.log('\n' + '='.repeat(80));
        console.log('📈 PERFORMANCE COMPARISON');
        console.log('='.repeat(80));

        const original = results.find(r => r.name.includes('Original'));
        const superOptimized = results.find(r => r.name.includes('Super-Optimized'));

        if (original && superOptimized) {
            console.log(`\n🏁 Original vs Super-Optimized Improvements:`);
            
            const improvements = [
                { name: 'First Contentful Paint', orig: original.metrics.firstContentfulPaint, opt: superOptimized.metrics.firstContentfulPaint },
                { name: 'Largest Contentful Paint', orig: original.metrics.largestContentfulPaint, opt: superOptimized.metrics.largestContentfulPaint },
                { name: 'Speed Index', orig: original.metrics.speedIndex, opt: superOptimized.metrics.speedIndex },
                { name: 'Total Blocking Time', orig: original.metrics.totalBlockingTime, opt: superOptimized.metrics.totalBlockingTime }
            ];

            improvements.forEach(imp => {
                const improvement = ((imp.orig - imp.opt) / imp.orig * 100);
                const emoji = improvement > 0 ? '📈' : '📉';
                const color = improvement > 0 ? '\x1b[32m' : '\x1b[31m';
                console.log(`  ${emoji} ${imp.name}: ${color}${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}% improvement${reset}`);
            });

            const scoreImprovement = superOptimized.performanceScore - original.performanceScore;
            console.log(`\n⭐ Overall Performance Score: ${scoreImprovement > 0 ? '+' : ''}${scoreImprovement} points`);
        }
    }

    console.log('\n' + '='.repeat(80));
}

async function saveResults(results) {
    const filename = `test-results/super-optimized-performance-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${filename}`);
}

async function main() {
    console.log('🧪 Starting Super-Optimized Invoice Performance Tests...\n');

    const results = [];

    try {
        for (const testConfig of URLS_TO_TEST) {
            try {
                const result = await runLighthouseAudit(testConfig.url, testConfig.name);
                results.push(result);
                console.log(`✅ ${testConfig.name} test completed`);
            } catch (error) {
                console.error(`❌ ${testConfig.name} test failed:`, error.message);
                // Continue with other tests
            }
        }

        if (results.length > 0) {
            displayResults(results);
            await saveResults(results);
        } else {
            console.error('❌ No successful tests completed');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Check if lighthouse is available
async function checkDependencies() {
    try {
        require.resolve('lighthouse');
        require.resolve('chrome-launcher');
    } catch (error) {
        console.error('❌ Missing dependencies. Please install lighthouse and chrome-launcher:');
        console.error('npm install -g lighthouse chrome-launcher');
        process.exit(1);
    }
}

if (require.main === module) {
    checkDependencies()
        .then(() => main())
        .catch(console.error);
}

module.exports = { runLighthouseAudit, displayResults, saveResults }; 