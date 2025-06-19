import { PrismaClient, PurchaseInvoiceStatus } from '@prisma/client';
import { db } from '@/lib/db';

interface CreatePurchaseInvoiceData {
  invoiceNumber: string;
  supplierId: number;
  totalAmount: number;
  status: PurchaseInvoiceStatus;
  notes?: string;
  shopId?: number;
}

interface CreatePurchaseInvoiceWithItemsData extends CreatePurchaseInvoiceData {
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
}

interface UpdatePurchaseInvoiceData {
  invoiceNumber?: string;
  supplierId?: number;
  totalAmount?: number;
  status?: PurchaseInvoiceStatus;
  notes?: string;
}

interface SearchFilters {
  supplierId?: number;
  status?: PurchaseInvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface GetPurchaseInvoicesOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PurchaseInvoiceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = db;
  }

  async createPurchaseInvoice(data: CreatePurchaseInvoiceData) {
    return await this.prisma.purchaseInvoice.create({
      data,
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async createPurchaseInvoiceWithItems(data: CreatePurchaseInvoiceWithItemsData) {
    const { items, ...invoiceData } = data;
    
    return await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.create({
        data: invoiceData
      });

      if (items && items.length > 0) {
        await tx.purchaseInvoiceItem.createMany({
          data: items.map(item => ({
            purchaseInvoiceId: invoice.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        });
      }

      return await tx.purchaseInvoice.findUnique({
        where: { id: invoice.id },
        include: {
          supplier: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });
    });
  }

  async createPurchaseInvoiceWithCalculations(data: CreatePurchaseInvoiceWithItemsData) {
    // Calculate total from items
    const calculatedTotal = data.items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);

    return await this.createPurchaseInvoiceWithItems({
      ...data,
      totalAmount: calculatedTotal
    });
  }

  async getPurchaseInvoiceById(id: number) {
    return await this.prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async getPurchaseInvoiceWithDetails(id: number) {
    return await this.getPurchaseInvoiceById(id);
  }

  async getPurchaseInvoices(options: GetPurchaseInvoicesOptions = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    return await this.prisma.purchaseInvoice.findMany({
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async updatePurchaseInvoice(id: number, data: UpdatePurchaseInvoiceData) {
    return await this.prisma.purchaseInvoice.update({
      where: { id },
      data,
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async updatePurchaseInvoiceStatus(id: number, status: PurchaseInvoiceStatus) {
    return await this.updatePurchaseInvoice(id, { status });
  }

  async deletePurchaseInvoice(id: number) {
    return await this.prisma.$transaction(async (tx) => {
      // Delete related items first
      await tx.purchaseInvoiceItem.deleteMany({
        where: { purchaseInvoiceId: id }
      });

      // Delete the invoice
      return await tx.purchaseInvoice.delete({
        where: { id }
      });
    });
  }

  async searchPurchaseInvoices(filters: SearchFilters) {
    const where: any = {};

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        {
          invoiceNumber: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          notes: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      ];
    }

    return await this.prisma.purchaseInvoice.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async approvePurchaseInvoice(id: number) {
    return await this.updatePurchaseInvoiceStatus(id, PurchaseInvoiceStatus.APPROVED);
  }
}

export default PurchaseInvoiceService;