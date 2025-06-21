import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/users/route';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Mock dependencies
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  shop: {
    findUnique: jest.fn(),
  },
  permission: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  role: {
    upsert: jest.fn(),
  },
};

// Mock modules
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('bcryptjs');
jest.mock('crypto');

// Mock middleware
jest.mock('@/lib/utils/middleware', () => ({
  requirePermission: () => () => null, // Bypass permission check for tests
}));

// Helper to create NextRequest-like object
const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
  return {
    json: async () => body,
    headers: new Headers({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
      ...headers,
    }),
  } as any;
};

describe('User Creation API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (randomUUID as jest.Mock).mockReturnValue('user-123');
  });

  describe('POST /api/users - Success Cases', () => {
    test('should create admin user successfully', async () => {
      // Mock shop exists
      mockPrisma.shop.findUnique.mockResolvedValue({
        id: 'shop-1',
        name: 'Main Store',
      });

      // Mock admin permission
      mockPrisma.permission.findUnique.mockResolvedValue({
        id: 'admin-perm-1',
        name: 'admin:all',
      });

      // Mock admin role creation
      mockPrisma.role.upsert.mockResolvedValue({
        id: 'admin-role-id',
        name: 'Admin',
        description: 'Full system access with all permissions',
      });

      // Mock user creation
      const createdUser = {
        id: 'user-123',
        name: 'John Admin',
        email: 'admin@example.com',
        shopId: 'shop-1',
        permissions: ['admin-perm-1'],
        createdAt: new Date(),
        shop: {
          id: 'shop-1',
          name: 'Main Store',
        },
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const requestBody = {
        name: 'John Admin',
        email: 'admin@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin:all'],
        allowedAccounts: [],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('User created successfully');
      expect(responseData.data.name).toBe('John Admin');
      expect(responseData.data.email).toBe('admin@example.com');

      // Verify database calls
      expect(mockPrisma.shop.findUnique).toHaveBeenCalledWith({
        where: { id: 'shop-1' }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'user-123',
          name: 'John Admin',
          email: 'admin@example.com',
          password: 'hashed-password',
          shopId: 'shop-1',
          isActive: true,
        }),
        select: expect.any(Object),
      });
    });

    test('should create shop staff user successfully', async () => {
      // Mock shop exists
      mockPrisma.shop.findUnique.mockResolvedValue({
        id: 'shop-2',
        name: 'Branch Store',
      });

      // Mock shop:assigned_only permission creation
      mockPrisma.permission.upsert.mockResolvedValue({
        id: 'shop-perm-1',
        name: 'shop:assigned_only',
        description: 'Restricts user access to only their assigned shop',
      });

      // Mock shop staff role creation
      mockPrisma.role.upsert.mockResolvedValue({
        id: 'shop-staff-role-id',
        name: 'Shop Staff',
        description: 'Limited access for shop staff members',
      });

      // Mock user creation
      const createdUser = {
        id: 'user-456',
        name: 'Jane Staff',
        email: 'staff@example.com',
        shopId: 'shop-2',
        permissions: ['shop-perm-1'],
        createdAt: new Date(),
        shop: {
          id: 'shop-2',
          name: 'Branch Store',
        },
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const requestBody = {
        name: 'Jane Staff',
        email: 'staff@example.com',
        password: 'password123',
        shop: 'shop-2',
        permissions: ['shop:assigned_only', 'sales:view'],
        allowedAccounts: ['acc-1', 'acc-2'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.name).toBe('Jane Staff');

      // Verify shop:assigned_only permission was created
      expect(mockPrisma.permission.upsert).toHaveBeenCalledWith({
        where: { name: 'shop:assigned_only' },
        update: {},
        create: {
          name: 'shop:assigned_only',
          description: 'Restricts user access to only their assigned shop',
        },
      });

      // Verify shop staff role was created
      expect(mockPrisma.role.upsert).toHaveBeenCalledWith({
        where: { name: 'Shop Staff' },
        update: {},
        create: {
          id: 'shop-staff-role-id',
          name: 'Shop Staff',
          description: 'Limited access for shop staff members',
        },
      });
    });
  });

  describe('POST /api/users - Validation Errors', () => {
    test('should return 400 for missing name', async () => {
      const requestBody = {
        name: '',
        email: 'test@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Name is required');
    });

    test('should return 400 for missing email', async () => {
      const requestBody = {
        name: 'John Doe',
        email: '',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Email is required');
    });

    test('should return 400 for weak password', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'test@example.com',
        password: '123',
        shop: 'shop-1',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Password must be at least 8 characters');
    });

    test('should return 400 for missing shop assignment', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        shop: '',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Shop assignment is required');
    });

    test('should return 400 for missing permissions', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: [],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('At least one permission is required');
    });

    test('should return 400 for invalid shop ID', async () => {
      // Mock shop not found
      mockPrisma.shop.findUnique.mockResolvedValue(null);

      const requestBody = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        shop: 'invalid-shop-id',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Invalid shop ID provided - shop does not exist');
    });
  });

  describe('POST /api/users - Database Errors', () => {
    test('should handle shop lookup database error', async () => {
      mockPrisma.shop.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const requestBody = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Failed to create user');
    });

    test('should handle user creation database error', async () => {
      // Mock shop exists
      mockPrisma.shop.findUnique.mockResolvedValue({
        id: 'shop-1',
        name: 'Main Store',
      });

      // Mock user creation failure
      mockPrisma.user.create.mockRejectedValue(new Error('Unique constraint violation'));

      const requestBody = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Failed to create user');
    });

    test('should handle bcrypt hashing error', async () => {
      // Mock shop exists
      mockPrisma.shop.findUnique.mockResolvedValue({
        id: 'shop-1',
        name: 'Main Store',
      });

      // Mock bcrypt error
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      const requestBody = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Failed to create user');
    });
  });

  describe('POST /api/users - Permission Processing', () => {
    test('should handle admin:all permission by ID', async () => {
      // Mock shop exists
      mockPrisma.shop.findUnique.mockResolvedValue({
        id: 'shop-1',
        name: 'Main Store',
      });

      // Mock admin:all permission lookup
      mockPrisma.permission.findUnique.mockResolvedValue({
        id: 'admin-perm-123',
        name: 'admin:all',
      });

      // Mock admin role creation
      mockPrisma.role.upsert.mockResolvedValue({
        id: 'admin-role-id',
        name: 'Admin',
      });

      // Mock user creation
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        shopId: 'shop-1',
        permissions: ['admin-perm-123'],
        createdAt: new Date(),
        shop: { id: 'shop-1', name: 'Main Store' },
      });

      const requestBody = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin-perm-123'], // Permission by ID
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { name: 'admin:all' }
      });
    });

    test('should process multiple permissions correctly', async () => {
      // Mock shop exists
      mockPrisma.shop.findUnique.mockResolvedValue({
        id: 'shop-1',
        name: 'Main Store',
      });

      // Mock shop:assigned_only permission creation
      mockPrisma.permission.upsert.mockResolvedValue({
        id: 'shop-perm-1',
        name: 'shop:assigned_only',
      });

      // Mock role creation
      mockPrisma.role.upsert.mockResolvedValue({
        id: 'shop-staff-role-id',
        name: 'Shop Staff',
      });

      // Mock user creation
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-456',
        name: 'Staff User',
        email: 'staff@example.com',
        shopId: 'shop-1',
        permissions: ['shop-perm-1', 'sales:view', 'inventory:view'],
        createdAt: new Date(),
        shop: { id: 'shop-1', name: 'Main Store' },
      });

      const requestBody = {
        name: 'Staff User',
        email: 'staff@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['shop:assigned_only', 'sales:view', 'inventory:view'],
      };

      const req = createMockRequest(requestBody);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockPrisma.permission.upsert).toHaveBeenCalledWith({
        where: { name: 'shop:assigned_only' },
        update: {},
        create: {
          name: 'shop:assigned_only',
          description: 'Restricts user access to only their assigned shop',
        },
      });
    });
  });

  describe('POST /api/users - Role Assignment', () => {
    test('should assign correct role based on permissions', async () => {
      // Test admin role assignment
      mockPrisma.shop.findUnique.mockResolvedValue({ id: 'shop-1', name: 'Store' });
      mockPrisma.role.upsert.mockResolvedValue({ id: 'admin-role', name: 'Admin' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        name: 'Admin',
        email: 'admin@test.com',
        shopId: 'shop-1',
        permissions: ['admin:all'],
        createdAt: new Date(),
        shop: { id: 'shop-1', name: 'Store' },
      });

      const adminRequest = {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(adminRequest);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.role.upsert).toHaveBeenCalledWith({
        where: { name: 'Admin' },
        update: {},
        create: {
          id: 'admin-role-id',
          name: 'Admin',
          description: 'Full system access with all permissions',
        },
      });
    });
  });

  describe('POST /api/users - Data Integrity', () => {
    test('should generate unique user ID', async () => {
      mockPrisma.shop.findUnique.mockResolvedValue({ id: 'shop-1', name: 'Store' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        shopId: 'shop-1',
        permissions: ['admin:all'],
        createdAt: new Date(),
        shop: { id: 'shop-1', name: 'Store' },
      });

      const requestBody = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      await POST(req);

      expect(randomUUID).toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'user-123',
          isActive: true,
        }),
        select: expect.any(Object),
      });
    });

    test('should hash password with correct salt rounds', async () => {
      mockPrisma.shop.findUnique.mockResolvedValue({ id: 'shop-1', name: 'Store' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        shopId: 'shop-1',
        permissions: ['admin:all'],
        createdAt: new Date(),
        shop: { id: 'shop-1', name: 'Store' },
      });

      const requestBody = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        shop: 'shop-1',
        permissions: ['admin:all'],
      };

      const req = createMockRequest(requestBody);
      await POST(req);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });
  });
});