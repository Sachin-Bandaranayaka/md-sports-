import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BulkImportPage from '@/app/inventory/bulk-import/page';

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

// Mock MainLayout
jest.mock('@/components/layout/MainLayout', () => {
  return function MockMainLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-layout">{children}</div>;
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('BulkImportPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful shop names fetch
    mockFetch.mockImplementation((url) => {
      if (url === '/api/shops/names') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            shopNames: ['MBA', 'Zimantra'],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  it('should render the bulk import page correctly', async () => {
    render(<BulkImportPage />);

    expect(screen.getByText('Bulk Import Products')).toBeInTheDocument();
    expect(screen.getByText('Upload an Excel file to import multiple products at once')).toBeInTheDocument();
    expect(screen.getByText('Download Template')).toBeInTheDocument();
    expect(screen.getByText('Drop your Excel file here, or click to browse')).toBeInTheDocument();
    
    // Wait for shop names to load
    await waitFor(() => {
      expect(screen.getByText('Available Shop Names:')).toBeInTheDocument();
      expect(screen.getByText('MBA, Zimantra')).toBeInTheDocument();
    });
  });

  it('should handle template download', async () => {
    // Mock window.open
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    });

    render(<BulkImportPage />);

    const downloadButton = screen.getByText('Download Template');
    fireEvent.click(downloadButton);

    expect(mockOpen).toHaveBeenCalledWith('/api/products/template', '_blank');
  });

  it('should handle file selection via input', async () => {
    const user = userEvent.setup();
    render(<BulkImportPage />);

    const file = new File(['test content'], 'products.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const browseButton = screen.getByText('Browse Files');
    fireEvent.click(browseButton);

    // Get the file input directly instead of looking for buttons
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('products.xlsx')).toBeInTheDocument();
        expect(screen.getByText('Upload & Import')).toBeInTheDocument();
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });
    }
  });

  it('should handle drag and drop file selection', async () => {
    render(<BulkImportPage />);

    const file = new File(['test content'], 'products.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dropZone = screen.getByText('Drop your Excel file here, or click to browse').closest('div');
    
    if (dropZone) {
      // Simulate drag enter
      fireEvent.dragEnter(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      // Simulate drop
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('products.xlsx')).toBeInTheDocument();
      });
    }
  });

  it('should handle file upload successfully', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/shops/names') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            shopNames: ['MBA', 'Zimantra'],
          }),
        });
      }
      if (url === '/api/products/bulk-import') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: '5 out of 5 products imported successfully!',
            details: [
              { row: 2, success: true, productName: 'Product 1', message: 'Product imported successfully.' },
              { row: 3, success: true, productName: 'Product 2', message: 'Product imported successfully.' },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<BulkImportPage />);

    const file = new File(['test content'], 'products.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Add file
    const dropZone = screen.getByText('Drop your Excel file here, or click to browse').closest('div');
    if (dropZone) {
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Upload & Import')).toBeInTheDocument();
    });

    // Click upload button
    const uploadButton = screen.getByText('Upload & Import');
    fireEvent.click(uploadButton);

    // Wait for upload to complete
    await waitFor(() => {
      expect(screen.getByText('Import Results')).toBeInTheDocument();
      expect(screen.getByText('5 out of 5 products imported successfully!')).toBeInTheDocument();
      expect(screen.getByText('Detailed Results:')).toBeInTheDocument();
    });
  });

  it('should handle upload errors', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/shops/names') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            shopNames: ['MBA', 'Zimantra'],
          }),
        });
      }
      if (url === '/api/products/bulk-import') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            success: false,
            message: '0 out of 3 products imported successfully. Please check the details for errors.',
            details: [
              { row: 2, success: false, productName: 'Invalid Product', message: 'Product Name is required.' },
              { row: 3, success: false, productName: 'Another Invalid', message: 'Shop Name is required when Initial Quantity is greater than 0.' },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<BulkImportPage />);

    const file = new File(['test content'], 'products.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Add file and upload
    const dropZone = screen.getByText('Drop your Excel file here, or click to browse').closest('div');
    if (dropZone) {
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    }

    await waitFor(() => {
      const uploadButton = screen.getByText('Upload & Import');
      fireEvent.click(uploadButton);
    });

    // Wait for error results
    await waitFor(() => {
      expect(screen.getByText('Import Results')).toBeInTheDocument();
      expect(screen.getByText('0 out of 3 products imported successfully. Please check the details for errors.')).toBeInTheDocument();
      expect(screen.getByText('Product Name is required.')).toBeInTheDocument();
      expect(screen.getByText('Shop Name is required when Initial Quantity is greater than 0.')).toBeInTheDocument();
    });
  });

  it('should handle network errors during upload', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/shops/names') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            shopNames: ['MBA', 'Zimantra'],
          }),
        });
      }
      if (url === '/api/products/bulk-import') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<BulkImportPage />);

    const file = new File(['test content'], 'products.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Add file and upload
    const dropZone = screen.getByText('Drop your Excel file here, or click to browse').closest('div');
    if (dropZone) {
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    }

    await waitFor(() => {
      const uploadButton = screen.getByText('Upload & Import');
      fireEvent.click(uploadButton);
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Upload failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('should clear file when clear button is clicked', async () => {
    render(<BulkImportPage />);

    const file = new File(['test content'], 'products.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Add file
    const dropZone = screen.getByText('Drop your Excel file here, or click to browse').closest('div');
    if (dropZone) {
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('products.xlsx')).toBeInTheDocument();
    });

    // Click clear button
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Drop your Excel file here, or click to browse')).toBeInTheDocument();
      expect(screen.queryByText('products.xlsx')).not.toBeInTheDocument();
    });
  });

  it('should display loading state during upload', async () => {
    let resolveUpload: (value: any) => void;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });

    mockFetch.mockImplementation((url) => {
      if (url === '/api/shops/names') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            shopNames: ['MBA', 'Zimantra'],
          }),
        });
      }
      if (url === '/api/products/bulk-import') {
        return uploadPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: 'Upload successful',
            details: [],
          }),
        }));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<BulkImportPage />);

    const file = new File(['test content'], 'products.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Add file
    const dropZone = screen.getByText('Drop your Excel file here, or click to browse').closest('div');
    if (dropZone) {
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    }

    await waitFor(() => {
      const uploadButton = screen.getByText('Upload & Import');
      fireEvent.click(uploadButton);
    });

    // Check loading state
    expect(screen.getByText('Uploading...')).toBeInTheDocument();

    // Resolve upload
    resolveUpload!({});

    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });
  });

  it('should handle shop names fetch failure', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/shops/names') {
        return Promise.reject(new Error('Failed to fetch shops'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<BulkImportPage />);

    // Shop names section should not appear if fetch fails
    await waitFor(() => {
      expect(screen.queryByText('Available Shop Names:')).not.toBeInTheDocument();
    });
  });

  it('should show drag active state', async () => {
    render(<BulkImportPage />);

    const dropZone = screen.getByText('Drop your Excel file here, or click to browse').closest('div');
    
    if (dropZone) {
      // Check initial state
      expect(dropZone).toHaveClass('border-gray-300');
      
      // Simulate drag enter
      fireEvent.dragEnter(dropZone, {
        dataTransfer: {
          files: [new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })],
        },
      });
      
      // Wait for state update and check for drag active styling
      await waitFor(() => {
        expect(dropZone).toHaveClass('border-blue-400');
        expect(dropZone).toHaveClass('bg-blue-50');
      });
    }
  });
}); 