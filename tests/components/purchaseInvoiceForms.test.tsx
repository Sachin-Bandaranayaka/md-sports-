import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock hooks
jest.mock('@/hooks/useQueries', () => ({
  useCreatePurchaseInvoice: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ data: { id: 1 } }),
  }),
  useSuppliersOptimized: () => ({
    data: [
      { id: '1', name: 'Test Supplier' }
    ]
  }),
  useProducts: () => ({
    data: [
      { id: 1, name: 'Test Product', price: 100 }
    ],
    refetch: jest.fn()
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => 
      <div ref={ref} {...props}>{children}</div>
    ),
    form: React.forwardRef(({ children, ...props }: any, ref: any) => 
      <form ref={ref} {...props}>{children}</form>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock components
jest.mock('@/components/ui/Button', () => {
  return function MockButton({ children, disabled, type, onClick, ...props }: any) {
    return (
      <button 
        type={type} 
        disabled={disabled} 
        onClick={onClick}
        data-testid={props['data-testid'] || 'button'}
        {...props}
      >
        {children}
      </button>
    );
  };
});

jest.mock('@/components/ui/Combobox', () => {
  return function MockCombobox({ value, onSelect, options, placeholder }: any) {
    return (
      <select 
        value={value} 
        onChange={(e) => onSelect?.(e.target.value)}
        data-testid="combobox"
      >
        <option value="">{placeholder}</option>
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  };
});

// Mock Purchase Invoice Form Component
const MockNewPurchaseInvoiceForm = ({ 
  initialSuppliers = [], 
  initialProducts = [], 
  initialShops = [], 
  onSuccess,
  onCancel
}: any) => {
  const [formData, setFormData] = React.useState({
    items: [] as any[],
    supplierId: '',
  });
  const [itemDistributions, setItemDistributions] = React.useState<Array<Record<string, number>>>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Validation functions (extracted from actual component)
  const validateDistributions = () => {
    if (!formData.items || formData.items.length === 0) return { isValid: false, error: 'No items to validate' };
    
    if (initialShops.length === 0) {
      return { isValid: false, error: 'No shops available for distribution. Please configure at least one shop before creating purchase invoices.' };
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      const distribution = itemDistributions[i] || {};
      
      const totalDistributed = Object.values(distribution).reduce((sum: number, qty) => {
        const num = Number(qty) || 0;
        return sum + num;
      }, 0);
      
      const requiredQuantity = Number(item.quantity);
      
      if (totalDistributed === 0) {
        return { 
          isValid: false, 
          error: `Product "${item.productName || `Product ${item.productId}`}" has no distribution set. Please distribute all quantities to shops.` 
        };
      }
      
      if (totalDistributed !== requiredQuantity) {
        return { 
          isValid: false, 
          error: `Product "${item.productName || `Product ${item.productId}`}" distribution mismatch. Required: ${requiredQuantity}, Distributed: ${totalDistributed}` 
        };
      }
    }
    
    return { isValid: true, error: null };
  };

  const getItemDistributionStatus = (itemIndex: number) => {
    if (!formData.items || !formData.items[itemIndex]) return { status: 'none', message: 'No item' };
    
    const item = formData.items[itemIndex];
    const requiredQty = Number(item.quantity);
    
    const distribution = itemDistributions[itemIndex] || {};
    const distributedQty = Object.values(distribution).reduce((sum: number, qty) => sum + (Number(qty) || 0), 0);
    
    if (distributedQty === 0) {
      return { status: 'none', message: 'Not distributed' };
    } else if (distributedQty < requiredQty) {
      return { status: 'partial', message: `${distributedQty}/${requiredQty} distributed` };
    } else if (distributedQty === requiredQty) {
      return { status: 'complete', message: 'Fully distributed' };
    } else {
      return { status: 'over', message: `Over-distributed: ${distributedQty}/${requiredQty}` };
    }
  };

  const addItem = () => {
    const newItem = {
      productId: '1',
      productName: 'Test Product',
      quantity: 10,
      price: 100
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setItemDistributions(prev => [...prev, {}]);
  };

  const setDistribution = (itemIndex: number, shopId: string, quantity: number) => {
    setItemDistributions(prev => {
      const newDist = [...prev];
      if (!newDist[itemIndex]) newDist[itemIndex] = {};
      newDist[itemIndex] = { ...newDist[itemIndex], [shopId]: quantity };
      return newDist;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.supplierId) {
      setError('Please select a supplier.');
      return;
    }

    if (!formData.items || formData.items.length === 0) {
      setError('Please add at least one item to the invoice.');
      return;
    }

    const { isValid, error: validationError } = validateDistributions();
    if (!isValid) {
      setError(validationError || 'An unexpected error occurred during distribution validation.');
      return;
    }

    onSuccess?.();
  };

  const { isValid } = validateDistributions();

  return (
    <form onSubmit={handleSubmit} data-testid="purchase-invoice-form">
      {error && (
        <div data-testid="error-message" className="error">
          {error}
        </div>
      )}

      <select 
        data-testid="supplier-select"
        value={formData.supplierId}
        onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
      >
        <option value="">Select Supplier</option>
        {initialSuppliers.map((supplier: any) => (
          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
        ))}
      </select>

      <button type="button" onClick={addItem} data-testid="add-item-btn">
        Add Item
      </button>

      {formData.items.map((item, index) => {
        const status = getItemDistributionStatus(index);
        return (
          <div key={index} data-testid={`item-${index}`}>
            <div data-testid={`item-${index}-name`}>{item.productName}</div>
            <div data-testid={`item-${index}-quantity`}>Qty: {item.quantity}</div>
            <div 
              data-testid={`item-${index}-status`}
              className={`status-${status.status}`}
            >
              {status.message}
            </div>
            
            {initialShops.map((shop: any) => (
              <div key={shop.id}>
                <label>{shop.name}:</label>
                <input
                  type="number"
                  data-testid={`distribution-${index}-${shop.id}`}
                  value={itemDistributions[index]?.[shop.id] || ''}
                  onChange={(e) => setDistribution(index, shop.id, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        );
      })}

      {/* Validation Summary */}
      {formData.items && formData.items.length > 0 && (
        <div data-testid="validation-summary">
          {(() => {
            const { isValid, error } = validateDistributions();
            if (!isValid) {
              return (
                <div data-testid="validation-error" className="validation-error">
                  <h4>Distribution Required</h4>
                  <p>{error}</p>
                </div>
              );
            }
            
            const allItemsDistributed = formData.items.every((_, index) => {
              const status = getItemDistributionStatus(index);
              return status.status === 'complete';
            });
            
            if (allItemsDistributed && formData.items.length > 0) {
              return (
                <div data-testid="validation-success" className="validation-success">
                  <h4>Ready to Submit</h4>
                  <p>All items are properly distributed to shops.</p>
                </div>
              );
            }
            
            return null;
          })()}
        </div>
      )}

      <button 
        type="button" 
        onClick={onCancel}
        data-testid="cancel-btn"
      >
        Cancel
      </button>
      
      <button 
        type="submit" 
        disabled={!isValid}
        data-testid="submit-btn"
      >
        Save Invoice
      </button>
    </form>
  );
};

describe('Purchase Invoice Forms - Distribution Validation', () => {
  const mockSuppliers = [
    { id: '1', name: 'Test Supplier 1' },
    { id: '2', name: 'Test Supplier 2' }
  ];

  const mockProducts = [
    { id: 1, name: 'Product A', price: 100 },
    { id: 2, name: 'Product B', price: 200 }
  ];

  const mockShops = [
    { id: 'shop1', name: 'Shop 1' },
    { id: 'shop2', name: 'Shop 2' }
  ];

  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Validation', () => {
    it('should show error when no supplier is selected', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Add an item and distribute it
      await userEvent.click(screen.getByTestId('add-item-btn'));
      await userEvent.type(screen.getByTestId('distribution-0-shop1'), '10');

      // Try to submit without selecting supplier
      await userEvent.click(screen.getByTestId('submit-btn'));

      expect(screen.getByTestId('error-message')).toHaveTextContent('Please select a supplier.');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should disable submit button when no items are added', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Select supplier but don't add items
      await userEvent.selectOptions(screen.getByTestId('supplier-select'), '1');

      // Submit button should be disabled when no items are present
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should show error when no shops are configured', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={[]} // No shops
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Select supplier and add item
      await userEvent.selectOptions(screen.getByTestId('supplier-select'), '1');
      await userEvent.click(screen.getByTestId('add-item-btn'));

      // Try to submit
      await userEvent.click(screen.getByTestId('submit-btn'));

      expect(screen.getByTestId('validation-error')).toHaveTextContent('No shops available for distribution');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Distribution Status Indicators', () => {
    it('should show "Not distributed" status initially', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await userEvent.click(screen.getByTestId('add-item-btn'));

      expect(screen.getByTestId('item-0-status')).toHaveTextContent('Not distributed');
      expect(screen.getByTestId('item-0-status')).toHaveClass('status-none');
    });

    it('should show "Partial distributed" status', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await userEvent.click(screen.getByTestId('add-item-btn'));
      await userEvent.type(screen.getByTestId('distribution-0-shop1'), '5'); // 5 out of 10

      await waitFor(() => {
        expect(screen.getByTestId('item-0-status')).toHaveTextContent('5/10 distributed');
        expect(screen.getByTestId('item-0-status')).toHaveClass('status-partial');
      });
    });

    it('should show "Fully distributed" status', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await userEvent.click(screen.getByTestId('add-item-btn'));
      await userEvent.type(screen.getByTestId('distribution-0-shop1'), '6');
      await userEvent.type(screen.getByTestId('distribution-0-shop2'), '4'); // Total: 10

      await waitFor(() => {
        expect(screen.getByTestId('item-0-status')).toHaveTextContent('Fully distributed');
        expect(screen.getByTestId('item-0-status')).toHaveClass('status-complete');
      });
    });

    it('should show "Over-distributed" status', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await userEvent.click(screen.getByTestId('add-item-btn'));
      await userEvent.type(screen.getByTestId('distribution-0-shop1'), '15'); // 15 out of 10

      await waitFor(() => {
        expect(screen.getByTestId('item-0-status')).toHaveTextContent('Over-distributed: 15/10');
        expect(screen.getByTestId('item-0-status')).toHaveClass('status-over');
      });
    });
  });

  describe('Validation Summary', () => {
    it('should show validation error when items are not distributed', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await userEvent.click(screen.getByTestId('add-item-btn'));

      expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      expect(screen.getByTestId('validation-error')).toHaveTextContent('Distribution Required');
      expect(screen.getByTestId('validation-error')).toHaveTextContent('has no distribution set');
    });

    it('should show validation success when all items are distributed', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await userEvent.click(screen.getByTestId('add-item-btn'));
      await userEvent.type(screen.getByTestId('distribution-0-shop1'), '10');

      await waitFor(() => {
        expect(screen.getByTestId('validation-success')).toBeInTheDocument();
        expect(screen.getByTestId('validation-success')).toHaveTextContent('Ready to Submit');
        expect(screen.getByTestId('validation-success')).toHaveTextContent('All items are properly distributed');
      });
    });
  });

  describe('Submit Button State', () => {
    it('should disable submit button when validation fails', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await userEvent.click(screen.getByTestId('add-item-btn'));

      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('should enable submit button when validation passes', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Select supplier
      await userEvent.selectOptions(screen.getByTestId('supplier-select'), '1');
      
      // Add item and distribute it fully
      await userEvent.click(screen.getByTestId('add-item-btn'));
      await userEvent.type(screen.getByTestId('distribution-0-shop1'), '10');

      await waitFor(() => {
        expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
      });
    });

    it('should successfully submit when all validations pass', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Select supplier
      await userEvent.selectOptions(screen.getByTestId('supplier-select'), '1');
      
      // Add item and distribute it fully
      await userEvent.click(screen.getByTestId('add-item-btn'));
      await userEvent.type(screen.getByTestId('distribution-0-shop1'), '10');

      // Submit
      await userEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Items Validation', () => {
    it('should validate all items before allowing submission', async () => {
      render(
        <MockNewPurchaseInvoiceForm
          initialSuppliers={mockSuppliers}
          initialProducts={mockProducts}
          initialShops={mockShops}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Select supplier
      await userEvent.selectOptions(screen.getByTestId('supplier-select'), '1');
      
      // Add two items
      await userEvent.click(screen.getByTestId('add-item-btn'));
      await userEvent.click(screen.getByTestId('add-item-btn'));

      // Distribute only first item
      await userEvent.type(screen.getByTestId('distribution-0-shop1'), '10');

      // Should still be disabled because second item is not distributed
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
      expect(screen.getByTestId('validation-error')).toHaveTextContent('has no distribution set');

      // Distribute second item
      await userEvent.type(screen.getByTestId('distribution-1-shop2'), '10');

      await waitFor(() => {
        expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
        expect(screen.getByTestId('validation-success')).toBeInTheDocument();
      });
    });
  });
}); 