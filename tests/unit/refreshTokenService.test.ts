import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  cleanupRefreshTokens,
} from '@/services/refreshTokenService';
import prisma from '@/lib/prisma';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock crypto for consistent testing
const mockCrypto = {
  getRandomValues: jest.fn(),
};

// Store original crypto
const originalCrypto = global.crypto;

describe('RefreshTokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock crypto.getRandomValues to return predictable values
    global.crypto = mockCrypto as any;
    mockCrypto.getRandomValues.mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256; // Predictable pattern
      }
      return array;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.crypto = originalCrypto;
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token successfully', async () => {
      const userId = 'user-123';
      const mockCreatedToken = {
        id: 'token-id-123',
        userId,
        token: 'generated-token',
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.refreshToken.create.mockResolvedValue(mockCreatedToken as any);

      const result = await generateRefreshToken(userId);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: expect.any(String),
          expiresAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe('generated-token');
    });

    it('should generate a token using crypto.getRandomValues when available', async () => {
      const userId = 'user-123';
      const mockCreatedToken = {
        id: 'token-id-123',
        userId,
        token: 'crypto-generated-token',
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.refreshToken.create.mockResolvedValue(mockCreatedToken as any);

      await generateRefreshToken(userId);

      expect(mockCrypto.getRandomValues).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: expect.any(String),
          }),
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const userId = 'user-123';
      mockPrisma.refreshToken.create.mockRejectedValue(new Error('Database error'));

      await expect(generateRefreshToken(userId)).rejects.toThrow(
        'Failed to generate refresh token'
      );
    });

    it('should handle prisma client not being available', async () => {
      const userId = 'user-123';
      // Mock prisma as undefined
      (prisma as any) = undefined;

      await expect(generateRefreshToken(userId)).rejects.toThrow(
        'Failed to generate refresh token'
      );

      // Restore prisma mock
      (prisma as any) = mockPrisma;
    });

    it('should retry on prepared statement conflicts', async () => {
      const userId = 'user-123';
      const preparedStatementError = {
        code: '42P05',
        message: 'prepared statement conflict',
      };
      const mockCreatedToken = {
        id: 'token-id-123',
        userId,
        token: 'generated-token',
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.refreshToken.create
        .mockRejectedValueOnce(preparedStatementError)
        .mockResolvedValue(mockCreatedToken as any);

      const result = await generateRefreshToken(userId);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledTimes(2);
      expect(result).toBe('generated-token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token and return user ID', async () => {
      const token = 'valid-token';
      const userId = 'user-123';
      const mockRefreshToken = {
        id: 'token-id-123',
        userId,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken as any);

      const result = await verifyRefreshToken(token);

      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token },
      });
      expect(result).toBe(userId);
    });

    it('should return null for non-existent token', async () => {
      const token = 'non-existent-token';
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      const result = await verifyRefreshToken(token);

      expect(result).toBeNull();
    });

    it('should return null for revoked token', async () => {
      const token = 'revoked-token';
      const mockRefreshToken = {
        id: 'token-id-123',
        userId: 'user-123',
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isRevoked: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken as any);

      const result = await verifyRefreshToken(token);

      expect(result).toBeNull();
    });

    it('should return null and revoke expired token', async () => {
      const token = 'expired-token';
      const mockRefreshToken = {
        id: 'token-id-123',
        userId: 'user-123',
        token,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken as any);
      mockPrisma.refreshToken.update.mockResolvedValue(mockRefreshToken as any);

      const result = await verifyRefreshToken(token);

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockRefreshToken.id },
        data: { isRevoked: true },
      });
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const token = 'error-token';
      mockPrisma.refreshToken.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await verifyRefreshToken(token);

      expect(result).toBeNull();
    });

    it('should handle prisma client not being available', async () => {
      const token = 'test-token';
      // Mock prisma as undefined
      (prisma as any) = undefined;

      const result = await verifyRefreshToken(token);

      expect(result).toBeNull();

      // Restore prisma mock
      (prisma as any) = mockPrisma;
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token successfully', async () => {
      const token = 'token-to-revoke';
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 } as any);

      const result = await revokeRefreshToken(token);

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token },
        data: { isRevoked: true },
      });
      expect(result).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const token = 'error-token';
      mockPrisma.refreshToken.updateMany.mockRejectedValue(new Error('Database error'));

      const result = await revokeRefreshToken(token);

      expect(result).toBe(false);
    });

    it('should handle prisma client not being available', async () => {
      const token = 'test-token';
      // Mock prisma as undefined
      (prisma as any) = undefined;

      const result = await revokeRefreshToken(token);

      expect(result).toBe(false);

      // Restore prisma mock
      (prisma as any) = mockPrisma;
    });
  });

  describe('revokeAllUserRefreshTokens', () => {
    it('should revoke all refresh tokens for a user successfully', async () => {
      const userId = 'user-123';
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 } as any);

      const result = await revokeAllUserRefreshTokens(userId);

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isRevoked: true },
      });
      expect(result).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const userId = 'user-123';
      mockPrisma.refreshToken.updateMany.mockRejectedValue(new Error('Database error'));

      const result = await revokeAllUserRefreshTokens(userId);

      expect(result).toBe(false);
    });

    it('should handle prisma client not being available', async () => {
      const userId = 'user-123';
      // Mock prisma as undefined
      (prisma as any) = undefined;

      const result = await revokeAllUserRefreshTokens(userId);

      expect(result).toBe(false);

      // Restore prisma mock
      (prisma as any) = mockPrisma;
    });
  });

  describe('cleanupRefreshTokens', () => {
    it('should clean up expired and revoked tokens successfully', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 } as any);

      await cleanupRefreshTokens();

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { isRevoked: true },
          ],
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.refreshToken.deleteMany.mockRejectedValue(new Error('Database error'));

      // Should not throw an error
      await expect(cleanupRefreshTokens()).resolves.toBeUndefined();
    });

    it('should handle prisma client not being available', async () => {
      // Mock prisma as undefined
      (prisma as any) = undefined;

      // Should not throw an error
      await expect(cleanupRefreshTokens()).resolves.toBeUndefined();

      // Restore prisma mock
      (prisma as any) = mockPrisma;
    });
  });

  describe('generateSecureToken fallback', () => {
    it('should use Math.random fallback when crypto is not available', async () => {
      const userId = 'user-123';
      const mockCreatedToken = {
        id: 'token-id-123',
        userId,
        token: 'fallback-generated-token',
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Remove crypto to test fallback
      global.crypto = undefined as any;
      mockPrisma.refreshToken.create.mockResolvedValue(mockCreatedToken as any);

      const result = await generateRefreshToken(userId);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: expect.any(String),
          }),
        })
      );
      expect(result).toBe('fallback-generated-token');
    });
  });
});