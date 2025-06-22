import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission, getUserIdFromToken } from '@/lib/auth';
import { permissionService } from '@/lib/services/PermissionService';

export async function fetchSalesData(shopId?: string | null, periodDays?: number, startDate?: Date, endDate?: Date, userId?: string | null) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
        start = startDate;
        end = endDate;
    } else {
        // Default behavior - last 6 months
        const now = new Date();
        end = new Date();
        start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }
    
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
                    ...(shopId ? { shopId } : {}),
                    ...(userId ? { createdBy: userId } : {})
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
}

// GET: Fetch monthly sales data with shop-based filtering
export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'view_sales');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Get user ID from token
        const tokenUserId = await getUserIdFromToken(request);
        if (!tokenUserId) {
            return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
        }

        // Fetch user details to check role and permissions
        const user = await prisma.user.findUnique({
            where: { id: tokenUserId },
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                roleName: true,
                permissions: true,
                shopId: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user is admin or has admin permissions
        const isAdmin = user.roleName === 'Admin' || user.roleName === 'Super Admin' || 
                       await permissionService.hasPermission(user, 'admin:all') || 
                       await permissionService.hasPermission(user, 'ALL');

        // Determine user filtering
        let filterUserId: string | null = null;
        if (!isAdmin) {
            filterUserId = tokenUserId;
        }

        const shopId = context.isFiltered ? context.shopId : null;
        
        // Determine date range
        const endDate = endDateParam ? new Date(endDateParam) : new Date();
        const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Create cache key that includes shop context and user context and date range
        const userContext = isAdmin ? 'admin' : filterUserId;
        const dateRangeKey = `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
        const cacheKey = `dashboard:sales:${shopId || 'all'}:user:${userContext}:${dateRangeKey}`;
        
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
        const salesResult = await fetchSalesData(
            shopId,
            undefined,
            startDate,
            endDate,
            filterUserId
        );

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

        // Return empty array on error
        return NextResponse.json({
            success: false,
            data: [],
            message: error instanceof Error ? error.message : 'Unknown error',
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId,
                error: true
            }
        });
    }
});