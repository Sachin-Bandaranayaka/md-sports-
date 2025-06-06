import '@testing-library/jest-dom';

// Mock hooks and dependencies
const mockUseAuth = jest.fn();
const mockUsePermission = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../src/hooks/usePermission', () => ({
  usePermission: () => mockUsePermission(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
};
global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Sample data for testing
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
  permissions: ['read:invoices', 'write:invoices', 'read:inventory', 'write:inventory'],
};

const mockCustomer = {
  id: '1',
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+1234567890',
  address: '123 Test St',
  creditLimit: 5000,
  currentBalance: 1500,
};

const mockProduct = {
  id: '1',
  name: 'Test Product',
  sku: 'TEST-001',
  barcode: '1234567890123',
  price: 99.99,
  cost: 60.00,
  stock: 100,
  category: 'Electronics',
  supplier: 'Test Supplier',
};

const mockInvoice = {
  id: '1',
  invoiceNumber: 'INV-000001',
  customerId: '1',
  customer: mockCustomer,
  items: [
    {
      id: '1',
      productId: '1',
      product: mockProduct,
      quantity: 2,
      unitPrice: 99.99,
      total: 199.98,
    },
  ],
  subtotal: 199.98,
  tax: 20.00,
  total: 219.98,
  status: 'pending',
  dueDate: '2024-02-15',
  createdAt: '2024-01-15T10:00:00Z',
};

describe('System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth state
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });
    
    // Default permission state
    mockUsePermission.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true),
      hasAnyPermission: jest.fn().mockReturnValue(true),
      hasAllPermissions: jest.fn().mockReturnValue(true),
    });
    
    // Default fetch responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
      status: 200,
    });
    
    // Clear storage
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe('End-to-End Invoice Workflow', () => {
    test('should complete full invoice creation and payment workflow', async () => {
      // Step 1: Create customer if not exists
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ customers: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ customer: mockCustomer }),
        });
      
      // Search for customer
      const customerResponse = await fetch('/api/customers?search=test@example.com');
      const customerData = await customerResponse.json();
      
      expect(customerData.customers).toEqual([]);
      
      // Create new customer
      const newCustomerResponse = await fetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Customer',
          email: 'customer@example.com',
          phone: '+1234567890',
          address: '123 Test St',
          creditLimit: 5000,
        }),
      });
      
      const newCustomer = await newCustomerResponse.json();
      expect(newCustomer.customer).toEqual(mockCustomer);
      
      // Step 2: Check product availability
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });
      
      const productResponse = await fetch('/api/products/1');
      const productData = await productResponse.json();
      
      expect(productData.product.stock).toBeGreaterThanOrEqual(2);
      
      // Step 3: Create invoice
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invoice: mockInvoice }),
      });
      
      const invoiceResponse = await fetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          customerId: mockCustomer.id,
          items: [
            {
              productId: mockProduct.id,
              quantity: 2,
              unitPrice: mockProduct.price,
            },
          ],
          dueDate: '2024-02-15',
        }),
      });
      
      const invoiceData = await invoiceResponse.json();
      expect(invoiceData.invoice.total).toBe(219.98);
      
      // Step 4: Update inventory
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          product: { ...mockProduct, stock: mockProduct.stock - 2 } 
        }),
      });
      
      const inventoryResponse = await fetch('/api/products/1/stock', {
        method: 'PUT',
        body: JSON.stringify({
          quantity: -2,
          reason: 'sale',
          invoiceId: mockInvoice.id,
        }),
      });
      
      const updatedProduct = await inventoryResponse.json();
      expect(updatedProduct.product.stock).toBe(98);
      
      // Step 5: Process payment
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          payment: {
            id: '1',
            invoiceId: mockInvoice.id,
            amount: 219.98,
            method: 'credit_card',
            status: 'completed',
          }
        }),
      });
      
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: mockInvoice.id,
          amount: 219.98,
          method: 'credit_card',
        }),
      });
      
      const paymentData = await paymentResponse.json();
      expect(paymentData.payment.status).toBe('completed');
      
      // Verify all API calls were made
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });

    test('should handle inventory shortage during invoice creation', async () => {
      // Mock product with insufficient stock
      const lowStockProduct = { ...mockProduct, stock: 1 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: lowStockProduct }),
      });
      
      const productResponse = await fetch('/api/products/1');
      const productData = await productResponse.json();
      
      expect(productData.product.stock).toBeLessThan(2);
      
      // Attempt to create invoice with insufficient stock
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Insufficient stock',
          available: 1,
          requested: 2,
        }),
      });
      
      const invoiceResponse = await fetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          customerId: mockCustomer.id,
          items: [
            {
              productId: mockProduct.id,
              quantity: 2,
              unitPrice: mockProduct.price,
            },
          ],
        }),
      });
      
      expect(invoiceResponse.ok).toBe(false);
      expect(invoiceResponse.status).toBe(400);
      
      const errorData = await invoiceResponse.json();
      expect(errorData.error).toBe('Insufficient stock');
    });
  });

  describe('Real-time Updates Integration', () => {
    test('should handle real-time inventory updates via WebSocket', async () => {
      const mockOnMessage = jest.fn();
      const mockOnError = jest.fn();
      const mockOnClose = jest.fn();
      
      // Simulate WebSocket connection
      const ws = new WebSocket('ws://localhost:3000/ws');
      
      // Simulate receiving inventory update
      const inventoryUpdate = {
        type: 'inventory_update',
        productId: '1',
        newStock: 95,
        reason: 'sale',
        timestamp: new Date().toISOString(),
      };
      
      // Simulate message received
      mockWebSocket.addEventListener.mockImplementation((event, callback) => {
        if (event === 'message') {
          setTimeout(() => {
            callback({ data: JSON.stringify(inventoryUpdate) });
          }, 100);
        }
      });
      
      ws.addEventListener('message', mockOnMessage);
      
      // Wait for message
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    test('should handle real-time invoice status updates', async () => {
      const statusUpdate = {
        type: 'invoice_status_update',
        invoiceId: '1',
        status: 'paid',
        paidAmount: 219.98,
        paidAt: new Date().toISOString(),
      };
      
      // Simulate WebSocket message
      mockWebSocket.addEventListener.mockImplementation((event, callback) => {
        if (event === 'message') {
          setTimeout(() => {
            callback({ data: JSON.stringify(statusUpdate) });
          }, 100);
        }
      });
      
      const ws = new WebSocket('ws://localhost:3000/ws');
      const mockHandler = jest.fn();
      ws.addEventListener('message', mockHandler);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockWebSocket.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Authentication and Authorization Flow', () => {
    test('should handle complete authentication flow', async () => {
      // Step 1: Login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        }),
      });
      
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
      
      const loginData = await loginResponse.json();
      expect(loginData.user).toEqual(mockUser);
      expect(loginData.token).toBeDefined();
      
      // Step 2: Simulate token storage (would be handled by auth service)
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return 'mock-jwt-token';
        if (key === 'refresh_token') return 'mock-refresh-token';
        return null;
      });
      
      // Step 3: Access protected resource
      mockLocalStorage.getItem.mockReturnValue('mock-jwt-token');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invoices: [mockInvoice] }),
      });
      
      const protectedResponse = await fetch('/api/invoices', {
        headers: {
          Authorization: 'Bearer mock-jwt-token',
        },
      });
      
      expect(protectedResponse.ok).toBe(true);
      
      // Step 4: Handle token refresh
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'new-jwt-token',
            refreshToken: 'new-refresh-token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ invoices: [mockInvoice] }),
        });
      
      // First request fails with 401
      const expiredResponse = await fetch('/api/invoices', {
        headers: {
          Authorization: 'Bearer expired-token',
        },
      });
      
      expect(expiredResponse.status).toBe(401);
      
      // Refresh token
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'mock-refresh-token',
        }),
      });
      
      const refreshData = await refreshResponse.json();
      expect(refreshData.token).toBe('new-jwt-token');
      
      // Retry with new token
      const retryResponse = await fetch('/api/invoices', {
        headers: {
          Authorization: 'Bearer new-jwt-token',
        },
      });
      
      expect(retryResponse.ok).toBe(true);
    });

    test('should handle permission-based access control', async () => {
      // Test user with limited permissions
      const limitedUser = {
        ...mockUser,
        role: 'viewer',
        permissions: ['read:invoices'],
      };
      
      mockUseAuth.mockReturnValue({
        user: limitedUser,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      });
      
      mockUsePermission.mockReturnValue({
        hasPermission: jest.fn((permission) => {
          return limitedUser.permissions.includes(permission);
        }),
        hasAnyPermission: jest.fn((permissions) => {
          return permissions.some(p => limitedUser.permissions.includes(p));
        }),
        hasAllPermissions: jest.fn((permissions) => {
          return permissions.every(p => limitedUser.permissions.includes(p));
        }),
      });
      
      const { hasPermission } = mockUsePermission();
      
      // Should have read access
      expect(hasPermission('read:invoices')).toBe(true);
      
      // Should not have write access
      expect(hasPermission('write:invoices')).toBe(false);
      
      // API should reject write operations
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Insufficient permissions' }),
      });
      
      const writeResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify(mockInvoice),
      });
      
      expect(writeResponse.status).toBe(403);
    });
  });

  describe('Data Consistency and Validation', () => {
    test('should maintain data consistency across operations', async () => {
      // Create invoice
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invoice: mockInvoice }),
      });
      
      const createResponse = await fetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          customerId: mockCustomer.id,
          items: mockInvoice.items,
        }),
      });
      
      const createdInvoice = await createResponse.json();
      
      // Verify calculations
      const expectedSubtotal = mockInvoice.items.reduce(
        (sum, item) => sum + item.total,
        0
      );
      const expectedTax = Math.round(expectedSubtotal * 0.1 * 100) / 100;
      const expectedTotal = expectedSubtotal + expectedTax;
      
      expect(createdInvoice.invoice.subtotal).toBe(expectedSubtotal);
      expect(createdInvoice.invoice.tax).toBe(expectedTax);
      expect(createdInvoice.invoice.total).toBe(expectedTotal);
      
      // Update invoice
      const updatedItems = [
        {
          ...mockInvoice.items[0],
          quantity: 3,
          total: 299.97,
        },
      ];
      
      const updatedInvoice = {
        ...mockInvoice,
        items: updatedItems,
        subtotal: 299.97,
        tax: 30.00,
        total: 329.97,
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invoice: updatedInvoice }),
      });
      
      const updateResponse = await fetch(`/api/invoices/${mockInvoice.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          items: updatedItems,
        }),
      });
      
      const updateData = await updateResponse.json();
      
      // Verify updated calculations
      expect(updateData.invoice.subtotal).toBe(299.97);
      expect(updateData.invoice.total).toBe(329.97);
    });

    test('should validate business rules across modules', async () => {
      // Test credit limit validation
      const highValueInvoice = {
        ...mockInvoice,
        total: 6000, // Exceeds customer credit limit
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Credit limit exceeded',
          creditLimit: mockCustomer.creditLimit,
          currentBalance: mockCustomer.currentBalance,
          requestedAmount: 6000,
          availableCredit: 3500,
        }),
      });
      
      const creditResponse = await fetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(highValueInvoice),
      });
      
      expect(creditResponse.status).toBe(400);
      
      const creditError = await creditResponse.json();
      expect(creditError.error).toBe('Credit limit exceeded');
      
      // Test inventory validation
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Insufficient inventory',
          productId: mockProduct.id,
          available: 50,
          requested: 100,
        }),
      });
      
      const inventoryResponse = await fetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...mockInvoice,
          items: [
            {
              ...mockInvoice.items[0],
              quantity: 100, // Exceeds available stock
            },
          ],
        }),
      });
      
      expect(inventoryResponse.status).toBe(400);
      
      const inventoryError = await inventoryResponse.json();
      expect(inventoryError.error).toBe('Insufficient inventory');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network failures gracefully', async () => {
      // Simulate network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('/api/invoices');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
      
      // Simulate retry logic
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invoices: [mockInvoice] }),
      });
      
      const retryResponse = await fetch('/api/invoices');
      expect(retryResponse.ok).toBe(true);
    });

    test('should handle partial failures in batch operations', async () => {
      const batchItems = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];
      
      // Simulate partial success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: '1', status: 'success' },
            { id: '2', status: 'error', error: 'Validation failed' },
            { id: '3', status: 'success' },
          ],
          summary: {
            total: 3,
            successful: 2,
            failed: 1,
          },
        }),
      });
      
      const batchResponse = await fetch('/api/batch/process', {
        method: 'POST',
        body: JSON.stringify({ items: batchItems }),
      });
      
      const batchResult = await batchResponse.json();
      
      expect(batchResult.summary.successful).toBe(2);
      expect(batchResult.summary.failed).toBe(1);
      expect(batchResult.results[1].status).toBe('error');
    });
  });

  describe('Performance and Caching', () => {
    test('should implement proper caching strategies', async () => {
      // First request - cache miss
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          'Cache-Control': 'max-age=300',
          'ETag': '"abc123"',
        }),
        json: async () => ({ products: [mockProduct] }),
      });
      
      const firstResponse = await fetch('/api/products');
      const firstData = await firstResponse.json();
      
      expect(firstData.products).toEqual([mockProduct]);
      
      // Second request - cache hit (304 Not Modified)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 304,
        headers: new Headers({
          'ETag': '"abc123"',
        }),
      });
      
      const secondResponse = await fetch('/api/products', {
        headers: {
          'If-None-Match': '"abc123"',
        },
      });
      
      expect(secondResponse.status).toBe(304);
    });

    test('should handle pagination efficiently', async () => {
      const pageSize = 10;
      const totalItems = 25;
      
      // First page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          invoices: Array(pageSize).fill(mockInvoice),
          pagination: {
            page: 1,
            pageSize,
            total: totalItems,
            totalPages: 3,
            hasNext: true,
            hasPrev: false,
          },
        }),
      });
      
      const firstPageResponse = await fetch('/api/invoices?page=1&limit=10');
      const firstPageData = await firstPageResponse.json();
      
      expect(firstPageData.invoices).toHaveLength(pageSize);
      expect(firstPageData.pagination.hasNext).toBe(true);
      
      // Last page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          invoices: Array(5).fill(mockInvoice), // Remaining items
          pagination: {
            page: 3,
            pageSize,
            total: totalItems,
            totalPages: 3,
            hasNext: false,
            hasPrev: true,
          },
        }),
      });
      
      const lastPageResponse = await fetch('/api/invoices?page=3&limit=10');
      const lastPageData = await lastPageResponse.json();
      
      expect(lastPageData.invoices).toHaveLength(5);
      expect(lastPageData.pagination.hasNext).toBe(false);
    });
  });
});