'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { Account } from '@/types';
import { authPost, authGet } from '@/utils/api';

export default function AddAccount() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const parentId = searchParams.get('parentId');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('income');
    const [balance, setBalance] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [selectedParentId, setSelectedParentId] = useState<string>(parentId || '');
    
    // Data state
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [parentAccount, setParentAccount] = useState<Account | null>(null);

    // Fetch accounts for parent selection
    useEffect(() => {
        const fetchAccounts = async () => {
            setIsLoading(true);
            try {
                const response = await authGet('/api/accounting/accounts');
                if (!response.ok) throw new Error('Failed to fetch accounts');
                const data = await response.json();
                setAccounts(data.accounts || []);
                
                // If parentId is provided, find and set the parent account
                if (parentId) {
                    const parent = data.accounts.find((acc: Account) => acc.id === parentId);
                    if (parent) {
                        setParentAccount(parent);
                        setType(parent.type); // Set same type as parent
                    }
                }
            } catch (error) {
                console.error('Error fetching accounts:', error);
                alert('Failed to load accounts');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccounts();
    }, [parentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!name || !type) {
            alert('Please fill in all required fields');
            return;
        }

        // Validate parent account compatibility
        if (selectedParentId) {
            const parent = accounts.find(acc => acc.id === selectedParentId);
            if (parent && parent.type !== type) {
                alert('Sub-account type must match parent account type');
                return;
            }
        }

        setIsSaving(true);

        try {
            // Create account object
            const account: Omit<Account, 'id' | 'createdAt'> & { parentId?: string } = {
                name,
                type,
                balance: balance ? parseFloat(balance) : 0,
                description,
                isActive,
                ...(selectedParentId && { parentId: selectedParentId })
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

    // Filter accounts for parent selection (only main accounts that are income or expense)
    const availableParentAccounts = accounts.filter(acc => 
        !acc.parentId && acc.isActive && (acc.type === 'income' || acc.type === 'expense')
    );

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
                        <h1 className="text-2xl font-bold text-gray-900">
                            {parentAccount ? `Add Sub-Account under ${parentAccount.name}` : 'Add New Account'}
                        </h1>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Parent Account Selection */}
                        {!parentId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Parent Account (Optional)
                                </label>
                                <select
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                    value={selectedParentId}
                                    onChange={(e) => {
                                        setSelectedParentId(e.target.value);
                                        if (e.target.value) {
                                            const parent = accounts.find(acc => acc.id === e.target.value);
                                            if (parent) {
                                                setType(parent.type);
                                            }
                                        }
                                    }}
                                >
                                    <option value="">Select parent account (for sub-account)</option>
                                    {availableParentAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} ({account.type})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to create a main account
                                </p>
                            </div>
                        )}

                        {/* Show parent account info if creating sub-account */}
                        {parentAccount && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Creating sub-account under:</strong> {parentAccount.name} ({parentAccount.type})
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Sub-account will inherit the same type as parent account
                                </p>
                            </div>
                        )}

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
                                placeholder={parentAccount ? "Enter sub-account name" : "Enter account name"}
                                required
                            />
                        </div>

                        {/* Account Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Type
                            </label>
                            {parentAccount || selectedParentId ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                    <span className="text-sm text-gray-700">
                                        {type.charAt(0).toUpperCase() + type.slice(1)} (inherited from parent)
                                    </span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
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
                            )}
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
                                disabled={isSaving || isLoading}
                            >
                                {isSaving ? 'Saving...' : isLoading ? 'Loading...' : (parentAccount || selectedParentId ? 'Save Sub-Account' : 'Save Account')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}