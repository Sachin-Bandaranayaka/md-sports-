import { Suspense } from 'react';
import DashboardClientWrapper from './components/DashboardClientWrapper';
import { Loader2 } from 'lucide-react';
import { headers } from 'next/headers';

// Add revalidation - cache dashboard page for 30 seconds (shorter time for more real-time feel)
export const revalidate = 30;

// Server Component for the Dashboard
export default async function DashboardPage() {
    // Fetch initial dashboard data server-side
    async function fetchInitialDashboardData() {
        try {
            // Get the host from headers for proper URL construction
            const headersList = await headers();
            const host = headersList.get('host') || 'localhost:3000';
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const baseUrl = `${protocol}://${host}`;

            // Fetch all dashboard data from the consolidated endpoint
            const response = await fetch(`${baseUrl}/api/dashboard/all`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
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
                recentTransfers: result.recentTransfers,
            };
        } catch (error) {
            console.error('Error fetching initial dashboard data:', error);
            return {
                summaryData: null,
                recentTransfers: null
            };
        }
    }

    const initialData = await fetchInitialDashboardData();

    return (
        <Suspense fallback={
            <div className="h-full flex items-center justify-center p-20">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        }>
            <DashboardClientWrapper initialData={initialData} />
        </Suspense>
    );
}