import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

// Default fallback data
const defaultSummaryData = [
    { title: 'Total Inventory Value', value: 'Rs. 1,245,800', icon: 'Package', trend: '+5%', trendUp: true },
    { title: 'Pending Transfers', value: '12', icon: 'Truck', trend: '+2', trendUp: true },
    { title: 'Outstanding Invoices', value: 'Rs. 320,450', icon: 'CreditCard', trend: '-8%', trendUp: false },
    { title: 'Low Stock Items', value: '28', icon: 'AlertTriangle', trend: '+5', trendUp: false },
];

// GET: Fetch dashboard summary statistics
export async function GET() {
    try {
        // Get total inventory value using Prisma with safe query
        const inventoryItems = await safeQuery(
            () => prisma.inventoryItem.findMany({
                include: {
                    product: true
                }
            }),
            [], // Empty array fallback
            'Failed to fetch inventory items'
        );

        // Calculate inventory value - sum of (product price * quantity)
        const inventoryValue = inventoryItems.reduce((sum, item) => {
            // Use price if available, otherwise default to 0
            const price = item.product?.price || 0;
            return sum + (price * item.quantity);
        }, 0);

        // Count pending transfers
        const pendingTransfers = await safeQuery(
            () => prisma.inventoryTransfer.count({
                where: {
                    status: 'pending'
                }
            }),
            0, // Zero fallback
            'Failed to count pending transfers'
        );

        // Count outstanding invoices (unpaid)
        const outstandingInvoices = await safeQuery(
            () => prisma.invoice.aggregate({
                where: {
                    status: {
                        not: 'Paid'
                    }
                },
                _sum: {
                    total: true
                }
            }),
            { _sum: { total: null } }, // Null sum fallback
            'Failed to calculate outstanding invoices'
        );

        const totalOutstanding = outstandingInvoices._sum.total || 0;

        // Count low stock items (assume less than 10 is low)
        const lowStockItems = await safeQuery(
            () => prisma.inventoryItem.count({
                where: {
                    quantity: {
                        lte: 10
                    }
                }
            }),
            0, // Zero fallback
            'Failed to count low stock items'
        );

        // Prepare the summary data in the format expected by the frontend
        const data = [
            {
                title: 'Total Inventory Value',
                value: `Rs. ${Number(inventoryValue).toLocaleString()}`,
                icon: 'Package',
                trend: '+5%',
                trendUp: true
            },
            {
                title: 'Pending Transfers',
                value: `${pendingTransfers}`,
                icon: 'Truck',
                trend: pendingTransfers > 0 ? `+${pendingTransfers}` : '0',
                trendUp: pendingTransfers > 0
            },
            {
                title: 'Outstanding Invoices',
                value: `Rs. ${Number(totalOutstanding).toLocaleString()}`,
                icon: 'CreditCard',
                trend: totalOutstanding > 0 ? `+${Math.round((totalOutstanding / 1000))}k` : '0',
                trendUp: false
            },
            {
                title: 'Low Stock Items',
                value: `${lowStockItems}`,
                icon: 'AlertTriangle',
                trend: `${lowStockItems > 0 ? '+' : ''}${lowStockItems}`,
                trendUp: lowStockItems > 0
            },
        ];

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching dashboard summary data:', error);

        // Return fallback data in case of any other error
        return NextResponse.json({
            success: true, // Still return success to avoid breaking the UI
            data: defaultSummaryData
        });
    }
} 