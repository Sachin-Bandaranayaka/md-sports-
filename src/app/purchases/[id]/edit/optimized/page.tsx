import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PurchaseInvoiceFormOptimized from '@/components/purchases/PurchaseInvoiceFormOptimized';
import { ArrowLeft, Edit, History, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PurchaseInvoice } from '@/types';

interface EditPurchaseInvoiceOptimizedPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: EditPurchaseInvoiceOptimizedPageProps): Promise<Metadata> {
  const invoice = await fetchPurchaseInvoice(params.id);

  return {
    title: `Edit Invoice ${invoice?.invoiceNumber || params.id} - Optimized | MS Sports`,
    description: `Edit purchase invoice ${invoice?.invoiceNumber || params.id} with enhanced performance and user experience`,
  };
}

// Fetch purchase invoice data
async function fetchPurchaseInvoice(id: string): Promise<PurchaseInvoice | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/purchases/${id}`,
      {
        cache: 'no-store', // Always fetch fresh data for editing
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch invoice: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching purchase invoice:', error);
    return null;
  }
}

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
        </div>

        {/* Items section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
            Failed to Load Invoice
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred while loading the purchase invoice.'}
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

// Invoice info component
function InvoiceInfo({ invoice }: { invoice: PurchaseInvoice }) {
  const statusColors = {
    paid: 'bg-green-100 text-green-800 border-green-200',
    partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    unpaid: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Invoice {invoice.invoiceNumber}
          </h3>
          <p className="text-sm text-gray-600">
            Created: {new Date(invoice.createdAt).toLocaleDateString()}
          </p>
          {invoice.updatedAt !== invoice.createdAt && (
            <p className="text-sm text-gray-600">
              Last updated: {new Date(invoice.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[invoice.status as keyof typeof statusColors] || statusColors.unpaid
            }`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>

          <div className="text-right">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-lg font-semibold text-gray-900">
              ${invoice.totalAmount?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function EditPurchaseInvoiceOptimizedPage({ params }: EditPurchaseInvoiceOptimizedPageProps) {
  const invoice = await fetchPurchaseInvoice(params.id);

  if (!invoice) {
    notFound();
  }

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
            <Link
              href={`/purchases/${params.id}`}
              className="text-gray-500 hover:text-gray-700"
            >
              {invoice.invoiceNumber}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Edit (Optimized)</span>
          </nav>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <InvoiceInfo invoice={invoice} />
      </div>

      {/* Performance Notice */}
      <div className="max-w-6xl mx-auto px-6 pb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="text-blue-500 text-lg">⚡</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Optimized Edit Experience
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                This form features smart validation, real-time calculations,
                optimistic updates, and conflict detection for enhanced editing experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-6xl mx-auto px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          <Link href={`/purchases/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              View Invoice
            </Button>
          </Link>

          <Link href={`/purchases/${params.id}/history`}>
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
          </Link>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Warning for Paid Invoices */}
      {invoice.status === 'paid' && (
        <div className="max-w-6xl mx-auto px-6 pb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="text-yellow-500 text-lg">⚠️</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Editing Paid Invoice
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This invoice is marked as paid. Changes may affect inventory and financial records.
                  Please ensure you have proper authorization before making modifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <Suspense fallback={<FormSkeleton />}>
        <PurchaseInvoiceFormOptimized
          invoice={invoice}
          mode="edit"
        />
      </Suspense>

      {/* Edit Guidelines */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">📝 Edit Guidelines:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Changes are automatically validated in real-time</li>
            <li>• Inventory levels will be updated based on status changes</li>
            <li>• All modifications are logged for audit purposes</li>
            <li>• Use caution when editing paid invoices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}