// Mock dependencies before any imports
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));
jest.mock('@/services/auditService', () => ({
  auditService: {
    getRecycleBinItems: jest.fn(),
    getAuditEntries: jest.fn(),
    getEntityHistory: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/audit-trail/route';
import { verifyToken } from '@/lib/auth';
import { auditService } from '@/services/auditService';

const mockVerifyToken = verifyToken as jest.Mock;
const mockAuditService = auditService as {
  getRecycleBinItems: jest.Mock;
  getAuditEntries: jest.Mock;
  getEntityHistory: jest.Mock;
};

describe('/api/audit-trail', () => {
  const mockToken = 'valid-jwt-token';
  const mockDecodedToken = { sub: 'user123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyToken.mockResolvedValue(mockDecodedToken);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit-trail');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    it('should return 401 when token verification fails', async () => {
      mockVerifyToken.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/audit-trail', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
    });
  });

  describe('Recycle Bin Items (type=deleted)', () => {
    const mockRecycleBinData = {
      items: [
        {
          id: 1,
          entity: 'product',
          entityId: 123,
          originalData: { name: 'Test Product' },
          deletedAt: '2024-01-15T10:00:00.000Z',
          deletedBy: 'user1',
          canRecover: true,
        },
      ],
      total: 1,
    };

    beforeEach(() => {
      mockAuditService.getRecycleBinItems.mockResolvedValue(mockRecycleBinData);
    });

    it('should fetch recycle bin items without filters', async () => {
      const url = 'http://localhost:3000/api/audit-trail?type=deleted&limit=20&offset=0';
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRecycleBinData);
      expect(mockAuditService.getRecycleBinItems).toHaveBeenCalledWith(
        undefined,
        20,
        0,
        null,
        null
      );
    });

    it('should fetch recycle bin items with entity filter', async () => {
      const url = 'http://localhost:3000/api/audit-trail?type=deleted&entity=product&limit=20&offset=0';
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRecycleBinData);
      expect(mockAuditService.getRecycleBinItems).toHaveBeenCalledWith(
        'product',
        20,
        0,
        null,
        null
      );
    });

    it('should fetch recycle bin items with date filters', async () => {
      const dateFrom = '2024-01-15T00:00:00Z';
      const dateTo = '2024-01-15T23:59:59Z';
      const url = `http://localhost:3000/api/audit-trail?type=deleted&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&limit=20&offset=0`;
      
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRecycleBinData);
      expect(mockAuditService.getRecycleBinItems).toHaveBeenCalledWith(
        undefined,
        20,
        0,
        dateFrom,
        dateTo
      );
    });

    it('should fetch recycle bin items with entity and date filters combined', async () => {
      const dateFrom = '2024-01-15T00:00:00Z';
      const dateTo = '2024-01-16T23:59:59Z';
      const url = `http://localhost:3000/api/audit-trail?type=deleted&entity=customer&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&limit=10&offset=5`;
      
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRecycleBinData);
      expect(mockAuditService.getRecycleBinItems).toHaveBeenCalledWith(
        'customer',
        10,
        5,
        dateFrom,
        dateTo
      );
    });
  });

  describe('Audit Entries (type=all)', () => {
    const mockAuditData = {
      items: [
        {
          id: 1,
          entity: 'product',
          entityId: 123,
          action: 'CREATE',
          userId: 'user1',
          createdAt: '2024-01-15T10:00:00.000Z',
          details: { name: 'Test Product' },
        },
      ],
      total: 1,
    };

    beforeEach(() => {
      mockAuditService.getAuditEntries.mockResolvedValue(mockAuditData);
    });

    it('should fetch audit entries without filters', async () => {
      const url = 'http://localhost:3000/api/audit-trail?type=all&limit=20&offset=0';
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockAuditData);
      expect(mockAuditService.getAuditEntries).toHaveBeenCalledWith(
        undefined,
        20,
        0,
        null,
        null
      );
    });

    it('should fetch audit entries with entity filter', async () => {
      const url = 'http://localhost:3000/api/audit-trail?type=all&entity=invoice&limit=20&offset=0';
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockAuditData);
      expect(mockAuditService.getAuditEntries).toHaveBeenCalledWith(
        'invoice',
        20,
        0,
        null,
        null
      );
    });

    it('should fetch audit entries with date filters', async () => {
      const dateFrom = '2024-01-15T00:00:00Z';
      const dateTo = '2024-01-15T23:59:59Z';
      const url = `http://localhost:3000/api/audit-trail?type=all&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&limit=20&offset=0`;
      
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockAuditData);
      expect(mockAuditService.getAuditEntries).toHaveBeenCalledWith(
        undefined,
        20,
        0,
        dateFrom,
        dateTo
      );
    });
  });

  describe('Entity History (type=history)', () => {
    const mockHistoryData = [
      {
        id: 1,
        entity: 'product',
        entityId: 123,
        action: 'CREATE',
        userId: 'user1',
        createdAt: '2024-01-15T10:00:00.000Z',
        details: { name: 'Test Product' },
      },
      {
        id: 2,
        entity: 'product',
        entityId: 123,
        action: 'UPDATE',
        userId: 'user2',
        createdAt: '2024-01-16T11:00:00.000Z',
        details: { name: 'Updated Product' },
      },
    ];

    beforeEach(() => {
      mockAuditService.getEntityHistory.mockResolvedValue(mockHistoryData);
    });

    it('should fetch entity history without date filters', async () => {
      const url = 'http://localhost:3000/api/audit-trail?type=history&entity=product&entityId=123&limit=20';
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ items: mockHistoryData, total: mockHistoryData.length });
      expect(mockAuditService.getEntityHistory).toHaveBeenCalledWith(
        'product',
        123,
        20,
        null,
        null
      );
    });

    it('should fetch entity history with date filters', async () => {
      const dateFrom = '2024-01-15T00:00:00Z';
      const dateTo = '2024-01-16T23:59:59Z';
      const url = `http://localhost:3000/api/audit-trail?type=history&entity=product&entityId=123&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&limit=10`;
      
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ items: mockHistoryData, total: mockHistoryData.length });
      expect(mockAuditService.getEntityHistory).toHaveBeenCalledWith(
        'product',
        123,
        10,
        dateFrom,
        dateTo
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock console.error to suppress expected error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockAuditService.getRecycleBinItems.mockRejectedValue(new Error('Database error'));
      
      const url = 'http://localhost:3000/api/audit-trail?type=deleted';
      const request = new NextRequest(url, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch audit trail');
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });
});