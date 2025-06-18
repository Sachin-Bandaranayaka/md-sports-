'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Trash, ArrowUp, ArrowDown } from 'lucide-react';
import { Account, Transaction } from '@/types';
import { authGet, authPatch } from '@/utils/api';

export default function AccountDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    // Extract id directly from params
    const { id } = params;

    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch account details and transactions
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch account details
                const accountResponse = await authGet(`/api/accounting/accounts?id=${id}`);
                if (!accountResponse.ok) {
                    throw new Error('Failed to fetch account details');
                }
                const accountData = await accountResponse.json();

                if (!accountData.data) {
                    throw new Error('Account not found');
                }

                setAccount(accountData.data);

                // Fetch transactions for this account (both as primary account and as destination account)
                const [primaryTransactionsResponse, destinationTransactionsResponse] = await Promise.all([
                    authGet(`/api/accounting/transactions?accountId=${id}`),
                    authGet(`/api/accounting/transactions`)
                ]);
                
                if (!primaryTransactionsResponse.ok || !destinationTransactionsResponse.ok) {
                    throw new Error('Failed to fetch account transactions');
                }
                
                const primaryTransactionsData = await primaryTransactionsResponse.json();
                const allTransactionsData = await destinationTransactionsResponse.json();
                
                // Filter transactions where this account is either the primary account or destination account
                const primaryTransactions = primaryTransactionsData.data || [];
                const destinationTransactions = (allTransactionsData.data || []).filter(
                    (transaction: any) => transaction.toAccountId === parseInt(id)
                );
                
                // Combine and deduplicate transactions
                const allAccountTransactions = [...primaryTransactions];
                destinationTransactions.forEach((destTransaction: any) => {
                    if (!allAccountTransactions.find(t => t.id === destTransaction.id)) {
                        allAccountTransactions.push(destTransaction);
                    }
                });
                
                // Sort by date (newest first)
                allAccountTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                setTransactions(allAccountTransactions);

            } catch (err) {
                console.error('Error fetching account data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleToggleStatus = async () => {
        if (!account) return;

        const newStatus = !account.isActive;
        const action = newStatus ? 'activate' : 'deactivate';

        if (confirm(`Are you sure you want to ${action} this account?`)) {
            try {
                const response = await authPatch('/api/accounting/accounts', {
                    id: account.id,
                    name: account.name,
                    type: account.type,
                    balance: account.balance,
                    description: account.description,
                    isActive: newStatus
                });

                if (!response.ok) {
                    throw new Error(`Failed to ${action} account`);
                }

                // Update account in state
                setAccount({
                    ...account,
                    isActive: newStatus
                });
            } catch (err) {
                console.error(`Error ${action}ing account:`, err);
                alert(`Failed to ${action} account. Please try again.`);
            }
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-600">Loading account details...</div>
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
    if (!account) {
        return (
            <MainLayout>
                <div className="flex flex-col justify-center items-center h-64">
                    <div className="text-lg text-red-600 mb-4">Account not found</div>
                    <Button
                        variant="primary"
                        onClick={() => router.push('/accounting?tab=accounts')}
                    >
                        Back to Accounts
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
                            onClick={() => router.push('/accounting?tab=accounts')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Account Details</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/accounting/edit-account/${account.id}`)}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant={account.isActive ? "destructive" : "success"}
                            size="sm"
                            onClick={handleToggleStatus}
                        >
                            {account.isActive ? (
                                <>
                                    <Trash className="w-4 h-4 mr-2" />
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <ArrowUp className="w-4 h-4 mr-2" />
                                    Activate
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Account Details */}
                <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Account Name</div>
                                    <div className="text-xl font-medium">{account.name}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Type</div>
                                    <div className="text-base capitalize">{account.type}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Balance</div>
                                    <div className={`text-xl font-medium ${['income', 'asset'].includes(account.type) ? 'text-green-600' : 'text-red-600'}`}>
                                        Rs. {Number(account.balance).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Status</div>
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {account.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Description</div>
                                    <div className="text-base">{account.description || 'No description'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Created At</div>
                                    <div className="text-base">{new Date(account.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Transaction Count</div>
                                    <div className="text-base">{transactions.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3">Category</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length > 0 ? (
                                        transactions.map((transaction) => (
                                            <tr key={transaction.id} className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <a
                                                        href={`/accounting/transaction/${transaction.id}`}
                                                        className="hover:underline hover:text-blue-600"
                                                    >
                                                        {transaction.description}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {transaction.category}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`flex items-center space-x-1 ${transaction.type === 'income'
                                                        ? 'text-green-600'
                                                        : transaction.type === 'expense'
                                                            ? 'text-red-600'
                                                            : transaction.type === 'withdrawal'
                                                                ? 'text-orange-600'
                                                                : 'text-purple-600'
                                                        }`}>
                                                        {transaction.type === 'income' ? (
                                                            <ArrowUp className="w-4 h-4" />
                                                        ) : transaction.type === 'expense' ? (
                                                            <ArrowDown className="w-4 h-4" />
                                                        ) : transaction.type === 'withdrawal' ? (
                                                            <ArrowUp className="w-4 h-4" />
                                                        ) : (
                                                            <ArrowUp className="w-4 h-4" />
                                                        )}
                                                        <span>
                                                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 font-medium ${transaction.type === 'income'
                                                    ? 'text-green-600'
                                                    : transaction.type === 'expense'
                                                        ? 'text-red-600'
                                                        : transaction.type === 'withdrawal'
                                                            ? 'text-orange-600'
                                                            : 'text-purple-600'
                                                    }`}>
                                                    {transaction.type === 'income' ? '+' : '-'} Rs. {Number(transaction.amount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/accounting/transaction/${transaction.id}`)}
                                                    >
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center">
                                                No transactions found for this account.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}