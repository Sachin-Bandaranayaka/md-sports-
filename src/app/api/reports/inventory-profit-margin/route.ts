import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const shopId = searchParams.get('shopId');
    const categoryId = searchParams.get('categoryId');

    // Build date filter for sales analysis
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Build where clause for inventory items
    const inventoryWhereClause: any = {
      quantity: { gt: 0 }, // Only items with stock
    };
    
    if (shopId) {
      inventoryWhereClause.shopId = shopId;
    }
    
    if (categoryId) {
      inventoryWhereClause.product = {
        categoryId: categoryId,
      };
    }

    // Get current inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: inventoryWhereClause,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        shop: true,
      },
    });

    // Get historical sales data for these products within the date range
    const productIds = inventoryItems.map(item => item.product.id);
    
    const salesWhereClause: any = {
      product: {
        id: { in: productIds },
      },
      invoice: {
        status: 'paid', // Only consider paid invoices for profit calculation
      },
    };
    
    if (Object.keys(dateFilter).length > 0) {
      salesWhereClause.invoice.createdAt = dateFilter;
    }
    
    if (shopId) {
      salesWhereClause.invoice.shopId = shopId;
    }

    const salesData = await prisma.invoiceItem.findMany({
      where: salesWhereClause,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        invoice: {
          include: {
            shop: true,
          },
        },
      },
    });

    // Create a map of product sales performance
    const productSalesMap = new Map();
    salesData.forEach(sale => {
      const productId = sale.product.id;
      if (!productSalesMap.has(productId)) {
        productSalesMap.set(productId, {
          totalQuantitySold: 0,
          totalRevenue: 0,
          totalCost: 0,
          salesCount: 0,
          averageSellingPrice: 0,
        });
      }
      
      const salesInfo = productSalesMap.get(productId);
      const costPerUnit = sale.product.weightedAverageCost || 0;
      const cost = sale.quantity * costPerUnit;
      
      salesInfo.totalQuantitySold += sale.quantity;
      salesInfo.totalRevenue += sale.total;
      salesInfo.totalCost += cost;
      salesInfo.salesCount += 1;
      salesInfo.averageSellingPrice = salesInfo.totalRevenue / salesInfo.totalQuantitySold;
    });

    // Calculate profit margins for inventory items
    const inventoryProfitData = inventoryItems.map(item => {
      const productId = item.product.id;
      const currentSellingPrice = item.product.price;
      const currentCost = item.product.weightedAverageCost || 0;
      const shopSpecificCost = item.shopSpecificCost || currentCost;
      
      // Current profit margin based on current prices
      const currentProfitMargin = currentSellingPrice > 0 
        ? ((currentSellingPrice - shopSpecificCost) / currentSellingPrice) * 100 
        : 0;
      
      // Historical sales performance
      const salesInfo = productSalesMap.get(productId) || {
        totalQuantitySold: 0,
        totalRevenue: 0,
        totalCost: 0,
        salesCount: 0,
        averageSellingPrice: 0,
      };
      
      const historicalProfitMargin = salesInfo.totalRevenue > 0 
        ? ((salesInfo.totalRevenue - salesInfo.totalCost) / salesInfo.totalRevenue) * 100 
        : 0;
      
      const inventoryValue = item.quantity * shopSpecificCost;
      const potentialRevenue = item.quantity * currentSellingPrice;
      const potentialProfit = potentialRevenue - inventoryValue;
      
      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        barcode: item.product.barcode,
        categoryName: item.product.category?.name || 'Uncategorized',
        shopName: item.shop.name,
        currentStock: item.quantity,
        currentSellingPrice,
        shopSpecificCost,
        weightedAverageCost: currentCost,
        currentProfitMargin,
        historicalProfitMargin,
        inventoryValue,
        potentialRevenue,
        potentialProfit,
        // Historical sales metrics
        totalQuantitySold: salesInfo.totalQuantitySold,
        totalRevenue: salesInfo.totalRevenue,
        salesCount: salesInfo.salesCount,
        averageSellingPrice: salesInfo.averageSellingPrice,
        turnoverRate: item.quantity > 0 ? salesInfo.totalQuantitySold / item.quantity : 0,
        lastUpdated: item.updatedAt,
      };
    });

    // Sort by current profit margin (descending)
    const sortedData = inventoryProfitData.sort((a, b) => b.currentProfitMargin - a.currentProfitMargin);

    // Calculate summary statistics
    const totalInventoryValue = inventoryProfitData.reduce((sum, item) => sum + item.inventoryValue, 0);
    const totalPotentialRevenue = inventoryProfitData.reduce((sum, item) => sum + item.potentialRevenue, 0);
    const totalPotentialProfit = inventoryProfitData.reduce((sum, item) => sum + item.potentialProfit, 0);
    const averageCurrentProfitMargin = inventoryProfitData.length > 0 
      ? inventoryProfitData.reduce((sum, item) => sum + item.currentProfitMargin, 0) / inventoryProfitData.length 
      : 0;
    const averageHistoricalProfitMargin = inventoryProfitData.length > 0 
      ? inventoryProfitData.reduce((sum, item) => sum + item.historicalProfitMargin, 0) / inventoryProfitData.length 
      : 0;

    // Get top and bottom performers
    const highProfitMarginItems = sortedData.slice(0, 10);
    const lowProfitMarginItems = [...sortedData].reverse().slice(0, 10);
    const highTurnoverItems = [...inventoryProfitData]
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts: inventoryProfitData.length,
        totalInventoryValue,
        totalPotentialRevenue,
        totalPotentialProfit,
        overallProfitMargin: totalPotentialRevenue > 0 
          ? (totalPotentialProfit / totalPotentialRevenue) * 100 
          : 0,
        averageCurrentProfitMargin,
        averageHistoricalProfitMargin,
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time',
        },
      },
      products: sortedData,
      highProfitMarginItems,
      lowProfitMarginItems,
      highTurnoverItems,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating inventory profit margin report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate inventory profit margin report' },
      { status: 500 }
    );
  }
}