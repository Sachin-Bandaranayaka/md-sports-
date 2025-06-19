// Fixed AuthService Test Suite
// This file contains the corrected version of authService.test.ts

import { jest } from '@jest/globals';

// Create proper mock objects before any imports
const mockCacheService = {
  generateKey: jest.fn().mockReturnValue('mock-cache-key'),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(true),
  clear: jest.fn().mockResolvedValue(true),
  has: jest.fn().mockResolvedValue(false)
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  auditLog: {
    create: jest.fn()
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn()
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 1, email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ userId: 1, email: 'test@example.com' })
};

const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
};

// Mock modules
jest.mock('@/lib/cache', () => ({
  __esModule: true,
  default: mockCacheService,
  cacheService: mockCacheService
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma
}));

jest.mock('jsonwebtoken', () => mockJwt);
jest.mock('bcryptjs', () => mockBcrypt);

// Import the service after mocking
import { AuthService } from '@/services/authService';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock return values
    mockCacheService.generateKey.mockReturnValue('mock-cache-key');
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);
    mockCacheService.delete.mockResolvedValue(true);
    
    authService = new AuthService();
  });

  describe('Authentication', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed-password',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    describe('login', () => {
      it('should authenticate user with valid credentials', async () => {
        // Arrange
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(true);
        mockJwt.sign.mockReturnValue('valid-jwt-token');
        mockPrisma.session.create.mockResolvedValue({
          id: 'session-id',
          userId: 1,
          token: 'session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        // Act
        const result = await authService.login('test@example.com', 'password');

        // Assert
        expect(result).toEqual({
          success: true,
          user: expect.objectContaining({
            id: 1,
            email: 'test@example.com',
            role: UserRole.USER
          }),
          token: 'valid-jwt-token',
          sessionId: 'session-id'
        });
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' }
        });
        expect(mockBcrypt.compare).toHaveBeenCalledWith('password', 'hashed-password');
      });

      it('should reject invalid credentials', async () => {
        // Arrange
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(false);

        // Act
        const result = await authService.login('test@example.com', 'wrong-password');

        // Assert
        expect(result).toEqual({
          success: false,
          error: 'Invalid credentials'
        });
        expect(mockPrisma.session.create).not.toHaveBeenCalled();
      });

      it('should reject non-existent user', async () => {
        // Arrange
        mockPrisma.user.findUnique.mockResolvedValue(null);

        // Act
        const result = await authService.login('nonexistent@example.com', 'password');

        // Assert
        expect(result).toEqual({
          success: false,
          error: 'User not found'
        });
        expect(mockBcrypt.compare).not.toHaveBeenCalled();
      });

      it('should reject inactive user', async () => {
        // Arrange
        const inactiveUser = { ...mockUser, isActive: false };
        mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

        // Act
        const result = await authService.login('test@example.com', 'password');

        // Assert
        expect(result).toEqual({
          success: false,
          error: 'Account is deactivated'
        });
      });
    });

    describe('Token Validation', () => {
      it('should validate valid JWT token', async () => {
        // Arrange
        const tokenPayload = { userId: 1, email: 'test@example.com', iat: Date.now() };
        mockJwt.verify.mockReturnValue(tokenPayload);
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockCacheService.get.mockResolvedValue(JSON.stringify(mockUser));

        // Act
        const result = await authService.validateToken('valid-jwt-token');

        // Assert
        expect(result).toEqual({
          valid: true,
          user: expect.objectContaining({
            id: 1,
            email: 'test@example.com'
          })
        });
        expect(mockJwt.verify).toHaveBeenCalledWith('valid-jwt-token', expect.any(String));
      });

      it('should reject invalid JWT token', async () => {
        // Arrange
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });

        // Act
        const result = await authService.validateToken('invalid-token');

        // Assert
        expect(result).toEqual({
          valid: false,
          error: 'Invalid token'
        });
      });

      it('should reject expired token', async () => {
        // Arrange
        mockJwt.verify.mockImplementation(() => {
          const error = new Error('Token expired');
          error.name = 'TokenExpiredError';
          throw error;
        });

        // Act
        const result = await authService.validateToken('expired-token');

        // Assert
        expect(result).toEqual({
          valid: false,
          error: 'Token expired'
        });
      });
    });

    describe('Session Management', () => {
      it('should create new session', async () => {
        // Arrange
        const sessionData = {
          id: 'new-session-id',
          userId: 1,
          token: 'session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        mockPrisma.session.create.mockResolvedValue(sessionData);

        // Act
        const result = await authService.createSession(1, 'session-token');

        // Assert
        expect(result).toEqual(sessionData);
        expect(mockPrisma.session.create).toHaveBeenCalledWith({
          data: {
            userId: 1,
            token: 'session-token',
            expiresAt: expect.any(Date)
          }
        });
      });

      it('should invalidate session', async () => {
        // Arrange
        mockPrisma.session.delete.mockResolvedValue({ id: 'session-id' });
        mockCacheService.delete.mockResolvedValue(true);

        // Act
        const result = await authService.invalidateSession('session-id');

        // Assert
        expect(result).toBe(true);
        expect(mockPrisma.session.delete).toHaveBeenCalledWith({
          where: { id: 'session-id' }
        });
        expect(mockCacheService.delete).toHaveBeenCalled();
      });

      it('should cleanup expired sessions', async () => {
        // Arrange
        mockPrisma.session.deleteMany.mockResolvedValue({ count: 5 });

        // Act
        const result = await authService.cleanupExpiredSessions();

        // Assert
        expect(result).toBe(5);
        expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
          where: {
            expiresAt: {
              lt: expect.any(Date)
            }
          }
        });
      });
    });

    describe('Password Management', () => {
      it('should hash password securely', async () => {
        // Arrange
        mockBcrypt.genSalt.mockResolvedValue('random-salt');
        mockBcrypt.hash.mockResolvedValue('hashed-password');

        // Act
        const hashedPassword = await authService.hashPassword('plain-password');

        // Assert
        expect(hashedPassword).toBe('hashed-password');
        expect(mockBcrypt.genSalt).toHaveBeenCalledWith(12);
        expect(mockBcrypt.hash).toHaveBeenCalledWith('plain-password', 'random-salt');
      });

      it('should verify password correctly', async () => {
        // Arrange
        mockBcrypt.compare.mockResolvedValue(true);

        // Act
        const isValid = await authService.verifyPassword('plain-password', 'hashed-password');

        // Assert
        expect(isValid).toBe(true);
        expect(mockBcrypt.compare).toHaveBeenCalledWith('plain-password', 'hashed-password');
      });
    });

    describe('Error Handling', () => {
      it('should handle database connection errors', async () => {
        // Arrange
        mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

        // Act
        const result = await authService.login('test@example.com', 'password');

        // Assert
        expect(result).toEqual({
          success: false,
          error: 'Authentication service temporarily unavailable'
        });
      });

      it('should handle cache service errors gracefully', async () => {
        // Arrange
        mockCacheService.get.mockRejectedValue(new Error('Cache service down'));
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        const tokenPayload = { userId: 1, email: 'test@example.com' };
        mockJwt.verify.mockReturnValue(tokenPayload);

        // Act
        const result = await authService.validateToken('valid-token');

        // Assert
        expect(result.valid).toBe(true);
        expect(mockPrisma.user.findUnique).toHaveBeenCalled(); // Should fallback to database
      });

      it('should handle empty token', async () => {
        // Act
        const result = await authService.validateToken('');

        // Assert
        expect(result).toEqual({
          valid: false,
          error: 'Token is required'
        });
      });

      it('should handle null token', async () => {
        // Act
        const result = await authService.validateToken(null as any);

        // Assert
        expect(result).toEqual({
          valid: false,
          error: 'Token is required'
        });
      });
    });

    describe('Rate Limiting', () => {
      it('should track failed login attempts', async () => {
        // Arrange
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(false);
        mockCacheService.get.mockResolvedValue('2'); // 2 previous attempts
        mockCacheService.set.mockResolvedValue(undefined);

        // Act
        const result = await authService.login('test@example.com', 'wrong-password');

        // Assert
        expect(result.success).toBe(false);
        expect(mockCacheService.set).toHaveBeenCalledWith(
          expect.stringContaining('failed_attempts'),
          '3',
          expect.any(Number)
        );
      });

      it('should block login after too many failed attempts', async () => {
        // Arrange
        mockCacheService.get.mockResolvedValue('5'); // 5 failed attempts

        // Act
        const result = await authService.login('test@example.com', 'password');

        // Assert
        expect(result).toEqual({
          success: false,
          error: 'Account temporarily locked due to too many failed attempts'
        });
        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      });
    });

    describe('Audit Logging', () => {
      it('should log successful login', async () => {
        // Arrange
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(true);
        mockJwt.sign.mockReturnValue('jwt-token');
        mockPrisma.session.create.mockResolvedValue({ id: 'session-id' });
        mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });

        // Act
        await authService.login('test@example.com', 'password');

        // Assert
        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: {
            userId: 1,
            action: 'LOGIN_SUCCESS',
            details: expect.objectContaining({
              email: 'test@example.com'
            }),
            timestamp: expect.any(Date)
          }
        });
      });

      it('should log failed login attempts', async () => {
        // Arrange
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(false);
        mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });

        // Act
        await authService.login('test@example.com', 'wrong-password');

        // Assert
        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: {
            userId: 1,
            action: 'LOGIN_FAILED',
            details: expect.objectContaining({
              email: 'test@example.com',
              reason: 'Invalid credentials'
            }),
            timestamp: expect.any(Date)
          }
        });
      });
    });
  });
});