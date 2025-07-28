import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build shop filter
    const shopFilter = shopId ? { shopId } : {};

    // Get inventory items with product and shop details
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        ...shopFilter,
      },
      include: {
        product: {
          include: {
            category: true,
            invoiceItems: {
              where: {
                createdAt: {
                  gte: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Default 90 days
                  lte: endDate ? new Date(endDate) : new Date(),
                },
              },
            },
          },
        },
        shop: true,
      },
    });

    // Calculate quality metrics for each item
    const qualityData = inventoryItems.map(item => {
      const totalSold = item.product.invoiceItems.reduce((sum, invoiceItem) => sum + invoiceItem.quantity, 0);
      const daysSinceLastSale = item.product.invoiceItems.length > 0 
        ? Math.floor((Date.now() - new Date(Math.max(...item.product.invoiceItems.map(ii => new Date(ii.createdAt).getTime()))).getTime()) / (1000 * 60 * 60 * 24))
        : 999; // High number for never sold
      
      const turnoverRate = totalSold > 0 ? (totalSold / item.quantity) * 30 : 0; // Monthly turnover rate
      const isLowStock = item.quantity <= (item.product.minStockLevel || 10);
      const isOverstock = item.quantity > (item.product.minStockLevel || 10) * 5; // 5x min stock level
      const isDeadStock = daysSinceLastSale > 90 && item.quantity > 0;
      
      return {
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        category: item.product.category?.name || 'Uncategorized',
        shopName: item.shop.name,
        currentStock: item.quantity,
        minStockLevel: item.product.minStockLevel || 10,
        totalSold,
        daysSinceLastSale,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        isLowStock,
        isOverstock,
        isDeadStock,
        stockValue: item.quantity * (item.shopSpecificCost || item.product.weightedAverageCost || 0),
        status: isDeadStock ? 'Dead Stock' : isLowStock ? 'Low Stock' : isOverstock ? 'Overstock' : 'Normal',
      };
    });

    // Summary statistics
    const summary = {
      totalItems: qualityData.length,
      lowStockItems: qualityData.filter(item => item.isLowStock).length,
      overstockItems: qualityData.filter(item => item.isOverstock).length,
      deadStockItems: qualityData.filter(item => item.isDeadStock).length,
      normalItems: qualityData.filter(item => !item.isLowStock && !item.isOverstock && !item.isDeadStock).length,
      totalStockValue: qualityData.reduce((sum, item) => sum + item.stockValue, 0),
      averageTurnoverRate: qualityData.length > 0 ? qualityData.reduce((sum, item) => sum + item.turnoverRate, 0) / qualityData.length : 0,
    };

    return NextResponse.json({
      success: true,
      data: qualityData,
      summary,
    });
  } catch (error) {
    console.error('Error generating inventory quality report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate inventory quality report' },
      { status: 500 }
    );
  }
}