'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, X, ArrowUp, ArrowDown, Filter, Calendar } from 'lucide-react';
import { Transaction, Account } from '@/types';
import { authGet, authPost, authDelete, authPatch } from '@/utils/api';

export default function Accounting() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [activeTab, setActiveTab] = useState<'transactions' | 'accounts'>(
        tabParam === 'accounts' ? 'accounts' : 'transactions'
    );
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<Transaction['type'] | ''>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch accounts and transactions data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch accounts
                const accountsResponse = await authGet('/api/accounting/accounts');
                if (!accountsResponse.ok) {
                    throw new Error('Failed to fetch accounts');
                }
                const accountsData = await accountsResponse.json();
                setAccounts(accountsData.data);

                // Fetch transactions
                const transactionsResponse = await authGet('/api/accounting/transactions');
                if (!transactionsResponse.ok) {
                    throw new Error('Failed to fetch transactions');
                }
                const transactionsData = await transactionsResponse.json();
                setTransactions(transactionsData.data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Update URL when tab changes
    useEffect(() => {
        const newParams = new URLSearchParams(searchParams);
        if (activeTab === 'accounts') {
            newParams.set('tab', 'accounts');
        } else {
            newParams.delete('tab');
        }
        router.replace(`/accounting?${newParams.toString()}`, { scroll: false });
    }, [activeTab, router, searchParams]);

    // Filter transactions based on search term, type filter, and date range
    const filteredTransactions = transactions.filter((transaction) => {
        const matchesSearch =
            transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter ? transaction.type === typeFilter : true;

        // Date range filtering
        const transactionDate = new Date(transaction.date);
        const matchesStartDate = startDate ? transactionDate >= new Date(startDate) : true;
        const matchesEndDate = endDate ? transactionDate <= new Date(endDate) : true;

        return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
    });

    // Filter accounts based on search term
    const filteredAccounts = accounts.filter((account) =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Calculate financial summary
    const totalAssets = accounts
        .filter(account => account.type === 'asset')
        .reduce((sum, account) => sum + Number(account.balance), 0);

    const totalLiabilities = accounts
        .filter(account => account.type === 'liability')
        .reduce((sum, account) => sum + Number(account.balance), 0);

    const totalEquity = totalAssets - totalLiabilities;

    const totalIncome = accounts
        .filter(account => account.type === 'income')
        .reduce((sum, account) => sum + Number(account.balance), 0);

    const totalExpenses = accounts
        .filter(account => account.type === 'expense')
        .reduce((sum, account) => sum + Number(account.balance), 0);

    // Calculate total withdrawals
    const totalWithdrawals = transactions
        .filter(transaction => transaction.type === 'withdrawal')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const netProfit = totalIncome - totalExpenses;

    const handleAddTransaction = () => {
        router.push('/accounting/add-transaction');
    };

    const handleAddAccount = () => {
        router.push('/accounting/add-account');
    };

    const handleDeleteTransaction = async (id: string | number) => {
        if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            try {
                const response = await authDelete(`/api/accounting/transactions?id=${id}`);

                if (!response.ok) {
                    throw new Error('Failed to delete transaction');
                }

                // Remove the transaction from state
                setTransactions(transactions.filter(t => t.id !== id));

                // Refresh data to update account balances
                fetchData();
            } catch (err) {
                console.error('Error deleting transaction:', err);
                alert('Failed to delete transaction. Please try again.');
            }
        }
    };

    const handleToggleAccountStatus = async (account: Account) => {
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
                setAccounts(accounts.map(a =>
                    a.id === account.id ? { ...a, isActive: newStatus } : a
                ));
            } catch (err) {
                console.error(`Error ${action}ing account:`, err);
                alert(`Failed to ${action} account. Please try again.`);
            }
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setTypeFilter('');
        setStartDate('');
        setEndDate('');
    };

    // Loading state
    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-600">Loading accounting data...</div>
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
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
                        <p className="text-gray-500">Manage your financial transactions and accounts</p>
                    </div>
                    <div className="flex gap-3">
                        {activeTab === 'transactions' ? (
                            <Button variant="primary" size="sm" onClick={handleAddTransaction}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Transaction
                            </Button>
                        ) : (
                            <Button variant="primary" size="sm" onClick={handleAddAccount}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Account
                            </Button>
                        )}
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Assets</h3>
                        <p className="text-2xl font-bold text-gray-900">Rs. {totalAssets.toLocaleString()}</p>
                        <div className="mt-1 text-sm text-gray-600">Total value of all assets</div>
                    </div>

                    <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Liabilities</h3>
                        <p className="text-2xl font-bold text-gray-900">Rs. {totalLiabilities.toLocaleString()}</p>
                        <div className="mt-1 text-sm text-gray-600">Total value of all liabilities</div>
                    </div>

                    <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Equity</h3>
                        <p className="text-2xl font-bold text-gray-900">Rs. {totalEquity.toLocaleString()}</p>
                        <div className="mt-1 text-sm text-gray-600">Total business equity</div>
                    </div>

                    <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Income</h3>
                        <p className="text-2xl font-bold text-green-600">Rs. {totalIncome.toLocaleString()}</p>
                        <div className="mt-1 text-sm text-gray-600">Total revenue and income</div>
                    </div>

                    <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Expenses</h3>
                        <p className="text-2xl font-bold text-red-600">Rs. {totalExpenses.toLocaleString()}</p>
                        <div className="mt-1 text-sm text-gray-600">Total expenses and costs</div>
                    </div>

                    <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Net Profit</h3>
                        <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Rs. {netProfit.toLocaleString()}
                        </p>
                        <div className="mt-1 text-sm text-gray-600">Total profit after expenses</div>
                    </div>

                    <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Owner Withdrawals</h3>
                        <p className="text-2xl font-bold text-orange-600">Rs. {totalWithdrawals.toLocaleString()}</p>
                        <div className="mt-1 text-sm text-gray-600">Total owner drawings this period</div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`py-2 px-1 text-sm font-medium ${activeTab === 'transactions'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Transactions
                        </button>
                        <button
                            onClick={() => setActiveTab('accounts')}
                            className={`py-2 px-1 text-sm font-medium ${activeTab === 'accounts'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Accounts
                        </button>
                    </nav>
                </div>

                {/* Search bar */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                                placeholder={`Search ${activeTab === 'transactions' ? 'transactions' : 'accounts'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                    </div>

                    {/* Advanced filters */}
                    {isFilterOpen && activeTab === 'transactions' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Date range filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="w-full"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter by transaction type */}
                {activeTab === 'transactions' && (
                    <div className="mt-6">
                        <div className="text-sm font-medium mb-2">Filter by Type</div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className={`px-3 py-1 text-sm rounded-full ${activeTab === 'transactions' && !typeFilter ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                                onClick={() => setTypeFilter('')}
                            >
                                All
                            </button>
                            <button
                                className={`px-3 py-1 text-sm rounded-full ${typeFilter === 'income' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                onClick={() => setTypeFilter('income')}
                            >
                                <ArrowDown className="w-3 h-3 inline mr-1" />
                                Income
                            </button>
                            <button
                                className={`px-3 py-1 text-sm rounded-full ${typeFilter === 'expense' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                                onClick={() => setTypeFilter('expense')}
                            >
                                <ArrowUp className="w-3 h-3 inline mr-1" />
                                Expense
                            </button>
                            <button
                                className={`px-3 py-1 text-sm rounded-full ${typeFilter === 'withdrawal' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}
                                onClick={() => setTypeFilter('withdrawal')}
                            >
                                <ArrowUp className="w-3 h-3 inline mr-1" />
                                Withdrawal
                            </button>
                            <button
                                className={`px-3 py-1 text-sm rounded-full ${typeFilter === 'transfer' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}
                                onClick={() => setTypeFilter('transfer')}
                            >
                                <ArrowUp className="w-3 h-3 inline mr-1" />
                                Transfer
                            </button>
                        </div>
                    </div>
                )}

                {/* Transactions Table */}
                {activeTab === 'transactions' && (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3">Account</th>
                                        <th className="px-6 py-3">Category</th>
                                        <th className="px-6 py-3">Reference</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((transaction) => (
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
                                                    {transaction.accountName}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {transaction.category}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {transaction.reference}
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
                                                            {transaction.type === 'income'
                                                                ? 'Income'
                                                                : transaction.type === 'expense'
                                                                    ? 'Expense'
                                                                    : transaction.type === 'withdrawal'
                                                                        ? 'Withdrawal'
                                                                        : 'Transfer'}
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
                                                    {transaction.type === 'transfer' && transaction.toAccountName && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            To: {transaction.toAccountName}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            className="text-yellow-500 hover:text-yellow-700"
                                                            title="Edit"
                                                            onClick={() => router.push(`/accounting/edit-transaction/${transaction.id}`)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Delete"
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-4 text-center">
                                                {searchTerm || typeFilter
                                                    ? 'No transactions found matching your search criteria.'
                                                    : 'No transactions found. Create your first transaction!'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{filteredTransactions.length}</span> transactions
                            </div>
                        </div>
                    </div>
                )}

                {/* Accounts Table */}
                {activeTab === 'accounts' && (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3">Balance</th>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAccounts.length > 0 ? (
                                        filteredAccounts.map((account) => (
                                            <tr key={account.id} className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <a
                                                        href={`/accounting/account/${account.id}`}
                                                        className="hover:underline hover:text-blue-600"
                                                    >
                                                        {account.name}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 capitalize">
                                                    {account.type}
                                                </td>
                                                <td className={`px-6 py-4 font-medium ${['income', 'asset'].includes(account.type)
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    Rs. {Number(account.balance).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {account.description}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${account.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {account.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            className="text-yellow-500 hover:text-yellow-700"
                                                            title="Edit"
                                                            onClick={() => router.push(`/accounting/edit-account/${account.id}`)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className={`${account.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                                                            title={account.isActive ? 'Deactivate' : 'Activate'}
                                                            onClick={() => handleToggleAccountStatus(account)}
                                                        >
                                                            {account.isActive ? (
                                                                <Trash className="w-4 h-4" />
                                                            ) : (
                                                                <Plus className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center">
                                                {searchTerm
                                                    ? 'No accounts found matching your search criteria.'
                                                    : 'No accounts found. Create your first account!'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{filteredAccounts.length}</span> accounts
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 