// Debug what the mock is actually being called with

// Create a simple mock that logs all calls
const mockCalls = [];
const mockFindMany = function(params) {
  console.log('Mock called with:', JSON.stringify(params, null, 2));
  mockCalls.push(params);
  return Promise.resolve([]);
};

const mockPrisma = {
  product: {
    findMany: mockFindMany
  }
};

// Test the exact scenario
const testInput = "test<script>&alert";
const sanitizedQuery = testInput.replace(/[<>\"'&]/g, '');

console.log('Input:', testInput);
console.log('Sanitized:', sanitizedQuery);
console.log('Expected:', "testscriptalert");
console.log('Match:', sanitizedQuery === "testscriptalert");

// Call the mock with the expected parameters
mockPrisma.product.findMany({
  where: {
    name: {
      contains: sanitizedQuery,
      mode: 'insensitive',
    },
  },
});

// Check what the mock received
console.log('\nMock calls:', mockCalls);
console.log('Mock call count:', mockCalls.length);

if (mockCalls.length > 0) {
  console.log('First call args:', mockCalls[0]);
}