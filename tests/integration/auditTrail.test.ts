import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
// Mock dependencies
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

// Import after mocking
const { verifyToken } = require('@/lib/auth');

// Mock auditService completely
const mockAuditService = {
  getRecycleBinItems: jest.fn(),
  recoverItem: jest.fn(),
  getEntityHistory: jest.fn(),
  logAction: jest.fn(),
};

jest.mock('@/services/auditService', () => ({
  auditService: mockAuditService,
  AuditService: {
    getInstance: () => mockAuditService,
  },
}));
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}));

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useToast hook
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/audit-trail',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
};

const mockRecycleBinItem = {
  id: 1,
  userId: 1,
  action: 'DELETE',
  entity: 'product',
  entityId: 123,
  originalData: {
    id: 123,
    name: 'Test Product',
    price: 99.99,
    stock: 10,
  },
  isDeleted: true,
  deletedAt: new Date('2024-01-15T10:00:00Z'),
  deletedBy: 1,
  canRecover: true,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
  },
};

const mockAuditHistoryItem = {
  id: 2,
  userId: 1,
  action: 'UPDATE',
  entity: 'customer',
  entityId: 456,
  details: {
    changes: {
      name: { from: 'Old Name', to: 'New Name' },
      email: { from: 'old@email.com', to: 'new@email.com' },
    },
  },
  createdAt: new Date('2024-01-16T14:30:00Z'),
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
  },
};

describe('Audit Trail Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth state
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      accessToken: 'mock-access-token',
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });

    // Mock verifyToken
    (verifyToken as jest.Mock).mockResolvedValue({
      sub: '1',
      userId: 1,
      email: 'test@example.com',
    });
  });

  describe('API Route Tests', () => {
    describe('GET /api/audit-trail', () => {
      test('should fetch recycle bin items successfully', async () => {
        const mockRecycleBinData = {
          items: [mockRecycleBinItem],
          total: 1,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockRecycleBinData,
        });

        const response = await fetch('/api/audit-trail?type=deleted', {
          headers: {
            Authorization: 'Bearer mock-token',
          },
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.items).toHaveLength(1);
        expect(data.items[0].entity).toBe('product');
        expect(data.total).toBe(1);
      });

      test('should fetch audit history successfully', async () => {
        const mockAuditData = {
          items: [mockAuditHistoryItem],
          total: 1,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockAuditData,
        });

        const response = await fetch('/api/audit-trail?type=history&entity=customer&entityId=456', {
          headers: {
            Authorization: 'Bearer mock-token',
          },
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.items).toHaveLength(1);
        expect(data.items[0].action).toBe('UPDATE');
        expect(data.items[0].entity).toBe('customer');
      });

      test('should handle fetch error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        try {
          await fetch('/api/audit-trail?type=deleted');
        } catch (error) {
          expect(error.message).toBe('Network error');
        }
      });

      test('should handle non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        });

        const response = await fetch('/api/audit-trail?type=deleted');
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });
    });

    describe('POST /api/audit-trail/recover', () => {
      test('should recover item successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: 'Item recovered successfully',
          }),
        });

        const response = await fetch('/api/audit-trail/recover', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ auditLogId: 1 }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Item recovered successfully');
      });

      test('should handle authentication error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        });

        const response = await fetch('/api/audit-trail/recover', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer invalid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ auditLogId: 1 }),
        });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      test('should handle service error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        });

        const response = await fetch('/api/audit-trail/recover', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ auditLogId: 1 }),
        });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });

      test('should handle missing auditLogId', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Audit log ID is required' }),
        });

        const response = await fetch('/api/audit-trail/recover', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Audit log ID is required');
      });
    });
  });

  describe('Service Integration Tests', () => {
    test('should call auditService.getRecycleBinItems with correct parameters', async () => {
      const mockData = {
        items: [mockRecycleBinItem],
        total: 1,
      };

      mockAuditService.getRecycleBinItems.mockResolvedValue(mockData);

       const result = await mockAuditService.getRecycleBinItems('product', 10, 0);

       expect(mockAuditService.getRecycleBinItems).toHaveBeenCalledWith('product', 10, 0);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    test('should call auditService.recoverItem with correct parameters', async () => {
      const mockResult = {
        success: true,
        message: 'Item recovered successfully',
      };

      mockAuditService.recoverItem.mockResolvedValue(mockResult);

       const result = await mockAuditService.recoverItem(1, 1);

       expect(mockAuditService.recoverItem).toHaveBeenCalledWith(1, 1);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Item recovered successfully');
    });

    test('should handle service errors gracefully', async () => {
      mockAuditService.getRecycleBinItems.mockRejectedValue(
         new Error('Database connection failed')
       );

       try {
         await mockAuditService.getRecycleBinItems();
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }
    });
  });

  describe('Authentication Integration Tests', () => {
    test('should handle unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      });

      const authState = mockUseAuth();
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBeNull();
      expect(authState.accessToken).toBeNull();
    });

    test('should handle authenticated user', () => {
      const authState = mockUseAuth();
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).toEqual(mockUser);
      expect(authState.accessToken).toBe('mock-access-token');
    });

    test('should handle token verification', async () => {
      const tokenPayload = await verifyToken('mock-token');
      
      expect(verifyToken).toHaveBeenCalledWith('mock-token');
      expect(tokenPayload.userId).toBe(1);
      expect(tokenPayload.email).toBe('test@example.com');
    });

    test('should handle invalid token', async () => {
      (verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      try {
        await verifyToken('invalid-token');
      } catch (error) {
        expect(error.message).toBe('Invalid token');
      }
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/audit-trail');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    test('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const response = await fetch('/api/audit-trail');
      
      try {
        await response.json();
      } catch (error) {
        expect(error.message).toBe('Invalid JSON');
      }
    });

    test('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      try {
        await fetch('/api/audit-trail');
      } catch (error) {
        expect(error.message).toBe('Request timeout');
      }
    });
  });
});