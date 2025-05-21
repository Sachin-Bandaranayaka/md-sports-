'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { Transaction, Account } from '@/types';
import { authGet, authPost } from '@/utils/api';

export default function AddTransaction() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [type, setType] = useState<Transaction['type']>('income');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [accountId, setAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [category, setCategory] = useState('');

    // Fetch accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            setIsLoading(true);
            try {
                const response = await authGet('/api/accounting/accounts');
                if (!response.ok) {
                    throw new Error('Failed to fetch accounts');
                }
                const data = await response.json();
                setAccounts(data.data);
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
    const toAccountOptions = accounts.filter(account => account.id !== accountId && account.isActive);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!date || !description || !accountId || !amount || !category) {
            alert('Please fill in all required fields');
            return;
        }

        // For transfers, validate toAccountId
        if (type === 'transfer' && !toAccountId) {
            alert('Please select a destination account for the transfer');
            return;
        }

        setIsSaving(true);

        try {
            // Get account name for display
            const selectedAccount = accounts.find(acc => acc.id.toString() === accountId.toString());
            const selectedToAccount = toAccountId ? accounts.find(acc => acc.id.toString() === toAccountId.toString()) : undefined;

            // Create transaction object
            const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
                date,
                description,
                accountId,
                accountName: selectedAccount?.name || '',
                type,
                amount: parseFloat(amount),
                reference,
                category,
                ...(type === 'transfer' && toAccountId && selectedToAccount ? {
                    toAccountId,
                    toAccountName: selectedToAccount.name
                } : {})
            };

            // Save transaction
            const response = await authPost('/api/accounting/transactions', transaction);

            if (!response.ok) {
                throw new Error('Failed to create transaction');
            }

            // Redirect back to accounting page
            router.push('/accounting');

        } catch (err) {
            console.error('Error creating transaction:', err);
            alert('Failed to create transaction. Please try again.');
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
                        <h1 className="text-2xl font-bold text-gray-900">Add New Transaction</h1>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200 max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Transaction Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Transaction Type
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button
                                    type="button"
                                    className={`px-4 py-3 text-sm rounded-md ${type === 'income' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                    onClick={() => setType('income')}
                                >
                                    Income
                                </button>
                                <button
                                    type="button"
                                    className={`px-4 py-3 text-sm rounded-md ${type === 'expense' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                    onClick={() => setType('expense')}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    className={`px-4 py-3 text-sm rounded-md ${type === 'withdrawal' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                    onClick={() => setType('withdrawal')}
                                >
                                    Withdrawal
                                </button>
                                <button
                                    type="button"
                                    className={`px-4 py-3 text-sm rounded-md ${type === 'transfer' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                    onClick={() => setType('transfer')}
                                >
                                    Transfer
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount (Rs.)
                                </label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter description"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* From Account */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {type === 'transfer' ? 'From Account' : 'Account'}
                                </label>
                                <select
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    required
                                >
                                    <option value="">Select an account</option>
                                    {accounts
                                        .filter(account => account.isActive)
                                        .map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name} (Rs. {Number(account.balance).toLocaleString()})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* To Account (for transfers only) */}
                            {type === 'transfer' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        To Account
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                        value={toAccountId}
                                        onChange={(e) => setToAccountId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select destination account</option>
                                        {toAccountOptions.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name} (Rs. {Number(account.balance).toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Enter category"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {/* Reference */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reference (Optional)
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Invoice #, Receipt #, etc."
                            />
                        </div>

                        {/* Category (for transfers) */}
                        {type === 'transfer' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Enter category"
                                    required
                                />
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.push('/accounting')}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Transaction'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
} 