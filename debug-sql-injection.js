// Simulate the secureSearchHandler logic
const sqlPayloads = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  "' UNION SELECT * FROM users --",
  "'; INSERT INTO users (email, password) VALUES ('hacker@evil.com', 'password'); --",
  "' OR 1=1 --",
  "admin'--",
  "admin'/*",
  "' OR 'x'='x",
  "') OR ('1'='1",
  "' OR 1=1#",
];

function simulateSecureSearchHandler(query) {
  // Input validation
  if (query.length > 100) {
    return { error: 'Query too long', status: 400 };
  }

  // Sanitize input
  const sanitizedQuery = query.replace(/[<>"'&]/g, '');
  
  console.log(`Original: ${query}`);
  console.log(`Sanitized: ${sanitizedQuery}`);
  
  // If sanitized query is empty or very short, might not return results
  if (sanitizedQuery.trim().length === 0) {
    return { error: 'Invalid query', status: 400 };
  }
  
  // Simulate successful response
  return { results: [], status: 200 };
}

console.log('Testing SQL injection payloads:');
console.log('='.repeat(50));

for (const payload of sqlPayloads) {
  const result = simulateSecureSearchHandler(payload);
  console.log(`Status: ${result.status}, Has results: ${!!result.results}`);
  console.log('-'.repeat(30));
}