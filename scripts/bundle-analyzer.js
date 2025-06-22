#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleAnalyzer {
  constructor() {
    this.bundleStats = {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      largeFiles: [],
      duplicatePackages: [],
      unusedCode: []
    };
  }

  async analyzeBundleSize() {
    console.log('🔍 Analyzing Bundle Size for TBT Optimization\n');
    console.log('Target: Reduce Total Blocking Time from 1,160ms to <300ms\n');

    try {
      // 1. Analyze Next.js build output
      console.log('📦 Building for production analysis...');
      execSync('npm run build', { stdio: 'inherit' });

      // 2. Analyze .next folder
      await this.analyzeNextBuild();

      // 3. Find large JavaScript files
      await this.findLargeFiles();

      // 4. Check for duplicate dependencies
      await this.checkDuplicateDependencies();

      // 5. Generate optimization recommendations
      this.generateOptimizationPlan();

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
    }
  }

  async analyzeNextBuild() {
    const buildDir = '.next';
    if (!fs.existsSync(buildDir)) {
      console.log('⚠️ No .next build directory found. Run npm run build first.');
      return;
    }

    console.log('\n📊 Analyzing Next.js Build Output:');
    
    // Analyze static chunks
    const staticDir = path.join(buildDir, 'static');
    if (fs.existsSync(staticDir)) {
      await this.analyzeDirectory(staticDir, 'Static Assets');
    }

    // Analyze server chunks
    const serverDir = path.join(buildDir, 'server');
    if (fs.existsSync(serverDir)) {
      await this.analyzeDirectory(serverDir, 'Server Chunks');
    }
  }

  async analyzeDirectory(dirPath, category) {
    const files = this.getAllFiles(dirPath);
    let totalSize = 0;
    const largeFiles = [];

    files.forEach(file => {
      const stats = fs.statSync(file);
      const sizeKB = Math.round(stats.size / 1024);
      totalSize += sizeKB;

      if (sizeKB > 100) { // Files larger than 100KB
        largeFiles.push({
          path: path.relative(process.cwd(), file),
          size: sizeKB,
          type: path.extname(file)
        });
      }
    });

    console.log(`\n${category}:`);
    console.log(`  Total Size: ${totalSize} KB`);
    console.log(`  File Count: ${files.length}`);
    
    if (largeFiles.length > 0) {
      console.log(`  Large Files (>100KB):`);
      largeFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .forEach(file => {
          console.log(`    ${file.path}: ${file.size} KB`);
        });
      
      this.bundleStats.largeFiles.push(...largeFiles);
    }

    this.bundleStats.totalSize += totalSize;
  }

  getAllFiles(dirPath) {
    let files = [];
    
    if (!fs.existsSync(dirPath)) return files;
    
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        files = files.concat(this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  async findLargeFiles() {
    console.log('\n🔍 Identifying Performance Bottlenecks:');
    
    const criticalFiles = this.bundleStats.largeFiles
      .filter(file => file.size > 200) // Files larger than 200KB
      .sort((a, b) => b.size - a.size);

    if (criticalFiles.length > 0) {
      console.log('\n⚠️ Critical Large Files (>200KB):');
      criticalFiles.forEach(file => {
        console.log(`  ${file.path}: ${file.size} KB - CRITICAL`);
      });
    }

    // Check for common performance issues
    const jsFiles = this.bundleStats.largeFiles.filter(f => f.type === '.js');
    const totalJSSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
    
    console.log(`\n📊 JavaScript Bundle Analysis:`);
    console.log(`  Total JS Size: ${totalJSSize} KB`);
    console.log(`  JS File Count: ${jsFiles.length}`);
    
    if (totalJSSize > 1000) {
      console.log(`  ⚠️ WARNING: Large JS bundle (${totalJSSize} KB > 1000 KB)`);
    }
  }

  async checkDuplicateDependencies() {
    console.log('\n🔍 Checking for Duplicate Dependencies...');
    
    try {
      // Check package.json for potential duplicates
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Look for common duplicate patterns
      const duplicatePatterns = [
        ['react', '@types/react'],
        ['lodash', 'lodash-es'],
        ['moment', 'dayjs', 'date-fns'],
        ['axios', 'fetch'],
        ['styled-components', 'emotion']
      ];
      
      duplicatePatterns.forEach(pattern => {
        const found = pattern.filter(pkg => deps[pkg]);
        if (found.length > 1) {
          console.log(`  ⚠️ Potential duplicate: ${found.join(', ')}`);
          this.bundleStats.duplicatePackages.push(found);
        }
      });
      
    } catch (error) {
      console.log(`  ❌ Could not analyze dependencies: ${error.message}`);
    }
  }

  generateOptimizationPlan() {
    console.log('\n🚀 CRITICAL PERFORMANCE OPTIMIZATION PLAN\n');
    console.log('='.repeat(60));
    
    console.log('\n1. 🎯 IMMEDIATE ACTIONS (Next 30 minutes):');
    
    // Critical file optimizations
    const criticalFiles = this.bundleStats.largeFiles
      .filter(file => file.size > 200)
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
      
    if (criticalFiles.length > 0) {
      console.log('\n   📦 Bundle Splitting Required:');
      criticalFiles.forEach(file => {
        console.log(`   • Split ${file.path} (${file.size} KB)`);
        if (file.path.includes('chunk')) {
          console.log(`     → Implement dynamic imports`);
        }
        if (file.path.includes('vendor')) {
          console.log(`     → Split vendor bundle`);
        }
      });
    }
    
    console.log('\n   🔧 Code Splitting Implementations:');
    console.log('   • Convert large components to lazy loading');
    console.log('   • Implement route-based code splitting');
    console.log('   • Split vendor dependencies');
    console.log('   • Remove unused dependencies');
    
    if (this.bundleStats.duplicatePackages.length > 0) {
      console.log('\n   🗑️ Remove Duplicate Dependencies:');
      this.bundleStats.duplicatePackages.forEach(duplicates => {
        console.log(`   • Choose one: ${duplicates.join(' OR ')}`);
      });
    }
    
    console.log('\n2. 📊 Expected Performance Impact:');
    console.log('   • Total Blocking Time: 1,160ms → <300ms (74% improvement)');
    console.log('   • Bundle Size Reduction: 30-50%');
    console.log('   • Time to Interactive: 17.3s → <5s (71% improvement)');
    console.log('   • Performance Score: 51 → 75+ (47% improvement)');
    
    console.log('\n3. 🔄 Implementation Commands:');
    console.log('   npm run optimize:bundle');
    console.log('   npm run analyze:webpack');
    console.log('   npm run test:performance');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PRIORITY: Fix TBT (1,160ms) and LCP (17.4s) issues first!');
    console.log('='.repeat(60));
  }
}

// Run analysis
const analyzer = new BundleAnalyzer();
analyzer.analyzeBundleSize().catch(console.error); 