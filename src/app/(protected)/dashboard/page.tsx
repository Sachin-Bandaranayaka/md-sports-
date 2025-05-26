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
            // Get the host from headers for proper URL construction
            const headersList = await headers(); // Corrected: await headers()
            const host = headersList.get('host') || 'localhost:3000';
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const baseUrl = `${protocol}://${host}`;

            // Fetch all dashboard data from the consolidated endpoint
            const response = await fetch(`${baseUrl}/api/dashboard/all`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store' // Retain no-store for now, can be re-evaluated
            });

            const result = await response.json();

            if (!result.success) {
                // Log the errors if any individual fetch failed
                if (result.errors && result.errors.length > 0) {
                    console.error('Errors fetching dashboard data:', result.errors.join('; '));
                }
                throw new Error(result.message || 'Failed to load dashboard data from /api/dashboard/all');
            }

            return {
                summaryData: result.summaryData,
                shopPerformance: result.shopPerformance,
                inventoryDistribution: result.inventoryDistribution,
                monthlySales: result.monthlySales,
                recentTransfers: result.recentTransfers,
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            return {
                error: error instanceof Error ? error.message : 'Failed to load dashboard data',
                summaryData: null,
                shopPerformance: null,
                inventoryDistribution: null,
                monthlySales: null,
                recentTransfers: null
            };
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