'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReceiptClientWrapper from '../components/ReceiptClientWrapper';

interface Receipt {
    id: number;
    payment: {
        customer: any;
        invoice: {
            items: {
                product: any;
            }[];
        };
    };
    confirmedByUser: any;
}

export default function ReceiptPage({
    params
}: {
    params: { id: string };
}) {
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const id = parseInt(params.id);

    useEffect(() => {
        if (isNaN(id)) {
            router.push('/404');
            return;
        }

        const fetchReceipt = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/receipts/${id}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        router.push('/404');
                        return;
                    }
                    throw new Error(`Failed to fetch receipt: ${response.statusText}`);
                }
                
                const data = await response.json();
                setReceipt(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load receipt');
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [id, router]);

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!receipt) {
        return null;
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <ReceiptClientWrapper receipt={receipt} />
        </div>
    );
}