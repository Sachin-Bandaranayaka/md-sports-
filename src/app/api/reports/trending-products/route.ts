import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const includeAiInsights = searchParams.get('includeAiInsights') === 'true';

    const now = new Date();
    
    // Calculate date ranges
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setTime(endOfLastWeek.getTime() - 1);

    // Build shop filter
    const shopFilter = shopId ? { shopId } : {};

    // Get current week's top selling products
    const currentWeekSales = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          ...shopFilter,
          status: 'paid',
          createdAt: {
            gte: startOfWeek,
          },
        },
      },
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

    // Get current month's top selling products
    const currentMonthSales = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          ...shopFilter,
          status: 'paid',
          createdAt: {
            gte: startOfMonth,
          },
        },
      },
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

    // Get last week's sales for comparison
    const lastWeekSales = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          ...shopFilter,
          status: 'paid',
          createdAt: {
            gte: startOfLastWeek,
            lte: endOfLastWeek,
          },
        },
      },
      include: {
        product: true,
      },
    });

    // Get last month's sales for comparison
    const lastMonthSales = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          ...shopFilter,
          status: 'paid',
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      },
      include: {
        product: true,
      },
    });

    // Helper function to aggregate sales data
    const aggregateSales = (salesData: any[]) => {
      const productMap = new Map();
      
      salesData.forEach(item => {
        const productId = item.product.id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productId,
            productName: item.product.name,
            sku: item.product.sku,
            categoryName: item.product.category?.name || 'Uncategorized',
            totalQuantity: 0,
            totalRevenue: 0,
            transactionCount: 0,
            averagePrice: 0,
          });
        }
        
        const product = productMap.get(productId);
        product.totalQuantity += item.quantity;
        product.totalRevenue += item.total;
        product.transactionCount += 1;
        product.averagePrice = product.totalRevenue / product.totalQuantity;
      });
      
      return Array.from(productMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity);
    };

    // Aggregate data for each period
    const weeklyTopProducts = aggregateSales(currentWeekSales).slice(0, 10);
    const monthlyTopProducts = aggregateSales(currentMonthSales).slice(0, 10);
    const lastWeekProducts = aggregateSales(lastWeekSales);
    const lastMonthProducts = aggregateSales(lastMonthSales);

    // Calculate trends and growth
    const calculateTrends = (currentData: any[], previousData: any[]) => {
      const previousMap = new Map();
      previousData.forEach(item => {
        previousMap.set(item.productId, item);
      });
      
      return currentData.map(current => {
        const previous = previousMap.get(current.productId);
        const quantityGrowth = previous 
          ? ((current.totalQuantity - previous.totalQuantity) / previous.totalQuantity) * 100 
          : 100; // 100% growth if new product
        const revenueGrowth = previous 
          ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100 
          : 100;
        
        return {
          ...current,
          quantityGrowth,
          revenueGrowth,
          isNewEntry: !previous,
          previousQuantity: previous?.totalQuantity || 0,
          previousRevenue: previous?.totalRevenue || 0,
        };
      });
    };

    const weeklyTrends = calculateTrends(weeklyTopProducts, lastWeekProducts);
    const monthlyTrends = calculateTrends(monthlyTopProducts, lastMonthProducts);

    // Prepare AI insights data if requested
    let aiInsights = null;
    if (includeAiInsights) {
      const aiAnalysisData = {
        weeklyTopProducts: weeklyTrends.slice(0, 5),
        monthlyTopProducts: monthlyTrends.slice(0, 5),
        weeklyGrowthProducts: weeklyTrends
          .filter(p => p.quantityGrowth > 0)
          .sort((a, b) => b.quantityGrowth - a.quantityGrowth)
          .slice(0, 3),
        monthlyGrowthProducts: monthlyTrends
          .filter(p => p.quantityGrowth > 0)
          .sort((a, b) => b.quantityGrowth - a.quantityGrowth)
          .slice(0, 3),
        newEntries: {
          weekly: weeklyTrends.filter(p => p.isNewEntry),
          monthly: monthlyTrends.filter(p => p.isNewEntry),
        },
      };

      // Generate AI insights using DeepSeek
      try {
        const aiResponse = await fetch(`${process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com'}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'You are a business analyst AI specializing in retail sales trends. Analyze the provided sales data and provide actionable insights about product performance, trends, and recommendations for inventory management and marketing strategies. Keep your response concise and business-focused.',
              },
              {
                role: 'user',
                content: `Analyze this sales trend data and provide insights:\n\n${JSON.stringify(aiAnalysisData, null, 2)}`,
              },
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          aiInsights = {
            analysis: aiResult.choices[0]?.message?.content || 'AI analysis unavailable',
            generatedAt: new Date().toISOString(),
          };
        }
      } catch (aiError) {
        console.error('AI insights generation failed:', aiError);
        aiInsights = {
          analysis: 'AI insights temporarily unavailable. Please try again later.',
          error: true,
        };
      }
    }

    // Calculate summary statistics
    const weeklyTotalQuantity = weeklyTopProducts.reduce((sum, p) => sum + p.totalQuantity, 0);
    const weeklyTotalRevenue = weeklyTopProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
    const monthlyTotalQuantity = monthlyTopProducts.reduce((sum, p) => sum + p.totalQuantity, 0);
    const monthlyTotalRevenue = monthlyTopProducts.reduce((sum, p) => sum + p.totalRevenue, 0);

    return NextResponse.json({
      success: true,
      summary: {
        weeklyStats: {
          totalProducts: weeklyTopProducts.length,
          totalQuantitySold: weeklyTotalQuantity,
          totalRevenue: weeklyTotalRevenue,
          averageRevenuePerProduct: weeklyTopProducts.length > 0 ? weeklyTotalRevenue / weeklyTopProducts.length : 0,
        },
        monthlyStats: {
          totalProducts: monthlyTopProducts.length,
          totalQuantitySold: monthlyTotalQuantity,
          totalRevenue: monthlyTotalRevenue,
          averageRevenuePerProduct: monthlyTopProducts.length > 0 ? monthlyTotalRevenue / monthlyTopProducts.length : 0,
        },
        dateRanges: {
          currentWeek: { start: startOfWeek.toISOString(), end: now.toISOString() },
          currentMonth: { start: startOfMonth.toISOString(), end: now.toISOString() },
        },
      },
      weeklyTopProducts: weeklyTrends,
      monthlyTopProducts: monthlyTrends,
      aiInsights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating trending products report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate trending products report' },
      { status: 500 }
    );
  }
}