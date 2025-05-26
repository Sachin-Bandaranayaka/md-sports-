import { NextResponse } from 'next/server';
import { fetchSummaryData } from '../summary/route';
import { fetchTotalRetailValueData } from '../total-retail-value/route';
import { fetchShopsData } from '../shops/route';
import { fetchInventoryDistributionData } from '../inventory/route';
import { fetchSalesData } from '../sales/route';
import { fetchTransfersData } from '../transfers/route';

export async function GET() {
    try {
        const [
            summaryResult,
            totalRetailValueResult,
            shopsResult,
            inventoryResult,
            salesResult,
            transfersResult
        ] = await Promise.all([
            fetchSummaryData(),
            fetchTotalRetailValueData(),
            fetchShopsData(),
            fetchInventoryDistributionData(),
            fetchSalesData(),
            fetchTransfersData()
        ]);

        // The summaryData expects totalRetailValue to be part of its structure.
        // Let's merge it here.
        if (summaryResult.success && summaryResult.data && totalRetailValueResult.success) {
            summaryResult.data = summaryResult.data.map(item => {
                if (item.title === 'Total Retail Value') {
                    return {
                        ...item,
                        value: totalRetailValueResult.formattedValue,
                        trend: totalRetailValueResult.trend,
                        trendUp: totalRetailValueResult.trendUp
                    };
                }
                return item;
            });
        }

        return NextResponse.json({
            success: true, // Overall success
            summaryData: summaryResult.success ? summaryResult.data : null,
            // totalRetailValue: totalRetailValueResult.success ? totalRetailValueResult : null, // No longer needed separately
            shopPerformance: shopsResult.success ? shopsResult.data : null,
            inventoryDistribution: inventoryResult.success ? inventoryResult.data : null,
            monthlySales: salesResult.success ? salesResult.data : null,
            recentTransfers: transfersResult.success ? transfersResult.data : null,
            // You might want to include individual success statuses or error messages if needed
            errors: [
                !summaryResult.success ? 'Failed to fetch summary data' : null,
                !totalRetailValueResult.success ? 'Failed to fetch total retail value' : null,
                !shopsResult.success ? 'Failed to fetch shops data' : null,
                !inventoryResult.success ? 'Failed to fetch inventory data' : null,
                !salesResult.success ? 'Failed to fetch sales data' : null,
                !transfersResult.success ? 'Failed to fetch transfers data' : null,
            ].filter(e => e !== null)
        });

    } catch (error) {
        console.error('Error fetching all dashboard data:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load all dashboard data',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 