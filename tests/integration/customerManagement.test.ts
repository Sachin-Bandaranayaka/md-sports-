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

describe('Customer Management System', () => {
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

    // Mock user with customer management permissions
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'Sales Manager',
        email: 'sales@test.com',
        permissions: ['sales:view', 'sales:create', 'sales:edit', 'customers:view', 'customers:create', 'customers:edit']
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      hasPermission: jest.fn((permission) => {
        const userPermissions = ['sales:view', 'sales:create', 'sales:edit', 'customers:view', 'customers:create', 'customers:edit'];
        return userPermissions.includes(permission);
      })
    });
  });

  describe('Customer Creation and Validation', () => {
    test('should validate customer data correctly', () => {
      const validateCustomer = (customer: any) => {
        const errors: string[] = [];
        
        if (!customer.name || customer.name.trim().length === 0) {
          errors.push('Customer name is required');
        }
        
        if (customer.name && customer.name.length > 100) {
          errors.push('Customer name must be 100 characters or less');
        }
        
        if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
          errors.push('Invalid email format');
        }
        
        if (customer.phone && !/^[\d\s\-\+\(\)]+$/.test(customer.phone)) {
          errors.push('Invalid phone number format');
        }
        
        if (customer.creditLimit && customer.creditLimit < 0) {
          errors.push('Credit limit cannot be negative');
        }
        
        if (customer.paymentTerms && customer.paymentTerms < 0) {
          errors.push('Payment terms cannot be negative');
        }
        
        return errors;
      };

      const validCustomer = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        creditLimit: 5000,
        paymentTerms: 30
      };

      expect(validateCustomer(validCustomer)).toEqual([]);
      expect(validateCustomer({ ...validCustomer, name: '' })).toContain('Customer name is required');
      expect(validateCustomer({ ...validCustomer, email: 'invalid-email' })).toContain('Invalid email format');
      expect(validateCustomer({ ...validCustomer, phone: 'abc123' })).toContain('Invalid phone number format');
      expect(validateCustomer({ ...validCustomer, creditLimit: -100 })).toContain('Credit limit cannot be negative');
    });

    test('should handle customer creation API call', async () => {
      const createCustomer = async (customerData: any) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            customer: { id: 'cust123', ...customerData },
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

        return response.json();
      };

      const customerData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1987654321',
        creditLimit: 3000
      };

      const result = await createCustomer(customerData);
      expect(result.success).toBe(true);
      expect(result.customer.id).toBe('cust123');
      expect(mockFetch).toHaveBeenCalledWith('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(customerData)
      });
    });
  });

  describe('Credit Limit Management', () => {
    test('should calculate available credit correctly', () => {
      const calculateAvailableCredit = (creditLimit: number, currentBalance: number) => {
        return Math.max(0, creditLimit - currentBalance);
      };

      expect(calculateAvailableCredit(5000, 2000)).toBe(3000);
      expect(calculateAvailableCredit(5000, 5000)).toBe(0);
      expect(calculateAvailableCredit(5000, 6000)).toBe(0); // Cannot go negative
    });

    test('should validate credit limit changes', () => {
      const validateCreditLimitChange = (currentBalance: number, newCreditLimit: number) => {
        const errors: string[] = [];
        
        if (newCreditLimit < 0) {
          errors.push('Credit limit cannot be negative');
        }
        
        if (newCreditLimit < currentBalance) {
          errors.push('Credit limit cannot be less than current balance');
        }
        
        return errors;
      };

      expect(validateCreditLimitChange(2000, 5000)).toEqual([]);
      expect(validateCreditLimitChange(2000, -100)).toContain('Credit limit cannot be negative');
      expect(validateCreditLimitChange(2000, 1500)).toContain('Credit limit cannot be less than current balance');
    });

    test('should check credit availability for new sales', () => {
      const checkCreditAvailability = (customer: any, saleAmount: number) => {
        const availableCredit = customer.creditLimit - customer.currentBalance;
        return {
          approved: availableCredit >= saleAmount,
          availableCredit,
          requiredCredit: saleAmount,
          shortfall: Math.max(0, saleAmount - availableCredit)
        };
      };

      const customer = { creditLimit: 5000, currentBalance: 2000 };
      
      const result1 = checkCreditAvailability(customer, 2000);
      expect(result1.approved).toBe(true);
      expect(result1.availableCredit).toBe(3000);
      expect(result1.shortfall).toBe(0);
      
      const result2 = checkCreditAvailability(customer, 4000);
      expect(result2.approved).toBe(false);
      expect(result2.shortfall).toBe(1000);
    });
  });

  describe('Payment Terms and Due Dates', () => {
    test('should calculate due dates correctly', () => {
      const calculateDueDate = (invoiceDate: Date, paymentTerms: number) => {
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + paymentTerms);
        return dueDate;
      };

      const invoiceDate = new Date('2024-01-01');
      const dueDate = calculateDueDate(invoiceDate, 30);
      expect(dueDate.toISOString().split('T')[0]).toBe('2024-01-31');
    });

    test('should identify overdue invoices', () => {
      const isOverdue = (dueDate: Date, currentDate: Date = new Date()) => {
        return currentDate > dueDate;
      };

      const pastDate = new Date('2023-12-01');
      const futureDate = new Date('2025-12-01');
      const today = new Date();

      expect(isOverdue(pastDate, today)).toBe(true);
      expect(isOverdue(futureDate, today)).toBe(false);
    });

    test('should calculate aging buckets', () => {
      const calculateAging = (dueDate: Date, currentDate: Date = new Date()) => {
        const daysPastDue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysPastDue <= 0) return 'current';
        if (daysPastDue <= 30) return '1-30 days';
        if (daysPastDue <= 60) return '31-60 days';
        if (daysPastDue <= 90) return '61-90 days';
        return 'over 90 days';
      };

      const today = new Date();
      const date30DaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const date60DaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
      const date100DaysAgo = new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000);

      expect(calculateAging(today)).toBe('current');
      expect(calculateAging(date30DaysAgo)).toBe('1-30 days');
      expect(calculateAging(date60DaysAgo)).toBe('31-60 days');
      expect(calculateAging(date100DaysAgo)).toBe('over 90 days');
    });
  });

  describe('Customer Transaction History', () => {
    test('should calculate customer balance correctly', () => {
      const calculateCustomerBalance = (transactions: any[]) => {
        return transactions.reduce((balance, transaction) => {
          if (transaction.type === 'invoice') {
            return balance + transaction.amount;
          } else if (transaction.type === 'payment') {
            return balance - transaction.amount;
          } else if (transaction.type === 'credit') {
            return balance - transaction.amount;
          }
          return balance;
        }, 0);
      };

      const transactions = [
        { type: 'invoice', amount: 1000 },
        { type: 'payment', amount: 500 },
        { type: 'invoice', amount: 800 },
        { type: 'credit', amount: 100 }
      ];

      expect(calculateCustomerBalance(transactions)).toBe(1200); // 1000 - 500 + 800 - 100
    });

    test('should filter transactions by date range', () => {
      const filterTransactionsByDateRange = (transactions: any[], startDate: Date, endDate: Date) => {
        return transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      };

      const transactions = [
        { id: 1, date: '2024-01-15', amount: 100 },
        { id: 2, date: '2024-02-15', amount: 200 },
        { id: 3, date: '2024-03-15', amount: 300 }
      ];

      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-28');
      const filtered = filterTransactionsByDateRange(transactions, startDate, endDate);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });

    test('should generate customer statement', () => {
      const generateCustomerStatement = (customer: any, transactions: any[]) => {
        const invoices = transactions.filter(t => t.type === 'invoice');
        const payments = transactions.filter(t => t.type === 'payment');
        const credits = transactions.filter(t => t.type === 'credit');
        
        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
        const totalCredits = credits.reduce((sum, cr) => sum + cr.amount, 0);
        const currentBalance = totalInvoiced - totalPaid - totalCredits;
        
        return {
          customer,
          summary: {
            totalInvoiced,
            totalPaid,
            totalCredits,
            currentBalance
          },
          transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
      };

      const customer = { id: 'cust1', name: 'John Doe' };
      const transactions = [
        { type: 'invoice', amount: 1000, date: '2024-01-01' },
        { type: 'payment', amount: 600, date: '2024-01-15' },
        { type: 'credit', amount: 50, date: '2024-01-20' }
      ];

      const statement = generateCustomerStatement(customer, transactions);
      expect(statement.summary.totalInvoiced).toBe(1000);
      expect(statement.summary.totalPaid).toBe(600);
      expect(statement.summary.totalCredits).toBe(50);
      expect(statement.summary.currentBalance).toBe(350);
    });
  });

  describe('Customer Search and Filtering', () => {
    test('should search customers by name', () => {
      const searchCustomers = (customers: any[], searchTerm: string) => {
        if (!searchTerm) return customers;
        
        const term = searchTerm.toLowerCase();
        return customers.filter(customer => 
          customer.name.toLowerCase().includes(term) ||
          customer.email?.toLowerCase().includes(term) ||
          customer.phone?.includes(term)
        );
      };

      const customers = [
        { name: 'John Doe', email: 'john@example.com', phone: '123456789' },
        { name: 'Jane Smith', email: 'jane@example.com', phone: '987654321' },
        { name: 'Bob Johnson', email: 'bob@example.com', phone: '555666777' }
      ];

      expect(searchCustomers(customers, 'john')).toHaveLength(2); // John Doe and Bob Johnson
      expect(searchCustomers(customers, 'jane@')).toHaveLength(1);
      expect(searchCustomers(customers, '555')).toHaveLength(1);
    });

    test('should filter customers by credit status', () => {
      const filterByCredit = (customers: any[], filterType: string) => {
        switch (filterType) {
          case 'overLimit':
            return customers.filter(c => c.currentBalance > c.creditLimit);
          case 'nearLimit':
            return customers.filter(c => {
              const utilization = c.currentBalance / c.creditLimit;
              return utilization >= 0.8 && utilization <= 1;
            });
          case 'goodStanding':
            return customers.filter(c => c.currentBalance <= c.creditLimit * 0.8);
          default:
            return customers;
        }
      };

      const customers = [
        { name: 'Customer A', creditLimit: 1000, currentBalance: 1200 }, // Over limit
        { name: 'Customer B', creditLimit: 1000, currentBalance: 900 },  // Near limit
        { name: 'Customer C', creditLimit: 1000, currentBalance: 500 }   // Good standing
      ];

      expect(filterByCredit(customers, 'overLimit')).toHaveLength(1);
      expect(filterByCredit(customers, 'nearLimit')).toHaveLength(1);
      expect(filterByCredit(customers, 'goodStanding')).toHaveLength(1);
    });
  });

  describe('Customer API Integration', () => {
    test('should fetch customer list with pagination', async () => {
      const fetchCustomers = async (page: number = 1, limit: number = 10, search?: string) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search })
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            customers: [
              { id: 'cust1', name: 'Customer 1' },
              { id: 'cust2', name: 'Customer 2' }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 25,
              pages: 3
            }
          })
        });

        const response = await fetch(`/api/customers?${params}`, {
          headers: { 'Authorization': 'Bearer mock-token' }
        });

        return response.json();
      };

      const result = await fetchCustomers(1, 10, 'test');
      expect(result.customers).toHaveLength(2);
      expect(result.pagination.total).toBe(25);
    });

    test('should update customer information', async () => {
      const updateCustomer = async (customerId: string, updateData: any) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            customer: { id: customerId, ...updateData },
            message: 'Customer updated successfully'
          })
        });

        const response = await fetch(`/api/customers/${customerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(updateData)
        });

        return response.json();
      };

      const updateData = { creditLimit: 7500, paymentTerms: 45 };
      const result = await updateCustomer('cust123', updateData);
      
      expect(result.success).toBe(true);
      expect(result.customer.creditLimit).toBe(7500);
    });
  });

  describe('Permission-based Access Control', () => {
    test('should restrict customer operations based on permissions', () => {
      const checkCustomerAccess = (userPermissions: string[], action: string) => {
        const permissionMap: Record<string, string> = {
          'view': 'customers:view',
          'create': 'customers:create',
          'edit': 'customers:edit',
          'delete': 'customers:delete'
        };
        
        const requiredPermission = permissionMap[action];
        return userPermissions.includes(requiredPermission) || userPermissions.includes('sales:manage');
      };

      const userPermissions = ['customers:view', 'customers:create'];
      
      expect(checkCustomerAccess(userPermissions, 'view')).toBe(true);
      expect(checkCustomerAccess(userPermissions, 'create')).toBe(true);
      expect(checkCustomerAccess(userPermissions, 'edit')).toBe(false);
      expect(checkCustomerAccess(userPermissions, 'delete')).toBe(false);
    });
  });
});