'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, X, ArrowUp, ArrowDown, Filter, Calendar, DollarSign, Briefcase, CreditCard, PieChart, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Transaction, Account } from '@/types';
import { authGet, authPost, authDelete, authPatch } from '@/utils/api';
// Removed framer-motion animations

// Create a wrapper component to use the search params
function AccountingContent() {
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

    // Function to fetch accounts and transactions data
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

    // Fetch accounts and transactions data
    useEffect(() => {
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

    // Calculate simplified cash flow summary based on paid invoices and transactions
    const cashInHand = transactions
        .filter(transaction => transaction.type === 'income' &&
            (transaction.category?.toLowerCase().includes('cash') ||
                transaction.accountName?.toLowerCase().includes('cash')))
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const cashInBank = transactions
        .filter(transaction => transaction.type === 'income' &&
            (transaction.category?.toLowerCase().includes('bank') ||
                transaction.category?.toLowerCase().includes('card') ||
                transaction.accountName?.toLowerCase().includes('bank')))
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    // Calculate total sales from all income transactions (representing paid invoices)
    const totalSales = transactions
        .filter(transaction => transaction.type === 'income')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    // Calculate expenses from transactions
    const totalExpenses = transactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const handleAddTransaction = () => {
        router.push('/accounting/add-transaction');
    };

    const handleAddAccount = () => {
        router.push('/accounting/add-account');
    };

    const handleAddSubAccount = (parentId: string) => {
        router.push(`/accounting/add-account?parentId=${parentId}`);
    };

    const handleDeleteTransaction = async (id: string | number) => {
        if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            try {
                const response = await authDelete(`/api/accounting/transactions?id=${id}`);

                if (!response.ok) {
                    throw new Error('Failed to delete transaction');
                }

                // Refresh data to update account balances and transaction list
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

                // Refresh data to update account list
                fetchData();
            } catch (err) {
                console.error(`Error ${action}ing account:`, err);
                alert(`Failed to ${action} account. Please try again.`);
            }
        }
    };

    const handleDeleteAccount = async (account: Account) => {
        if (confirm(`Are you sure you want to permanently delete the account "${account.name}"? This action cannot be undone.`)) {
            try {
                const response = await authDelete(`/api/accounting/accounts?id=${account.id}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete account');
                }

                // Refresh data to update account list
                fetchData();
                alert('Account deleted successfully');
            } catch (err) {
                console.error('Error deleting account:', err);
                alert(err instanceof Error ? err.message : 'Failed to delete account. Please try again.');
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
                        <h1 className="text-2xl font-bold text-gray-900">Cash Flow Overview</h1>
                        <p className="text-gray-500">Track your cash flow from sales and expenses</p>
                    </div>
                    {activeTab === 'accounts' && (
                        <div className="flex gap-3">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAddAccount}
                                className="flex items-center shadow-md"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Account
                            </Button>
                        </div>
                    )}
                </div>

                {/* Simplified Cash Flow Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Cash in Hand</h3>
                                <p className="text-2xl font-bold text-green-600">Rs. {cashInHand.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">From cash payments</div>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Cash in Bank</h3>
                                <p className="text-2xl font-bold text-blue-600">Rs. {cashInBank.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">From bank transfers & cards</div>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Sales</h3>
                                <p className="text-2xl font-bold text-purple-600">Rs. {totalSales.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">From paid invoices</div>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Expenses</h3>
                                <p className="text-2xl font-bold text-red-600">Rs. {totalExpenses.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">Business expenses</div>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`relative py-3 px-1 text-sm font-medium ${
                                activeTab === 'transactions'
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Transactions
                            {activeTab === 'transactions' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('accounts')}
                            className={`relative py-3 px-1 text-sm font-medium ${
                                activeTab === 'accounts'
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Accounts
                            {activeTab === 'accounts' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                        </button>
                    </nav>
                </div>

                {/* Search bar */}
                <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                                placeholder={`Search ${activeTab === 'transactions' ? 'transactions' : 'accounts'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center justify-center"
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
                                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
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
                                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
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
                                            className="w-full flex items-center justify-center"
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
                        <div className="text-sm font-medium mb-3">Filter by Type</div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${activeTab === 'transactions' && !typeFilter ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('')}
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                All
                            </button>
                            <button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${typeFilter === 'income' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('income')}
                            >
                                <TrendingUp className="w-3 h-3 mr-2" />
                                Income
                            </button>
                            <button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${typeFilter === 'expense' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('expense')}
                            >
                                <TrendingDown className="w-3 h-3 mr-2" />
                                Expense
                            </button>
                            <button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${typeFilter === 'withdrawal' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('withdrawal')}
                            >
                                <ArrowUp className="w-3 h-3 mr-2" />
                                Withdrawal
                            </button>
                            <button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${typeFilter === 'transfer' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('transfer')}
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Transfer
                            </button>
                        </div>
                    </div>
                )}

                {/* Transactions Table */}
                {activeTab === 'transactions' && (
                    <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
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
                                            <tr
                                                key={transaction.id}
                                                className="border-b hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <span
                                                        onClick={() => router.push(`/accounting/transaction/${transaction.id}`)}
                                                        className="hover:underline hover:text-blue-600 cursor-pointer"
                                                    >
                                                        {transaction.description}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {transaction.accountName}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {transaction.category}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {transaction.reference || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.type === 'income'
                                                        ? 'bg-green-100 text-green-800'
                                                        : transaction.type === 'expense'
                                                            ? 'bg-red-100 text-red-800'
                                                            : transaction.type === 'withdrawal'
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {transaction.type === 'income' ? (
                                                            <TrendingUp className="w-3 h-3 mr-1" />
                                                        ) : transaction.type === 'expense' ? (
                                                            <TrendingDown className="w-3 h-3 mr-1" />
                                                        ) : transaction.type === 'withdrawal' ? (
                                                            <ArrowUp className="w-3 h-3 mr-1" />
                                                        ) : (
                                                            <RefreshCw className="w-3 h-3 mr-1" />
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
                                                    {transaction.type === 'transfer' && transaction.toAccountName && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            To: {transaction.toAccountName}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            className="text-blue-500 hover:text-blue-700"
                                                            title="View"
                                                            onClick={() => router.push(`/accounting/transaction/${transaction.id}`)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                        </button>
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
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
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
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAddTransaction}
                                className="flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Transaction
                            </Button>
                        </div>
                    </div>
                )}

                {/* Accounts Table */}
                {activeTab === 'accounts' && (
                    <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
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
                                            <tr
                                                key={account.id}
                                                className="border-b hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <div className="flex items-center">
                                                        {account.parentId && (
                                                            <span className="mr-2 text-gray-400">└─</span>
                                                        )}
                                                        <span
                                                            onClick={() => router.push(`/accounting/account/${account.id}`)}
                                                            className="hover:underline hover:text-blue-600 cursor-pointer"
                                                        >
                                                            {account.name}
                                                        </span>
                                                        {account.parentId && account.parent && (
                                                            <span className="ml-2 text-xs text-gray-500">
                                                                (under {account.parent.name})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        account.type === 'asset'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : account.type === 'liability'
                                                                ? 'bg-red-100 text-red-800'
                                                                : account.type === 'equity'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : account.type === 'income'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-orange-100 text-orange-800'
                                                        }`}>
                                                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 font-medium ${
                                                    ['income', 'asset'].includes(account.type)
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    Rs. {Number(account.balance).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {account.description || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        account.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {account.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            className="text-blue-500 hover:text-blue-700"
                                                            title="View"
                                                            onClick={() => router.push(`/accounting/account/${account.id}`)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                        </button>
                                                        <button
                                                            className="text-yellow-500 hover:text-yellow-700"
                                                            title="Edit"
                                                            onClick={() => router.push(`/accounting/edit-account/${account.id}`)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        {!account.parentId && (
                                                            <button
                                                                className="text-purple-500 hover:text-purple-700"
                                                                title="Add Sub-Account"
                                                                onClick={() => handleAddSubAccount(account.id)}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            className={`${account.isActive ? 'text-orange-500 hover:text-orange-700' : 'text-green-500 hover:text-green-700'}`}
                                                            title={account.isActive ? 'Deactivate' : 'Activate'}
                                                            onClick={() => handleToggleAccountStatus(account)}
                                                        >
                                                            {account.isActive ? (
                                                                <ArrowDown className="w-4 h-4" />
                                                            ) : (
                                                                <ArrowUp className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Delete Account"
                                                            onClick={() => handleDeleteAccount(account)}
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAddAccount}
                                className="flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Account
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

// Main component with Suspense boundary
export default function Accounting() {
    return (
        <Suspense fallback={
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-600">Loading...</div>
                </div>
            </MainLayout>
        }>
            <AccountingContent />
        </Suspense>
    );
}