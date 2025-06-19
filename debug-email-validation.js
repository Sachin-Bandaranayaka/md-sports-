const invalidEmails = [
  'invalid-email',
  '@domain.com',
  'user@',
  'user..name@domain.com',
  'user@domain',
  'user name@domain.com',
];

const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
const hasControlChars = (str) => /[\x00-\x1F\x7F]/.test(str);
const hasConsecutiveDots = (str) => /\.{2,}/.test(str);

console.log('Testing email validation:');
invalidEmails.forEach((email, index) => {
  const isValidFormat = emailRegex.test(email);
  const hasControl = hasControlChars(email);
  const hasConsDots = hasConsecutiveDots(email);
  const shouldBeRejected = !isValidFormat || hasControl || hasConsDots;
  
  console.log(`${index + 1}. "${email}"`);
  console.log(`   - Regex test: ${isValidFormat}`);
  console.log(`   - Has control chars: ${hasControl}`);
  console.log(`   - Has consecutive dots: ${hasConsDots}`);
  console.log(`   - Should be rejected: ${shouldBeRejected}`);
  console.log('');
});