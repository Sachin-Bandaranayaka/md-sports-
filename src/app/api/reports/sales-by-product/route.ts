import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status'); // 'all', 'paid', 'pending', 'partial'
    const shopId = searchParams.get('shopId');
    const categoryId = searchParams.get('categoryId');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Build where clause for invoices
    const invoiceWhereClause: any = {};
    
    if (Object.keys(dateFilter).length > 0) {
      invoiceWhereClause.createdAt = dateFilter;
    }
    
    if (status && status !== 'all') {
      invoiceWhereClause.status = status;
    }
    
    if (shopId) {
      invoiceWhereClause.shopId = shopId;
    }

    // Build where clause for products (through invoice items)
    const productWhereClause: any = {};
    if (categoryId) {
      productWhereClause.categoryId = categoryId;
    }

    // Get invoice items with related data
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: invoiceWhereClause,
        product: productWhereClause,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        invoice: {
          include: {
            customer: true,
            shop: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by product and calculate totals
    const productSummary = new Map();
    let grandTotalRevenue = 0;
    let grandTotalQuantity = 0;

    invoiceItems.forEach(item => {
      const productId = item.product.id;
      const productName = item.product.name;
      const productSku = item.product.sku;
      const categoryName = item.product.category?.name || 'Uncategorized';

      if (!productSummary.has(productId)) {
        productSummary.set(productId, {
          productId,
          productName,
          productSku,
          categoryName,
          totalQuantity: 0,
          totalRevenue: 0,
          invoiceCount: 0,
          averagePrice: 0,
          transactions: [],
        });
      }

      const summary = productSummary.get(productId);
      summary.totalQuantity += item.quantity;
      summary.totalRevenue += item.total;
      summary.invoiceCount += 1;
      summary.averagePrice = summary.totalRevenue / summary.totalQuantity;

      summary.transactions.push({
        invoiceId: item.invoice.id,
        invoiceNumber: item.invoice.invoiceNumber,
        date: item.invoice.createdAt,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.total,
        customerName: item.invoice.customer?.name || 'Walk-in Customer',
        shopName: item.invoice.shop?.name || 'Unknown Shop',
        status: item.invoice.status,
      });

      grandTotalRevenue += item.total;
      grandTotalQuantity += item.quantity;
    });

    // Convert to array and sort by total revenue
    const productData = Array.from(productSummary.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate additional metrics
    const averageRevenuePerProduct = productData.length > 0 ? grandTotalRevenue / productData.length : 0;
    const averageQuantityPerProduct = productData.length > 0 ? grandTotalQuantity / productData.length : 0;
    const averagePriceOverall = grandTotalQuantity > 0 ? grandTotalRevenue / grandTotalQuantity : 0;

    // Get top selling products by quantity and revenue
    const topByQuantity = [...productData]
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
    
    const topByRevenue = [...productData]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts: productData.length,
        totalTransactions: invoiceItems.length,
        grandTotalQuantity,
        grandTotalRevenue,
        averageRevenuePerProduct,
        averageQuantityPerProduct,
        averagePriceOverall,
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time',
        },
        statusFilter: status || 'all',
      },
      products: productData,
      topByQuantity,
      topByRevenue,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating sales by product report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate sales by product report' },
      { status: 500 }
    );
  }
}