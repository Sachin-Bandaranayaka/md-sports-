'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { Account } from '@/types';
import { authGet, authPatch } from '@/utils/api';

export default function EditAccount({ params }: { params: { id: string } }) {
    const router = useRouter();
    // Unwrap params using React.use()
    const unwrappedParams = React.use(params);
    const { id } = unwrappedParams;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('asset');
    const [balance, setBalance] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Fetch account data
    useEffect(() => {
        const fetchAccount = async () => {
            setIsLoading(true);
            try {
                const response = await authGet(`/api/accounting/accounts?id=${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch account');
                }
                const data = await response.json();

                if (!data.data) {
                    throw new Error('Account not found');
                }

                const account = data.data;

                // Set form state with account data
                setName(account.name);
                setType(account.type);
                setBalance(account.balance.toString());
                setDescription(account.description || '');
                setIsActive(account.isActive);
            } catch (err) {
                console.error('Error fetching account:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccount();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!name || !type) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSaving(true);

        try {
            // Create account object
            const account = {
                id,
                name,
                type,
                balance: balance ? parseFloat(balance) : 0,
                description,
                isActive
            };

            // Update account
            const response = await authPatch('/api/accounting/accounts', account);

            if (!response.ok) {
                throw new Error('Failed to update account');
            }

            // Redirect back to accounting page
            router.push('/accounting?tab=accounts');

        } catch (err) {
            console.error('Error updating account:', err);
            alert('Failed to update account. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-600">Loading account data...</div>
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

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/accounting?tab=accounts')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Account</h1>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Account Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Name
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter account name"
                                required
                            />
                        </div>

                        {/* Account Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Type
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <button
                                    type="button"
                                    className={`px-3 py-2 text-sm rounded-md ${type === 'asset' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                    onClick={() => setType('asset')}
                                >
                                    Asset
                                </button>
                                <button
                                    type="button"
                                    className={`px-3 py-2 text-sm rounded-md ${type === 'liability' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                    onClick={() => setType('liability')}
                                >
                                    Liability
                                </button>
                                <button
                                    type="button"
                                    className={`px-3 py-2 text-sm rounded-md ${type === 'equity' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                    onClick={() => setType('equity')}
                                >
                                    Equity
                                </button>
                                <button
                                    type="button"
                                    className={`px-3 py-2 text-sm rounded-md ${type === 'income' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                    onClick={() => setType('income')}
                                >
                                    Income
                                </button>
                                <button
                                    type="button"
                                    className={`px-3 py-2 text-sm rounded-md ${type === 'expense' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                    onClick={() => setType('expense')}
                                >
                                    Expense
                                </button>
                            </div>
                        </div>

                        {/* Balance */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Balance (Rs.)
                            </label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                placeholder="Enter balance"
                                min="0"
                                step="0.01"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Changing the balance directly may affect financial reports
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter description"
                                rows={3}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                    Account is active
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Inactive accounts won't appear in transaction forms
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.push('/accounting?tab=accounts')}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Update Account'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
} 