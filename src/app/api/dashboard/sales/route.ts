import { NextResponse } from 'next/server';

// GET: Fetch monthly sales data
export async function GET() {
    try {
        // Since we don't have actual sales data yet, we'll return dummy data
        // In a real implementation, we would query the database for actual sales

        // Get current month
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-indexed (0 = January)

        // Generate past 6 months of data
        const months = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 5; i >= 0; i--) {
            // Calculate month index (handling wrapping to previous year)
            let monthIndex = currentMonth - i;
            if (monthIndex < 0) {
                monthIndex += 12;
            }

            // Generate random sales between 80000 and 150000
            const sales = Math.floor(Math.random() * 70000) + 80000;

            months.push({
                month: monthNames[monthIndex],
                sales: sales
            });
        }

        return NextResponse.json({
            success: true,
            data: months
        });
    } catch (error) {
        console.error('Error generating sales data:', error);
        return NextResponse.json({
            success: false,
            message: 'Error generating sales data',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 