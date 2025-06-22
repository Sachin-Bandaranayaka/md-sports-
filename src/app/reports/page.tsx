'use client';

import { Suspense, lazy } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Loader2, BarChart2 } from 'lucide-react';

// Lazy load heavy components and libraries
const ReportsContent = lazy(() => import('./components/ReportsContent'));

// Loading skeleton for reports
const ReportsLoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header skeleton */}
    <div className="flex justify-between items-center">
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-96"></div>
      </div>
      <div className="flex space-x-3">
        <div className="h-10 bg-gray-200 rounded w-32"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>

    {/* Filters skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>

    {/* Reports grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Error boundary component
const ReportsErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <BarChart2 className="h-16 w-16 text-gray-400" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load reports</h3>
      <p className="text-gray-600 mb-4">There was an error loading the reports module.</p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default function Reports() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">
              Generate and manage business reports with real-time data
            </p>
          </div>
        </div>

        {/* Lazy loaded reports content */}
        <Suspense fallback={<ReportsLoadingSkeleton />}>
          <ReportsContent />
        </Suspense>
      </div>
    </MainLayout>
  );
}