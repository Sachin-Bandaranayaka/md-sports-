'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function InvoiceEditRedirect() {
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        // Redirect to the correct URL format
        if (params.id) {
            router.replace(`/invoices/edit/${params.id}`);
        }
    }, [params.id, router]);

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
                <p className="text-gray-600">Please wait while we redirect you to the invoice edit page.</p>
            </div>
        </div>
    );
} 