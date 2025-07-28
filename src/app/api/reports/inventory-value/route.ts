import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const categoryId = searchParams.get('categoryId');

    // Build where clause
    const whereClause: any = {
      quantity: { gt: 0 }, // Only items with stock
    };
    
    if (shopId) {
      whereClause.shopId = shopId;
    }
    
    if (categoryId) {
      whereClause.product = {
        categoryId: categoryId,
      };
    }

    // Get inventory items with product, category, and shop details
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        shop: true,
      },
    });

    // Calculate value summary by shop and category
    const summaryByShop = new Map();
    const summaryByCategory = new Map();
    const summaryByShopCategory = new Map();
    let totalValue = 0;
    let totalItems = 0;

    inventoryItems.forEach(item => {
      const value = item.quantity * (item.shopSpecificCost || 0);
      totalValue += value;
      totalItems += item.quantity;

      // By shop
      const shopKey = item.shop.id;
      if (!summaryByShop.has(shopKey)) {
        summaryByShop.set(shopKey, {
          shopId: item.shop.id,
          shopName: item.shop.name,
          totalValue: 0,
          totalItems: 0,
          productCount: 0,
        });
      }
      const shopSummary = summaryByShop.get(shopKey);
      shopSummary.totalValue += value;
      shopSummary.totalItems += item.quantity;
      shopSummary.productCount += 1;

      // By category
      const categoryKey = item.product.category?.id || 'uncategorized';
      const categoryName = item.product.category?.name || 'Uncategorized';
      if (!summaryByCategory.has(categoryKey)) {
        summaryByCategory.set(categoryKey, {
          categoryId: categoryKey,
          categoryName,
          totalValue: 0,
          totalItems: 0,
          productCount: 0,
        });
      }
      const categorySummary = summaryByCategory.get(categoryKey);
      categorySummary.totalValue += value;
      categorySummary.totalItems += item.quantity;
      categorySummary.productCount += 1;

      // By shop and category combination
      const shopCategoryKey = `${item.shop.id}-${categoryKey}`;
      if (!summaryByShopCategory.has(shopCategoryKey)) {
        summaryByShopCategory.set(shopCategoryKey, {
          shopId: item.shop.id,
          shopName: item.shop.name,
          categoryId: categoryKey,
          categoryName,
          totalValue: 0,
          totalItems: 0,
          productCount: 0,
        });
      }
      const shopCategorySummary = summaryByShopCategory.get(shopCategoryKey);
      shopCategorySummary.totalValue += value;
      shopCategorySummary.totalItems += item.quantity;
      shopCategorySummary.productCount += 1;
    });

    // Prepare detailed items for export
    const detailedItems = inventoryItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      barcode: item.product.barcode,
      categoryName: item.product.category?.name || 'Uncategorized',
      shopName: item.shop.name,
      quantity: item.quantity,
      shopSpecificCost: item.shopSpecificCost || 0,
      totalValue: item.quantity * (item.shopSpecificCost || 0),
      lastUpdated: item.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalValue,
        totalItems,
        totalProducts: inventoryItems.length,
        averageValuePerItem: totalItems > 0 ? totalValue / totalItems : 0,
      },
      byShop: Array.from(summaryByShop.values()),
      byCategory: Array.from(summaryByCategory.values()),
      byShopCategory: Array.from(summaryByShopCategory.values()),
      details: detailedItems,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating inventory value summary:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate inventory value summary' },
      { status: 500 }
    );
  }
}