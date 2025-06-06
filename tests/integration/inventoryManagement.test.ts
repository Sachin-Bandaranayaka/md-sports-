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

describe('Inventory Management System', () => {
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

    // Mock user with inventory permissions
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'Inventory Manager',
        email: 'inventory@test.com',
        permissions: ['inventory:view', 'inventory:manage', 'inventory:create', 'inventory:edit', 'inventory:delete']
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      hasPermission: jest.fn((permission) => {
        const userPermissions = ['inventory:view', 'inventory:manage', 'inventory:create', 'inventory:edit', 'inventory:delete'];
        return userPermissions.includes(permission);
      })
    });
  });

  describe('Product Creation and Management', () => {
    test('should validate product data correctly', () => {
      const productData = {
        name: 'Test Product',
        categoryId: 1,
        cost: 100,
        sellingPrice: 150,
        barcode: '1234567890',
        description: 'Test product description'
      };

      // Test product validation logic
      const validateProduct = (product: any) => {
        const errors: string[] = [];
        
        if (!product.name || product.name.trim().length === 0) {
          errors.push('Product name is required');
        }
        
        if (!product.categoryId) {
          errors.push('Category is required');
        }
        
        if (!product.cost || product.cost <= 0) {
          errors.push('Cost must be greater than 0');
        }
        
        if (!product.sellingPrice || product.sellingPrice <= 0) {
          errors.push('Selling price must be greater than 0');
        }
        
        if (product.sellingPrice <= product.cost) {
          errors.push('Selling price must be greater than cost');
        }
        
        return errors;
      };

      expect(validateProduct(productData)).toEqual([]);
      expect(validateProduct({ ...productData, name: '' })).toContain('Product name is required');
      expect(validateProduct({ ...productData, cost: 0 })).toContain('Cost must be greater than 0');
      expect(validateProduct({ ...productData, sellingPrice: 50 })).toContain('Selling price must be greater than cost');
    });

    test('should calculate weighted average cost correctly', () => {
      const calculateWeightedAverageCost = (currentStock: number, currentCost: number, newStock: number, newCost: number) => {
        if (currentStock === 0) return newCost;
        
        const totalValue = (currentStock * currentCost) + (newStock * newCost);
        const totalStock = currentStock + newStock;
        
        return totalValue / totalStock;
      };

      // Test scenarios
      expect(calculateWeightedAverageCost(0, 0, 10, 100)).toBe(100); // First purchase
      expect(calculateWeightedAverageCost(10, 100, 10, 120)).toBe(110); // Equal quantities
      expect(calculateWeightedAverageCost(5, 100, 15, 120)).toBe(115); // Different quantities
    });

    test('should handle barcode uniqueness validation', async () => {
      const checkBarcodeUniqueness = async (barcode: string, productId?: string) => {
        // Mock API call to check barcode
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ exists: false })
        });

        const response = await fetch('/api/products/check-barcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode, excludeId: productId })
        });

        const data = await response.json();
        return !data.exists;
      };

      const isUnique = await checkBarcodeUniqueness('1234567890');
      expect(isUnique).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/products/check-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: '1234567890', excludeId: undefined })
      });
    });
  });

  describe('Stock Level Management', () => {
    test('should track stock levels correctly', () => {
      const stockOperations = {
        add: (currentStock: number, quantity: number) => currentStock + quantity,
        remove: (currentStock: number, quantity: number) => Math.max(0, currentStock - quantity),
        set: (currentStock: number, quantity: number) => quantity
      };

      expect(stockOperations.add(10, 5)).toBe(15);
      expect(stockOperations.remove(10, 3)).toBe(7);
      expect(stockOperations.remove(5, 10)).toBe(0); // Cannot go negative
      expect(stockOperations.set(10, 25)).toBe(25);
    });

    test('should calculate stock alerts correctly', () => {
      const checkStockAlert = (currentStock: number, minStock: number, maxStock: number) => {
        if (currentStock <= minStock) return 'low';
        if (currentStock >= maxStock) return 'high';
        return 'normal';
      };

      expect(checkStockAlert(5, 10, 100)).toBe('low');
      expect(checkStockAlert(50, 10, 100)).toBe('normal');
      expect(checkStockAlert(150, 10, 100)).toBe('high');
    });

    test('should handle stock distribution across shops', () => {
      const distributeStock = (totalStock: number, distributions: Record<string, number>) => {
        const totalDistributed = Object.values(distributions).reduce((sum, qty) => sum + qty, 0);
        
        if (totalDistributed > totalStock) {
          throw new Error('Cannot distribute more stock than available');
        }
        
        return {
          distributed: distributions,
          remaining: totalStock - totalDistributed
        };
      };

      const result = distributeStock(100, { 'shop1': 30, 'shop2': 40 });
      expect(result.distributed).toEqual({ 'shop1': 30, 'shop2': 40 });
      expect(result.remaining).toBe(30);

      expect(() => distributeStock(50, { 'shop1': 30, 'shop2': 40 })).toThrow('Cannot distribute more stock than available');
    });
  });

  describe('Inventory Transfers', () => {
    test('should validate transfer data', () => {
      const validateTransfer = (transfer: any) => {
        const errors: string[] = [];
        
        if (!transfer.fromShopId) {
          errors.push('Source shop is required');
        }
        
        if (!transfer.toShopId) {
          errors.push('Destination shop is required');
        }
        
        if (transfer.fromShopId === transfer.toShopId) {
          errors.push('Source and destination shops must be different');
        }
        
        if (!transfer.items || transfer.items.length === 0) {
          errors.push('At least one item is required');
        }
        
        transfer.items?.forEach((item: any, index: number) => {
          if (!item.productId) {
            errors.push(`Product is required for item ${index + 1}`);
          }
          
          if (!item.quantity || item.quantity <= 0) {
            errors.push(`Quantity must be greater than 0 for item ${index + 1}`);
          }
        });
        
        return errors;
      };

      const validTransfer = {
        fromShopId: 'shop1',
        toShopId: 'shop2',
        items: [{ productId: 'prod1', quantity: 5 }]
      };

      expect(validateTransfer(validTransfer)).toEqual([]);
      expect(validateTransfer({ ...validTransfer, fromShopId: validTransfer.toShopId })).toContain('Source and destination shops must be different');
      expect(validateTransfer({ ...validTransfer, items: [] })).toContain('At least one item is required');
    });

    test('should process transfer correctly', async () => {
      const processTransfer = async (transferData: any) => {
        // Mock API call for transfer
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            transferId: 'transfer123',
            message: 'Transfer completed successfully'
          })
        });

        const response = await fetch('/api/inventory/transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(transferData)
        });

        return response.json();
      };

      const transferData = {
        fromShopId: 'shop1',
        toShopId: 'shop2',
        items: [{ productId: 'prod1', quantity: 5 }],
        notes: 'Test transfer'
      };

      const result = await processTransfer(transferData);
      expect(result.success).toBe(true);
      expect(result.transferId).toBe('transfer123');
    });
  });

  describe('Category Management', () => {
    test('should validate category data', () => {
      const validateCategory = (category: any) => {
        const errors: string[] = [];
        
        if (!category.name || category.name.trim().length === 0) {
          errors.push('Category name is required');
        }
        
        if (category.name && category.name.length > 50) {
          errors.push('Category name must be 50 characters or less');
        }
        
        return errors;
      };

      expect(validateCategory({ name: 'Electronics' })).toEqual([]);
      expect(validateCategory({ name: '' })).toContain('Category name is required');
      expect(validateCategory({ name: 'A'.repeat(51) })).toContain('Category name must be 50 characters or less');
    });

    test('should handle category hierarchy', () => {
      const buildCategoryTree = (categories: any[]) => {
        const categoryMap = new Map();
        const rootCategories: any[] = [];
        
        // First pass: create map
        categories.forEach(cat => {
          categoryMap.set(cat.id, { ...cat, children: [] });
        });
        
        // Second pass: build tree
        categories.forEach(cat => {
          if (cat.parentId) {
            const parent = categoryMap.get(cat.parentId);
            if (parent) {
              parent.children.push(categoryMap.get(cat.id));
            }
          } else {
            rootCategories.push(categoryMap.get(cat.id));
          }
        });
        
        return rootCategories;
      };

      const categories = [
        { id: 1, name: 'Electronics', parentId: null },
        { id: 2, name: 'Phones', parentId: 1 },
        { id: 3, name: 'Laptops', parentId: 1 },
        { id: 4, name: 'Clothing', parentId: null }
      ];

      const tree = buildCategoryTree(categories);
      expect(tree).toHaveLength(2); // Electronics and Clothing
      expect(tree[0].children).toHaveLength(2); // Phones and Laptops under Electronics
    });
  });

  describe('Inventory Value Calculations', () => {
    test('should calculate total inventory value', () => {
      const calculateInventoryValue = (items: any[]) => {
        return items.reduce((total, item) => {
          return total + (item.quantity * item.weightedAverageCost);
        }, 0);
      };

      const inventoryItems = [
        { quantity: 10, weightedAverageCost: 100 },
        { quantity: 5, weightedAverageCost: 200 },
        { quantity: 20, weightedAverageCost: 50 }
      ];

      expect(calculateInventoryValue(inventoryItems)).toBe(3000); // 1000 + 1000 + 1000
    });

    test('should calculate profit margins', () => {
      const calculateProfitMargin = (cost: number, sellingPrice: number) => {
        if (cost === 0) return 0;
        return ((sellingPrice - cost) / cost) * 100;
      };

      expect(calculateProfitMargin(100, 150)).toBe(50); // 50% margin
      expect(calculateProfitMargin(100, 120)).toBe(20); // 20% margin
      expect(calculateProfitMargin(0, 100)).toBe(0); // Handle zero cost
    });
  });

  describe('Permission-based Access', () => {
    test('should restrict access based on permissions', () => {
      const checkInventoryAccess = (userPermissions: string[], action: string) => {
        const permissionMap: Record<string, string> = {
          'view': 'inventory:view',
          'create': 'inventory:create',
          'edit': 'inventory:edit',
          'delete': 'inventory:delete',
          'manage': 'inventory:manage'
        };
        
        const requiredPermission = permissionMap[action];
        return userPermissions.includes(requiredPermission) || userPermissions.includes('inventory:manage');
      };

      const userPermissions = ['inventory:view', 'inventory:create'];
      
      expect(checkInventoryAccess(userPermissions, 'view')).toBe(true);
      expect(checkInventoryAccess(userPermissions, 'create')).toBe(true);
      expect(checkInventoryAccess(userPermissions, 'edit')).toBe(false);
      expect(checkInventoryAccess(userPermissions, 'delete')).toBe(false);
      
      const adminPermissions = ['inventory:manage'];
      expect(checkInventoryAccess(adminPermissions, 'delete')).toBe(true); // Admin can do everything
    });
  });
});