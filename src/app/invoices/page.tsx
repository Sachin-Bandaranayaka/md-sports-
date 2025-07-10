import MainLayout from '@/components/layout/MainLayout';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import InvoicesList from './components/InvoicesList';

// Invoice Page Skeleton Component
function InvoicePageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
            
            {/* Filters Skeleton */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-4 mb-4">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            
            {/* Table Skeleton */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4">
                    <div className="space-y-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Pagination Skeleton */}
            <div className="mt-6 flex justify-center">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-20" />
                </div>
            </div>
        </div>
    );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for real-time data

export default function InvoicesPage({
    searchParams,
}: {
    searchParams: { 
        page?: string;
        status?: string;
        paymentMethod?: string;
        search?: string;
        timePeriod?: string;
        sortBy?: string;
        shopId?: string;
    };
}) {
    return (
        <MainLayout>
            <Suspense fallback={<InvoicePageSkeleton />}>
                <InvoicesList searchParams={searchParams} />
            </Suspense>
        </MainLayout>
    );
} 