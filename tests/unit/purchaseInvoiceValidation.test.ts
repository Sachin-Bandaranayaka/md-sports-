import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock data types
interface FormItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Shop {
  id: string;
  name: string;
}

// Validation functions extracted from the components for testing
const validateDistributions = (
  items: FormItem[], 
  itemDistributions: Array<Record<string, number> | {}>, 
  shops: Shop[]
) => {
  if (!items || items.length === 0) return { isValid: false, error: 'No items to validate' };
  
  if (shops.length === 0) {
    return { isValid: false, error: 'No shops available for distribution. Please configure at least one shop before creating purchase invoices.' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const distribution = itemDistributions[i] || {};
    
    // Calculate total distributed quantity for this item
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

const getItemDistributionStatus = (
  itemIndex: number,
  items: FormItem[],
  itemDistributions: Array<Record<string, number>>
) => {
  if (!items || !items[itemIndex]) return { status: 'none', message: 'No item' };
  
  const item = items[itemIndex];
  const requiredQty = Number(item.quantity);
  
  // Calculate distributed quantity
  const distribution = itemDistributions[itemIndex] || {};
  const distributedQty = Object.values(distribution).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  
  // Check if quantities match first (handles zero quantity items)
  if (distributedQty === requiredQty) {
    return { status: 'complete', message: 'Fully distributed' };
  } else if (distributedQty === 0) {
    return { status: 'none', message: 'Not distributed' };
  } else if (distributedQty < requiredQty) {
    return { status: 'partial', message: `${distributedQty}/${requiredQty} distributed` };
  } else {
    return { status: 'over', message: `Over-distributed: ${distributedQty}/${requiredQty}` };
  }
};

describe('Purchase Invoice Distribution Validation', () => {
  let mockItems: FormItem[];
  let mockShops: Shop[];
  let mockDistributions: Array<Record<string, number>>;

  beforeEach(() => {
    mockItems = [
      {
        productId: '1',
        productName: 'Test Product 1',
        quantity: 10,
        price: 100
      },
      {
        productId: '2', 
        productName: 'Test Product 2',
        quantity: 5,
        price: 50
      }
    ];

    mockShops = [
      { id: 'shop1', name: 'Shop 1' },
      { id: 'shop2', name: 'Shop 2' }
    ];

    mockDistributions = [
      { 'shop1': 6, 'shop2': 4 }, // Total: 10 (matches item 1)
      { 'shop1': 5 }              // Total: 5 (matches item 2)
    ];
  });

  describe('validateDistributions', () => {
    it('should return valid when all items are properly distributed', () => {
      const result = validateDistributions(mockItems, mockDistributions, mockShops);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return invalid when no items exist', () => {
      const result = validateDistributions([], [], mockShops);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No items to validate');
    });

    it('should return invalid when no shops are configured', () => {
      const result = validateDistributions(mockItems, mockDistributions, []);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No shops available for distribution. Please configure at least one shop before creating purchase invoices.');
    });

    it('should return invalid when item has no distribution', () => {
      const emptyDistributions = [
        {},  // Empty distribution for first item
        { 'shop1': 5 }
      ];
      
      const result = validateDistributions(mockItems, emptyDistributions, mockShops);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Product "Test Product 1" has no distribution set. Please distribute all quantities to shops.');
    });

    it('should return invalid when distributed quantity is less than required', () => {
      const partialDistributions = [
        { 'shop1': 6, 'shop2': 2 }, // Total: 8, but required: 10
        { 'shop1': 5 }
      ];
      
      const result = validateDistributions(mockItems, partialDistributions, mockShops);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Product "Test Product 1" distribution mismatch. Required: 10, Distributed: 8');
    });

    it('should return invalid when distributed quantity exceeds required', () => {
      const overDistributions = [
        { 'shop1': 6, 'shop2': 6 }, // Total: 12, but required: 10
        { 'shop1': 5 }
      ];
      
      const result = validateDistributions(mockItems, overDistributions, mockShops);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Product "Test Product 1" distribution mismatch. Required: 10, Distributed: 12');
    });

    it('should handle missing distribution arrays gracefully', () => {
      const incompleteDistributions = [
        { 'shop1': 10 }
        // Missing distribution for second item
      ];
      
      const result = validateDistributions(mockItems, incompleteDistributions, mockShops);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Product "Test Product 2" has no distribution set. Please distribute all quantities to shops.');
    });

    it('should handle string quantities in distributions', () => {
      const stringDistributions = [
        { 'shop1': '6', 'shop2': '4' } as any, // String values
        { 'shop1': '5' } as any
      ];
      
      const result = validateDistributions(mockItems, stringDistributions, mockShops);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle invalid/NaN quantities in distributions', () => {
      const invalidDistributions = [
        { 'shop1': 'invalid', 'shop2': 4 } as any, // Invalid value should be treated as 0
        { 'shop1': 5 }
      ];
      
      const result = validateDistributions(mockItems, invalidDistributions, mockShops);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Product "Test Product 1" distribution mismatch. Required: 10, Distributed: 4');
    });
  });

  describe('getItemDistributionStatus', () => {
    it('should return "complete" when item is fully distributed', () => {
      const result = getItemDistributionStatus(0, mockItems, mockDistributions);
      
      expect(result.status).toBe('complete');
      expect(result.message).toBe('Fully distributed');
    });

    it('should return "none" when item has no distribution', () => {
      const emptyDistributions = [{}];
      const result = getItemDistributionStatus(0, mockItems, emptyDistributions);
      
      expect(result.status).toBe('none');
      expect(result.message).toBe('Not distributed');
    });

    it('should return "partial" when item is partially distributed', () => {
      const partialDistributions = [{ 'shop1': 6 }]; // 6 out of 10
      const result = getItemDistributionStatus(0, mockItems, partialDistributions);
      
      expect(result.status).toBe('partial');
      expect(result.message).toBe('6/10 distributed');
    });

    it('should return "over" when item is over-distributed', () => {
      const overDistributions = [{ 'shop1': 12 }]; // 12 out of 10
      const result = getItemDistributionStatus(0, mockItems, overDistributions);
      
      expect(result.status).toBe('over');
      expect(result.message).toBe('Over-distributed: 12/10');
    });

    it('should return "none" when item index is invalid', () => {
      const result = getItemDistributionStatus(999, mockItems, mockDistributions);
      
      expect(result.status).toBe('none');
      expect(result.message).toBe('No item');
    });

    it('should handle missing distribution for item index', () => {
      const incompleteDistributions = [{ 'shop1': 10 }]; // Missing index 1
      const result = getItemDistributionStatus(1, mockItems, incompleteDistributions);
      
      expect(result.status).toBe('none');
      expect(result.message).toBe('Not distributed');
    });

    it('should handle zero quantity items', () => {
      const zeroQuantityItems = [{ ...mockItems[0], quantity: 0 }];
      const zeroDistributions = [{ 'shop1': 0 }];
      const result = getItemDistributionStatus(0, zeroQuantityItems, zeroDistributions);
      
      // Zero quantity items with zero distribution should be considered complete
      expect(result.status).toBe('complete');
      expect(result.message).toBe('Fully distributed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const result = validateDistributions([], [], []);
      expect(result.isValid).toBe(false);
    });

    it('should handle null/undefined inputs gracefully', () => {
      const result = validateDistributions(null as any, null as any, null as any);
      expect(result.isValid).toBe(false);
    });

    it('should handle items with missing productName', () => {
      const itemsNoName = [{ 
        productId: '1', 
        productName: '', 
        quantity: 5, 
        price: 100 
      }];
      const emptyDist = [{}];
      
      const result = validateDistributions(itemsNoName, emptyDist, mockShops);
      expect(result.error).toContain('Product 1');
    });
  });
}); 