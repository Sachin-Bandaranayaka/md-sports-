import {
  loginSchema,
  registerSchema,
  productSchema,
  categorySchema,
  inventorySchema,
  shopSchema,
  customerSchema,
  supplierSchema,
  invoiceSchema,
  paymentSchema,
  validateInput,
  paginationSchema,
  searchSchema,
  idSchema
} from '../../src/utils/validators';

describe('Validators', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com'
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        roleId: 1
      };
      
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email', // Invalid email format
        password: 'password123',
        confirmPassword: 'password123',
        roleId: 1
      };
      
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        name: 'John Doe'
      };
      
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('productSchema', () => {
    it('should validate valid product data', () => {
      const validData = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        categoryId: 1,
        shopId: 1
      };
      
      const result = productSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative price', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'A test product',
        price: -10,
        categoryId: 1,
        shopId: 1
      };
      
      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        name: 'Test Product'
      };
      
      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('categorySchema', () => {
    it('should validate valid category data', () => {
      const validData = {
        name: 'Electronics',
        description: 'Electronic products',
        shopId: 1
      };
      
      const result = categorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        description: 'Electronic products',
        shopId: 1
      };
      
      const result = categorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('inventorySchema', () => {
    it('should validate valid inventory data', () => {
      const validData = {
        productId: 1,
        quantity: 100,
        minStock: 10,
        maxStock: 1000,
        shopId: 1
      };
      
      const result = inventorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid data', () => {
      const invalidData = {
        productId: -1, // Negative productId (should be positive)
        quantity: 'invalid', // String instead of number
        shopId: 0 // Zero shopId (should be positive)
      };
      
      const result = inventorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('shopSchema', () => {
    it('should validate valid shop data', () => {
      const validData = {
        name: 'Test Shop',
        address: '123 Main St',
        phone: '+1234567890',
        email: 'shop@example.com'
      };
      
      const result = shopSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'Test Shop',
        address: '123 Main St',
        phone: '+1234567890',
        email: 'invalid-email'
      };
      
      const result = shopSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('customerSchema', () => {
    it('should validate valid customer data', () => {
      const validData = {
        name: 'John Customer',
        email: 'customer@example.com',
        phone: '+1234567890',
        address: '456 Customer St'
      };
      
      const result = customerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Customer',
        email: 'invalid-email',
        phone: '+1234567890',
        address: '456 Customer St'
      };
      
      const result = customerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('supplierSchema', () => {
    it('should validate valid supplier data', () => {
      const validData = {
        name: 'Supplier Corp',
        email: 'supplier@example.com',
        phone: '+1234567890',
        address: '789 Supplier Ave'
      };
      
      const result = supplierSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid data', () => {
      const invalidData = {
        name: 'S', // Too short (min 2 chars)
        email: 'invalid-email' // Invalid email format
      };
      
      const result = supplierSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('should validate valid pagination data', () => {
      const validData = {
        page: 1,
        limit: 10
      };
      
      const result = paginationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative page number', () => {
      const invalidData = {
        page: -1,
        limit: 10
      };
      
      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('searchSchema', () => {
    it('should validate valid search data', () => {
      const validData = {
        query: 'test search',
        filters: {}
      };
      
      const result = searchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle empty query', () => {
      const validData = {
        query: '',
        filters: {}
      };
      
      const result = searchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('idSchema', () => {
    it('should validate valid ID', () => {
      const validData = { id: 123 };
      
      const result = idSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative ID', () => {
      const invalidData = { id: -1 };
      
      const result = idSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateInput utility', () => {
    it('should validate input using provided schema', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const result = validateInput(loginSchema, validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should return error for invalid input', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };
      
      const result = validateInput(loginSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});