const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emails = [
  'invalid-email',
  '@domain.com',
  'user@',
  'user..name@domain.com',
  'user@domain',
  'user name@domain.com'
];

emails.forEach(email => {
  console.log(`${email}: ${emailRegex.test(email)}`);
});