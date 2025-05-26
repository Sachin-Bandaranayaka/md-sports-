import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

export async function fetchSalesData() {
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
                    }
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

// GET: Fetch monthly sales data
export async function GET() {
    try {
        const salesResult = await fetchSalesData();
        return NextResponse.json(salesResult);
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
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 