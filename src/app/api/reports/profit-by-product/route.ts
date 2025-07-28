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

    // Group by product and calculate profit metrics
    const productProfitSummary = new Map();
    let grandTotalRevenue = 0;
    let grandTotalCost = 0;
    let grandTotalProfit = 0;

    invoiceItems.forEach(item => {
      const productId = item.product.id;
      const productName = item.product.name;
      const productSku = item.product.sku;
      const categoryName = item.product.category?.name || 'Uncategorized';
      
      // Use weightedAverageCost from Product as requested
      const costPerUnit = item.product.weightedAverageCost || 0;
      const revenue = item.total;
      const cost = item.quantity * costPerUnit;
      const profit = revenue - cost;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      if (!productProfitSummary.has(productId)) {
        productProfitSummary.set(productId, {
          productId,
          productName,
          productSku,
          categoryName,
          totalQuantity: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          averageProfitMargin: 0,
          transactionCount: 0,
          weightedAverageCost: costPerUnit,
          transactions: [],
        });
      }

      const summary = productProfitSummary.get(productId);
      summary.totalQuantity += item.quantity;
      summary.totalRevenue += revenue;
      summary.totalCost += cost;
      summary.totalProfit += profit;
      summary.transactionCount += 1;
      
      // Calculate weighted average profit margin
      summary.averageProfitMargin = summary.totalRevenue > 0 
        ? (summary.totalProfit / summary.totalRevenue) * 100 
        : 0;

      summary.transactions.push({
        invoiceId: item.invoice.id,
        invoiceNumber: item.invoice.invoiceNumber,
        date: item.invoice.createdAt,
        quantity: item.quantity,
        unitPrice: item.price,
        unitCost: costPerUnit,
        revenue: revenue,
        cost: cost,
        profit: profit,
        profitMargin: profitMargin,
        customerName: item.invoice.customer?.name || 'Walk-in Customer',
        shopName: item.invoice.shop?.name || 'Unknown Shop',
        status: item.invoice.status,
      });

      grandTotalRevenue += revenue;
      grandTotalCost += cost;
      grandTotalProfit += profit;
    });

    // Convert to array and sort by profit margin
    const productData = Array.from(productProfitSummary.values())
      .sort((a, b) => b.averageProfitMargin - a.averageProfitMargin);

    // Calculate overall metrics
    const overallProfitMargin = grandTotalRevenue > 0 
      ? (grandTotalProfit / grandTotalRevenue) * 100 
      : 0;
    
    const averageProfitPerProduct = productData.length > 0 
      ? grandTotalProfit / productData.length 
      : 0;

    // Get top and bottom performers
    const topProfitMarginProducts = [...productData]
      .sort((a, b) => b.averageProfitMargin - a.averageProfitMargin)
      .slice(0, 10);
    
    const topProfitAmountProducts = [...productData]
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10);
    
    const lowProfitMarginProducts = [...productData]
      .sort((a, b) => a.averageProfitMargin - b.averageProfitMargin)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts: productData.length,
        totalTransactions: invoiceItems.length,
        grandTotalRevenue,
        grandTotalCost,
        grandTotalProfit,
        overallProfitMargin,
        averageProfitPerProduct,
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time',
        },
        statusFilter: status || 'all',
      },
      products: productData,
      topProfitMarginProducts,
      topProfitAmountProducts,
      lowProfitMarginProducts,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating profit by product report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate profit by product report' },
      { status: 500 }
    );
  }
}