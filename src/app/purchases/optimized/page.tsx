import { Suspense } from 'react';
import { Metadata } from 'next';
import PurchaseListClientOptimized from '@/components/purchases/PurchaseListClientOptimized';
import PerformanceMonitor from '@/components/purchases/PerformanceMonitor';
import { Button } from '@/components/ui/Button';
import { Plus, Download, Upload, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Purchase Invoices - Optimized | MS Sports',
  description: 'Manage purchase invoices with enhanced performance and user experience',
};

// Enable ISR with 30 second revalidation
export const revalidate = 30;

// Loading component for better UX
function PurchaseListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="divide-y">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4 grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error boundary component
function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'An unexpected error occurred while loading purchase invoices.'}
        </p>
        <div className="space-x-2">
          <Button onClick={reset} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OptimizedPurchasesPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Purchase Invoices
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your purchase invoices with enhanced performance
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Quick Actions */}
          <Link href="/purchases/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </Link>

          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Link href="/purchases/analytics">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Performance Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="text-blue-500 text-lg">⚡</div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Enhanced Performance
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              This page features optimized data loading, caching, and virtualization for better performance.
              Features include: progressive loading, infinite scroll, debounced search, and smart caching.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Suspense fallback={<PurchaseListSkeleton />}>
        <PurchaseListClientOptimized />
      </Suspense>

      {/* Performance Monitor */}
      <PerformanceMonitor
        pageName="Purchase Invoices (Optimized)"
        showDetails={false}
      />
    </div>
  );
}