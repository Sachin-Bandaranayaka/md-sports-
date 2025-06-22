# MS Sport Reliability Testing Suite

This comprehensive testing suite is designed to validate the reliability of the MS Sport application under realistic usage conditions, specifically for your use case of **2 shop staff users + 1-2 admins** handling **2000+ products** and **50-100 invoices per day**.

## 🎯 Testing Objectives

The reliability testing suite validates:

- **Concurrent User Support**: 2-4 simultaneous users (shop staff + admins)
- **High Data Volume Handling**: 2000+ products in inventory
- **Daily Load Simulation**: 50-100 invoices per day
- **Database Connection Stability**: Under sustained load
- **Session Management**: Persistent sessions across multiple requests
- **Error Recovery**: Graceful handling of failures
- **Memory Usage**: No memory leaks under load
- **Performance Degradation**: Response times under stress

## 📁 Test Structure

```
tests/reliability/
├── README.md                    # This file
├── reliability-test-suite.ts    # Playwright-based comprehensive tests
├── stress-test-config.yml       # Artillery load testing configuration
└── test-data/                   # Sample data for testing
```

```
scripts/
└── run-reliability-tests.js     # Node.js test runner
```

## 🚀 Quick Start

### Prerequisites

1. **Application Running**: Ensure your MS Sport application is running on `http://localhost:3000`
2. **Database Setup**: Database should be populated with test data
3. **Dependencies**: Install required packages

```bash
npm install axios
npm install -g artillery  # For load testing (optional)
```

### Running Tests

#### Option 1: Quick Reliability Check (2 minutes)
```bash
node scripts/run-reliability-tests.js quick
```

#### Option 2: Standard Reliability Test (10 minutes)
```bash
node scripts/run-reliability-tests.js standard
```

#### Option 3: Extended Reliability Test (30 minutes)
```bash
node scripts/run-reliability-tests.js extended
```

#### Option 4: Playwright Test Suite
```bash
npx playwright test tests/reliability/reliability-test-suite.ts
```

#### Option 5: Load Testing with Artillery
```bash
npx artillery run tests/reliability/stress-test-config.yml
```

## 🧪 Test Scenarios

### 1. Concurrent User Authentication
- **Purpose**: Validate that multiple users can log in simultaneously
- **Scenario**: 4 users authenticate concurrently
- **Success Criteria**: 100% authentication success rate
- **Duration**: 30 seconds

### 2. High-Volume Product Operations
- **Purpose**: Test product browsing and management with large inventory
- **Scenario**: 
  - Browse 2000+ products with pagination
  - Search products with various queries
  - Update product information concurrently
- **Success Criteria**: <3s response time, <5% error rate
- **Duration**: 5-10 minutes

### 3. Daily Invoice Load Simulation
- **Purpose**: Simulate daily invoice creation load
- **Scenario**: Create 100 invoices concurrently (2 users, 50 each)
- **Success Criteria**: <5s invoice creation time, <2% error rate
- **Duration**: 5-10 minutes

### 4. Database Connection Stability
- **Purpose**: Validate database performance under load
- **Scenario**: 200 rapid database queries across 4 users
- **Success Criteria**: >95% connection success rate
- **Duration**: 2-3 minutes

### 5. Session Management
- **Purpose**: Test session persistence and timeout handling
- **Scenario**: Multiple requests over time with session validation
- **Success Criteria**: No session failures, proper timeout handling
- **Duration**: 3-5 minutes

### 6. Error Recovery
- **Purpose**: Test graceful error handling and system recovery
- **Scenario**: 
  - Invalid endpoints
  - Invalid authentication
  - Invalid data submissions
  - Timeout scenarios
- **Success Criteria**: >80% graceful error handling, >80% recovery rate
- **Duration**: 2-3 minutes

### 7. Memory Usage Monitoring
- **Purpose**: Detect memory leaks and excessive memory usage
- **Scenario**: Memory-intensive operations with monitoring
- **Success Criteria**: <512MB peak memory, no memory leaks
- **Duration**: 2-3 minutes

## 📊 Test Reports

### Console Output
Real-time test progress and results are displayed in the console with:
- ✅ Success indicators
- ❌ Failure indicators  
- 📊 Performance metrics
- 🎯 Reliability assessments

### JSON Report
Detailed results are saved to `test-results/reliability-report.json` including:
- Test execution details
- Performance metrics
- Error logs
- Reliability assessments
- Production readiness recommendations

## 🎯 Success Criteria

### Overall Reliability Score
- **Excellent (90%+)**: Ready for production
- **Good (70-89%)**: Acceptable with monitoring
- **Poor (<70%)**: Needs improvement

### Specific Metrics
- **Error Rate**: <5%
- **Response Time**: <5 seconds (95th percentile)
- **Success Rate**: >95%
- **Memory Usage**: <512MB peak
- **Session Stability**: Zero session failures

## 🔧 Configuration

### Environment Variables
```bash
export BASE_URL=http://localhost:3000  # Application URL
export TEST_DURATION=standard          # quick|standard|extended
```

### Test Users
The tests expect these user accounts to exist:
```javascript
// Admin users
admin@test.com / admin123
manager@test.com / manager123

// Shop staff users  
staff1@test.com / staff123 (shop-1)
staff2@test.com / staff123 (shop-2)
```

### Database Requirements
- At least 100 products in the database
- At least 10 customers
- At least 2 shops configured
- User accounts with proper permissions

## 🛠️ Troubleshooting

### Common Issues

#### 1. Authentication Failures
```bash
❌ Authentication failed: 401 Unauthorized
```
**Solution**: Verify test user accounts exist with correct passwords

#### 2. Database Connection Errors
```bash
❌ Database stability test failed: Connection timeout
```
**Solution**: 
- Check database is running
- Verify connection string
- Ensure database has test data

#### 3. Memory Test Failures
```bash
❌ Memory leak detected: 75MB increase
```
**Solution**: 
- Check for memory leaks in application code
- Verify proper resource cleanup
- Monitor garbage collection

#### 4. Timeout Errors
```bash
❌ Request timeout after 10000ms
```
**Solution**:
- Optimize slow database queries
- Check server performance
- Consider increasing timeout values

### Debug Mode
Run tests with debug output:
```bash
DEBUG=reliability:* node scripts/run-reliability-tests.js
```

## 📈 Performance Baselines

Based on your use case, these are the expected performance baselines:

### Response Times
- **Dashboard**: <1s
- **Product Listing**: <2s  
- **Invoice Creation**: <3s
- **Search**: <1.5s

### Concurrent Users
- **2 Users**: Excellent performance
- **4 Users**: Good performance  
- **8+ Users**: Stress test (may degrade)

### Daily Load
- **50 Invoices/day**: Light load
- **100 Invoices/day**: Normal load
- **200+ Invoices/day**: Heavy load

## 🔄 Continuous Testing

### Integration with CI/CD
Add to your CI pipeline:
```yaml
# .github/workflows/reliability.yml
- name: Run Reliability Tests
  run: |
    npm start &
    sleep 30
    node scripts/run-reliability-tests.js quick
```

### Scheduled Testing
Run reliability tests regularly:
```bash
# Cron job for daily reliability check
0 2 * * * cd /path/to/ms-sport && node scripts/run-reliability-tests.js quick
```

## 📞 Support

If you encounter issues:

1. **Check Prerequisites**: Ensure application is running and database is populated
2. **Review Logs**: Check console output and JSON report for details
3. **Verify Configuration**: Confirm test users and database setup
4. **Run Individual Tests**: Isolate specific test scenarios
5. **Monitor Resources**: Check CPU, memory, and database performance

## 🎉 Success Indicators

Your application is ready for production when:

- ✅ Overall reliability score >90%
- ✅ All concurrent user tests pass
- ✅ Database stability >95%
- ✅ No memory leaks detected
- ✅ Error recovery rate >80%
- ✅ Response times within thresholds

## 📝 Test Customization

### Adding New Test Scenarios
1. Create new test method in `ReliabilityTestRunner`
2. Add to test execution sequence
3. Define success criteria
4. Update reporting

### Modifying Thresholds
Edit `RELIABILITY_CONFIG` in `run-reliability-tests.js`:
```javascript
THRESHOLDS: {
  MAX_ERROR_RATE: 0.05,      // 5%
  MAX_RESPONSE_TIME: 5000,   // 5 seconds
  MIN_SUCCESS_RATE: 0.95     // 95%
}
```

### Custom Test Data
Modify test data in `stress-test-config.yml` for realistic scenarios specific to your business.

---

**Ready to test your MS Sport application's reliability? Start with the quick test and work your way up to extended testing!** 