import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';

// Filtered version of fetchSalesData with date range and shop support
export async function fetchSalesDataFiltered(startDate?: string | null, endDate?: string | null, shopId?: number | null) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (startDate && endDate) {
        // Custom date range - generate monthly data within the range
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const months = [];
        const current = new Date(start.getFullYear(), start.getMonth(), 1);

        while (current <= end) {
            const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);

            // Ensure we don't go beyond the specified end date
            const actualEnd = monthEnd > end ? end : monthEnd;
            const actualStart = monthStart < start ? start : monthStart;

            const monthlyInvoices = await safeQuery(
                () => prisma.invoice.aggregate({
                    where: {
                        createdAt: {
                            gte: actualStart,
                            lte: actualEnd
                        },
                        ...(shopId ? { shopId } : {})
                    },
                    _sum: {
                        total: true
                    }
                }),
                { _sum: { total: null } },
                `Failed to fetch invoice data for ${monthNames[current.getMonth()]} ${current.getFullYear()}`
            );

            months.push({
                month: `${monthNames[current.getMonth()]} ${current.getFullYear()}`,
                sales: monthlyInvoices._sum.total || 0
            });

            // Move to next month
            current.setMonth(current.getMonth() + 1);
        }

        return {
            success: true,
            data: months
        };
    } else {
        // Default behavior - last 6 months
        return fetchSalesData();
    }
}

export async function fetchSalesData(shopId?: number | null) {
    // Get current month and year
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (0 = January)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Prepare the result array with 6 months of data (current month and 5 previous months)
    const months = [];

    for (let i = 5; i >= 0; i--) {
        // Calculate month index (handle wrapping to previous year)
        let monthIndex = currentMonth - i;
        let yearToUse = currentYear;

        if (monthIndex < 0) {
            monthIndex += 12;
            yearToUse -= 1;
        }

        // Create start and end date for this month
        const startDate = new Date(yearToUse, monthIndex, 1);
        const endDate = new Date(yearToUse, monthIndex + 1, 0, 23, 59, 59, 999);

        // Query actual invoices for this month
        const monthlyInvoices = await safeQuery(
            () => prisma.invoice.aggregate({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    },
                    ...(shopId ? { shopId } : {})
                },
                _sum: {
                    total: true
                }
            }),
            { _sum: { total: null } }, // Default to null if query fails
            `Failed to fetch invoice data for ${monthNames[monthIndex]} ${yearToUse}`
        );

        // Add the month data to our result array
        months.push({
            month: monthNames[monthIndex],
            sales: monthlyInvoices._sum.total || 0 // Use 0 if no sales data
        });
    }
    return {
        success: true,
        data: months
    };
}

// GET: Fetch monthly sales data with shop-based filtering
export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_sales');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        console.log('Sales API - Shop context:', {
            shopId: context.shopId,
            isFiltered: context.isFiltered,
            isAdmin: context.isAdmin,
            userShopId: context.userShopId
        });

        // Create cache key that includes shop context
        const cacheKey = context.isFiltered ? `dashboard:sales:shop:${context.shopId}` : 'dashboard:sales:all';
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            console.log('✅ Sales data served from cache');
            return NextResponse.json({
                ...cachedData,
                meta: {
                    shopFiltered: context.isFiltered,
                    shopId: context.shopId,
                    fromCache: true
                }
            });
        }

        console.log('🔄 Fetching fresh sales data');
        const salesResult = await fetchSalesData(context.isFiltered ? context.shopId : null);

        // Cache for 5 minutes (sales data changes less frequently)
        await cacheService.set(cacheKey, salesResult, 300);
        console.log('💾 Sales data cached for 5 minutes');

        return NextResponse.json({
            ...salesResult,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                fromCache: false
            }
        });
    } catch (error) {
        console.error('Error generating sales data:', error);

        // Return months with zero values on error, consistent with original logic
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const currentMonth = now.getMonth();

        const emptyMonths = Array(6).fill(0).map((_, i) => {
            let monthIndex = currentMonth - i;
            if (monthIndex < 0) monthIndex += 12;

            return {
                month: monthNames[monthIndex],
                sales: 0
            };
        }).reverse();

        return NextResponse.json({
            success: true, // Or false
            data: emptyMonths,
            message: error instanceof Error ? error.message : 'Unknown error',
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                error: true
            }
        });
    }
});