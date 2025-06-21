// Fixed Unit tests for AuthService
// This file tests the authentication service functionality

import { jest } from '@jest/globals';

// Mock dependencies BEFORE importing the service
const mockCacheService = {
  get: jest.fn() as jest.MockedFunction<any>,
  set: jest.fn() as jest.MockedFunction<any>,
  delete: jest.fn() as jest.MockedFunction<any>,
  increment: jest.fn() as jest.MockedFunction<any>,
  generateKey: jest.fn() as jest.MockedFunction<any>,
  clear: jest.fn() as jest.MockedFunction<any>,
};

const mockPrisma = {
  user: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
    findFirst: jest.fn() as jest.MockedFunction<any>,
    create: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>,
    delete: jest.fn() as jest.MockedFunction<any>,
  },
  permission: {
    findMany: jest.fn() as jest.MockedFunction<any>,
  },
  session: {
    create: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    deleteMany: jest.fn() as jest.MockedFunction<any>,
  },
  auditLog: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
};

const mockBcrypt = {
  compare: jest.fn() as jest.MockedFunction<any>,
  hash: jest.fn(),
  genSalt: jest.fn(),
};

// Mock modules
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Also mock the alias path in case it's used elsewhere
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Mock cache service for both relative and alias paths
jest.mock('../../src/lib/cache', () => ({
  __esModule: true,
  cacheService: mockCacheService,
  cache: mockCacheService,
  CACHE_CONFIG: {
    KEYS: {
      USER_SESSION: 'user_session',
      TOKEN_VALIDATION: 'token_validation',
    },
    TTL: {
      USER_SESSION: 3600,
      TOKEN_VALIDATION: 1800,
    },
  },
}));

jest.mock('@/lib/cache', () => ({
  __esModule: true,
  cacheService: mockCacheService,
  cache: mockCacheService,
  CACHE_CONFIG: {
    KEYS: {
      USER_SESSION: 'user_session',
      TOKEN_VALIDATION: 'token_validation',
    },
    TTL: {
      USER_SESSION: 3600,
      TOKEN_VALIDATION: 1800,
    },
  },
}));

jest.mock('bcryptjs', () => mockBcrypt);
// Mock jsonwebtoken with a simple approach
const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
  TokenExpiredError: class extends Error {
    expiredAt: Date;
    constructor(message: string, expiredAt?: Date) {
      super(message);
      this.name = 'TokenExpiredError';
      this.expiredAt = expiredAt || new Date();
    }
  },
  JsonWebTokenError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'JsonWebTokenError';
    }
  },
};

jest.mock('jsonwebtoken', () => mockJwt);

// Import after mocking
import { authenticateUser, generateToken, verifyToken, parseTimeStringToSeconds, getUserFromDecodedPayload, getUserFromToken } from '@/services/authService';
import { cacheService } from '@/lib/cache';
import * as jwt from 'jsonwebtoken';

// Spy on the imported jwt to ensure our mocks work
const jwtVerifySpy = jest.spyOn(jwt, 'verify');
const jwtSignSpy = jest.spyOn(jwt, 'sign');

// Spy on the actual cacheService to verify mocking
const cacheServiceGenerateKeySpy = jest.spyOn(cacheService, 'generateKey');
const cacheServiceGetSpy = jest.spyOn(cacheService, 'get');
const cacheServiceSetSpy = jest.spyOn(cacheService, 'set');

// Create proper mock types for easier access
const mockUserFindFirst = mockPrisma.user.findFirst as jest.MockedFunction<any>;
const mockPermissionFindMany = mockPrisma.permission.findMany as jest.MockedFunction<any>;
// mockJwt is already defined above

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '12h';
    
    // Setup default cache mocks
    mockCacheService.generateKey.mockReturnValue('mock-cache-key');
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(true);
    mockCacheService.delete.mockResolvedValue(true);
    
    // Reset Prisma mocks
    mockUserFindFirst.mockResolvedValue(null);
    mockPermissionFindMany.mockResolvedValue([]);
    
    // Reset JWT mocks
    mockJwt.sign.mockReturnValue('mocked-jwt-token');
    mockJwt.verify.mockReturnValue({ userId: 1, email: 'test@example.com' });
    mockJwt.decode.mockReturnValue({ userId: 1, email: 'test@example.com' });
    jwtVerifySpy.mockClear();
    jwtSignSpy.mockClear();
  });

  describe('parseTimeStringToSeconds', () => {
    test('should parse seconds correctly', () => {
      expect(parseTimeStringToSeconds('30s')).toBe(30);
    });

    test('should parse minutes correctly', () => {
      expect(parseTimeStringToSeconds('5m')).toBe(300);
    });

    test('should parse hours correctly', () => {
      expect(parseTimeStringToSeconds('2h')).toBe(7200);
    });

    test('should parse days correctly', () => {
      expect(parseTimeStringToSeconds('1d')).toBe(86400);
    });

    test('should return 0 for invalid input', () => {
      expect(parseTimeStringToSeconds('')).toBe(0);
      expect(parseTimeStringToSeconds('invalid')).toBe(0);
      expect(parseTimeStringToSeconds('abc')).toBe(0);
    });

    test('should handle edge cases', () => {
      expect(parseTimeStringToSeconds('0s')).toBe(0);
      expect(parseTimeStringToSeconds('100x')).toBe(100); // Falls back to parsing the number part
    });
  });

  describe('authenticateUser', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'testuser',
      password: 'hashedpassword',
      isActive: true,
      roleId: 1,
      shopId: 1,
      roleName: 'admin',
      permissions: null,
      role: {
        id: 1,
        name: 'admin',
        permissions: [
          { name: 'read_products' },
          { name: 'write_products' }
        ]
      }
    };

    test('should authenticate valid user credentials', async () => {
      mockUserFindFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as any);
      mockJwt.sign.mockReturnValue('mock-jwt-token' as any);

      const result = await authenticateUser('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'testuser',
        roleId: 1,
        roleName: 'admin',
        shopId: 1,
        permissions: ['read_products', 'write_products']
      });
      expect(mockUserFindFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          isActive: true
        },
        include: {
          role: {
            include: {
              permissions: {
                select: { name: true }
              }
            }
          }
        }
      });
    });

    test('should reject invalid email', async () => {
      mockUserFindFirst.mockResolvedValue(null);

      const result = await authenticateUser('invalid@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    test('should reject invalid password', async () => {
      mockUserFindFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as any);

      const result = await authenticateUser('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    test('should reject inactive user', async () => {
      mockUserFindFirst.mockResolvedValue(null); // findFirst with isActive: true returns null

      const result = await authenticateUser('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    test('should handle database errors gracefully', async () => {
      mockUserFindFirst.mockRejectedValue(new Error('Database connection failed'));

      const result = await authenticateUser('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Authentication failed');
    });

    test('should handle bcrypt errors gracefully', async () => {
      mockUserFindFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      const result = await authenticateUser('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Authentication failed');
    });
  });

  describe('generateToken', () => {

    test('should generate JWT token', () => {
      const payload = {
        sub: 1,
        username: 'testuser',
        email: 'test@example.com',
        roleId: 1,
        shopId: 1,
        permissions: ['read_products', 'write_products']
      };
      const mockToken = 'mock-jwt-token';
      mockJwt.sign.mockReturnValue(mockToken);

      const result = generateToken(payload);

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
          payload,
          'test-secret-key',
          { expiresIn: '12h' }
        );
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token from cache', async () => {
      const mockPayload = {
        sub: '1',
        username: 'testuser',
        email: 'test@example.com',
        roleId: 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      mockCacheService.get.mockResolvedValue(mockPayload);

      const result = await verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    test('should verify valid token and cache result', async () => {
      const mockPayload = {
        sub: '1',
        username: 'testuser',
        email: 'test@example.com',
        roleId: 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      mockCacheService.get.mockResolvedValue(null); // Not in cache
      mockJwt.verify.mockReturnValue(mockPayload as any);

      const result = await verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret-key');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    test('should throw error for invalid token', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const invalidError = new Error('Invalid token');
      mockJwt.verify.mockImplementation(() => {
        throw invalidError;
      });
      jwtVerifySpy.mockImplementation(() => {
         throw invalidError;
       });

      await expect(verifyToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    test('should throw error for expired token', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const expiredError = new mockJwt.TokenExpiredError('Token expired', new Date());
      mockJwt.verify.mockImplementation(() => {
        throw expiredError;
      });
      jwtVerifySpy.mockImplementation(() => {
         throw expiredError;
       });

      await expect(verifyToken('expired-token')).rejects.toThrow('Token expired');
    });
  });

  describe('getUserFromDecodedPayload', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'testuser',
      isActive: true,
      roleId: 1,
      shopId: 1,
      role: {
        id: 1,
        name: 'admin',
        permissions: [
          { name: 'read_products' },
          { name: 'write_products' }
        ]
      }
    };

    test('should return user from cache', async () => {
      const payload = {
        sub: 1,
        username: 'testuser',
        email: 'test@example.com',
        roleId: 1
      };

      // Test if the function is imported correctly
      process.stderr.write(`Function type: ${typeof getUserFromDecodedPayload}\n`);
      process.stderr.write(`Function name: ${getUserFromDecodedPayload.name}\n`);
      
      const cachedUser = {
        ...mockUser,
        roleName: 'admin',
        permissions: ['read_products', 'write_products']
      };
      
      mockCacheService.get.mockResolvedValue(cachedUser);

      const result = await getUserFromDecodedPayload(payload);

      expect(result).toEqual(cachedUser);
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    test('should return user from database and cache it', async () => {
      // Temporarily restore console.log for debugging
      const originalConsoleLog = console.log;
      console.log = originalConsoleLog;
      
      const payload = {
        sub: 1,
        username: 'testuser',
        email: 'test@example.com',
        roleId: 1
      };

      // Clear any previous mock calls
      mockUserFindFirst.mockClear();
      
      // Reset and configure the global cache service mocks
      jest.clearAllMocks();
      
      // Configure the cache service to return null (not in cache)
      (cacheService.get as jest.MockedFunction<any>).mockResolvedValue(null);
      (cacheService.generateKey as jest.MockedFunction<any>).mockReturnValue('test-cache-key');
      (cacheService.set as jest.MockedFunction<any>).mockResolvedValue(undefined);
      
      // Mock the findFirst call to return the user when called with the correct parameters
      mockUserFindFirst.mockImplementation(async (query) => {
        console.log('Mock findFirst called with:', JSON.stringify(query, null, 2));
        return mockUser;
      });
      
      // Add some debugging to the mock to see if it's called
      let mockCallCount = 0;
      mockUserFindFirst.mockImplementation(async (query) => {
        mockCallCount++;
        process.stdout.write(`Mock findFirst called ${mockCallCount} times with: ${JSON.stringify(query, null, 2)}\n`);
        return mockUser;
      });
      
      let result;
      let caughtError = null;
      try {
        process.stdout.write(`Calling getUserFromDecodedPayload with payload: ${JSON.stringify(payload)}\n`);
        result = await getUserFromDecodedPayload(payload);
        process.stdout.write(`getUserFromDecodedPayload returned: ${JSON.stringify(result)}\n`);
      } catch (error) {
        process.stdout.write(`getUserFromDecodedPayload threw error: ${error}\n`);
        caughtError = error;
        throw error;
      }
      
      // If result is null, let's check what happened
      if (result === null) {
        throw new Error(`getUserFromDecodedPayload returned null. Mock calls: ${mockCallCount}, Prisma mock calls: ${mockUserFindFirst.mock.calls.length}, Error: ${caughtError?.message || 'none'}`);
      }

      expect(result).toEqual({
        ...mockUser,
        roleName: 'admin',
        permissions: ['read_products', 'write_products']
      });
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    test('should return null for null payload', async () => {
      const result = await getUserFromDecodedPayload(null);
      expect(result).toBeNull();
    });

    test('should return null for invalid payload', async () => {
      const result = await getUserFromDecodedPayload({} as any);
      expect(result).toBeNull();
    });

    test('should return null when user not found', async () => {
      const payload = {
        sub: 999,
        username: 'nonexistent',
        email: 'nonexistent@example.com',
        roleId: 1
      };
      
      mockCacheService.get.mockResolvedValue(null);
      mockUserFindFirst.mockResolvedValue(null);

      const result = await getUserFromDecodedPayload(payload);
      expect(result).toBeNull();
    });
  });

  describe('getUserFromToken', () => {
    test('should return user from valid token', async () => {
      const mockPayload = {
        sub: 1,
        username: 'testuser',
        email: 'test@example.com',
        roleId: 1
      };
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'testuser',
        isActive: true,
        roleId: 1,
        shopId: 1,
        role: {
          id: 1,
          name: 'admin',
          permissions: [{ name: 'read_products' }]
        }
      };

      // Mock verifyToken to return payload
      mockCacheService.get.mockResolvedValue(null); // Cache miss for user lookup
      mockCacheService.generateKey.mockReturnValue('test-cache-key');
      mockCacheService.set.mockResolvedValue(undefined);
      mockJwt.verify.mockReturnValue(mockPayload);
      jwtVerifySpy.mockReturnValue(mockPayload as any);
      
      // Mock the findFirst call to return the user
      mockUserFindFirst.mockResolvedValue(mockUser);
      
      // Set up spies to return expected values
      cacheServiceGenerateKeySpy.mockReturnValue('test-cache-key');
      cacheServiceGetSpy.mockResolvedValue(null);
      cacheServiceSetSpy.mockResolvedValue(undefined);
      
      // Reset cache mock to ensure it always returns null (cache miss)
       mockCacheService.get.mockResolvedValue(null);

      // Test verifyToken separately first
       const verifyResult = await verifyToken('valid-token');
       expect(verifyResult).toBeDefined();
       expect(verifyResult).toHaveProperty('sub', 1);
       
       // Test getUserFromDecodedPayload separately
       // First verify the function exists
       expect(typeof getUserFromDecodedPayload).toBe('function');
       
       // Test with null payload first to see if we get the expected error path
       const nullResult = await getUserFromDecodedPayload(null);
       expect(nullResult).toBeNull();
       
       // Test with payload missing sub
       const noSubResult = await getUserFromDecodedPayload({ username: 'test' } as any);
       expect(noSubResult).toBeNull();
       
       // Test with mockPayload
       const decodedResult = await getUserFromDecodedPayload(mockPayload);
       
       // Check if the actual cacheService methods are being called
       expect(cacheServiceGenerateKeySpy).toHaveBeenCalledWith('user_session', { userId: 1 });
       expect(cacheServiceGetSpy).toHaveBeenCalled();
       
       expect(decodedResult).toBeDefined();
       expect(decodedResult).not.toBeNull();
       
       // Now test the full flow
       const result = await getUserFromToken('valid-token');
       
       expect(result).toEqual({
         ...mockUser,
         roleName: 'admin',
         permissions: ['read_products']
       });
    });

    test('should throw error for invalid token', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.generateKey.mockReturnValue('test-cache-key');
      
      // Mock both the direct mock and the spy
      const jwtError = new mockJwt.JsonWebTokenError('jwt malformed');
      mockJwt.verify.mockImplementation(() => {
        throw jwtError;
      });
      jwtVerifySpy.mockImplementation(() => {
         throw jwtError;
       });

      await expect(getUserFromToken('invalid')).rejects.toThrow('jwt malformed');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing JWT_SECRET', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      mockCacheService.get.mockResolvedValue(null);
      const secretError = new Error('secretOrPrivateKey must have a value');
      mockJwt.verify.mockImplementation(() => {
        throw secretError;
      });
      jwtVerifySpy.mockImplementation(() => {
         throw secretError;
       });
      
      await expect(verifyToken('any-token')).rejects.toThrow();
      
      // Restore the secret
      process.env.JWT_SECRET = originalSecret;
    });

    test('should handle malformed tokens gracefully', async () => {
      mockCacheService.get.mockResolvedValue(null);
      
      // Mock both the direct mock and the spy
      const jwtError = new mockJwt.JsonWebTokenError('jwt malformed');
      mockJwt.verify.mockImplementation(() => {
        throw jwtError;
      });
      jwtVerifySpy.mockImplementation(() => {
        throw jwtError;
      });
      
      await expect(verifyToken('malformed-token')).rejects.toThrow('jwt malformed');
    });

    test('should handle empty token', async () => {
      mockCacheService.get.mockResolvedValue(null);
      
      await expect(verifyToken('')).rejects.toThrow('jwt must be provided');
    });
  });
});