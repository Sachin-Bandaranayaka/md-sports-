// Fixed Unit tests for AuthService
// This file tests the authentication service functionality

import { jest } from '@jest/globals';

// Mock dependencies BEFORE importing the service
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  increment: jest.fn(),
  generateKey: jest.fn(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  permission: {
    findMany: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

// Mock modules
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('@/lib/cache', () => ({
  cacheService: mockCacheService,
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
jest.mock('jsonwebtoken', () => mockJwt);

// Import after mocking
import { authenticateUser, generateToken, verifyToken, parseTimeStringToSeconds, getUserFromDecodedPayload, getUserFromToken } from '@/services/authService';

// Create proper mock types for easier access
const mockUserFindFirst = mockPrisma.user.findFirst;
const mockPermissionFindMany = mockPrisma.permission.findMany;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '12h';
    
    // Setup default cache mocks
    mockCacheService.generateKey.mockReturnValue('mock-cache-key');
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);
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
    const mockPayload = {
      sub: 1,
      username: 'testuser',
      email: 'test@example.com',
      roleId: 1,
      shopId: 1,
      permissions: ['read_products', 'write_products']
    };

    test('should generate JWT token', () => {
      const mockToken = 'mock-jwt-token';
      mockJwt.sign.mockReturnValue(mockToken);

      const result = generateToken(mockPayload);

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
          mockPayload,
          'test-secret-key',
          { expiresIn: '12h' }
        );
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token from cache', async () => {
      const mockPayload = {
        sub: 1,
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
        sub: 1,
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
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(verifyToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    test('should throw error for expired token', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockJwt.verify.mockImplementation(() => {
        const error = new Error('Token expired') as any;
        error.name = 'TokenExpiredError';
        error.expiredAt = new Date();
        throw error;
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
      const payload = {
        sub: 1,
        username: 'testuser',
        email: 'test@example.com',
        roleId: 1
      };
      
      mockCacheService.get.mockResolvedValue(null); // Not in cache
      mockUserFindFirst.mockResolvedValue(mockUser);

      const result = await getUserFromDecodedPayload(payload);

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
      mockCacheService.get.mockResolvedValue(null);
      mockJwt.verify.mockReturnValue(mockPayload);
      
      // Mock getUserFromDecodedPayload
      mockUserFindFirst.mockResolvedValue(mockUser);

      const result = await getUserFromToken('valid-token');
      
      expect(result).toEqual({
        ...mockUser,
        roleName: 'admin',
        permissions: ['read_products']
      });
    });

    test('should throw error for invalid token', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(getUserFromToken('invalid-token')).rejects.toThrow('Invalid token');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing JWT_SECRET', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      mockCacheService.get.mockResolvedValue(null);
      mockJwt.verify.mockImplementation(() => {
        throw new Error('secretOrPrivateKey must have a value');
      });
      
      await expect(verifyToken('any-token')).rejects.toThrow();
      
      // Restore the secret
      process.env.JWT_SECRET = originalSecret;
    });

    test('should handle malformed tokens gracefully', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockJwt.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });
      
      await expect(verifyToken('not.a.valid.jwt.token')).rejects.toThrow('jwt malformed');
    });

    test('should handle empty token', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockJwt.verify.mockImplementation(() => {
        throw new Error('jwt must be provided');
      });
      
      await expect(verifyToken('')).rejects.toThrow('jwt must be provided');
    });
  });
});