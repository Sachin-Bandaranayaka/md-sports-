// Debug the exact test scenario

// Mock Prisma
const mockPrisma = {
  product: {
    findMany: function(params) {
      console.log('findMany called with:', JSON.stringify(params, null, 2));
      return Promise.resolve([]);
    }
  }
};

// Simulate the sanitization and call
function testSanitization() {
  const query = 'test<script>&alert';
  
  // Check for suspicious SQL injection patterns
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
  
  console.log('Original query:', query);
  console.log('Is suspicious:', isSuspicious);
  
  if (isSuspicious) {
    console.log('Query would be rejected as suspicious');
    return;
  }

  // Sanitize input
  const sanitizedQuery = query.replace(/[<>"'&]/g, '');
  
  console.log('Sanitized query:', sanitizedQuery);
  console.log('Expected in test:', 'testscriptalert');
  console.log('Match:', sanitizedQuery === 'testscriptalert');
  
  // Call mock with the parameters
  mockPrisma.product.findMany({
    where: {
      name: {
        contains: sanitizedQuery,
        mode: 'insensitive',
      },
    },
  });
}

testSanitization();