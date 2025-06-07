#!/usr/bin/env node

/**
 * Migration script for Vercel deployment
 * Helps transition from Socket.IO to polling-based real-time updates
 */

const fs = require('fs');
const path = require('path');

const SOCKET_IO_PATTERNS = [
  /import.*socket\.io/gi,
  /from.*socket\.io/gi,
  /socket\.emit/gi,
  /socket\.on/gi,
  /io\(/gi,
  /useSocket/gi,
  /socketio/gi
];

const REALTIME_REPLACEMENT = `
// Replace Socket.IO with polling-based real-time updates
// Import the new hook:
// import { useRealtime } from '@/hooks/useRealtime';
//
// Usage:
// const { updates, publishUpdate } = useRealtime({
//   types: ['inventory', 'invoice'],
//   onUpdate: (update) => {
//     // Handle real-time update
//   }
// });
`;

function findSocketIOUsage(dir) {
  const results = [];
  
  function scanDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .next directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
          scanDirectory(filePath);
        }
      } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = [];
        
        SOCKET_IO_PATTERNS.forEach((pattern, index) => {
          const patternMatches = content.match(pattern);
          if (patternMatches) {
            matches.push(...patternMatches);
          }
        });
        
        if (matches.length > 0) {
          results.push({
            file: filePath,
            matches: [...new Set(matches)] // Remove duplicates
          });
        }
      }
    }
  }
  
  scanDirectory(dir);
  return results;
}

function createMigrationReport(socketIOUsage) {
  const report = [
    '# Socket.IO to Polling Migration Report',
    '',
    'This report shows files that contain Socket.IO usage and need to be updated for Vercel deployment.',
    '',
    '## Files requiring updates:',
    ''
  ];
  
  if (socketIOUsage.length === 0) {
    report.push('✅ No Socket.IO usage found! Your application is ready for Vercel deployment.');
  } else {
    socketIOUsage.forEach(({ file, matches }) => {
      report.push(`### ${file}`);
      report.push('');
      report.push('**Socket.IO patterns found:**');
      matches.forEach(match => {
        report.push(`- \`${match}\``);
      });
      report.push('');
      report.push('**Recommended action:**');
      report.push('Replace Socket.IO usage with the new `useRealtime` hook.');
      report.push('');
    });
    
    report.push('## Migration Steps');
    report.push('');
    report.push('1. **Remove Socket.IO dependencies:**');
    report.push('   ```bash');
    report.push('   npm uninstall socket.io socket.io-client');
    report.push('   ```');
    report.push('');
    report.push('2. **Update client-side code:**');
    report.push('   Replace Socket.IO hooks with `useRealtime`:');
    report.push('   ```typescript');
    report.push('   // Old Socket.IO code');
    report.push('   // const socket = useSocket();');
    report.push('   // socket.on("update", handleUpdate);');
    report.push('');
    report.push('   // New polling-based code');
    report.push('   import { useRealtime } from "@/hooks/useRealtime";');
    report.push('   const { updates, publishUpdate } = useRealtime({');
    report.push('     types: ["inventory", "invoice"],');
    report.push('     onUpdate: handleUpdate');
    report.push('   });');
    report.push('   ```');
    report.push('');
    report.push('3. **Update server-side code:**');
    report.push('   Replace Socket.IO emits with API calls to `/api/realtime`:');
    report.push('   ```typescript');
    report.push('   // Old Socket.IO code');
    report.push('   // io.emit("update", data);');
    report.push('');
    report.push('   // New API-based code');
    report.push('   await fetch("/api/realtime", {');
    report.push('     method: "POST",');
    report.push('     headers: { "Content-Type": "application/json" },');
    report.push('     body: JSON.stringify({ type: "inventory", data })');
    report.push('   });');
    report.push('   ```');
    report.push('');
    report.push('4. **Remove server.js:**');
    report.push('   The custom server is not compatible with Vercel. Remove `server.js` and update package.json scripts.');
    report.push('');
    report.push('5. **Test the migration:**');
    report.push('   ```bash');
    report.push('   npm run dev');
    report.push('   ```');
  }
  
  return report.join('\n');
}

function checkVercelCompatibility() {
  const issues = [];
  
  // Check for server.js
  if (fs.existsSync('server.js')) {
    issues.push({
      type: 'error',
      message: 'Custom server (server.js) detected. This is not compatible with Vercel serverless functions.',
      solution: 'Remove server.js and update package.json scripts to use "next dev" and "next start"'
    });
  }
  
  // Check for Socket.IO dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (dependencies['socket.io'] || dependencies['socket.io-client']) {
    issues.push({
      type: 'warning',
      message: 'Socket.IO dependencies found. These should be removed for Vercel deployment.',
      solution: 'Run: npm uninstall socket.io socket.io-client'
    });
  }
  
  // Check for Vercel KV dependency
  if (!dependencies['@vercel/kv']) {
    issues.push({
      type: 'info',
      message: 'Vercel KV dependency not found.',
      solution: 'Run: npm install @vercel/kv'
    });
  }
  
  return issues;
}

function main() {
  console.log('🚀 Vercel Migration Tool\n');
  
  // Check current directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ No package.json found. Please run this script from your project root.');
    process.exit(1);
  }
  
  console.log('📊 Analyzing project for Vercel compatibility...\n');
  
  // Check for Socket.IO usage
  const socketIOUsage = findSocketIOUsage('.');
  
  // Check for other compatibility issues
  const compatibilityIssues = checkVercelCompatibility();
  
  // Generate migration report
  const report = createMigrationReport(socketIOUsage);
  
  // Write report to file
  fs.writeFileSync('MIGRATION_REPORT.md', report);
  
  console.log('📋 Migration Report Generated: MIGRATION_REPORT.md\n');
  
  // Display compatibility issues
  if (compatibilityIssues.length > 0) {
    console.log('⚠️  Compatibility Issues Found:\n');
    
    compatibilityIssues.forEach(issue => {
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${issue.message}`);
      console.log(`   Solution: ${issue.solution}\n`);
    });
  }
  
  // Display summary
  if (socketIOUsage.length === 0 && compatibilityIssues.filter(i => i.type === 'error').length === 0) {
    console.log('✅ Your project appears to be ready for Vercel deployment!');
    console.log('\n📚 Next steps:');
    console.log('1. Set up environment variables in Vercel Dashboard');
    console.log('2. Configure Vercel KV for caching');
    console.log('3. Deploy to Vercel');
    console.log('\n📖 See VERCEL_DEPLOYMENT.md for detailed instructions.');
  } else {
    console.log('🔧 Migration required. Please review MIGRATION_REPORT.md for detailed instructions.');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findSocketIOUsage,
  createMigrationReport,
  checkVercelCompatibility
};