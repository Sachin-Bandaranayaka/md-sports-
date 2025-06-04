import { Metadata } from 'next';
import { Suspense } from 'react';
import PurchaseInvoiceFormOptimized from '@/components/purchases/PurchaseInvoiceFormOptimized';
import { ArrowLeft, Save, Upload, Calculator } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'New Purchase Invoice - Optimized | MS Sports',
  description: 'Create a new purchase invoice with enhanced performance and user experience',
};

// Loading component for the form
function FormSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex space-x-3">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-50 border rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Form sections skeleton */}
      <div className="space-y-6">
        {/* Basic information section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Items section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="col-span-2 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Submit buttons skeleton */}
        <div className="flex justify-end space-x-4">
          <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Error boundary component
function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Form
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred while loading the purchase invoice form.'}
          </p>
          <div className="space-x-2">
            <Button onClick={reset} variant="outline">
              Try Again
            </Button>
            <Link href="/purchases">
              <Button>
                Back to Invoices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewPurchaseInvoiceOptimizedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link
              href="/purchases"
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Purchase Invoices
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">New Invoice (Optimized)</span>
          </nav>
        </div>
      </div>

      {/* Performance Notice */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="text-green-500 text-lg">🚀</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Optimized Form Experience
              </h3>
              <p className="text-sm text-green-700 mt-1">
                This form features auto-save drafts, smart validation, CSV import,
                product search with autocomplete, and real-time calculations for enhanced productivity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="max-w-6xl mx-auto px-6 pb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Quick Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your progress is automatically saved as you type</li>
            <li>• Use the CSV import feature to bulk add items</li>
            <li>• Search products by name or SKU for quick selection</li>
            <li>• Use the calculator for quick total verification</li>
          </ul>
        </div>
      </div>

      {/* Main Form */}
      <Suspense fallback={<FormSkeleton />}>
        <PurchaseInvoiceFormOptimized mode="create" />
      </Suspense>

      {/* Keyboard Shortcuts Help */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">⌨️ Keyboard Shortcuts:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">Ctrl + S</span>
              <span className="ml-2">Save invoice</span>
            </div>
            <div>
              <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">Ctrl + Enter</span>
              <span className="ml-2">Add new item</span>
            </div>
            <div>
              <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">Escape</span>
              <span className="ml-2">Cancel/Close dialogs</span>
            </div>
            <div>
              <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">Tab</span>
              <span className="ml-2">Navigate between fields</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}