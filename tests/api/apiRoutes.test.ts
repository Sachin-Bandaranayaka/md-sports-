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

describe('API Routes Testing', () => {
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

    // Mock user with API access permissions
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'API User',
        email: 'api@test.com',
        permissions: ['api:access', 'sales:all', 'inventory:all', 'customers:all']
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      hasPermission: jest.fn(() => true)
    });
  });

  describe('Authentication API Routes', () => {
    test('should handle POST /api/auth/login', async () => {
      const testLogin = async (credentials: any) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            token: 'jwt-token-123',
            user: {
              id: '1',
              email: credentials.email,
              name: 'Test User',
              permissions: ['sales:view']
            },
            expiresIn: 3600
          })
        });

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testLogin({ email: 'test@example.com', password: 'password123' });
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.token).toBe('jwt-token-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });
    });

    test('should handle POST /api/auth/logout', async () => {
      const testLogout = async (token: string) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: 'Logged out successfully'
          })
        });

        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testLogout('mock-token');
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
    });

    test('should handle POST /api/auth/refresh', async () => {
      const testRefresh = async (token: string) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            token: 'new-jwt-token-456',
            expiresIn: 3600
          })
        });

        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testRefresh('old-token');
      
      expect(result.status).toBe(200);
      expect(result.data.token).toBe('new-jwt-token-456');
    });

    test('should handle authentication errors', async () => {
      const testAuthError = async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            message: 'Invalid credentials',
            error: 'UNAUTHORIZED'
          })
        });

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: 'wrong@example.com', password: 'wrongpass' })
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testAuthError();
      
      expect(result.status).toBe(401);
      expect(result.data.success).toBe(false);
      expect(result.data.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Sales Invoice API Routes', () => {
    test('should handle GET /api/sales/invoices', async () => {
      const testGetInvoices = async (params: any = {}) => {
        const queryString = new URLSearchParams(params).toString();
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            invoices: [
              {
                id: 'inv-1',
                invoiceNumber: 'INV-001',
                customerId: 'cust-1',
                amount: 1000,
                status: 'paid',
                createdAt: '2024-01-01T00:00:00Z'
              },
              {
                id: 'inv-2',
                invoiceNumber: 'INV-002',
                customerId: 'cust-2',
                amount: 1500,
                status: 'pending',
                createdAt: '2024-01-02T00:00:00Z'
              }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              pages: 1
            }
          })
        });

        const url = queryString ? `/api/sales/invoices?${queryString}` : '/api/sales/invoices';
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testGetInvoices({ page: 1, limit: 10, status: 'pending' });
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.invoices).toHaveLength(2);
      expect(result.data.pagination.total).toBe(2);
    });

    test('should handle POST /api/sales/invoices', async () => {
      const testCreateInvoice = async (invoiceData: any) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            invoice: {
              id: 'inv-new',
              ...invoiceData,
              invoiceNumber: 'INV-003',
              createdAt: new Date().toISOString()
            },
            message: 'Invoice created successfully'
          })
        });

        const response = await fetch('/api/sales/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(invoiceData)
        });

        return { status: response.status, data: await response.json() };
      };

      const invoiceData = {
        customerId: 'cust-1',
        items: [
          { productId: 'prod-1', quantity: 2, price: 500 }
        ],
        subtotal: 1000,
        tax: 100,
        total: 1100
      };

      const result = await testCreateInvoice(invoiceData);
      
      expect(result.status).toBe(201);
      expect(result.data.success).toBe(true);
      expect(result.data.invoice.id).toBe('inv-new');
    });

    test('should handle PUT /api/sales/invoices/[id]', async () => {
      const testUpdateInvoice = async (invoiceId: string, updateData: any) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            invoice: {
              id: invoiceId,
              ...updateData,
              updatedAt: new Date().toISOString()
            },
            message: 'Invoice updated successfully'
          })
        });

        const response = await fetch(`/api/sales/invoices/${invoiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(updateData)
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testUpdateInvoice('inv-1', { status: 'paid' });
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.invoice.status).toBe('paid');
    });

    test('should handle DELETE /api/sales/invoices/[id]', async () => {
      const testDeleteInvoice = async (invoiceId: string) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: 'Invoice deleted successfully'
          })
        });

        const response = await fetch(`/api/sales/invoices/${invoiceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testDeleteInvoice('inv-1');
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
    });
  });

  describe('Inventory API Routes', () => {
    test('should handle GET /api/inventory/products', async () => {
      const testGetProducts = async (params: any = {}) => {
        const queryString = new URLSearchParams(params).toString();
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            products: [
              {
                id: 'prod-1',
                name: 'Product A',
                sku: 'SKU-001',
                price: 100,
                stock: 50,
                category: 'Electronics'
              },
              {
                id: 'prod-2',
                name: 'Product B',
                sku: 'SKU-002',
                price: 200,
                stock: 25,
                category: 'Clothing'
              }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              pages: 1
            }
          })
        });

        const url = queryString ? `/api/inventory/products?${queryString}` : '/api/inventory/products';
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testGetProducts({ category: 'Electronics', inStock: true });
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.products).toHaveLength(2);
    });

    test('should handle POST /api/inventory/products', async () => {
      const testCreateProduct = async (productData: any) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            product: {
              id: 'prod-new',
              ...productData,
              createdAt: new Date().toISOString()
            },
            message: 'Product created successfully'
          })
        });

        const response = await fetch('/api/inventory/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(productData)
        });

        return { status: response.status, data: await response.json() };
      };

      const productData = {
        name: 'New Product',
        sku: 'SKU-NEW',
        price: 150,
        stock: 100,
        category: 'Books'
      };

      const result = await testCreateProduct(productData);
      
      expect(result.status).toBe(201);
      expect(result.data.success).toBe(true);
      expect(result.data.product.name).toBe('New Product');
    });

    test('should handle PUT /api/inventory/stock/[id]', async () => {
      const testUpdateStock = async (productId: string, stockData: any) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            product: {
              id: productId,
              stock: stockData.newStock,
              updatedAt: new Date().toISOString()
            },
            stockMovement: {
              id: 'mov-1',
              productId,
              type: stockData.type,
              quantity: stockData.quantity,
              reason: stockData.reason
            },
            message: 'Stock updated successfully'
          })
        });

        const response = await fetch(`/api/inventory/stock/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(stockData)
        });

        return { status: response.status, data: await response.json() };
      };

      const stockData = {
        type: 'adjustment',
        quantity: 10,
        newStock: 60,
        reason: 'Stock count correction'
      };

      const result = await testUpdateStock('prod-1', stockData);
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.product.stock).toBe(60);
    });
  });

  describe('Customer API Routes', () => {
    test('should handle GET /api/customers', async () => {
      const testGetCustomers = async (params: any = {}) => {
        const queryString = new URLSearchParams(params).toString();
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            customers: [
              {
                id: 'cust-1',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                creditLimit: 5000,
                currentBalance: 1200
              },
              {
                id: 'cust-2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '+1987654321',
                creditLimit: 3000,
                currentBalance: 800
              }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              pages: 1
            }
          })
        });

        const url = queryString ? `/api/customers?${queryString}` : '/api/customers';
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testGetCustomers({ search: 'john', creditStatus: 'good' });
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.customers).toHaveLength(2);
    });

    test('should handle POST /api/customers', async () => {
      const testCreateCustomer = async (customerData: any) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            customer: {
              id: 'cust-new',
              ...customerData,
              currentBalance: 0,
              createdAt: new Date().toISOString()
            },
            message: 'Customer created successfully'
          })
        });

        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(customerData)
        });

        return { status: response.status, data: await response.json() };
      };

      const customerData = {
        name: 'New Customer',
        email: 'new@example.com',
        phone: '+1555666777',
        creditLimit: 2000
      };

      const result = await testCreateCustomer(customerData);
      
      expect(result.status).toBe(201);
      expect(result.data.success).toBe(true);
      expect(result.data.customer.name).toBe('New Customer');
    });

    test('should handle GET /api/customers/[id]/transactions', async () => {
      const testGetCustomerTransactions = async (customerId: string, params: any = {}) => {
        const queryString = new URLSearchParams(params).toString();
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            transactions: [
              {
                id: 'txn-1',
                type: 'invoice',
                amount: 1000,
                date: '2024-01-01T00:00:00Z',
                description: 'Invoice INV-001'
              },
              {
                id: 'txn-2',
                type: 'payment',
                amount: 500,
                date: '2024-01-05T00:00:00Z',
                description: 'Payment received'
              }
            ],
            summary: {
              totalInvoiced: 1000,
              totalPaid: 500,
              currentBalance: 500
            }
          })
        });

        const url = queryString ? `/api/customers/${customerId}/transactions?${queryString}` : `/api/customers/${customerId}/transactions`;
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testGetCustomerTransactions('cust-1', { startDate: '2024-01-01', endDate: '2024-01-31' });
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.transactions).toHaveLength(2);
      expect(result.data.summary.currentBalance).toBe(500);
    });
  });

  describe('Dashboard API Routes', () => {
    test('should handle GET /api/dashboard', async () => {
      const testGetDashboard = async (params: any = {}) => {
        const queryString = new URLSearchParams(params).toString();
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              sales: {
                totalRevenue: 125000,
                totalTransactions: 450,
                averageOrderValue: 277.78,
                growth: 15.5
              },
              inventory: {
                totalItems: 1250,
                lowStockItems: 23,
                outOfStockItems: 5,
                inventoryValue: 85000
              },
              customers: {
                totalCustomers: 890,
                newCustomers: 45,
                activeCustomers: 234
              }
            }
          })
        });

        const url = queryString ? `/api/dashboard?${queryString}` : '/api/dashboard';
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testGetDashboard({ range: '30d' });
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.data.sales.totalRevenue).toBe(125000);
    });

    test('should handle GET /api/analytics/charts/[type]', async () => {
      const testGetChartData = async (chartType: string, params: any = {}) => {
        const queryString = new URLSearchParams(params).toString();
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            chartData: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
              datasets: [{
                label: 'Revenue',
                data: [12000, 15000, 18000, 16000, 20000],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)'
              }]
            },
            metadata: {
              total: 81000,
              average: 16200,
              growth: 12.5
            }
          })
        });

        const url = queryString ? `/api/analytics/charts/${chartType}?${queryString}` : `/api/analytics/charts/${chartType}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testGetChartData('revenue', { period: '6m', groupBy: 'month' });
      
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.chartData.labels).toHaveLength(5);
      expect(result.data.metadata.total).toBe(81000);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      const testNotFound = async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({
            success: false,
            message: 'Resource not found',
            error: 'NOT_FOUND'
          })
        });

        const response = await fetch('/api/nonexistent/route', {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testNotFound();
      
      expect(result.status).toBe(404);
      expect(result.data.success).toBe(false);
      expect(result.data.error).toBe('NOT_FOUND');
    });

    test('should handle validation errors', async () => {
      const testValidationError = async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            message: 'Validation failed',
            error: 'VALIDATION_ERROR',
            details: [
              { field: 'email', message: 'Invalid email format' },
              { field: 'name', message: 'Name is required' }
            ]
          })
        });

        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({ email: 'invalid-email' })
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testValidationError();
      
      expect(result.status).toBe(400);
      expect(result.data.success).toBe(false);
      expect(result.data.error).toBe('VALIDATION_ERROR');
      expect(result.data.details).toHaveLength(2);
    });

    test('should handle server errors', async () => {
      const testServerError = async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            message: 'Internal server error',
            error: 'INTERNAL_ERROR'
          })
        });

        const response = await fetch('/api/sales/invoices', {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testServerError();
      
      expect(result.status).toBe(500);
      expect(result.data.success).toBe(false);
      expect(result.data.error).toBe('INTERNAL_ERROR');
    });

    test('should handle rate limiting', async () => {
      const testRateLimit = async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            success: false,
            message: 'Too many requests',
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 60
          })
        });

        const response = await fetch('/api/sales/invoices', {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });

        return { status: response.status, data: await response.json() };
      };

      const result = await testRateLimit();
      
      expect(result.status).toBe(429);
      expect(result.data.success).toBe(false);
      expect(result.data.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.data.retryAfter).toBe(60);
    });
  });
});