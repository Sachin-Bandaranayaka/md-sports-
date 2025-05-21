'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { Account } from '@/types';
import { authPost } from '@/utils/api';

export default function AddAccount() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('asset');
    const [balance, setBalance] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

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
            const account: Omit<Account, 'id' | 'createdAt'> = {
                name,
                type,
                balance: balance ? parseFloat(balance) : 0,
                description,
                isActive
            };

            // Save account
            const response = await authPost('/api/accounting/accounts', account);

            if (!response.ok) {
                throw new Error('Failed to create account');
            }

            // Redirect back to accounting page
            router.push('/accounting?tab=accounts');

        } catch (err) {
            console.error('Error creating account:', err);
            alert('Failed to create account. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

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
                        <h1 className="text-2xl font-bold text-gray-900">Add New Account</h1>
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

                        {/* Initial Balance */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Initial Balance (Rs.)
                            </label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                placeholder="Enter initial balance"
                                min="0"
                                step="0.01"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Leave empty for zero balance
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
                                {isSaving ? 'Saving...' : 'Save Account'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
} 