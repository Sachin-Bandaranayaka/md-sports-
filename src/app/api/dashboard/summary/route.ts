import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

// GET: Fetch dashboard summary statistics
export async function GET() {
    try {
        // Use a simple approach to get inventory value
        const inventoryItems = await prisma.inventoryItem.findMany({
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        weightedAverageCost: true // Corrected to camelCase
                    }
                }
            }
        });

        console.log(`Found ${inventoryItems.length} inventory items for summary.`); // Clarified log

        // Calculate total value manually
        let totalValue = 0;
        for (const item of inventoryItems) {
            const productName = item.product?.name || 'Unknown Product';
            const cost = item.product?.weightedAverageCost; // Corrected to camelCase
            const quantity = item.quantity; // This should be number

            console.log(`  Processing Item ID: ${item.id}, Product: ${productName}, Raw Cost: ${cost} (type: ${typeof cost}), Raw Qty: ${quantity} (type: ${typeof quantity})`);

            if (item.product && typeof quantity === 'number') { // Check product exists and quantity is a number
                const actualCost = (typeof cost === 'number' && cost !== null) ? cost : 0; // Treat null or non-number cost as 0
                const actualQuantity = quantity; // Already checked it's a number

                if (actualQuantity > 0) { // Only add if quantity is positive
                    const itemValue = actualCost * actualQuantity;
                    totalValue += itemValue;
                    console.log(`    SUCCESS: Item ID: ${item.id} -> Name: ${productName}, Cost: ${actualCost}, Qty: ${actualQuantity}, ItemValue: ${itemValue}. Current Total: ${totalValue}`);
                } else {
                    console.log(`    INFO: Item ID: ${item.id} -> Name: ${productName}, Quantity is 0 or less. Not added to total.`);
                }
            } else {
                console.log(`    SKIPPED Item ID: ${item.id} -> Product exists: ${!!item.product}, Quantity is number: ${typeof quantity === 'number'}`);
                if (!item.product) {
                    console.log(`      Reason: item.product is missing for item ID ${item.id}`);
                }
                if (typeof quantity !== 'number') {
                    console.log(`      Reason: item.quantity is not a number for item ID ${item.id} (type: ${typeof quantity})`);
                }
            }
        }

        console.log(`Final calculated total inventory value: ${totalValue}`);

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

        // Count unpaid invoices
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

        // Get month-over-month invoice change (if any invoices exist)
        const previousMonthStart = new Date();
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
        previousMonthStart.setDate(1);
        previousMonthStart.setHours(0, 0, 0, 0);

        const previousMonthEnd = new Date();
        previousMonthEnd.setDate(0); // Last day of previous month
        previousMonthEnd.setHours(23, 59, 59, 999);

        // Calculate trend only if there are outstanding invoices
        let invoiceTrend = '0%';
        let invoiceTrendUp = false;

        // Only calculate trend if there are outstanding invoices
        if (totalOutstanding > 0) {
            const previousMonthInvoices = await safeQuery(
                () => prisma.invoice.aggregate({
                    where: {
                        status: {
                            not: 'Paid'
                        },
                        createdAt: {
                            gte: previousMonthStart,
                            lte: previousMonthEnd
                        }
                    },
                    _sum: {
                        total: true
                    }
                }),
                { _sum: { total: null } },
                'Failed to calculate previous month invoices'
            );

            const previousTotal = previousMonthInvoices._sum.total || 0;

            // Calculate percentage change
            if (previousTotal > 0) {
                const percentChange = ((totalOutstanding - previousTotal) / previousTotal) * 100;
                invoiceTrend = `${percentChange > 0 ? '+' : ''}${Math.round(percentChange)}%`;
                invoiceTrendUp = percentChange > 0;
            } else if (totalOutstanding > 0) {
                // If no previous invoices but we have current ones
                invoiceTrend = '+100%';
                invoiceTrendUp = true;
            }
        }

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

        // Calculate month-over-month inventory change (last 30 days)
        let inventoryTrend = '+0%';
        let inventoryTrendUp = false;

        if (totalValue > 0) {
            inventoryTrend = '+5%'; // Simplified trend for now
            inventoryTrendUp = true;
        }

        // Format inventory value with 2 decimal places
        const formattedValue = totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        // Prepare the summary data in the format expected by the frontend
        const data = [
            {
                title: 'Total Inventory Value',
                value: `Rs. ${formattedValue}`,
                icon: 'Package',
                trend: inventoryTrend,
                trendUp: inventoryTrendUp
            },
            {
                title: 'Total Retail Value',
                value: 'Loading...', // Placeholder, will be updated by client
                icon: 'Tag', // Using 'Tag' icon for retail price, can be changed
                trend: '', // Trend can be calculated if historical data is available
                trendUp: false
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
                trend: invoiceTrend,
                trendUp: invoiceTrendUp
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
            data,
            debug: {
                inventoryItemCount: inventoryItems.length,
                calculatedValue: totalValue
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary data:', error);

        // Return empty data in case of any other error
        return NextResponse.json({
            success: false,
            message: 'Error fetching dashboard summary data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 