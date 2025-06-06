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
global.fetch = jest.fn();

describe('Sales Invoice Management', () => {
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

  describe('Invoice Creation Logic', () => {
    test('should validate invoice creation data', () => {
      const validateInvoiceData = (invoiceData: any) => {
        const errors: string[] = [];
        
        if (!invoiceData.customerId) {
          errors.push('Customer is required');
        }
        
        if (!invoiceData.items || invoiceData.items.length === 0) {
          errors.push('At least one item is required');
        }
        
        if (invoiceData.items) {
          invoiceData.items.forEach((item: any, index: number) => {
            if (!item.productId) {
              errors.push(`Product is required for item ${index + 1}`);
            }
            if (!item.quantity || item.quantity <= 0) {
              errors.push(`Valid quantity is required for item ${index + 1}`);
            }
            if (!item.unitPrice || item.unitPrice <= 0) {
              errors.push(`Valid unit price is required for item ${index + 1}`);
            }
          });
        }
        
        return errors;
      };

      const validInvoice = {
        customerId: 1,
        items: [
          { productId: 1, quantity: 2, unitPrice: 100 },
          { productId: 2, quantity: 1, unitPrice: 50 }
        ]
      };

      const invalidInvoice = {
        customerId: null,
        items: []
      };

      const partiallyInvalidInvoice = {
        customerId: 1,
        items: [
          { productId: 1, quantity: 0, unitPrice: 100 },
          { productId: null, quantity: 1, unitPrice: -50 }
        ]
      };

      expect(validateInvoiceData(validInvoice)).toHaveLength(0);
      
      const invalidErrors = validateInvoiceData(invalidInvoice);
      expect(invalidErrors).toContain('Customer is required');
      expect(invalidErrors).toContain('At least one item is required');
      
      const partialErrors = validateInvoiceData(partiallyInvalidInvoice);
      expect(partialErrors).toContain('Valid quantity is required for item 1');
      expect(partialErrors).toContain('Product is required for item 2');
      expect(partialErrors).toContain('Valid unit price is required for item 2');
    });

    test('should calculate invoice totals correctly', () => {
      const calculateInvoiceTotals = (items: any[], taxRate: number = 0.1) => {
        const subtotal = items.reduce((sum, item) => {
          return sum + (item.quantity * item.unitPrice);
        }, 0);
        
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;
        
        return {
          subtotal: parseFloat(subtotal.toFixed(2)),
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2))
        };
      };

      const items = [
        { quantity: 2, unitPrice: 100 }, // 200
        { quantity: 1, unitPrice: 50 },  // 50
        { quantity: 3, unitPrice: 25 }   // 75
      ];

      const totals = calculateInvoiceTotals(items, 0.1);
      
      expect(totals.subtotal).toBe(325);
      expect(totals.taxAmount).toBe(32.5);
      expect(totals.total).toBe(357.5);
    });

    test('should handle discount calculations', () => {
      const calculateWithDiscount = (subtotal: number, discountType: 'percentage' | 'fixed', discountValue: number, taxRate: number = 0.1) => {
        let discountAmount = 0;
        
        if (discountType === 'percentage') {
          discountAmount = subtotal * (discountValue / 100);
        } else {
          discountAmount = discountValue;
        }
        
        const discountedSubtotal = subtotal - discountAmount;
        const taxAmount = discountedSubtotal * taxRate;
        const total = discountedSubtotal + taxAmount;
        
        return {
          subtotal,
          discountAmount: parseFloat(discountAmount.toFixed(2)),
          discountedSubtotal: parseFloat(discountedSubtotal.toFixed(2)),
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2))
        };
      };

      // Test percentage discount
      const percentageResult = calculateWithDiscount(1000, 'percentage', 10, 0.1);
      expect(percentageResult.discountAmount).toBe(100);
      expect(percentageResult.discountedSubtotal).toBe(900);
      expect(percentageResult.total).toBe(990);

      // Test fixed discount
      const fixedResult = calculateWithDiscount(1000, 'fixed', 150, 0.1);
      expect(fixedResult.discountAmount).toBe(150);
      expect(fixedResult.discountedSubtotal).toBe(850);
      expect(fixedResult.total).toBe(935);
    });
  });

  describe('Invoice Update Logic', () => {
    test('should validate invoice update permissions', () => {
      const checkUpdatePermissions = (invoice: any, currentUser: any) => {
        const errors: string[] = [];
        
        // Check if user has edit permission
        if (!currentUser.permissions.includes('sales:edit')) {
          errors.push('You do not have permission to edit invoices');
        }
        
        // Check if invoice is already paid
        if (invoice.status === 'paid') {
          errors.push('Cannot edit a paid invoice');
        }
        
        // Check if invoice is cancelled
        if (invoice.status === 'cancelled') {
          errors.push('Cannot edit a cancelled invoice');
        }
        
        return errors;
      };

      const user = {
        permissions: ['sales:edit']
      };

      const userWithoutPermission = {
        permissions: ['sales:view']
      };

      const draftInvoice = { status: 'draft' };
      const paidInvoice = { status: 'paid' };
      const cancelledInvoice = { status: 'cancelled' };

      expect(checkUpdatePermissions(draftInvoice, user)).toHaveLength(0);
      expect(checkUpdatePermissions(paidInvoice, user)).toContain('Cannot edit a paid invoice');
      expect(checkUpdatePermissions(cancelledInvoice, user)).toContain('Cannot edit a cancelled invoice');
      expect(checkUpdatePermissions(draftInvoice, userWithoutPermission)).toContain('You do not have permission to edit invoices');
    });

    test('should track invoice changes', () => {
      const trackInvoiceChanges = (originalInvoice: any, updatedInvoice: any) => {
        const changes: any[] = [];
        
        // Compare basic fields
        const fieldsToTrack = ['customerId', 'dueDate', 'notes', 'status'];
        fieldsToTrack.forEach(field => {
          if (originalInvoice[field] !== updatedInvoice[field]) {
            changes.push({
              field,
              oldValue: originalInvoice[field],
              newValue: updatedInvoice[field]
            });
          }
        });
        
        // Compare items
        if (JSON.stringify(originalInvoice.items) !== JSON.stringify(updatedInvoice.items)) {
          changes.push({
            field: 'items',
            oldValue: originalInvoice.items,
            newValue: updatedInvoice.items
          });
        }
        
        return changes;
      };

      const original = {
        customerId: 1,
        dueDate: '2024-01-15',
        notes: 'Original notes',
        status: 'draft',
        items: [{ productId: 1, quantity: 2, unitPrice: 100 }]
      };

      const updated = {
        customerId: 2,
        dueDate: '2024-01-20',
        notes: 'Updated notes',
        status: 'sent',
        items: [{ productId: 1, quantity: 3, unitPrice: 100 }]
      };

      const changes = trackInvoiceChanges(original, updated);
      
      expect(changes).toHaveLength(5);
      expect(changes.find(c => c.field === 'customerId')).toBeTruthy();
      expect(changes.find(c => c.field === 'dueDate')).toBeTruthy();
      expect(changes.find(c => c.field === 'items')).toBeTruthy();
    });
  });

  describe('Invoice Deletion Logic', () => {
    test('should validate invoice deletion permissions', () => {
      const checkDeletePermissions = (invoice: any, currentUser: any) => {
        const errors: string[] = [];
        
        // Check if user has delete permission
        if (!currentUser.permissions.includes('sales:delete')) {
          errors.push('You do not have permission to delete invoices');
        }
        
        // Check if invoice has payments
        if (invoice.payments && invoice.payments.length > 0) {
          errors.push('Cannot delete an invoice with payments');
        }
        
        // Check if invoice is sent to customer
        if (invoice.status === 'sent' || invoice.status === 'paid') {
          errors.push('Cannot delete an invoice that has been sent to customer');
        }
        
        return errors;
      };

      const user = {
        permissions: ['sales:delete']
      };

      const userWithoutPermission = {
        permissions: ['sales:view']
      };

      const draftInvoice = { status: 'draft', payments: [] };
      const sentInvoice = { status: 'sent', payments: [] };
      const invoiceWithPayments = { status: 'draft', payments: [{ id: 1, amount: 100 }] };

      expect(checkDeletePermissions(draftInvoice, user)).toHaveLength(0);
      expect(checkDeletePermissions(sentInvoice, user)).toContain('Cannot delete an invoice that has been sent to customer');
      expect(checkDeletePermissions(invoiceWithPayments, user)).toContain('Cannot delete an invoice with payments');
      expect(checkDeletePermissions(draftInvoice, userWithoutPermission)).toContain('You do not have permission to delete invoices');
    });

    test('should handle soft delete vs hard delete', () => {
      const deleteInvoice = (invoice: any, deleteType: 'soft' | 'hard') => {
        if (deleteType === 'soft') {
          return {
            ...invoice,
            status: 'deleted',
            deletedAt: new Date().toISOString()
          };
        } else {
          // Hard delete - return null to indicate removal
          return null;
        }
      };

      const invoice = {
        id: 1,
        status: 'draft',
        customerId: 1
      };

      const softDeleted = deleteInvoice(invoice, 'soft');
      const hardDeleted = deleteInvoice(invoice, 'hard');

      expect(softDeleted?.status).toBe('deleted');
      expect(softDeleted?.deletedAt).toBeTruthy();
      expect(hardDeleted).toBeNull();
    });
  });

  describe('Payment Processing Logic', () => {
    test('should validate payment data', () => {
      const validatePaymentData = (paymentData: any, invoice: any) => {
        const errors: string[] = [];
        
        if (!paymentData.amount || paymentData.amount <= 0) {
          errors.push('Payment amount must be greater than 0');
        }
        
        if (!paymentData.paymentMethod) {
          errors.push('Payment method is required');
        }
        
        if (!paymentData.paymentDate) {
          errors.push('Payment date is required');
        }
        
        // Check if payment amount exceeds remaining balance
        const totalPaid = invoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        const remainingBalance = invoice.total - totalPaid;
        
        if (paymentData.amount > remainingBalance) {
          errors.push(`Payment amount cannot exceed remaining balance of ${remainingBalance}`);
        }
        
        return errors;
      };

      const invoice = {
        total: 1000,
        payments: [{ amount: 300 }] // 700 remaining
      };

      const validPayment = {
        amount: 500,
        paymentMethod: 'cash',
        paymentDate: '2024-01-15'
      };

      const invalidPayment = {
        amount: 800, // Exceeds remaining balance
        paymentMethod: '',
        paymentDate: ''
      };

      expect(validatePaymentData(validPayment, invoice)).toHaveLength(0);
      
      const errors = validatePaymentData(invalidPayment, invoice);
      expect(errors).toContain('Payment method is required');
      expect(errors).toContain('Payment date is required');
      expect(errors).toContain('Payment amount cannot exceed remaining balance of 700');
    });

    test('should calculate payment status correctly', () => {
      const calculatePaymentStatus = (invoice: any) => {
        const totalPaid = invoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        const remainingBalance = invoice.total - totalPaid;
        
        if (remainingBalance <= 0) {
          return 'paid';
        } else if (totalPaid > 0) {
          return 'partial';
        } else {
          return 'unpaid';
        }
      };

      const unpaidInvoice = {
        total: 1000,
        payments: []
      };

      const partiallyPaidInvoice = {
        total: 1000,
        payments: [{ amount: 300 }, { amount: 200 }]
      };

      const fullyPaidInvoice = {
        total: 1000,
        payments: [{ amount: 600 }, { amount: 400 }]
      };

      const overpaidInvoice = {
        total: 1000,
        payments: [{ amount: 1200 }]
      };

      expect(calculatePaymentStatus(unpaidInvoice)).toBe('unpaid');
      expect(calculatePaymentStatus(partiallyPaidInvoice)).toBe('partial');
      expect(calculatePaymentStatus(fullyPaidInvoice)).toBe('paid');
      expect(calculatePaymentStatus(overpaidInvoice)).toBe('paid');
    });

    test('should handle multiple payment methods', () => {
      const processPayment = (paymentData: any) => {
        const supportedMethods = ['cash', 'card', 'bank_transfer', 'check', 'mobile_payment'];
        
        if (!supportedMethods.includes(paymentData.paymentMethod)) {
          throw new Error(`Unsupported payment method: ${paymentData.paymentMethod}`);
        }
        
        // Simulate different processing logic for different methods
        const processedPayment = {
          ...paymentData,
          id: Math.random().toString(36).substr(2, 9),
          processedAt: new Date().toISOString(),
          status: 'completed'
        };
        
        // Add method-specific fields
        switch (paymentData.paymentMethod) {
          case 'card':
            processedPayment.transactionId = 'TXN_' + Math.random().toString(36).substr(2, 9);
            break;
          case 'bank_transfer':
            processedPayment.referenceNumber = 'REF_' + Math.random().toString(36).substr(2, 9);
            break;
          case 'check':
            processedPayment.checkNumber = paymentData.checkNumber;
            break;
        }
        
        return processedPayment;
      };

      const cashPayment = {
        amount: 500,
        paymentMethod: 'cash',
        paymentDate: '2024-01-15'
      };

      const cardPayment = {
        amount: 300,
        paymentMethod: 'card',
        paymentDate: '2024-01-15'
      };

      const checkPayment = {
        amount: 200,
        paymentMethod: 'check',
        paymentDate: '2024-01-15',
        checkNumber: 'CHK001'
      };

      const invalidPayment = {
        amount: 100,
        paymentMethod: 'crypto',
        paymentDate: '2024-01-15'
      };

      const processedCash = processPayment(cashPayment);
      const processedCard = processPayment(cardPayment);
      const processedCheck = processPayment(checkPayment);

      expect(processedCash.status).toBe('completed');
      expect(processedCard.transactionId).toBeTruthy();
      expect(processedCheck.checkNumber).toBe('CHK001');
      
      expect(() => processPayment(invalidPayment)).toThrow('Unsupported payment method: crypto');
    });
  });

  describe('Invoice Status Workflow', () => {
    test('should handle invoice status transitions', () => {
      const validateStatusTransition = (currentStatus: string, newStatus: string) => {
        const validTransitions: Record<string, string[]> = {
          'draft': ['sent', 'cancelled'],
          'sent': ['paid', 'partial', 'overdue', 'cancelled'],
          'partial': ['paid', 'overdue', 'cancelled'],
          'overdue': ['paid', 'partial', 'cancelled'],
          'paid': [], // No transitions from paid
          'cancelled': [] // No transitions from cancelled
        };
        
        return validTransitions[currentStatus]?.includes(newStatus) || false;
      };

      expect(validateStatusTransition('draft', 'sent')).toBe(true);
      expect(validateStatusTransition('sent', 'paid')).toBe(true);
      expect(validateStatusTransition('paid', 'cancelled')).toBe(false);
      expect(validateStatusTransition('cancelled', 'sent')).toBe(false);
      expect(validateStatusTransition('partial', 'paid')).toBe(true);
    });

    test('should auto-update status based on payments', () => {
      const updateInvoiceStatus = (invoice: any) => {
        const totalPaid = invoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        const remainingBalance = invoice.total - totalPaid;
        
        if (remainingBalance <= 0) {
          return { ...invoice, status: 'paid' };
        } else if (totalPaid > 0) {
          return { ...invoice, status: 'partial' };
        } else if (invoice.status === 'sent' && new Date(invoice.dueDate) < new Date()) {
          return { ...invoice, status: 'overdue' };
        }
        
        return invoice;
      };

      const invoice = {
        id: 1,
        total: 1000,
        status: 'sent',
        dueDate: '2024-01-01', // Past due
        payments: []
      };

      const partialPaymentInvoice = {
        ...invoice,
        payments: [{ amount: 500 }]
      };

      const fullPaymentInvoice = {
        ...invoice,
        payments: [{ amount: 1000 }]
      };

      expect(updateInvoiceStatus(invoice).status).toBe('overdue');
      expect(updateInvoiceStatus(partialPaymentInvoice).status).toBe('partial');
      expect(updateInvoiceStatus(fullPaymentInvoice).status).toBe('paid');
    });
  });
});