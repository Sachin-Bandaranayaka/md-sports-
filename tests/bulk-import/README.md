# Bulk Import Feature Tests

This directory contains comprehensive tests for the bulk product import functionality, covering API endpoints, React components, and full integration scenarios.

## 📋 Test Coverage

### 1. API Tests (`tests/api/bulkImport.test.ts`)

**Endpoints Tested:**
- `POST /api/products/bulk-import` - Excel/CSV file upload
- `POST /api/products/bulk-create` - JSON bulk creation
- `GET /api/shops/names` - Shop names for validation

**Test Scenarios:**
- ✅ Successful product imports with inventory
- ✅ File validation (missing files, empty files)
- ✅ Data validation (required fields, data types)
- ✅ Business rule validation (InitialQuantity + ShopName relationship)
- ✅ Duplicate SKU detection (within batch and database)
- ✅ Authentication and authorization
- ✅ Error handling and graceful failures
- ✅ Database transaction integrity

### 2. Component Tests (`tests/components/bulkImport.test.tsx`)

**Component Tested:**
- `BulkImportPage` - Main bulk import interface

**User Interactions Tested:**
- ✅ Drag and drop file upload
- ✅ Click to browse file selection
- ✅ Template download functionality
- ✅ File validation and error display
- ✅ Upload progress and loading states
- ✅ Success and error result display
- ✅ Clear file functionality
- ✅ Shop names loading and display

### 3. Integration Tests (`tests/integration/bulkImportIntegration.test.ts`)

**End-to-End Scenarios:**
- ✅ Complete Excel upload flow with database persistence
- ✅ Real validation against actual database constraints
- ✅ Performance testing with large datasets (100+ products)
- ✅ Transaction rollback on partial failures
- ✅ Cross-table relationships (products, categories, shops, inventory)

## 🚀 Running the Tests

### Prerequisites

```bash
# Install test dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Test Environment Setup

1. **Database Setup** (for integration tests):
   ```bash
   # Create test database
   createdb md_sports_test
   
   # Set environment variable
   export TEST_DATABASE_URL="postgresql://username:password@localhost:5432/md_sports_test"
   ```

2. **Environment Variables**:
   ```bash
   # .env.test
   TEST_DATABASE_URL="postgresql://username:password@localhost:5432/md_sports_test"
   NODE_ENV=test
   ```

### Running Tests

```bash
# Run all bulk import tests
npm test -- tests/api/bulkImport.test.ts tests/components/bulkImport.test.tsx

# Run specific test suites
npm test -- tests/api/bulkImport.test.ts
npm test -- tests/components/bulkImport.test.tsx

# Run with coverage
npm test -- --coverage tests/api/bulkImport.test.ts

# Run integration tests (requires test database)
npm test -- tests/integration/bulkImportIntegration.test.ts

# Use the test runner script
node tests/setup/testRunner.js
```

## 📊 Test Data Examples

### Valid Excel Data Format
```csv
Name,SKU,Description,RetailPrice,CostPrice,Barcode,CategoryName,InitialQuantity,ShopName
Test Product 1,TP001,Sample product,100.00,80.00,123456789,Sports,50,MBA
Test Product 2,TP002,Another product,200.00,160.00,,Equipment,25,Zimantra
Simple Product,SP001,No inventory,50.00,40.00,,Sports,0,
```

### JSON API Format
```json
{
  "products": [
    {
      "name": "API Product 1",
      "sku": "AP001",
      "price": 100,
      "weightedAverageCost": 80,
      "categoryId": 1,
      "initialQuantity": 30,
      "shopId": "shop-1"
    }
  ]
}
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/app/api/products/bulk-import/**/*.{ts,tsx}',
    'src/app/api/products/bulk-create/**/*.{ts,tsx}',
    'src/app/api/shops/names/**/*.{ts,tsx}',
    'src/app/inventory/bulk-import/**/*.{ts,tsx}',
  ],
};
```

## 🧪 Test Scenarios Covered

### Business Rules Validation
- **Required Fields**: Name and RetailPrice are mandatory
- **Shop Validation**: InitialQuantity > 0 requires valid ShopName
- **SKU Uniqueness**: No duplicate SKUs in batch or database
- **Category Validation**: CategoryName must exist in database
- **Data Types**: Numeric fields validated for proper formatting

### Error Handling
- **File Upload Errors**: Network failures, invalid files
- **Validation Errors**: Field validation with detailed messages
- **Database Errors**: Connection issues, constraint violations
- **Authentication**: Unauthorized access attempts

### Performance Tests
- **Large Datasets**: 100+ products import performance
- **Memory Usage**: File processing efficiency
- **Database Performance**: Bulk insert optimization
- **Transaction Management**: Rollback on failures

### Edge Cases
- **Empty Files**: Graceful handling of empty uploads
- **Malformed Data**: Invalid Excel/CSV structure
- **Special Characters**: Unicode and special character handling
- **Large Files**: File size limits and processing

## 📈 Test Metrics

**Target Coverage:**
- API Endpoints: 95%+
- Component Logic: 90%+
- Integration Scenarios: 85%+

**Performance Benchmarks:**
- 100 products: < 10 seconds
- File upload: < 5 seconds for typical files
- UI responsiveness: No blocking operations

## 🐛 Debugging Tests

### Common Issues

1. **Database Connection**: Ensure test database is running
2. **File Permissions**: Check file upload mock setup
3. **Authentication Mocks**: Verify auth token mocking
4. **Async Operations**: Use proper `await` and `waitFor`

### Debug Commands
```bash
# Run tests in debug mode
npm test -- --verbose tests/api/bulkImport.test.ts

# Run single test
npm test -- --testNamePattern="should successfully import valid products"

# Debug with console output
npm test -- --silent=false
```

## 🚨 Continuous Integration

### GitHub Actions Example
```yaml
name: Bulk Import Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run bulk import tests
        run: npm test -- tests/api/bulkImport.test.ts tests/components/bulkImport.test.tsx
        env:
          TEST_DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
```

---

This comprehensive test suite ensures the bulk import feature works reliably across all user scenarios and edge cases. 