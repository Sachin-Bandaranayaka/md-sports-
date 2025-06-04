import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { cacheService } from '@/lib/cache';
import { deduplicateRequest } from '@/lib/request-deduplication';

// Cache configuration
const CACHE_TTL = {
  LIST: 120, // 2 minutes for list queries
  STATS: 300, // 5 minutes for statistics
  SEARCH_SUGGESTIONS: 600, // 10 minutes for search suggestions
};

// Database query optimization helpers
const getOptimizedWhereClause = (params: {
  search?: string;
  status?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { search, status, supplierId, startDate, endDate } = params;
  const whereClause: any = {};

  // Optimized search with indexed fields
  if (search) {
    whereClause.OR = [
      {
        invoiceNumber: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        supplier: {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        }
      }
    ];
  }

  if (status) {
    whereClause.status = status;
  }

  if (supplierId) {
    whereClause.supplierId = parseInt(supplierId);
  }

  // Optimized date range queries
  if (startDate && endDate) {
    whereClause.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (startDate) {
    whereClause.date = {
      gte: new Date(startDate)
    };
  } else if (endDate) {
    whereClause.date = {
      lte: new Date(endDate)
    };
  }

  return whereClause;
};

// Optimized select fields to reduce data transfer
const getOptimizedSelectFields = (includeItems = false) => {
  const baseSelect = {
    id: true,
    invoiceNumber: true,
    date: true,
    totalAmount: true,
    status: true,
    supplierId: true,
    createdAt: true,
    updatedAt: true,
    supplier: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    }
  };

  if (includeItems) {
    return {
      ...baseSelect,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          productId: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          }
        }
      }
    };
  }

  return baseSelect;
};

// GET /api/purchases/optimized - Optimized purchase invoices endpoint
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Cap at 100
    const includeItems = searchParams.get('includeItems') === 'true';
    const export_data = searchParams.get('export') === 'true';
    const statsOnly = searchParams.get('statsOnly') === 'true';
    const searchSuggestions = searchParams.get('suggestions') === 'true';

    const skip = (page - 1) * limit;

    // Generate cache key
    const cacheKey = `purchases-optimized-${JSON.stringify({
      search, status, supplierId, startDate, endDate, page, limit, includeItems, statsOnly, searchSuggestions
    })}`;

    // Handle search suggestions
    if (searchSuggestions && search) {
      return deduplicateRequest(cacheKey, async () => {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return NextResponse.json(cached);
        }

        // Get unique invoice numbers and supplier names that match the search
        const [invoiceNumbers, supplierNames] = await Promise.all([
          prisma.purchaseInvoice.findMany({
            where: {
              invoiceNumber: {
                contains: search,
                mode: 'insensitive'
              }
            },
            select: { invoiceNumber: true },
            distinct: ['invoiceNumber'],
            take: 5
          }),
          prisma.supplier.findMany({
            where: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            },
            select: { name: true },
            take: 5
          })
        ]);

        const suggestions = [
          ...invoiceNumbers.map(inv => inv.invoiceNumber),
          ...supplierNames.map(sup => sup.name)
        ].slice(0, 10);

        await cacheService.set(cacheKey, suggestions, CACHE_TTL.SEARCH_SUGGESTIONS);
        return NextResponse.json(suggestions);
      });
    }

    // Handle statistics only
    if (statsOnly) {
      return deduplicateRequest(cacheKey, async () => {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return NextResponse.json(cached);
        }

        const whereClause = getOptimizedWhereClause({ search, status, supplierId, startDate, endDate });

        const [totalCount, totalAmount, statusCounts] = await Promise.all([
          prisma.purchaseInvoice.count({ where: whereClause }),
          prisma.purchaseInvoice.aggregate({
            where: whereClause,
            _sum: { totalAmount: true }
          }),
          prisma.purchaseInvoice.groupBy({
            by: ['status'],
            where: whereClause,
            _count: { status: true }
          })
        ]);

        const stats = {
          totalCount,
          totalAmount: totalAmount._sum.totalAmount || 0,
          statusBreakdown: statusCounts.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>)
        };

        await cacheService.set(cacheKey, stats, CACHE_TTL.STATS);
        return NextResponse.json(stats);
      });
    }

    // Handle export
    if (export_data) {
      const whereClause = getOptimizedWhereClause({ search, status, supplierId, startDate, endDate });

      const purchases = await prisma.purchaseInvoice.findMany({
        where: whereClause,
        select: getOptimizedSelectFields(true),
        orderBy: { date: 'desc' }
      });

      // Convert to CSV
      const csvHeaders = [
        'Invoice Number',
        'Supplier',
        'Date',
        'Total Amount',
        'Status',
        'Items Count',
        'Created At'
      ];

      const csvRows = purchases.map(purchase => [
        purchase.invoiceNumber,
        purchase.supplier?.name || 'N/A',
        new Date(purchase.date).toLocaleDateString(),
        purchase.totalAmount?.toString() || '0',
        purchase.status,
        purchase.items?.length.toString() || '0',
        new Date(purchase.createdAt).toLocaleDateString()
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="purchase-invoices-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Main list query with caching and deduplication
    return deduplicateRequest(cacheKey, async () => {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      const whereClause = getOptimizedWhereClause({ search, status, supplierId, startDate, endDate });

      // Use transaction for consistency and performance
      const [purchases, totalCount] = await prisma.$transaction([
        prisma.purchaseInvoice.findMany({
          where: whereClause,
          select: getOptimizedSelectFields(includeItems),
          orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit
        }),
        prisma.purchaseInvoice.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      const response = {
        data: purchases,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        meta: {
          cached: false,
          timestamp: new Date().toISOString()
        }
      };

      // Cache the response
      await cacheService.set(cacheKey, response, CACHE_TTL.LIST);

      return NextResponse.json(response);
    });

  } catch (error) {
    console.error('Error in optimized purchases API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}

// POST /api/purchases/optimized - Create purchase invoice with optimizations
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      invoiceNumber,
      supplierId,
      date,
      items,
      notes,
      status = 'unpaid'
    } = body;

    // Validation
    if (!invoiceNumber || !supplierId || !date || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceNumber, supplierId, date, items' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the purchase invoice
      const purchaseInvoice = await tx.purchaseInvoice.create({
        data: {
          invoiceNumber,
          supplierId: parseInt(supplierId),
          date: new Date(date),
          totalAmount,
          status,
          notes,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice
            }))
          }
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        }
      });

      // Update inventory levels if status is paid
      if (status === 'paid') {
        for (const item of items) {
          await tx.inventory.updateMany({
            where: {
              productId: item.productId
            },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        }
      }

      return purchaseInvoice;
    });

    // Clear related caches
    await Promise.all([
      cacheService.clear('purchases-optimized'),
      cacheService.clear('purchase-stats'),
      cacheService.clear('inventory')
    ]);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Purchase invoice created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating purchase invoice:', error);
    return NextResponse.json(
      {
        error: 'Failed to create purchase invoice',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}

// PUT /api/purchases/optimized/[id] - Update purchase invoice
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      invoiceNumber,
      supplierId,
      date,
      items,
      notes,
      status
    } = body;

    // Calculate total amount if items are provided
    const totalAmount = items ? items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0) : undefined;

    const result = await prisma.$transaction(async (tx) => {
      // Get current invoice for comparison
      const currentInvoice = await tx.purchaseInvoice.findUnique({
        where: { id: parseInt(id) },
        include: { items: true }
      });

      if (!currentInvoice) {
        throw new Error('Purchase invoice not found');
      }

      // Update the purchase invoice
      const updatedInvoice = await tx.purchaseInvoice.update({
        where: { id: parseInt(id) },
        data: {
          ...(invoiceNumber && { invoiceNumber }),
          ...(supplierId && { supplierId: parseInt(supplierId) }),
          ...(date && { date: new Date(date) }),
          ...(totalAmount !== undefined && { totalAmount }),
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
          ...(items && {
            items: {
              deleteMany: {},
              create: items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice
              }))
            }
          })
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        }
      });

      // Handle inventory updates if status changed to/from paid
      if (status && status !== currentInvoice.status) {
        const itemsToProcess = items || currentInvoice.items;

        if (status === 'paid' && currentInvoice.status !== 'paid') {
          // Add to inventory
          for (const item of itemsToProcess) {
            await tx.inventory.updateMany({
              where: { productId: item.productId },
              data: {
                quantity: { increment: item.quantity }
              }
            });
          }
        } else if (status !== 'paid' && currentInvoice.status === 'paid') {
          // Remove from inventory
          for (const item of itemsToProcess) {
            await tx.inventory.updateMany({
              where: { productId: item.productId },
              data: {
                quantity: { decrement: item.quantity }
              }
            });
          }
        }
      }

      return updatedInvoice;
    });

    // Clear related caches
    await Promise.all([
      cacheService.clear('purchases-optimized'),
      cacheService.clear('purchase-stats'),
      cacheService.clear('inventory')
    ]);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Purchase invoice updated successfully'
    });

  } catch (error) {
    console.error('Error updating purchase invoice:', error);
    return NextResponse.json(
      {
        error: 'Failed to update purchase invoice',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/purchases/optimized/[id] - Delete purchase invoice
export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get invoice details before deletion
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: parseInt(id) },
        include: { items: true }
      });

      if (!invoice) {
        throw new Error('Purchase invoice not found');
      }

      // If invoice was paid, adjust inventory
      if (invoice.status === 'paid') {
        for (const item of invoice.items) {
          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: {
              quantity: { decrement: item.quantity }
            }
          });
        }
      }

      // Delete the invoice (items will be deleted due to cascade)
      await tx.purchaseInvoice.delete({
        where: { id: parseInt(id) }
      });

      return invoice;
    });

    // Clear related caches
    await Promise.all([
      cacheService.clear('purchases-optimized'),
      cacheService.clear('purchase-stats'),
      cacheService.clear('inventory')
    ]);

    return NextResponse.json({
      success: true,
      message: 'Purchase invoice deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting purchase invoice:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete purchase invoice',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}