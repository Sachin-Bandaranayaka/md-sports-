import { Suspense } from 'react';
import DashboardClientWrapper from './components/DashboardClientWrapper';
import { Loader2 } from 'lucide-react';
import { headers, cookies } from 'next/headers';

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

            // Get the accessToken from cookies
            const cookieStore = await cookies();
            const accessToken = cookieStore.get('accessToken')?.value;

            const fetchHeaders: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (accessToken) {
                fetchHeaders['Authorization'] = `Bearer ${accessToken}`;
            }

            // Fetch all dashboard data from the consolidated endpoint
            const response = await fetch(`${baseUrl}/api/dashboard/all`, {
                headers: fetchHeaders,
                cache: 'no-store'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error response from dashboard API: ${response.status} ${errorText}`);
                throw new Error(`Failed to load dashboard data: ${response.status} ${response.statusText}`);
            }

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
            // Instead of returning null data, rethrow the error to trigger error boundary
            throw error;
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