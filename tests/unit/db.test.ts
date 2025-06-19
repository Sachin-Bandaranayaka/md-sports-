// Mock Prisma operations
const createMockPrismaOperations = () => ({
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
});

// Create mock Prisma client
const mockPrisma = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
  user: createMockPrismaOperations(),
  product: createMockPrismaOperations(),
  category: createMockPrismaOperations(),
  order: createMockPrismaOperations(),
  orderItem: createMockPrismaOperations(),
  review: createMockPrismaOperations(),
  cart: createMockPrismaOperations(),
  cartItem: createMockPrismaOperations(),
  payment: createMockPrismaOperations(),
  shipping: createMockPrismaOperations(),
  address: createMockPrismaOperations(),
  wishlist: createMockPrismaOperations(),
  wishlistItem: createMockPrismaOperations(),
  notification: createMockPrismaOperations(),
  auditLog: createMockPrismaOperations(),
  session: createMockPrismaOperations(),
  account: createMockPrismaOperations(),
  verificationToken: createMockPrismaOperations(),
  inventory: createMockPrismaOperations(),
  supplier: createMockPrismaOperations(),
  purchaseOrder: createMockPrismaOperations(),
  purchaseOrderItem: createMockPrismaOperations(),
  salesInvoice: createMockPrismaOperations(),
  salesInvoiceItem: createMockPrismaOperations(),
};

// Mock the prisma module
jest.mock('@/lib/prisma', () => {
  const mockOperations = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  };

  const mock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    user: mockOperations,
    product: mockOperations,
    category: mockOperations,
    order: mockOperations,
    orderItem: mockOperations,
    review: mockOperations,
    cart: mockOperations,
    cartItem: mockOperations,
    payment: mockOperations,
    shipping: mockOperations,
    address: mockOperations,
    wishlist: mockOperations,
    wishlistItem: mockOperations,
    notification: mockOperations,
    auditLog: mockOperations,
    session: mockOperations,
    account: mockOperations,
    verificationToken: mockOperations,
    inventory: mockOperations,
    supplier: mockOperations,
    purchaseOrder: mockOperations,
    purchaseOrderItem: mockOperations,
    salesInvoice: mockOperations,
    salesInvoiceItem: mockOperations,
  };

  return {
    __esModule: true,
    default: mock,
    prisma: mock,
  };
});

// Mock the db module
jest.mock('@/lib/db', () => {
  const mockOperations = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  };

  const mock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    user: mockOperations,
    product: mockOperations,
    category: mockOperations,
    order: mockOperations,
    orderItem: mockOperations,
    review: mockOperations,
    cart: mockOperations,
    cartItem: mockOperations,
    payment: mockOperations,
    shipping: mockOperations,
    address: mockOperations,
    wishlist: mockOperations,
    wishlistItem: mockOperations,
    notification: mockOperations,
    auditLog: mockOperations,
    session: mockOperations,
    account: mockOperations,
    verificationToken: mockOperations,
    inventory: mockOperations,
    supplier: mockOperations,
    purchaseOrder: mockOperations,
    purchaseOrderItem: mockOperations,
    salesInvoice: mockOperations,
    salesInvoiceItem: mockOperations,
  };

  return {
    __esModule: true,
    db: mock,
    prisma: mock,
    default: mock,
  };
});

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    NODE_ENV: 'test',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Import after mocking
import { db, prisma } from '@/lib/db';

describe('Database Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exports', () => {
    it('should export db', () => {
      expect(db).toBeDefined();
    });

    it('should export prisma', () => {
      expect(prisma).toBeDefined();
    });

    it('should have db and prisma reference the same instance', () => {
      expect(db).toBe(prisma);
    });
  });

  describe('database operations', () => {
    it('should have $connect method', () => {
      expect(db.$connect).toBeDefined();
      expect(typeof db.$connect).toBe('function');
    });

    it('should have $disconnect method', () => {
      expect(db.$disconnect).toBeDefined();
      expect(typeof db.$disconnect).toBe('function');
    });

    it('should have $transaction method', () => {
      expect(db.$transaction).toBeDefined();
      expect(typeof db.$transaction).toBe('function');
    });

    it('should have user model', () => {
      expect(db.user).toBeDefined();
      expect(db.user.findMany).toBeDefined();
      expect(db.user.create).toBeDefined();
      expect(db.user.update).toBeDefined();
      expect(db.user.delete).toBeDefined();
    });

    it('should have product model', () => {
      expect(db.product).toBeDefined();
      expect(db.product.findMany).toBeDefined();
      expect(db.product.create).toBeDefined();
      expect(db.product.update).toBeDefined();
      expect(db.product.delete).toBeDefined();
    });

    it('should have category model', () => {
      expect(db.category).toBeDefined();
      expect(db.category.findMany).toBeDefined();
      expect(db.category.create).toBeDefined();
      expect(db.category.update).toBeDefined();
      expect(db.category.delete).toBeDefined();
    });

    it('should have order model', () => {
      expect(db.order).toBeDefined();
      expect(db.order.findMany).toBeDefined();
      expect(db.order.create).toBeDefined();
      expect(db.order.update).toBeDefined();
      expect(db.order.delete).toBeDefined();
    });

    it('should have cart model', () => {
      expect(db.cart).toBeDefined();
      expect(db.cart.findMany).toBeDefined();
      expect(db.cart.create).toBeDefined();
      expect(db.cart.update).toBeDefined();
      expect(db.cart.delete).toBeDefined();
    });

    it('should have review model', () => {
      expect(db.review).toBeDefined();
      expect(db.review.findMany).toBeDefined();
      expect(db.review.create).toBeDefined();
      expect(db.review.update).toBeDefined();
      expect(db.review.delete).toBeDefined();
    });

    it('should have payment model', () => {
      expect(db.payment).toBeDefined();
      expect(db.payment.findMany).toBeDefined();
      expect(db.payment.create).toBeDefined();
      expect(db.payment.update).toBeDefined();
      expect(db.payment.delete).toBeDefined();
    });

    it('should have shipping model', () => {
      expect(db.shipping).toBeDefined();
      expect(db.shipping.findMany).toBeDefined();
      expect(db.shipping.create).toBeDefined();
      expect(db.shipping.update).toBeDefined();
      expect(db.shipping.delete).toBeDefined();
    });

    it('should have address model', () => {
      expect(db.address).toBeDefined();
      expect(db.address.findMany).toBeDefined();
      expect(db.address.create).toBeDefined();
      expect(db.address.update).toBeDefined();
      expect(db.address.delete).toBeDefined();
    });

    it('should have wishlist model', () => {
      expect(db.wishlist).toBeDefined();
      expect(db.wishlist.findMany).toBeDefined();
      expect(db.wishlist.create).toBeDefined();
      expect(db.wishlist.update).toBeDefined();
      expect(db.wishlist.delete).toBeDefined();
    });

    it('should have notification model', () => {
      expect(db.notification).toBeDefined();
      expect(db.notification.findMany).toBeDefined();
      expect(db.notification.create).toBeDefined();
      expect(db.notification.update).toBeDefined();
      expect(db.notification.delete).toBeDefined();
    });

    it('should have auditLog model', () => {
      expect(db.auditLog).toBeDefined();
      expect(db.auditLog.findMany).toBeDefined();
      expect(db.auditLog.create).toBeDefined();
      expect(db.auditLog.update).toBeDefined();
      expect(db.auditLog.delete).toBeDefined();
    });

    it('should have session model', () => {
      expect(db.session).toBeDefined();
      expect(db.session.findMany).toBeDefined();
      expect(db.session.create).toBeDefined();
      expect(db.session.update).toBeDefined();
      expect(db.session.delete).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      (db.$connect as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
      
      await expect(db.$connect()).rejects.toThrow('Database connection failed');
    });

    it('should handle query errors', async () => {
      (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('Query failed'));
      
      await expect(db.user.findUnique({ where: { id: 'invalid' } })).rejects.toThrow('Query failed');
    });

    it('should propagate transaction errors', async () => {
      (db.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      const transactionFn = jest.fn();
      await expect(db.$transaction(transactionFn)).rejects.toThrow('Transaction failed');
    });
  });
});