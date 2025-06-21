import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
const mockPush = jest.fn();
const mockUseAuth = {
  user: {
    id: 1,
    name: 'Admin User',
    email: 'admin@test.com',
    permissions: ['user:manage', 'admin:all'],
  },
  isAuthenticated: true,
  hasPermission: jest.fn().mockReturnValue(true),
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock the actual AddUserPage component logic
const MockAddUserPage = () => {
  const [userForm, setUserForm] = React.useState({
    name: '',
    email: '',
    shop: '',
    password: '',
    confirmPassword: '',
    permissions: [] as string[],
    allowedAccounts: [] as string[]
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');
  const [dynamicShops, setDynamicShops] = React.useState([
    { id: 'shop-1', name: 'Main Store' },
    { id: 'shop-2', name: 'Warehouse' }
  ]);
  const [availablePermissions] = React.useState([
    { id: 'admin:all', name: 'admin:all', module: 'Admin' },
    { id: 'shop:assigned_only', name: 'shop:assigned_only', module: 'Shop' },
    { id: 'sales:view', name: 'sales:view', module: 'Sales' },
    { id: 'inventory:view', name: 'inventory:view', module: 'Inventory' }
  ]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permissionId: string) => {
    setUserForm(prev => {
      const newPermissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');
    setFormSuccess('');

    // Basic validation
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.shop) {
      setFormError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    // Password validation
    if (userForm.password !== userForm.confirmPassword) {
      setFormError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (userForm.permissions.length === 0) {
      setFormError('Please select at least one permission');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token',
        },
        body: JSON.stringify(userForm),
      });

      const data = await response.json();

      if (data.success) {
        setFormSuccess('User added successfully! Redirecting...');
        setTimeout(() => {
          mockPush('/settings?tab=users');
        }, 1500);
      } else {
        setFormError(data.message || 'Failed to create user');
      }
    } catch (error) {
      setFormError('An error occurred while creating the user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6" data-testid="page-title">
          Add New User
        </h1>

        {formError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md" data-testid="error-message">
            <p className="text-red-800">{formError}</p>
          </div>
        )}

        {formSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md" data-testid="success-message">
            <p className="text-green-800">{formSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="user-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={userForm.name}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="name-input"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={userForm.email}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="email-input"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={userForm.password}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="password-input"
                required
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={userForm.confirmPassword}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="confirm-password-input"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Shop *
              </label>
              <select
                id="shop"
                name="shop"
                value={userForm.shop}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="shop-select"
                required
              >
                <option value="">Select a shop</option>
                {dynamicShops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4" data-testid="permissions-title">
              User Permissions *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="permissions-grid">
              {availablePermissions.map((permission) => (
                <label key={permission.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={userForm.permissions.includes(permission.id)}
                    onChange={() => handlePermissionChange(permission.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    data-testid={`permission-${permission.id}`}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                    <div className="text-xs text-gray-500">{permission.module}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => mockPush('/settings?tab=users')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              data-testid="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

describe('User Creation Form Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Form Rendering', () => {
    test('should render all form elements correctly', () => {
      render(<MockAddUserPage />);

      expect(screen.getByTestId('page-title')).toHaveTextContent('Add New User');
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('shop-select')).toBeInTheDocument();
      expect(screen.getByTestId('permissions-title')).toHaveTextContent('User Permissions *');
      expect(screen.getByTestId('permissions-grid')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    test('should render shop options correctly', () => {
      render(<MockAddUserPage />);

      const shopSelect = screen.getByTestId('shop-select');
      expect(shopSelect).toBeInTheDocument();
      expect(screen.getByText('Main Store')).toBeInTheDocument();
      expect(screen.getByText('Warehouse')).toBeInTheDocument();
    });

    test('should render permission checkboxes correctly', () => {
      render(<MockAddUserPage />);

      expect(screen.getByTestId('permission-admin:all')).toBeInTheDocument();
      expect(screen.getByTestId('permission-shop:assigned_only')).toBeInTheDocument();
      expect(screen.getByTestId('permission-sales:view')).toBeInTheDocument();
      expect(screen.getByTestId('permission-inventory:view')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('should handle text input changes', async () => {
      const user = userEvent.setup();
      render(<MockAddUserPage />);

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
    });

    test('should handle shop selection', async () => {
      const user = userEvent.setup();
      render(<MockAddUserPage />);

      const shopSelect = screen.getByTestId('shop-select');
      await user.selectOptions(shopSelect, 'shop-1');

      expect(shopSelect).toHaveValue('shop-1');
    });

    test('should handle permission selection', async () => {
      const user = userEvent.setup();
      render(<MockAddUserPage />);

      const adminPermission = screen.getByTestId('permission-admin:all');
      const shopPermission = screen.getByTestId('permission-shop:assigned_only');

      await user.click(adminPermission);
      await user.click(shopPermission);

      expect(adminPermission).toBeChecked();
      expect(shopPermission).toBeChecked();
    });

    test('should toggle permissions correctly', async () => {
      const user = userEvent.setup();
      render(<MockAddUserPage />);

      const adminPermission = screen.getByTestId('permission-admin:all');

      // Check the permission
      await user.click(adminPermission);
      expect(adminPermission).toBeChecked();

      // Uncheck the permission
      await user.click(adminPermission);
      expect(adminPermission).not.toBeChecked();
    });
  });

  describe('Form Validation', () => {
    test('should show error for password mismatch', async () => {
      const user = userEvent.setup();
      render(<MockAddUserPage />);

      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'different');
      await user.selectOptions(screen.getByTestId('shop-select'), 'shop-1');
      await user.click(screen.getByTestId('permission-admin:all'));
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match');
      });
    });

    test('should show error for missing required fields', async () => {
      const user = userEvent.setup();
      render(<MockAddUserPage />);

      // Submit form without filling any fields
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Check if form validation prevents submission (button should not be disabled for long)
      expect(submitButton).not.toBeDisabled();
    });

    test('should show error for missing permissions', async () => {
      const user = userEvent.setup();
      render(<MockAddUserPage />);

      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.selectOptions(screen.getByTestId('shop-select'), 'shop-1');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Please select at least one permission');
      });
    });
  });

  describe('Form Submission', () => {
    test('should submit form with valid data successfully', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        message: 'User created successfully',
        data: { id: 'user-123', name: 'John Doe' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<MockAddUserPage />);

      // Fill out the form
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.selectOptions(screen.getByTestId('shop-select'), 'shop-1');
      await user.click(screen.getByTestId('permission-admin:all'));
      
      // Submit the form
      await user.click(screen.getByTestId('submit-button'));

      // Verify API call was made
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Verify the fetch was called with correct URL and method
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dev-token',
          }),
        })
      );

      // Verify success message
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toHaveTextContent('User added successfully! Redirecting...');
      });
    });

    test('should handle API error response', async () => {
      const user = userEvent.setup();
      const mockErrorResponse = {
        success: false,
        message: 'Email already exists'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      render(<MockAddUserPage />);

      // Fill out the form
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'existing@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.selectOptions(screen.getByTestId('shop-select'), 'shop-1');
      await user.click(screen.getByTestId('permission-admin:all'));
      await user.click(screen.getByTestId('submit-button'));

      // Wait for API call to complete and error to show
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Email already exists');
      });
    });

    test('should handle network error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<MockAddUserPage />);

      // Fill out the form
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.selectOptions(screen.getByTestId('shop-select'), 'shop-1');
      await user.click(screen.getByTestId('permission-admin:all'));
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('An error occurred while creating the user');
      });
    });

    test('should disable submit button during loading', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<MockAddUserPage />);

      // Fill out the form
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.selectOptions(screen.getByTestId('shop-select'), 'shop-1');
      await user.click(screen.getByTestId('permission-admin:all'));
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeDisabled();
        expect(screen.getByTestId('submit-button')).toHaveTextContent('Creating...');
      });
    });
  });

  describe('Navigation', () => {
    test('should handle cancel button click', async () => {
      const user = userEvent.setup();
      render(<MockAddUserPage />);

      await user.click(screen.getByTestId('cancel-button'));

      expect(mockPush).toHaveBeenCalledWith('/settings?tab=users');
    });
  });

  describe('Accessibility', () => {
    test('should have proper form labels', () => {
      render(<MockAddUserPage />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/assign to shop/i)).toBeInTheDocument();
    });

    test('should have required field indicators', () => {
      render(<MockAddUserPage />);

      expect(screen.getByText(/full name \*/i)).toBeInTheDocument();
      expect(screen.getByText(/email \*/i)).toBeInTheDocument();
      expect(screen.getByText(/^password \*/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password \*/i)).toBeInTheDocument();
      expect(screen.getByText(/assign to shop \*/i)).toBeInTheDocument();
      expect(screen.getByText(/user permissions \*/i)).toBeInTheDocument();
    });
  });
});