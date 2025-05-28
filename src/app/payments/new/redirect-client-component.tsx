'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// This component contains the client-side logic and hooks.
export function RedirectLogic() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('invoiceId');

    useEffect(() => {
        if (invoiceId) {
            router.replace(`/payments/simple?invoiceId=${invoiceId}`);
        } else {
            router.replace('/invoices');
        }
    }, [router, invoiceId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-gray-600">Redirecting...</p>
        </div>
    );
}

// Fallback component for Suspense
export function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-gray-600">Loading page...</p>
        </div>
    );
} 