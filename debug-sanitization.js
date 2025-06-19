const testInput = "test' OR '1'='1";

// Sanitize input (same logic as secureSearchHandler)
const sanitizedQuery = testInput.replace(/[<>"'&]/g, '');

console.log('Original input:', testInput);
console.log('Sanitized output:', sanitizedQuery);
console.log('Expected in test:', "test OR 11");
console.log('Match:', sanitizedQuery === "test OR 11");