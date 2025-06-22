import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';
import { validateTokenPermission } from '@/lib/auth';

const prisma = new PrismaClient();

// This function can be moved to a lib/data-access layer later
async function fetchCustomersData(shopId: string | null) {
    try {
        const whereClause: any = {};
        if (shopId) {
            whereClause.shopId = shopId;
        }

        const totalCustomers = await prisma.customer.count({ where });
        const newCustomersThisWeek = await prisma.customer.count({
            where: {
                ...whereClause,
                createdAt: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                },
            },
        });
        const customerTypes = await prisma.customer.groupBy({
            by: ['customerType'],
            _count: {
                id: true,
            },
            where: whereClause,
        });

        return {
            success: true,
            data: {
                totalCustomers,
                newCustomersThisWeek,
                customerTypes: customerTypes.map(ct => ({
                    type: ct.customerType,
                    count: ct._count.id
                })),
            },
        };

    } catch (error) {
        console.error('Error fetching customers dashboard data:', error);
        return {
            success: false,
            error: 'Failed to fetch customer data'
        };
    }
}

export const GET = ShopAccessControl.withShopAccess(async (request: NextRequest, context) => {
    try {
        // Validate token and permissions
        const authResult = await validateTokenPermission(request, 'dashboard:view');
        if (!authResult.isValid) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }

        const result = await fetchCustomersData(context.isFiltered ? context.shopId : null);

        return NextResponse.json({
            success: result.success,
            data: result.success ? result.data : null,
            error: result.success ? null : result.error,
            meta: {
                shopFiltered: context.isFiltered,
                shopId: context.shopId
            }
        });

    } catch (error) {
        console.error('Error in customers dashboard API:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch customers dashboard data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}); 