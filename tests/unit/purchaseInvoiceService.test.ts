import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PurchaseInvoiceService } from '@/services/purchaseInvoiceService';
import { PurchaseInvoiceStatus } from '@prisma/client';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    purchaseInvoice: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchaseInvoiceItem: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('PurchaseInvoiceService', () => {
  let service: PurchaseInvoiceService;

  beforeEach(() => {
    service = new PurchaseInvoiceService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createPurchaseInvoice', () => {
    it('should create a purchase invoice successfully', async () => {
      const invoiceData = {
        invoiceNumber: 'PI-001',
        supplierId: 1,
        totalAmount: 1000,
        status: PurchaseInvoiceStatus.PENDING,
        notes: 'Test invoice',
        shopId: 1,
      };

      const mockCreatedInvoice = {
        id: 1,
        ...invoiceData,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: 1,
          name: 'Test Supplier',
        },
        items: [],
      };

      mockDb.purchaseInvoice.create.mockResolvedValue(mockCreatedInvoice as any);

      const result = await service.createPurchaseInvoice(invoiceData);

      expect(mockDb.purchaseInvoice.create).toHaveBeenCalledWith({
        data: invoiceData,
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCreatedInvoice);
    });

    it('should handle database errors', async () => {
      const invoiceData = {
        invoiceNumber: 'PI-001',
        supplierId: 1,
        totalAmount: 1000,
        status: PurchaseInvoiceStatus.PENDING,
      };

      mockDb.purchaseInvoice.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createPurchaseInvoice(invoiceData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('createPurchaseInvoiceWithItems', () => {
    it('should create a purchase invoice with items successfully', async () => {
      const invoiceData = {
        invoiceNumber: 'PI-002',
        supplierId: 1,
        totalAmount: 1500,
        status: PurchaseInvoiceStatus.PENDING,
        items: [
          { productId: 1, quantity: 10, price: 100 },
          { productId: 2, quantity: 5, price: 100 },
        ],
      };

      const mockCreatedInvoice = {
        id: 1,
        invoiceNumber: 'PI-002',
        supplierId: 1,
        totalAmount: 1500,
        status: PurchaseInvoiceStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFinalInvoice = {
        ...mockCreatedInvoice,
        supplier: { id: 1, name: 'Test Supplier' },
        items: [
          {
            id: 1,
            purchaseInvoiceId: 1,
            productId: 1,
            quantity: 10,
            price: 100,
            product: { id: 1, name: 'Product 1' },
          },
          {
            id: 2,
            purchaseInvoiceId: 1,
            productId: 2,
            quantity: 5,
            price: 100,
            product: { id: 2, name: 'Product 2' },
          },
        ],
      };

      mockDb.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          purchaseInvoice: {
            create: jest.fn().mockResolvedValue(mockCreatedInvoice),
            findUnique: jest.fn().mockResolvedValue(mockFinalInvoice),
          },
          purchaseInvoiceItem: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(mockTx as any);
      });

      const result = await service.createPurchaseInvoiceWithItems(invoiceData);

      expect(mockDb.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockFinalInvoice);
    });

    it('should handle empty items array', async () => {
      const invoiceData = {
        invoiceNumber: 'PI-003',
        supplierId: 1,
        totalAmount: 0,
        status: PurchaseInvoiceStatus.PENDING,
        items: [],
      };

      const mockCreatedInvoice = {
        id: 1,
        invoiceNumber: 'PI-003',
        supplierId: 1,
        totalAmount: 0,
        status: PurchaseInvoiceStatus.PENDING,
        supplier: { id: 1, name: 'Test Supplier' },
        items: [],
      };

      mockDb.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          purchaseInvoice: {
            create: jest.fn().mockResolvedValue(mockCreatedInvoice),
            findUnique: jest.fn().mockResolvedValue(mockCreatedInvoice),
          },
          purchaseInvoiceItem: {
            createMany: jest.fn(),
          },
        };
        return await callback(mockTx as any);
      });

      const result = await service.createPurchaseInvoiceWithItems(invoiceData);

      expect(result).toEqual(mockCreatedInvoice);
    });
  });

  describe('createPurchaseInvoiceWithCalculations', () => {
    it('should calculate total amount from items and create invoice', async () => {
      const invoiceData = {
        invoiceNumber: 'PI-004',
        supplierId: 1,
        totalAmount: 0, // This should be overridden by calculation
        status: PurchaseInvoiceStatus.PENDING,
        items: [
          { productId: 1, quantity: 10, price: 100 }, // 1000
          { productId: 2, quantity: 5, price: 200 },  // 1000
        ],
      };

      const mockFinalInvoice = {
        id: 1,
        invoiceNumber: 'PI-004',
        supplierId: 1,
        totalAmount: 2000, // Calculated total
        status: PurchaseInvoiceStatus.PENDING,
        supplier: { id: 1, name: 'Test Supplier' },
        items: [],
      };

      mockDb.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          purchaseInvoice: {
            create: jest.fn().mockResolvedValue(mockFinalInvoice),
            findUnique: jest.fn().mockResolvedValue(mockFinalInvoice),
          },
          purchaseInvoiceItem: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(mockTx as any);
      });

      const result = await service.createPurchaseInvoiceWithCalculations(invoiceData);

      expect(result.totalAmount).toBe(2000);
    });
  });

  describe('getPurchaseInvoiceById', () => {
    it('should retrieve a purchase invoice by ID', async () => {
      const invoiceId = 1;
      const mockInvoice = {
        id: invoiceId,
        invoiceNumber: 'PI-001',
        supplierId: 1,
        totalAmount: 1000,
        status: PurchaseInvoiceStatus.PENDING,
        supplier: { id: 1, name: 'Test Supplier' },
        items: [],
      };

      mockDb.purchaseInvoice.findUnique.mockResolvedValue(mockInvoice as any);

      const result = await service.getPurchaseInvoiceById(invoiceId);

      expect(mockDb.purchaseInvoice.findUnique).toHaveBeenCalledWith({
        where: { id: invoiceId },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result).toEqual(mockInvoice);
    });

    it('should return null for non-existent invoice', async () => {
      const invoiceId = 999;
      mockDb.purchaseInvoice.findUnique.mockResolvedValue(null);

      const result = await service.getPurchaseInvoiceById(invoiceId);

      expect(result).toBeNull();
    });
  });

  describe('getPurchaseInvoices', () => {
    it('should retrieve purchase invoices with default pagination', async () => {
      const mockInvoices = [
        {
          id: 1,
          invoiceNumber: 'PI-001',
          supplierId: 1,
          totalAmount: 1000,
          status: PurchaseInvoiceStatus.PENDING,
          supplier: { id: 1, name: 'Supplier 1' },
          items: [],
        },
        {
          id: 2,
          invoiceNumber: 'PI-002',
          supplierId: 2,
          totalAmount: 1500,
          status: PurchaseInvoiceStatus.APPROVED,
          supplier: { id: 2, name: 'Supplier 2' },
          items: [],
        },
      ];

      mockDb.purchaseInvoice.findMany.mockResolvedValue(mockInvoices as any);

      const result = await service.getPurchaseInvoices();

      expect(mockDb.purchaseInvoice.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result).toEqual(mockInvoices);
    });

    it('should retrieve purchase invoices with custom pagination and sorting', async () => {
      const options = {
        page: 2,
        limit: 5,
        sortBy: 'totalAmount',
        sortOrder: 'asc' as const,
      };

      mockDb.purchaseInvoice.findMany.mockResolvedValue([]);

      await service.getPurchaseInvoices(options);

      expect(mockDb.purchaseInvoice.findMany).toHaveBeenCalledWith({
        skip: 5, // (page - 1) * limit
        take: 5,
        orderBy: {
          totalAmount: 'asc',
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  });

  describe('updatePurchaseInvoice', () => {
    it('should update a purchase invoice successfully', async () => {
      const invoiceId = 1;
      const updateData = {
        totalAmount: 1200,
        status: PurchaseInvoiceStatus.APPROVED,
        notes: 'Updated notes',
      };

      const mockUpdatedInvoice = {
        id: invoiceId,
        invoiceNumber: 'PI-001',
        supplierId: 1,
        ...updateData,
        supplier: { id: 1, name: 'Test Supplier' },
        items: [],
      };

      mockDb.purchaseInvoice.update.mockResolvedValue(mockUpdatedInvoice as any);

      const result = await service.updatePurchaseInvoice(invoiceId, updateData);

      expect(mockDb.purchaseInvoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: updateData,
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUpdatedInvoice);
    });
  });

  describe('updatePurchaseInvoiceStatus', () => {
    it('should update purchase invoice status', async () => {
      const invoiceId = 1;
      const newStatus = PurchaseInvoiceStatus.APPROVED;

      const mockUpdatedInvoice = {
        id: invoiceId,
        status: newStatus,
        supplier: { id: 1, name: 'Test Supplier' },
        items: [],
      };

      mockDb.purchaseInvoice.update.mockResolvedValue(mockUpdatedInvoice as any);

      const result = await service.updatePurchaseInvoiceStatus(invoiceId, newStatus);

      expect(mockDb.purchaseInvoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: { status: newStatus },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUpdatedInvoice);
    });
  });

  describe('deletePurchaseInvoice', () => {
    it('should delete a purchase invoice and its items', async () => {
      const invoiceId = 1;
      const mockDeletedInvoice = {
        id: invoiceId,
        invoiceNumber: 'PI-001',
      };

      mockDb.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          purchaseInvoiceItem: {
            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          purchaseInvoice: {
            delete: jest.fn().mockResolvedValue(mockDeletedInvoice),
          },
        };
        return await callback(mockTx as any);
      });

      const result = await service.deletePurchaseInvoice(invoiceId);

      expect(mockDb.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedInvoice);
    });
  });

  describe('searchPurchaseInvoices', () => {
    it('should search purchase invoices with supplier filter', async () => {
      const filters = { supplierId: 1 };
      const mockInvoices = [
        {
          id: 1,
          supplierId: 1,
          supplier: { id: 1, name: 'Supplier 1' },
          items: [],
        },
      ];

      mockDb.purchaseInvoice.findMany.mockResolvedValue(mockInvoices as any);

      const result = await service.searchPurchaseInvoices(filters);

      expect(mockDb.purchaseInvoice.findMany).toHaveBeenCalledWith({
        where: { supplierId: 1 },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockInvoices);
    });

    it('should search purchase invoices with date range filter', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const filters = { startDate, endDate };

      mockDb.purchaseInvoice.findMany.mockResolvedValue([]);

      await service.searchPurchaseInvoices(filters);

      expect(mockDb.purchaseInvoice.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should search purchase invoices with text search', async () => {
      const filters = { search: 'test invoice' };

      mockDb.purchaseInvoice.findMany.mockResolvedValue([]);

      await service.searchPurchaseInvoices(filters);

      expect(mockDb.purchaseInvoice.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              invoiceNumber: {
                contains: 'test invoice',
                mode: 'insensitive',
              },
            },
            {
              notes: {
                contains: 'test invoice',
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should search purchase invoices with multiple filters', async () => {
      const filters = {
        supplierId: 1,
        status: PurchaseInvoiceStatus.PENDING,
        search: 'test',
        startDate: new Date('2024-01-01'),
      };

      mockDb.purchaseInvoice.findMany.mockResolvedValue([]);

      await service.searchPurchaseInvoices(filters);

      expect(mockDb.purchaseInvoice.findMany).toHaveBeenCalledWith({
        where: {
          supplierId: 1,
          status: PurchaseInvoiceStatus.PENDING,
          createdAt: {
            gte: new Date('2024-01-01'),
          },
          OR: [
            {
              invoiceNumber: {
                contains: 'test',
                mode: 'insensitive',
              },
            },
            {
              notes: {
                contains: 'test',
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('approvePurchaseInvoice', () => {
    it('should approve a purchase invoice', async () => {
      const invoiceId = 1;
      const mockApprovedInvoice = {
        id: invoiceId,
        status: PurchaseInvoiceStatus.APPROVED,
        supplier: { id: 1, name: 'Test Supplier' },
        items: [],
      };

      mockDb.purchaseInvoice.update.mockResolvedValue(mockApprovedInvoice as any);

      const result = await service.approvePurchaseInvoice(invoiceId);

      expect(mockDb.purchaseInvoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: { status: PurchaseInvoiceStatus.APPROVED },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result).toEqual(mockApprovedInvoice);
    });
  });

  describe('getPurchaseInvoiceWithDetails', () => {
    it('should get purchase invoice with details (alias for getPurchaseInvoiceById)', async () => {
      const invoiceId = 1;
      const mockInvoice = {
        id: invoiceId,
        invoiceNumber: 'PI-001',
        supplier: { id: 1, name: 'Test Supplier' },
        items: [],
      };

      mockDb.purchaseInvoice.findUnique.mockResolvedValue(mockInvoice as any);

      const result = await service.getPurchaseInvoiceWithDetails(invoiceId);

      expect(mockDb.purchaseInvoice.findUnique).toHaveBeenCalledWith({
        where: { id: invoiceId },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result).toEqual(mockInvoice);
    });
  });
});