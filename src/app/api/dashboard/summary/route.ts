import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET: Fetch dashboard summary statistics
export async function GET() {
    try {
        // Get total inventory value
        const inventoryValueQuery = await db.query(`
            SELECT SUM(p.retail_price * i.quantity) as total_value 
            FROM inventory_items i
            JOIN products p ON i.product_id = p.id
            WHERE p.is_active = true
        `);
        const inventoryValue = inventoryValueQuery.rows[0]?.total_value || 0;

        // Count pending transfers (not implemented yet, will return dummy data)
        const pendingTransfers = 0;

        // Count outstanding invoices (not implemented yet, will return dummy data)
        const outstandingInvoices = 0;

        // Count low stock items
        const lowStockQuery = await db.query(`
            SELECT COUNT(*) as low_stock_count
            FROM inventory_items i
            WHERE i.quantity <= i.reorder_level
        `);
        const lowStockItems = lowStockQuery.rows[0]?.low_stock_count || 0;

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
                trend: '0',
                trendUp: false
            },
            {
                title: 'Outstanding Invoices',
                value: `Rs. ${Number(outstandingInvoices).toLocaleString()}`,
                icon: 'CreditCard',
                trend: '0',
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
        return NextResponse.json({
            success: false,
            message: 'Error fetching dashboard summary data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 