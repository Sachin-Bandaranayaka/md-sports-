module.exports = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
  TokenExpiredError: class TokenExpiredError extends Error {
    constructor(message, expiredAt) {
      super(message);
      this.name = 'TokenExpiredError';
      this.expiredAt = expiredAt;
    }
  },
  JsonWebTokenError: class JsonWebTokenError extends Error {
    constructor(message) {
      super(message);
      this.name = 'JsonWebTokenError';
    }
  }
};