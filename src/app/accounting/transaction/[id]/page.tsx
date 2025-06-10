'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Trash } from 'lucide-react';
import { Transaction } from '@/types';
import { authGet, authDelete } from '@/utils/api';

export default function TransactionDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    // Extract id directly from params
    const { id } = params;

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch transaction details
    useEffect(() => {
        const fetchTransaction = async () => {
            setIsLoading(true);
            try {
                const response = await authGet(`/api/accounting/transactions?id=${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch transaction details');
                }
                const data = await response.json();

                if (!data.data) {
                    throw new Error('Transaction not found');
                }

                setTransaction(data.data);
            } catch (err) {
                console.error('Error fetching transaction:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransaction();
    }, [id]);

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            try {
                const response = await authDelete(`/api/accounting/transactions?id=${id}`);

                if (!response.ok) {
                    throw new Error('Failed to delete transaction');
                }

                // Redirect to accounting page
                router.push('/accounting');
            } catch (err) {
                console.error('Error deleting transaction:', err);
                alert('Failed to delete transaction. Please try again.');
            }
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-600">Loading transaction details...</div>
                </div>
            </MainLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <MainLayout>
                <div className="flex flex-col justify-center items-center h-64">
                    <div className="text-lg text-red-600 mb-4">Error: {error}</div>
                    <Button
                        variant="primary"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </Button>
                </div>
            </MainLayout>
        );
    }

    // Not found state
    if (!transaction) {
        return (
            <MainLayout>
                <div className="flex flex-col justify-center items-center h-64">
                    <div className="text-lg text-red-600 mb-4">Transaction not found</div>
                    <Button
                        variant="primary"
                        onClick={() => router.push('/accounting')}
                    >
                        Back to Accounting
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/accounting')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/accounting/edit-transaction/${transaction.id}`)}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                        >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Description</div>
                                    <div className="text-base">{transaction.description}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Date</div>
                                    <div className="text-base">{new Date(transaction.date).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Type</div>
                                    <div className={`text-base capitalize ${transaction.type === 'income' ? 'text-green-600' :
                                        transaction.type === 'expense' ? 'text-red-600' :
                                            transaction.type === 'withdrawal' ? 'text-orange-600' :
                                                'text-purple-600'
                                        }`}>
                                        {transaction.type}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Amount</div>
                                    <div className={`text-base font-medium ${transaction.type === 'income' ? 'text-green-600' :
                                        transaction.type === 'expense' ? 'text-red-600' :
                                            transaction.type === 'withdrawal' ? 'text-orange-600' :
                                                'text-purple-600'
                                        }`}>
                                        Rs. {Number(transaction.amount).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Account</div>
                                    <div className="text-base">{transaction.accountName}</div>
                                </div>
                                {transaction.type === 'transfer' && transaction.toAccountName && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-500">To Account</div>
                                        <div className="text-base">{transaction.toAccountName}</div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Category</div>
                                    <div className="text-base">{transaction.category}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Reference</div>
                                    <div className="text-base">{transaction.reference || 'None'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Created At</div>
                                    <div className="text-base">{new Date(transaction.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}