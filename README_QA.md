# MD Sports Management System - QA & Testing Setup

## 🎯 Overview

This project implements a comprehensive Quality Assurance strategy to ensure **zero bugs** and **super reliability**. Our multi-layered testing approach includes automated testing, continuous integration, performance monitoring, security scanning, and accessibility validation.

## 🚀 Quick Start for QA

### Prerequisites

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
npx prisma generate
npx prisma db push
```

### Run Complete QA Suite

```bash
# Full QA check (recommended before releases)
npm run qa:full

# Quick QA check (for daily development)
npm run qa:quick

# Pre-commit checks
npm run qa:pre-commit

# Pre-push checks
npm run qa:pre-push
```

## 🧪 Testing Layers

### 1. Code Quality & Linting

```bash
# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Type checking
npm run type-check
```

**Tools Used:**
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type checking
- Husky for git hooks
- lint-staged for pre-commit checks

### 2. Unit Testing (Jest)

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests with coverage
npm run test:coverage

# Run critical module tests
npm run test:critical

# Run specific test categories
npm run test:utils
npm run test:components
npm run test:api
```

**Coverage Requirements:**
- Overall: 85%
- Critical modules (auth, db, validators): 95%
- Statements: 85%
- Branches: 80%
- Functions: 85%
- Lines: 85%

**Test Files:**
- `tests/unit/auth.test.ts` - Authentication service tests
- `tests/unit/utils/` - Utility function tests
- `tests/unit/validators/` - Input validation tests
- `tests/unit/services/` - Business logic tests

### 3. Integration Testing

```bash
# Run integration tests
npm run test:integration

# Run API endpoint tests
npm run test:api

# Run component integration tests
npm run test:components
```

**Test Files:**
- `tests/integration/api-routes.test.ts` - API endpoint tests
- `tests/integration/database.test.ts` - Database integration tests
- `tests/integration/services.test.ts` - Service integration tests

### 4. End-to-End Testing (Playwright)

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

**Test Scenarios:**
- Authentication flows
- Product management workflows
- Inventory operations
- Sales and invoicing
- User management
- Cross-browser compatibility

**Test Files:**
- `tests/e2e/auth.spec.ts` - Authentication E2E tests
- `tests/e2e/products.spec.ts` - Product management tests
- `tests/e2e/inventory.spec.ts` - Inventory management tests
- `tests/e2e/sales.spec.ts` - Sales workflow tests

### 5. Performance Testing

```bash
# Run load tests
npm run test:load

# Run Lighthouse performance audit
npm run test:lighthouse

# Run performance benchmarks
npm run test:performance
```

**Performance Targets:**
- Page load time: < 2 seconds
- API response time: < 500ms (p95)
- Lighthouse score: > 90
- Error rate: < 1%

**Configuration:**
- `tests/performance/load-test.yml` - Artillery load testing config
- `lighthouse.config.js` - Lighthouse configuration

### 6. Security Testing

```bash
# Run security test suite
npm run test:security

# Run dependency audit
npm run audit

# Check for secrets in code
npm run security:secrets
```

**Security Checks:**
- SQL injection prevention
- XSS attack prevention
- Authentication security
- JWT token validation
- Input sanitization
- Rate limiting
- OWASP Top 10 compliance

**Test Files:**
- `tests/security/security.test.ts` - Security vulnerability tests
- `tests/security/auth-security.test.ts` - Authentication security tests

### 7. Accessibility Testing

```bash
# Run accessibility tests
npm run test:a11y

# Run Pa11y accessibility audit
npm run test:pa11y
```

**Accessibility Standards:**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast validation
- ARIA label verification

**Test Files:**
- `tests/accessibility/accessibility.test.ts` - Accessibility test suite
- `tests/accessibility/wcag.test.ts` - WCAG compliance tests

### 8. Visual Regression Testing

```bash
# Run visual regression tests
npm run test:visual

# Update visual baselines
npm run test:visual:update
```

**Visual Testing:**
- UI consistency across browsers
- Responsive design validation
- Component visual states
- Theme consistency
- Cross-browser rendering

**Test Files:**
- `tests/visual/visual-regression.spec.ts` - Visual regression tests

## 🔄 Continuous Integration

### GitHub Actions Pipeline

Our CI/CD pipeline (`.github/workflows/ci-cd.yml`) includes:

1. **Code Quality & Security**
   - ESLint, Prettier, TypeScript checks
   - Security audit and secret scanning
   - Dependency vulnerability checks

2. **Testing Stages**
   - Unit tests with coverage reporting
   - Integration tests
   - E2E tests across multiple browsers
   - Performance testing
   - Security testing
   - Accessibility testing
   - Visual regression testing

3. **Build & Deploy**
   - Docker image creation
   - Environment-specific deployments
   - Health checks and smoke tests

### Pipeline Triggers

- **Pull Requests**: Full test suite
- **Push to develop**: Deploy to staging
- **Push to main**: Deploy to production
- **Releases**: Tagged production deployment

## 🛡️ Quality Gates

### Pre-Commit Hooks

Automatically enforced before each commit:

```bash
# Configured in .husky/pre-commit
- Code formatting (Prettier)
- Linting (ESLint)
- Type checking (TypeScript)
- Critical tests
- Security audit
- Conventional commit format
```

### Pull Request Requirements

✅ **Must Pass Before Merge:**
- All tests passing (100%)
- Code coverage ≥ 85%
- No linting errors
- No TypeScript errors
- No security vulnerabilities
- Performance benchmarks met
- Accessibility compliance
- Visual regression tests pass
- Code review approved

### Deployment Gates

**Staging Deployment:**
- All CI tests pass
- Security scan clean
- Performance tests pass

**Production Deployment:**
- Staging validation complete
- Manual QA sign-off
- Security audit clean
- Performance benchmarks met

## 📊 Monitoring & Health Checks

### Application Health

```bash
# Check application health
curl http://localhost:3000/api/health

# Get detailed metrics
curl http://localhost:3000/api/health/metrics

# Check error logs
curl http://localhost:3000/api/health/errors
```

### Health Check Implementation

**File:** `monitoring/health-checks.ts`

**Features:**
- Database connectivity checks
- Memory usage monitoring
- Disk space monitoring
- External API health checks
- Performance metrics collection
- Error tracking and alerting

### Key Metrics

- **Uptime**: 99.9% target
- **Response Time**: p95 < 500ms
- **Error Rate**: < 0.1%
- **Database Performance**: < 100ms query time
- **Memory Usage**: < 80%
- **CPU Usage**: < 70%

## 🔧 Configuration Files

### Testing Configuration

| File | Purpose |
|------|----------|
| `jest.config.js` | Jest testing configuration |
| `playwright.config.ts` | Playwright E2E testing config |
| `tests/performance/load-test.yml` | Artillery load testing |
| `lighthouse.config.js` | Lighthouse performance config |
| `.eslintrc.js` | ESLint linting rules |
| `.prettierrc` | Prettier formatting rules |
| `tsconfig.json` | TypeScript configuration |

### Git Hooks Configuration

| File | Purpose |
|------|----------|
| `.husky/pre-commit` | Pre-commit quality checks |
| `.lintstagedrc.js` | Lint-staged configuration |
| `.commitlintrc.js` | Commit message validation |

### CI/CD Configuration

| File | Purpose |
|------|----------|
| `.github/workflows/ci-cd.yml` | Main CI/CD pipeline |
| `Dockerfile` | Container configuration |
| `docker-compose.yml` | Local development setup |

## 📚 Testing Best Practices

### Writing Tests

1. **Follow the AAA Pattern**
   ```javascript
   // Arrange
   const user = createTestUser();
   
   // Act
   const result = await authService.login(user.email, user.password);
   
   // Assert
   expect(result.success).toBe(true);
   ```

2. **Use Descriptive Test Names**
   ```javascript
   describe('AuthService', () => {
     it('should return success when valid credentials are provided', () => {
       // test implementation
     });
     
     it('should throw error when invalid email format is provided', () => {
       // test implementation
     });
   });
   ```

3. **Mock External Dependencies**
   ```javascript
   jest.mock('@prisma/client');
   jest.mock('bcryptjs');
   jest.mock('jsonwebtoken');
   ```

4. **Test Edge Cases**
   - Empty inputs
   - Invalid inputs
   - Boundary conditions
   - Error scenarios
   - Network failures

### Code Quality Standards

1. **TypeScript Usage**
   - Strict type checking enabled
   - No `any` types allowed
   - Proper interface definitions
   - Generic type usage

2. **Error Handling**
   - Try-catch blocks for async operations
   - Proper error logging
   - User-friendly error messages
   - Error boundary implementation

3. **Security Practices**
   - Input validation and sanitization
   - Parameterized database queries
   - JWT token security
   - Rate limiting implementation
   - HTTPS enforcement

## 🚨 Troubleshooting

### Common Issues

#### Test Failures

```bash
# Clear Jest cache
npm run test:clear-cache

# Reset test database
npm run test:db:reset

# Run tests in isolation
npm run test:unit -- --runInBand
```

#### E2E Test Issues

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests with debug info
npm run test:e2e:debug

# Check Playwright trace
npx playwright show-trace trace.zip
```

#### Performance Issues

```bash
# Profile application performance
npm run test:lighthouse -- --view

# Analyze bundle size
npm run analyze

# Check memory leaks
npm run test:memory
```

### Debug Commands

```bash
# Debug specific test file
npm run test:unit -- tests/unit/auth.test.ts --verbose

# Debug E2E test with browser
npm run test:e2e:headed -- --debug

# Debug with Node.js inspector
node --inspect-brk node_modules/.bin/jest tests/unit/auth.test.ts
```

## 📖 Documentation

### QA Documentation

- [`QA_GUIDE.md`](./QA_GUIDE.md) - Comprehensive QA strategy and guidelines
- [`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md) - Manual testing checklist
- [`README_QA.md`](./README_QA.md) - This file - QA setup and usage

### Test Documentation

- Test files include JSDoc comments
- Test scenarios documented in test descriptions
- API documentation includes testing examples
- Performance benchmarks documented

## 🎯 Success Metrics

### Quality Metrics

- **Test Coverage**: ≥ 85% (Critical modules: ≥ 95%)
- **Bug Escape Rate**: < 5%
- **Mean Time to Detection**: < 1 hour
- **Mean Time to Resolution**: < 4 hours
- **Customer Satisfaction**: ≥ 95%

### Performance Metrics

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms (p95)
- **Uptime**: ≥ 99.9%
- **Error Rate**: < 0.1%
- **Lighthouse Score**: ≥ 90

### Security Metrics

- **Critical Vulnerabilities**: 0
- **High Vulnerabilities**: 0
- **Security Scan Frequency**: Daily
- **Penetration Test**: Quarterly

## 🚀 Getting Started Checklist

### For Developers

- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Set up environment variables
- [ ] Run database migrations
- [ ] Run full test suite (`npm run qa:full`)
- [ ] Set up IDE with recommended extensions
- [ ] Review coding standards
- [ ] Set up git hooks (`npx husky install`)

### For QA Engineers

- [ ] Understand application architecture
- [ ] Set up testing environments
- [ ] Review test plans and cases
- [ ] Set up monitoring dashboards
- [ ] Configure alerting rules
- [ ] Practice incident response procedures
- [ ] Review manual testing checklist

## 📞 Support

### Team Contacts

- **Development Team**: dev-team@md-sports.com
- **QA Team**: qa-team@md-sports.com
- **DevOps Team**: devops-team@md-sports.com
- **Security Team**: security-team@md-sports.com

### Resources

- [Project Documentation](./docs/)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

---

**Remember**: Quality is everyone's responsibility. Every commit should maintain or improve the quality standards established in this project.

**Zero Bug Goal**: Our comprehensive testing strategy ensures that bugs are caught early and prevented from reaching production. Follow the guidelines, run the tests, and maintain the quality standards to achieve super reliability.