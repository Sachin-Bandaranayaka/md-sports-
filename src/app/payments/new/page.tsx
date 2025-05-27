'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Simple client-only redirect component to avoid hydration errors
export default function RedirectToSimplePayment() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('invoiceId');

    useEffect(() => {
        // Redirect to the simple payment form with the same invoice ID
        if (invoiceId) {
            router.replace(`/payments/simple?invoiceId=${invoiceId}`);
        } else {
            router.replace('/invoices');
        }
    }, [router, invoiceId]);

    // Return minimal UI with no server/client mismatch potential
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-gray-600">Redirecting...</p>
        </div>
    );
} 