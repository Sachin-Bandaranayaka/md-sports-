import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Sales Invoice API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock user with sales permissions
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'Sales User',
        email: 'sales@test.com',
        permissions: ['sales:view', 'sales:create', 'sales:edit', 'sales:delete', 'payments:create']
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  describe('Invoice Creation API', () => {
    test('should create invoice via API call', async () => {
      const mockInvoiceData = {
        customerId: 1,
        items: [
          { productId: 1, quantity: 2, unitPrice: 100 },
          { productId: 2, quantity: 1, unitPrice: 50 }
        ],
        dueDate: '2024-02-15',
        notes: 'Test invoice'
      };

      const mockResponse = {
        id: 1,
        invoiceNumber: 'INV-001',
        ...mockInvoiceData,
        status: 'draft',
        subtotal: 250,
        taxAmount: 25,
        total: 275,
        createdAt: '2024-01-15T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const createInvoice = async (invoiceData: any) => {
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(invoiceData)
        });

        if (!response.ok) {
          throw new Error('Failed to create invoice');
        }

        return response.json();
      };

      const result = await createInvoice(mockInvoiceData);

      expect(mockFetch).toHaveBeenCalledWith('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(mockInvoiceData)
      });

      expect(result.id).toBe(1);
      expect(result.invoiceNumber).toBe('INV-001');
      expect(result.total).toBe(275);
    });

    test('should handle API errors during creation', async () => {
      const mockInvoiceData = {
        customerId: 1,
        items: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          details: ['At least one item is required']
        }),
      });

      const createInvoice = async (invoiceData: any) => {
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(invoiceData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }

        return response.json();
      };

      await expect(createInvoice(mockInvoiceData)).rejects.toThrow('Validation failed');
    });
  });

  describe('Invoice Update API', () => {
    test('should update invoice via API call', async () => {
      const invoiceId = 1;
      const updateData = {
        notes: 'Updated notes',
        dueDate: '2024-02-20',
        items: [
          { productId: 1, quantity: 3, unitPrice: 100 }
        ]
      };

      const mockResponse = {
        id: invoiceId,
        ...updateData,
        status: 'draft',
        updatedAt: '2024-01-15T11:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const updateInvoice = async (id: number, data: any) => {
        const response = await fetch(`/api/invoices/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error('Failed to update invoice');
        }

        return response.json();
      };

      const result = await updateInvoice(invoiceId, updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/invoices/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.notes).toBe('Updated notes');
      expect(result.dueDate).toBe('2024-02-20');
    });

    test('should handle update permission errors', async () => {
      const invoiceId = 1;
      const updateData = { notes: 'Updated notes' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Insufficient permissions',
          message: 'You do not have permission to edit this invoice'
        }),
      });

      const updateInvoice = async (id: number, data: any) => {
        const response = await fetch(`/api/invoices/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }

        return response.json();
      };

      await expect(updateInvoice(invoiceId, updateData)).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Invoice Deletion API', () => {
    test('should delete invoice via API call', async () => {
      const invoiceId = 1;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Invoice deleted successfully',
          deletedId: invoiceId
        }),
      });

      const deleteInvoice = async (id: number) => {
        const response = await fetch(`/api/invoices/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete invoice');
        }

        return response.json();
      };

      const result = await deleteInvoice(invoiceId);

      expect(mockFetch).toHaveBeenCalledWith('/api/invoices/1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(result.message).toBe('Invoice deleted successfully');
      expect(result.deletedId).toBe(invoiceId);
    });

    test('should handle deletion restrictions', async () => {
      const invoiceId = 1;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Cannot delete invoice',
          message: 'Invoice has payments and cannot be deleted'
        }),
      });

      const deleteInvoice = async (id: number) => {
        const response = await fetch(`/api/invoices/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }

        return response.json();
      };

      await expect(deleteInvoice(invoiceId)).rejects.toThrow('Cannot delete invoice');
    });
  });

  describe('Payment Processing API', () => {
    test('should process payment via API call', async () => {
      const invoiceId = 1;
      const paymentData = {
        amount: 500,
        paymentMethod: 'cash',
        paymentDate: '2024-01-15',
        notes: 'Cash payment'
      };

      const mockResponse = {
        id: 1,
        invoiceId,
        ...paymentData,
        status: 'completed',
        processedAt: '2024-01-15T12:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const processPayment = async (invoiceId: number, paymentData: any) => {
        const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
          throw new Error('Failed to process payment');
        }

        return response.json();
      };

      const result = await processPayment(invoiceId, paymentData);

      expect(mockFetch).toHaveBeenCalledWith('/api/invoices/1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(paymentData)
      });

      expect(result.amount).toBe(500);
      expect(result.status).toBe('completed');
      expect(result.paymentMethod).toBe('cash');
    });

    test('should handle payment validation errors', async () => {
      const invoiceId = 1;
      const paymentData = {
        amount: 1500, // Exceeds invoice total
        paymentMethod: 'cash',
        paymentDate: '2024-01-15'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Payment validation failed',
          details: ['Payment amount exceeds remaining balance']
        }),
      });

      const processPayment = async (invoiceId: number, paymentData: any) => {
        const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }

        return response.json();
      };

      await expect(processPayment(invoiceId, paymentData)).rejects.toThrow('Payment validation failed');
    });
  });

  describe('Invoice Retrieval API', () => {
    test('should fetch invoice list via API call', async () => {
      const mockInvoices = [
        {
          id: 1,
          invoiceNumber: 'INV-001',
          customerId: 1,
          customerName: 'John Doe',
          total: 275,
          status: 'sent',
          dueDate: '2024-02-15'
        },
        {
          id: 2,
          invoiceNumber: 'INV-002',
          customerId: 2,
          customerName: 'Jane Smith',
          total: 150,
          status: 'paid',
          dueDate: '2024-02-10'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          invoices: mockInvoices,
          total: 2,
          page: 1,
          limit: 10
        }),
      });

      const fetchInvoices = async (params: any = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const url = `/api/invoices${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }

        return response.json();
      };

      const result = await fetchInvoices({ page: 1, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith('/api/invoices?page=1&limit=10', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(result.invoices).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    test('should fetch single invoice via API call', async () => {
      const invoiceId = 1;
      const mockInvoice = {
        id: invoiceId,
        invoiceNumber: 'INV-001',
        customerId: 1,
        customerName: 'John Doe',
        items: [
          { productId: 1, productName: 'Product A', quantity: 2, unitPrice: 100 },
          { productId: 2, productName: 'Product B', quantity: 1, unitPrice: 50 }
        ],
        subtotal: 250,
        taxAmount: 25,
        total: 275,
        status: 'sent',
        payments: [
          { id: 1, amount: 100, paymentMethod: 'cash', paymentDate: '2024-01-10' }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvoice,
      });

      const fetchInvoice = async (id: number) => {
        const response = await fetch(`/api/invoices/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch invoice');
        }

        return response.json();
      };

      const result = await fetchInvoice(invoiceId);

      expect(mockFetch).toHaveBeenCalledWith('/api/invoices/1', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(result.id).toBe(invoiceId);
      expect(result.items).toHaveLength(2);
      expect(result.payments).toHaveLength(1);
    });
  });

  describe('Invoice Status Updates API', () => {
    test('should update invoice status via API call', async () => {
      const invoiceId = 1;
      const statusData = {
        status: 'sent',
        sentDate: '2024-01-15T10:00:00Z'
      };

      const mockResponse = {
        id: invoiceId,
        status: 'sent',
        sentDate: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const updateInvoiceStatus = async (id: number, statusData: any) => {
        const response = await fetch(`/api/invoices/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(statusData)
        });

        if (!response.ok) {
          throw new Error('Failed to update invoice status');
        }

        return response.json();
      };

      const result = await updateInvoiceStatus(invoiceId, statusData);

      expect(mockFetch).toHaveBeenCalledWith('/api/invoices/1/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(statusData)
      });

      expect(result.status).toBe('sent');
      expect(result.sentDate).toBe('2024-01-15T10:00:00Z');
    });

    test('should handle invalid status transitions', async () => {
      const invoiceId = 1;
      const statusData = {
        status: 'draft' // Invalid transition from paid to draft
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid status transition',
          message: 'Cannot change status from paid to draft'
        }),
      });

      const updateInvoiceStatus = async (id: number, statusData: any) => {
        const response = await fetch(`/api/invoices/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(statusData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }

        return response.json();
      };

      await expect(updateInvoiceStatus(invoiceId, statusData)).rejects.toThrow('Invalid status transition');
    });
  });
});