'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Account } from '@/types';
import { authGet, authPost } from '@/utils/api';

export default function InterAccountTransfer() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');

    // Fetch income accounts only
    useEffect(() => {
        const fetchAccounts = async () => {
            setIsLoading(true);
            try {
                const response = await authGet('/api/accounting/accounts');
                if (!response.ok) {
                    throw new Error('Failed to fetch accounts');
                }
                const data = await response.json();
                // Filter for income and asset accounts only
                const incomeAccounts = data.data.filter((account: Account) => 
                    (account.type === 'income' || account.type === 'asset') && account.isActive
                );
                setAccounts(incomeAccounts);
            } catch (err) {
                console.error('Error fetching accounts:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    // Filter accounts for the "To Account" dropdown (exclude the selected "From Account")
    const toAccountOptions = accounts.filter(account => account.id !== fromAccountId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!date || !description || !fromAccountId || !toAccountId || !amount) {
            alert('Please fill in all required fields');
            return;
        }

        if (fromAccountId === toAccountId) {
            alert('Source and destination accounts cannot be the same');
            return;
        }

        const transferAmount = parseFloat(amount);
        if (transferAmount <= 0) {
            alert('Transfer amount must be greater than zero');
            return;
        }

        setIsSaving(true);

        try {
            // Get account names for display
            const fromAccount = accounts.find(acc => acc.id.toString() === fromAccountId.toString());
            const toAccount = accounts.find(acc => acc.id.toString() === toAccountId.toString());

            // Create transfer transaction
            const transferData = {
                date,
                description: `Inter-account transfer: ${description}`,
                accountId: fromAccountId,
                toAccountId: toAccountId,
                type: 'transfer',
                amount: transferAmount,
                reference: reference || `TRANSFER-${Date.now()}`,
                category: 'Inter-Account Transfer'
            };

            // Save transfer
            const response = await authPost('/api/accounting/transactions', transferData);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create transfer');
            }

            // Redirect back to accounting page
            router.push('/accounting?tab=income-accounts');

        } catch (err) {
            console.error('Error creating transfer:', err);
            alert(`Failed to create transfer: ${err instanceof Error ? err.message : 'Please try again.'}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-600">Loading accounts...</div>
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

    // No income accounts available
    if (accounts.length === 0) {
        return (
            <MainLayout>
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/accounting')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Inter-Account Transfer</h1>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-yellow-800 mb-2">No Income Accounts Available</h3>
                        <p className="text-yellow-700 mb-4">
                            You need at least 2 active income or asset accounts to perform inter-account transfers.
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => router.push('/accounting/add-account')}
                        >
                            Create New Account
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Need at least 2 accounts for transfer
    if (accounts.length < 2) {
        return (
            <MainLayout>
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/accounting')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Inter-Account Transfer</h1>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-yellow-800 mb-2">Insufficient Accounts</h3>
                        <p className="text-yellow-700 mb-4">
                            You need at least 2 active income or asset accounts to perform transfers. You currently have {accounts.length} account(s).
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => router.push('/accounting/add-account')}
                        >
                            Create New Account
                        </Button>
                    </div>
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
                            onClick={() => router.push('/accounting')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Inter-Account Transfer</h1>
                    </div>
                </div>

                {/* Transfer Form */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Transfer Between Income Accounts</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Transfer funds between your income and asset accounts
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Date */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                                Transfer Date *
                            </label>
                            <input
                                type="date"
                                id="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Transfer Direction */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            {/* From Account */}
                            <div>
                                <label htmlFor="fromAccount" className="block text-sm font-medium text-gray-700 mb-2">
                                    From Account *
                                </label>
                                <select
                                    id="fromAccount"
                                    value={fromAccountId}
                                    onChange={(e) => setFromAccountId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select source account</option>
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} ({account.type}) - ${typeof account.balance === 'number' ? account.balance.toFixed(2) : parseFloat(account.balance.toString()).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-center">
                                <ArrowRight className="w-6 h-6 text-gray-400" />
                            </div>

                            {/* To Account */}
                            <div>
                                <label htmlFor="toAccount" className="block text-sm font-medium text-gray-700 mb-2">
                                    To Account *
                                </label>
                                <select
                                    id="toAccount"
                                    value={toAccountId}
                                    onChange={(e) => setToAccountId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={!fromAccountId}
                                >
                                    <option value="">Select destination account</option>
                                    {toAccountOptions.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name} ({account.type}) - ${typeof account.balance === 'number' ? account.balance.toFixed(2) : parseFloat(account.balance.toString()).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                                Transfer Amount *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    step="0.01"
                                    min="0.01"
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <input
                                type="text"
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter transfer description"
                                required
                            />
                        </div>

                        {/* Reference */}
                        <div>
                            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                                Reference (Optional)
                            </label>
                            <input
                                type="text"
                                id="reference"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter reference number or note"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/accounting')}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Processing Transfer...' : 'Create Transfer'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}