import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const invoiceItems = await prisma.invoiceItem.findMany({
            where: {
                invoice: {
                    status: 'PAID', // Consider only PAID invoices for sales performance
                    createdAt: {
                        gte: firstDayOfMonth,
                        lte: lastDayOfMonth,
                    },
                },
            },
            include: {
                product: {
                    include: {
                        category: true, // Include category information
                    },
                },
                invoice: true, // To confirm invoice date and status if needed for double check
            },
        });

        if (invoiceItems.length === 0) {
            return NextResponse.json({
                success: true,
                details: [], // Will be an array of categories, each with a products array
                summary: {
                    month: now.toLocaleString('default', { month: 'long' }),
                    year: now.getFullYear(),
                    overallTotalRevenue: 0,
                    overallTotalProductsSold: 0,
                    numberOfCategoriesWithSales: 0
                },
                generatedAt: new Date().toISOString(),
                message: 'No sales data found for products in the current month.'
            });
        }

        // Aggregate data by product
        const productPerformance: Record<string, {
            productId: number;
            productName: string;
            sku: string | null;
            categoryId: number | null;
            categoryName: string;
            totalQuantitySold: number;
            totalSalesAmount: number;
        }> = {};

        invoiceItems.forEach(item => {
            const productIdString = item.productId.toString(); // Use string for object key
            if (!productPerformance[productIdString]) {
                productPerformance[productIdString] = {
                    productId: item.productId,
                    productName: item.product.name,
                    sku: item.product.sku,
                    categoryId: item.product.categoryId,
                    categoryName: item.product.category?.name || 'Uncategorized',
                    totalQuantitySold: 0,
                    totalSalesAmount: 0,
                };
            }
            productPerformance[productIdString].totalQuantitySold += item.quantity;
            productPerformance[productIdString].totalSalesAmount += item.total;
        });

        // Further group by category
        const categoryPerformanceIntermediate: Record<string, { categoryName: string; products: any[]; totalCategorySales: number; totalCategoryQuantity: number; }> = {};
        Object.values(productPerformance).forEach(product => {
            const categoryNameKey = product.categoryName; // Use category name as key

            if (!categoryPerformanceIntermediate[categoryNameKey]) {
                categoryPerformanceIntermediate[categoryNameKey] = {
                    categoryName: product.categoryName,
                    products: [],
                    totalCategorySales: 0,
                    totalCategoryQuantity: 0,
                };
            }
            categoryPerformanceIntermediate[categoryNameKey].products.push(product);
            categoryPerformanceIntermediate[categoryNameKey].totalCategorySales += product.totalSalesAmount;
            categoryPerformanceIntermediate[categoryNameKey].totalCategoryQuantity += product.totalQuantitySold;
        });

        // Sort products within each category by sales amount
        for (const catName in categoryPerformanceIntermediate) {
            categoryPerformanceIntermediate[catName].products.sort((a, b) => b.totalSalesAmount - a.totalSalesAmount);
        }

        // Convert intermediate object to array and sort categories by sales amount
        const reportDetails = Object.values(categoryPerformanceIntermediate).sort((a, b) => b.totalCategorySales - a.totalCategorySales);

        const overallTotalRevenue = reportDetails.reduce((sum, cat) => sum + cat.totalCategorySales, 0);
        const overallTotalProductsSold = reportDetails.reduce((sum, cat) => sum + cat.totalCategoryQuantity, 0);

        return NextResponse.json({
            success: true,
            details: reportDetails, // Array of categories, each with products array
            summary: {
                month: now.toLocaleString('default', { month: 'long' }),
                year: now.getFullYear(),
                overallTotalRevenue: overallTotalRevenue,
                overallTotalProductsSold: overallTotalProductsSold,
                numberOfCategoriesWithSales: reportDetails.length,
            },
            generatedAt: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('Error fetching product performance report:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch product performance report', error: error.message },
            { status: 500 }
        );
    }
} 