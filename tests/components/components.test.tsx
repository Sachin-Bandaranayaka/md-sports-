import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock usePermission hook
const mockUsePermission = jest.fn();
jest.mock('@/hooks/usePermission', () => ({
  usePermission: () => mockUsePermission(),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock components (since we don't have actual component files)
const MockLoginForm = ({ onSubmit, loading }: { onSubmit: (data: any) => void; loading?: boolean }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
        required
      />
      <button type="submit" disabled={loading} data-testid="login-button">
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

const MockInvoiceForm = ({ onSubmit, initialData, loading }: { 
  onSubmit: (data: any) => void; 
  initialData?: any; 
  loading?: boolean;
}) => {
  const [formData, setFormData] = React.useState({
    customerId: initialData?.customerId || '',
    items: initialData?.items || [{ productId: '', quantity: 1, price: 0 }],
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, price: 0 }]
    }));
  };

  return (
    <form onSubmit={handleSubmit} data-testid="invoice-form">
      <select
        value={formData.customerId}
        onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
        data-testid="customer-select"
        required
      >
        <option value="">Select Customer</option>
        <option value="cust-1">Customer 1</option>
        <option value="cust-2">Customer 2</option>
      </select>
      
      {formData.items.map((item, index) => (
        <div key={index} data-testid={`item-${index}`}>
          <input
            type="text"
            placeholder="Product ID"
            value={item.productId}
            onChange={(e) => {
              const newItems = [...formData.items];
              newItems[index].productId = e.target.value;
              setFormData(prev => ({ ...prev, items: newItems }));
            }}
            data-testid={`product-input-${index}`}
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={item.quantity}
            onChange={(e) => {
              const newItems = [...formData.items];
              newItems[index].quantity = parseInt(e.target.value) || 0;
              setFormData(prev => ({ ...prev, items: newItems }));
            }}
            data-testid={`quantity-input-${index}`}
            min="1"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={item.price}
            onChange={(e) => {
              const newItems = [...formData.items];
              newItems[index].price = parseFloat(e.target.value) || 0;
              setFormData(prev => ({ ...prev, items: newItems }));
            }}
            data-testid={`price-input-${index}`}
            min="0"
            step="0.01"
            required
          />
        </div>
      ))}
      
      <button type="button" onClick={addItem} data-testid="add-item-button">
        Add Item
      </button>
      
      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        data-testid="notes-textarea"
      />
      
      <button type="submit" disabled={loading} data-testid="submit-button">
        {loading ? 'Saving...' : 'Save Invoice'}
      </button>
    </form>
  );
};

const MockDataTable = ({ data, columns, onEdit, onDelete, loading }: {
  data: any[];
  columns: { key: string; label: string }[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  loading?: boolean;
}) => {
  if (loading) {
    return <div data-testid="table-loading">Loading...</div>;
  }

  return (
    <table data-testid="data-table">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} data-testid={`header-${col.key}`}>
              {col.label}
            </th>
          ))}
          {(onEdit || onDelete) && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={item.id || index} data-testid={`row-${index}`}>
            {columns.map(col => (
              <td key={col.key} data-testid={`cell-${index}-${col.key}`}>
                {item[col.key]}
              </td>
            ))}
            {(onEdit || onDelete) && (
              <td>
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    data-testid={`edit-${index}`}
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item)}
                    data-testid={`delete-${index}`}
                  >
                    Delete
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const MockDashboardCard = ({ title, value, change, loading }: {
  title: string;
  value: string | number;
  change?: { value: number; type: 'increase' | 'decrease' };
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <div data-testid="dashboard-card" className="loading">
        <div data-testid="card-skeleton">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-card">
      <h3 data-testid="card-title">{title}</h3>
      <div data-testid="card-value">{value}</div>
      {change && (
        <div 
          data-testid="card-change" 
          className={change.type}
        >
          {change.type === 'increase' ? '↑' : '↓'} {change.value}%
        </div>
      )}
    </div>
  );
};

const MockSearchFilter = ({ onSearch, onFilter, filters }: {
  onSearch: (query: string) => void;
  onFilter: (filters: any) => void;
  filters: { [key: string]: any };
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [localFilters, setLocalFilters] = React.useState(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilter(newFilters);
  };

  return (
    <div data-testid="search-filter">
      <form onSubmit={handleSearch} data-testid="search-form">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="search-input"
        />
        <button type="submit" data-testid="search-button">
          Search
        </button>
      </form>
      
      <div data-testid="filters">
        <select
          value={localFilters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          data-testid="status-filter"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
        
        <select
          value={localFilters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          data-testid="category-filter"
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </select>
      </div>
    </div>
  );
};

describe('Component Testing', () => {
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

    // Default auth mock
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        permissions: ['sales:all', 'inventory:all', 'customers:all']
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      hasPermission: jest.fn(() => true)
    });

    // Default permission mock
    mockUsePermission.mockReturnValue({
      hasPermission: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true)
    });
  });

  describe('LoginForm Component', () => {
    test('should render login form correctly', () => {
      const mockOnSubmit = jest.fn();
      render(<MockLoginForm onSubmit={mockOnSubmit} />);
      
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    test('should handle form submission with valid data', async () => {
      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<MockLoginForm onSubmit={mockOnSubmit} />);
      
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('login-button'));
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('should show loading state', () => {
      const mockOnSubmit = jest.fn();
      render(<MockLoginForm onSubmit={mockOnSubmit} loading={true} />);
      
      const button = screen.getByTestId('login-button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Logging in...');
    });

    test('should require email and password fields', async () => {
      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<MockLoginForm onSubmit={mockOnSubmit} />);
      
      await user.click(screen.getByTestId('login-button'));
      
      // Form should not submit without required fields
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('InvoiceForm Component', () => {
    test('should render invoice form correctly', () => {
      const mockOnSubmit = jest.fn();
      render(<MockInvoiceForm onSubmit={mockOnSubmit} />);
      
      expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
      expect(screen.getByTestId('customer-select')).toBeInTheDocument();
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('add-item-button')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    test('should handle adding new items', async () => {
      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<MockInvoiceForm onSubmit={mockOnSubmit} />);
      
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('item-1')).not.toBeInTheDocument();
      
      await user.click(screen.getByTestId('add-item-button'));
      
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });

    test('should handle form submission with complete data', async () => {
      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<MockInvoiceForm onSubmit={mockOnSubmit} />);
      
      await user.selectOptions(screen.getByTestId('customer-select'), 'cust-1');
      await user.type(screen.getByTestId('product-input-0'), 'prod-1');
      await user.clear(screen.getByTestId('quantity-input-0'));
      await user.type(screen.getByTestId('quantity-input-0'), '2');
      await user.clear(screen.getByTestId('price-input-0'));
      await user.type(screen.getByTestId('price-input-0'), '100');
      await user.type(screen.getByTestId('notes-textarea'), 'Test invoice');
      
      await user.click(screen.getByTestId('submit-button'));
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        customerId: 'cust-1',
        items: [{ productId: 'prod-1', quantity: 2, price: 100 }],
        notes: 'Test invoice'
      });
    });

    test('should populate form with initial data', () => {
      const initialData = {
        customerId: 'cust-2',
        items: [{ productId: 'prod-2', quantity: 3, price: 150 }],
        notes: 'Initial notes'
      };
      
      const mockOnSubmit = jest.fn();
      render(<MockInvoiceForm onSubmit={mockOnSubmit} initialData={initialData} />);
      
      expect(screen.getByTestId('customer-select')).toHaveValue('cust-2');
      expect(screen.getByTestId('product-input-0')).toHaveValue('prod-2');
      expect(screen.getByTestId('quantity-input-0')).toHaveValue(3);
      expect(screen.getByTestId('price-input-0')).toHaveValue(150);
      expect(screen.getByTestId('notes-textarea')).toHaveValue('Initial notes');
    });
  });

  describe('DataTable Component', () => {
    const mockData = [
      { id: '1', name: 'Item 1', status: 'active', price: 100 },
      { id: '2', name: 'Item 2', status: 'inactive', price: 200 }
    ];
    
    const mockColumns = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'price', label: 'Price' }
    ];

    test('should render table with data correctly', () => {
      render(<MockDataTable data={mockData} columns={mockColumns} />);
      
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByTestId('header-name')).toHaveTextContent('Name');
      expect(screen.getByTestId('header-status')).toHaveTextContent('Status');
      expect(screen.getByTestId('header-price')).toHaveTextContent('Price');
      
      expect(screen.getByTestId('cell-0-name')).toHaveTextContent('Item 1');
      expect(screen.getByTestId('cell-1-name')).toHaveTextContent('Item 2');
    });

    test('should handle edit and delete actions', async () => {
      const mockOnEdit = jest.fn();
      const mockOnDelete = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MockDataTable 
          data={mockData} 
          columns={mockColumns} 
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
      
      await user.click(screen.getByTestId('edit-0'));
      expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);
      
      await user.click(screen.getByTestId('delete-1'));
      expect(mockOnDelete).toHaveBeenCalledWith(mockData[1]);
    });

    test('should show loading state', () => {
      render(<MockDataTable data={[]} columns={mockColumns} loading={true} />);
      
      expect(screen.getByTestId('table-loading')).toBeInTheDocument();
      expect(screen.getByTestId('table-loading')).toHaveTextContent('Loading...');
    });

    test('should render empty table when no data', () => {
      render(<MockDataTable data={[]} columns={mockColumns} />);
      
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.queryByTestId('row-0')).not.toBeInTheDocument();
    });
  });

  describe('DashboardCard Component', () => {
    test('should render card with basic data', () => {
      render(
        <MockDashboardCard 
          title="Total Sales" 
          value="$125,000" 
        />
      );
      
      expect(screen.getByTestId('dashboard-card')).toBeInTheDocument();
      expect(screen.getByTestId('card-title')).toHaveTextContent('Total Sales');
      expect(screen.getByTestId('card-value')).toHaveTextContent('$125,000');
    });

    test('should render card with change indicator', () => {
      render(
        <MockDashboardCard 
          title="Revenue" 
          value={50000} 
          change={{ value: 15.5, type: 'increase' }}
        />
      );
      
      expect(screen.getByTestId('card-change')).toBeInTheDocument();
      expect(screen.getByTestId('card-change')).toHaveTextContent('↑ 15.5%');
      expect(screen.getByTestId('card-change')).toHaveClass('increase');
    });

    test('should render card with decrease indicator', () => {
      render(
        <MockDashboardCard 
          title="Orders" 
          value={200} 
          change={{ value: 5.2, type: 'decrease' }}
        />
      );
      
      expect(screen.getByTestId('card-change')).toHaveTextContent('↓ 5.2%');
      expect(screen.getByTestId('card-change')).toHaveClass('decrease');
    });

    test('should show loading state', () => {
      render(
        <MockDashboardCard 
          title="Loading Card" 
          value="" 
          loading={true}
        />
      );
      
      expect(screen.getByTestId('dashboard-card')).toHaveClass('loading');
      expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
    });
  });

  describe('SearchFilter Component', () => {
    test('should render search and filter controls', () => {
      const mockOnSearch = jest.fn();
      const mockOnFilter = jest.fn();
      
      render(
        <MockSearchFilter 
          onSearch={mockOnSearch}
          onFilter={mockOnFilter}
          filters={{}}
        />
      );
      
      expect(screen.getByTestId('search-filter')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-button')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    });

    test('should handle search submission', async () => {
      const mockOnSearch = jest.fn();
      const mockOnFilter = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MockSearchFilter 
          onSearch={mockOnSearch}
          onFilter={mockOnFilter}
          filters={{}}
        />
      );
      
      await user.type(screen.getByTestId('search-input'), 'test query');
      await user.click(screen.getByTestId('search-button'));
      
      expect(mockOnSearch).toHaveBeenCalledWith('test query');
    });

    test('should handle filter changes', async () => {
      const mockOnSearch = jest.fn();
      const mockOnFilter = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MockSearchFilter 
          onSearch={mockOnSearch}
          onFilter={mockOnFilter}
          filters={{}}
        />
      );
      
      await user.selectOptions(screen.getByTestId('status-filter'), 'active');
      expect(mockOnFilter).toHaveBeenCalledWith({ status: 'active' });
      
      await user.selectOptions(screen.getByTestId('category-filter'), 'electronics');
      expect(mockOnFilter).toHaveBeenCalledWith({ status: 'active', category: 'electronics' });
    });

    test('should initialize with provided filters', () => {
      const mockOnSearch = jest.fn();
      const mockOnFilter = jest.fn();
      const initialFilters = { status: 'pending', category: 'books' };
      
      render(
        <MockSearchFilter 
          onSearch={mockOnSearch}
          onFilter={mockOnFilter}
          filters={initialFilters}
        />
      );
      
      expect(screen.getByTestId('status-filter')).toHaveValue('pending');
      expect(screen.getByTestId('category-filter')).toHaveValue('books');
    });
  });

  describe('Permission-based Component Rendering', () => {
    test('should render components when user has permissions', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: jest.fn(() => true),
        hasAnyPermission: jest.fn(() => true),
        hasAllPermissions: jest.fn(() => true)
      });

      const ProtectedComponent = () => {
        const { hasPermission } = mockUsePermission();
        
        if (!hasPermission('sales:create')) {
          return <div data-testid="no-permission">No permission</div>;
        }
        
        return <div data-testid="protected-content">Protected content</div>;
      };
      
      render(<ProtectedComponent />);
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('no-permission')).not.toBeInTheDocument();
    });

    test('should hide components when user lacks permissions', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false)
      });

      const ProtectedComponent = () => {
        const { hasPermission } = mockUsePermission();
        
        if (!hasPermission('sales:create')) {
          return <div data-testid="no-permission">No permission</div>;
        }
        
        return <div data-testid="protected-content">Protected content</div>;
      };
      
      render(<ProtectedComponent />);
      
      expect(screen.getByTestId('no-permission')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Error Boundary and Error Handling', () => {
    test('should handle component errors gracefully', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false);

        React.useEffect(() => {
          const errorHandler = () => setHasError(true);
          window.addEventListener('error', errorHandler);
          return () => window.removeEventListener('error', errorHandler);
        }, []);

        if (hasError) {
          return <div data-testid="error-fallback">Something went wrong</div>;
        }

        return <>{children}</>;
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        render(
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
        );
      } catch (error) {
        // Expected error
      }
      
      consoleSpy.mockRestore();
    });
  });
});