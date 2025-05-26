import { Suspense } from 'react';
import DashboardMetrics from './components/DashboardMetrics';
import DashboardCharts from './components/DashboardCharts';
import DashboardTransfers from './components/DashboardTransfers';
import { Loader2 } from 'lucide-react';
import { headers } from 'next/headers';

// Server Component for the Dashboard
export default async function DashboardPage() {
    // Fetch dashboard data server-side
    async function fetchDashboardData() {
        try {
            // Get the host from headers for proper URL construction - properly awaited
            const headersList = await headers();
            const host = headersList.get('host') || 'localhost:3000';
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const baseUrl = `${protocol}://${host}`;

            // Fetch summary data
            const summaryResponse = await fetch(`${baseUrl}/api/dashboard/summary`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });
            const summaryData = await summaryResponse.json();

            // Fetch total retail value data
            const retailValueResponse = await fetch(`${baseUrl}/api/dashboard/total-retail-value`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });
            const retailValueData = await retailValueResponse.json();

            // If retail value data was successfully fetched, update the summary data
            if (retailValueData.success && summaryData.success) {
                // Find the Total Retail Value item in the summary data and update it
                const updatedSummaryData = summaryData.data.map(item => {
                    if (item.title === 'Total Retail Value') {
                        return {
                            ...item,
                            value: retailValueData.formattedValue,
                            trend: retailValueData.trend,
                            trendUp: retailValueData.trendUp
                        };
                    }
                    return item;
                });

                // Update the summary data
                summaryData.data = updatedSummaryData;
            }

            // Fetch shop performance
            const shopsResponse = await fetch(`${baseUrl}/api/dashboard/shops`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });
            const shopsData = await shopsResponse.json();

            // Fetch inventory distribution
            const inventoryResponse = await fetch(`${baseUrl}/api/dashboard/inventory`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });
            const inventoryData = await inventoryResponse.json();

            // Fetch monthly sales
            const salesResponse = await fetch(`${baseUrl}/api/dashboard/sales`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });
            const salesData = await salesResponse.json();

            // Fetch recent transfers
            const transfersResponse = await fetch(`${baseUrl}/api/dashboard/transfers`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });
            const transfersData = await transfersResponse.json();

            return {
                summaryData: summaryData.success ? summaryData.data : null,
                shopPerformance: shopsData.success ? shopsData.data : null,
                inventoryDistribution: inventoryData.success ? inventoryData.data : null,
                monthlySales: salesData.success ? salesData.data : null,
                recentTransfers: transfersData.success ? transfersData.data : null,
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            return { error: 'Failed to load dashboard data' };
        }
    }

    const dashboardData = await fetchDashboardData();

    return (
        <div className="space-y-8">
            {dashboardData.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {dashboardData.error}
                </div>
            )}

            <Suspense fallback={
                <div className="h-full flex items-center justify-center p-20">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500">Loading dashboard metrics...</p>
                    </div>
                </div>
            }>
                <DashboardMetrics summaryData={dashboardData.summaryData} />
            </Suspense>

            <Suspense fallback={
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <DashboardCharts
                    shopPerformance={dashboardData.shopPerformance}
                    inventoryDistribution={dashboardData.inventoryDistribution}
                    monthlySales={dashboardData.monthlySales}
                />
            </Suspense>

            <Suspense fallback={
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <DashboardTransfers transfers={dashboardData.recentTransfers} />
            </Suspense>
        </div>
    );
} 