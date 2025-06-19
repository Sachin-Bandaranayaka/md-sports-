const suspiciousEmail = '<script>alert("xss")</script>@test.com';

// Email format validation
const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
const hasControlChars = /[\x00-\x1F\x7F]/.test(suspiciousEmail);
const hasConsecutiveDots = /\.{2,}/.test(suspiciousEmail);

// Check for suspicious patterns
const suspiciousPatterns = [
  /<script/i,
  /javascript:/i,
  /on\w+=/i,
  /\bor\b.*\b1\s*=\s*1\b/i,
  /union.*select/i,
  /drop.*table/i,
];

const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(suspiciousEmail));

console.log('Testing suspicious email:', suspiciousEmail);
console.log('Email regex test:', emailRegex.test(suspiciousEmail));
console.log('Has control chars:', hasControlChars);
console.log('Has consecutive dots:', hasConsecutiveDots);
console.log('Is suspicious:', isSuspicious);
console.log('');

// Test the validation order (suspicious patterns checked first)
if (isSuspicious) {
  console.log('Would return: Invalid input detected');
} else if (!emailRegex.test(suspiciousEmail) || hasControlChars || hasConsecutiveDots) {
  console.log('Would return: Invalid email format');
} else {
  console.log('Would proceed to database check');
}