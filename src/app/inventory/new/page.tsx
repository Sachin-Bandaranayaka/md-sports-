'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

export default function NewProduct() {
    const router = useRouter();

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Add Inventory</h1>
                    </div>
                </div>

                {/* Information message */}
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-8 rounded-md">
                    <div className="flex flex-col items-center text-center">
                        <ShoppingCart className="w-12 h-12 mb-4 text-blue-500" />
                        <h2 className="text-xl font-semibold mb-3">Inventory Management Update</h2>
                        <p className="mb-4">
                            Inventory can only be added through purchase invoices to ensure accurate weighted average cost calculations.
                        </p>
                        <p className="mb-6">
                            This change helps maintain accurate cost tracking and inventory valuation using the weighted average cost method.
                        </p>
                        <div className="flex gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => router.push('/purchases')}
                            >
                                Go to Purchase Invoices
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => router.push('/inventory')}
                            >
                                Return to Inventory
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 