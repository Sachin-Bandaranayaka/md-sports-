// Debug the full test scenario to understand the failure

// Mock setup
const mockCalls = [];
const mockPrisma = {
  product: {
    findMany: function(params) {
      console.log('Mock findMany called with:', JSON.stringify(params, null, 2));
      mockCalls.push(params);
      return Promise.resolve([]);
    }
  }
};

// Simulate the exact secureSearchHandler logic
function simulateSecureSearchHandler(query) {
  console.log('\n=== Testing query:', query, '===');
  
  if (!query) {
    console.log('No query provided');
    return { status: 400, error: 'Query required' };
  }

  // Input validation
  if (query.length > 100) {
    console.log('Query too long');
    return { status: 400, error: 'Query too long' };
  }

  // Check for suspicious SQL injection patterns (exact patterns from test)
  const suspiciousPatterns = [
    /drop\s+table/i,
    /union\s+select/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+.*set/i,
    /or\s+['"]*1['"]*\s*=\s*['"]*1['"]/i,
    /or\s+['"]*x['"]*\s*=\s*['"]*x['"]/i,
    /--/,
    /\/\*/,
    /#/
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(query));
  
  console.log('Is suspicious:', isSuspicious);
  
  if (isSuspicious) {
    console.log('Query rejected as suspicious');
    return { status: 400, error: 'Invalid query detected' };
  }

  // Sanitize input
  const sanitizedQuery = query.replace(/[<>"'&]/g, '');
  
  console.log('Original query:', query);
  console.log('Sanitized query:', sanitizedQuery);
  
  // Call mock
  mockPrisma.product.findMany({
    where: {
      name: {
        contains: sanitizedQuery,
        mode: 'insensitive',
      },
    },
  });
  
  return { status: 200, results: [] };
}

// Test the exact scenario from the failing test
console.log('Testing the exact scenario from the failing test:');
const result = simulateSecureSearchHandler('test<script>&alert');
console.log('Result:', result);

// Check what was called
console.log('\nMock calls:', mockCalls.length);
if (mockCalls.length > 0) {
  console.log('Last call:', JSON.stringify(mockCalls[mockCalls.length - 1], null, 2));
}

// Test what the test expects
const expectedCall = {
  where: {
    name: {
      contains: "testscriptalert",
      mode: 'insensitive',
    },
  },
};

console.log('\nExpected call:', JSON.stringify(expectedCall, null, 2));

if (mockCalls.length > 0) {
  const actualCall = mockCalls[mockCalls.length - 1];
  console.log('\nComparison:');
  console.log('Expected contains:', expectedCall.where.name.contains);
  console.log('Actual contains:', actualCall.where.name.contains);
  console.log('Match:', expectedCall.where.name.contains === actualCall.where.name.contains);
  console.log('Deep equal:', JSON.stringify(expectedCall) === JSON.stringify(actualCall));
}