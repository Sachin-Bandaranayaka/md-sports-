// Lint-staged configuration for MD Sports Inventory Management
// This file defines what tools to run on staged files before commit

module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    // Run ESLint with auto-fix
    'eslint --fix',
    // Run Prettier formatting
    'prettier --write',
    // Run type checking for TypeScript files
    () => 'npm run type-check',
    // Run unit tests for affected files
    'npm run test:affected --',
  ],
  
  // JSON files
  '*.json': [
    'prettier --write',
  ],
  
  // CSS and SCSS files
  '*.{css,scss,sass}': [
    'prettier --write',
    // Add stylelint if configured
    // 'stylelint --fix',
  ],
  
  // Markdown files
  '*.md': [
    'prettier --write',
    // Check for broken links (optional)
    // 'markdown-link-check',
  ],
  
  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
  ],
  
  // Package.json files
  'package.json': [
    'prettier --write',
    // Sort package.json
    'npx sort-package-json',
  ],
  
  // Prisma schema files
  '*.prisma': [
    'npx prisma format',
  ],
  
  // Environment files
  '.env*': [
    // Check for exposed secrets (basic check)
    (filenames) => {
      const secretPatterns = [
        /password\s*=\s*[^\s]+/i,
        /secret\s*=\s*[^\s]+/i,
        /key\s*=\s*[^\s]+/i,
        /token\s*=\s*[^\s]+/i,
      ];
      
      const fs = require('fs');
      const warnings = [];
      
      filenames.forEach(filename => {
        try {
          const content = fs.readFileSync(filename, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            secretPatterns.forEach(pattern => {
              if (pattern.test(line) && !line.includes('example') && !line.includes('placeholder')) {
                warnings.push(`${filename}:${index + 1} - Potential secret detected: ${line.split('=')[0]}`);
              }
            });
          });
        } catch (error) {
          // Ignore file read errors
        }
      });
      
      if (warnings.length > 0) {
        console.warn('⚠️  Potential secrets detected in environment files:');
        warnings.forEach(warning => console.warn(`   ${warning}`));
        console.warn('   Please ensure no real secrets are committed to version control.');
      }
      
      return 'echo "Environment files checked for secrets"';
    },
  ],
  
  // Test files - run related tests
  '*.{test,spec}.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
    // Run the specific test file
    (filenames) => filenames.map(filename => `npm run test -- ${filename}`),
  ],
  
  // API route files - run API tests
  'src/app/api/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    // Run API-specific tests
    () => 'npm run test:api',
  ],
  
  // Component files - run component tests
  'src/components/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    // Run component-specific tests
    () => 'npm run test:components',
  ],
  
  // Database-related files
  'src/lib/db.ts': [
    'eslint --fix',
    'prettier --write',
    // Run database-related tests
    () => 'npm run test:integration',
  ],
  
  // Authentication files
  'src/lib/auth.ts': [
    'eslint --fix',
    'prettier --write',
    // Run auth-specific tests
    () => 'npm run test -- --testPathPattern=auth',
  ],
  
  // Utility files
  'src/lib/utils/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    // Run utility tests
    () => 'npm run test:utils',
  ],
  
  // Configuration files
  '*.config.{js,ts}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // Docker files
  'Dockerfile*': [
    // Basic Dockerfile linting (if hadolint is available)
    // 'hadolint',
  ],
  
  // GitHub workflows
  '.github/workflows/*.{yml,yaml}': [
    'prettier --write',
    // Validate GitHub Actions syntax (if actionlint is available)
    // 'actionlint',
  ],
};

// Additional configuration for specific scenarios
if (process.env.CI) {
  // In CI environment, don't auto-fix, just check
  module.exports = {
    '*.{ts,tsx,js,jsx}': [
      'eslint',
      'prettier --check',
      () => 'npm run type-check',
    ],
    '*.json': ['prettier --check'],
    '*.{css,scss,sass}': ['prettier --check'],
    '*.md': ['prettier --check'],
    '*.{yml,yaml}': ['prettier --check'],
  };
}