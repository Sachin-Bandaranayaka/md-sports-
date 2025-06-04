'use client';

import { Suspense, useEffect, useState } from 'react';
import DashboardClientWrapper from './components/DashboardClientWrapper';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Client Component for the Dashboard
export default function DashboardPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [initialData, setInitialData] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Fetch initial dashboard data client-side
    useEffect(() => {
        const fetchInitialDashboardData = async () => {
            if (!isAuthenticated || isLoading) return;

            try {
                setDataLoading(true);
                setError(null);

                // Get the accessToken from localStorage
                const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');

                console.log('[DashboardPage] Retrieved accessToken from localStorage:', accessToken ? `${accessToken.substring(0, 10)}...` : 'No accessToken found');

                const fetchHeaders: HeadersInit = {
                    'Content-Type': 'application/json',
                };

                if (accessToken) {
                    fetchHeaders['Authorization'] = `Bearer ${accessToken}`;
                }

                console.log('[DashboardPage] fetchHeaders for /api/dashboard/all:', JSON.stringify(fetchHeaders));

                // Fetch all dashboard data from the consolidated endpoint
                const response = await fetch('/api/dashboard/all', {
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

                setInitialData({
                    summaryData: result.summaryData,
                    recentTransfers: result.recentTransfers,
                });
            } catch (error) {
                console.error('Error fetching initial dashboard data:', error);
                setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
            } finally {
                setDataLoading(false);
            }
        };

        fetchInitialDashboardData();
    }, [isAuthenticated, isLoading]);

    // Show loading while auth is being checked
    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center p-20">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Show loading while data is being fetched
    if (dataLoading) {
        return (
            <div className="h-full flex items-center justify-center p-20">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Show error if data fetch failed
    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-20">
                <div className="text-center">
                    <div className="text-red-500 mb-4">Error loading dashboard</div>
                    <p className="text-gray-500">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Show dashboard if data is loaded
    if (initialData) {
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

    return null;
}