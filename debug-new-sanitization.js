const testInput = "test<script>&alert";

// Sanitize input (same logic as secureSearchHandler)
const sanitizedQuery = testInput.replace(/[<>"'&]/g, '');

console.log('Original input:', testInput);
console.log('Sanitized output:', sanitizedQuery);
console.log('Expected in test:', "testscriptalert");
console.log('Match:', sanitizedQuery === "testscriptalert");