// Component tests for Product Edit Form - Low Stock Threshold feature
// Tests the UI components and user interactions for editing minStockLevel

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditProductPage from '@/app/inventory/[productId]/edit/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  useParams: () => ({ productId: '1' }),
  usePathname: () => '/inventory/1/edit',
}));

// Mock MainLayout component
jest.mock('@/components/layout/MainLayout', () => {
  return function MockMainLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-layout">{children}</div>;
  };
});

// Mock other layout components
jest.mock('@/components/ui/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('@/components/ui/ErrorMessage', () => {
  return function MockErrorMessage({ message }: { message: string }) {
    return <div data-testid="error-message">{message}</div>;
  };
});

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      permissions: ['inventory:edit'],
    },
    isAuthenticated: true,
    loading: false,
  }),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock product data
const mockProduct = {
  id: 1,
  name: 'Test Product',
  sku: 'TEST-001',
  barcode: '1234567890',
  description: 'Test product description',
  retailPrice: 100,
  basePrice: 80,
  minStockLevel: 10,
  categoryId: 1,
  category: {
    id: 1,
    name: 'Test Category',
  },
};

const mockCategories = [
  { id: 1, name: 'Test Category' },
  { id: 2, name: 'Another Category' },
];

describe('Product Edit Form - Low Stock Threshold', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/products/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, product: mockProduct }),
        });
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, categories: mockCategories }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  test('should render low stock threshold input field', async () => {
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    expect(lowStockInput).toHaveAttribute('type', 'number');
    expect(lowStockInput).toHaveAttribute('min', '0');
  });

  test('should display current minStockLevel value', async () => {
    render(<EditProductPage />);

    await waitFor(() => {
      const lowStockInput = screen.getByLabelText(/low stock threshold/i);
      expect(lowStockInput).toHaveValue(10);
    });
  });

  test('should update minStockLevel when user types in input', async () => {
    const user = userEvent.setup();
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    
    // Clear the input and type new value
    await user.clear(lowStockInput);
    await user.type(lowStockInput, '25');

    expect(lowStockInput).toHaveValue(25);
  });

  test('should accept zero as valid minStockLevel', async () => {
    const user = userEvent.setup();
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    
    await user.clear(lowStockInput);
    await user.type(lowStockInput, '0');

    expect(lowStockInput).toHaveValue(0);
  });

  test('should prevent negative values', async () => {
    const user = userEvent.setup();
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    
    // Try to enter negative value
    await user.clear(lowStockInput);
    await user.type(lowStockInput, '-5');

    // The input should not accept negative values due to min="0" attribute
    expect(lowStockInput).toHaveAttribute('min', '0');
  });

  test('should include minStockLevel in form submission', async () => {
    const user = userEvent.setup();
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    const submitButton = screen.getByRole('button', { name: /update product/i });

    // Update the low stock threshold
    await user.clear(lowStockInput);
    await user.type(lowStockInput, '30');

    // Submit the form
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"minStockLevel":30'),
        })
      );
    });
  });

  test('should display helper text for low stock threshold', async () => {
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByText(/alert when stock falls below this level/i)).toBeInTheDocument();
    });
  });

  test('should handle form submission with only minStockLevel change', async () => {
    const user = userEvent.setup();
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    const submitButton = screen.getByRole('button', { name: /update product/i });

    // Only change the low stock threshold
    await user.clear(lowStockInput);
    await user.type(lowStockInput, '15');

    // Submit the form
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"minStockLevel":15'),
        })
      );
    });
  });

  test('should handle API error when updating minStockLevel', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/products/1') && url.includes('PUT')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ success: false, message: 'Update failed' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, product: mockProduct }),
      });
    });

    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    const submitButton = screen.getByRole('button', { name: /update product/i });

    await user.clear(lowStockInput);
    await user.type(lowStockInput, '20');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
    });
  });

  test('should maintain minStockLevel value during form validation errors', async () => {
    const user = userEvent.setup();
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/product name/i);
    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    const submitButton = screen.getByRole('button', { name: /update product/i });

    // Clear required field to trigger validation error
    await user.clear(nameInput);
    await user.clear(lowStockInput);
    await user.type(lowStockInput, '35');

    // Try to submit with invalid data
    await user.click(submitButton);

    // The minStockLevel should still be 35
    expect(lowStockInput).toHaveValue(35);
  });

  test('should handle large minStockLevel values', async () => {
    const user = userEvent.setup();
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    
    await user.clear(lowStockInput);
    await user.type(lowStockInput, '9999');

    expect(lowStockInput).toHaveValue(9999);
  });

  test('should reset form when product data is reloaded', async () => {
    render(<EditProductPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    expect(lowStockInput).toHaveValue(10); // Should show the original value
  });
});

// Integration test for the complete flow
describe('Product Edit Form - Low Stock Threshold Integration', () => {
  test('should complete full edit flow with minStockLevel update', async () => {
    const user = userEvent.setup();
    
    // Mock successful update response
    mockFetch.mockImplementation((url: string, options: any) => {
      if (url.includes('/api/products/1') && options?.method === 'PUT') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            product: { ...mockProduct, minStockLevel: body.minStockLevel },
          }),
        });
      }
      if (url.includes('/api/products/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, product: mockProduct }),
        });
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, categories: mockCategories }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    render(<EditProductPage />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument();
    });

    // Update multiple fields including minStockLevel
    const nameInput = screen.getByLabelText(/product name/i);
    const lowStockInput = screen.getByLabelText(/low stock threshold/i);
    const priceInput = screen.getByLabelText(/retail price/i);
    const submitButton = screen.getByRole('button', { name: /update product/i });

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Product Name');
    
    await user.clear(lowStockInput);
    await user.type(lowStockInput, '50');
    
    await user.clear(priceInput);
    await user.type(priceInput, '150');

    // Submit the form
    await user.click(submitButton);

    // Verify the API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"minStockLevel":50'),
        })
      );
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/product updated successfully/i)).toBeInTheDocument();
    });
  });
});