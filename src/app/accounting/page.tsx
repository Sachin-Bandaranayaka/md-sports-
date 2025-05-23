'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, X, ArrowUp, ArrowDown, Filter, Calendar, DollarSign, Briefcase, CreditCard, PieChart, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Transaction, Account } from '@/types';
import { authGet, authPost, authDelete, authPatch } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3 }
    }
};

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

    // Calculate financial summary
    const totalAssets = accounts
        .filter(account => account.type === 'asset')
        .reduce((sum, account) => sum + Number(account.balance), 0);

    const totalLiabilities = accounts
        .filter(account => account.type === 'liability')
        .reduce((sum, account) => sum + Number(account.balance), 0);

    const totalEquity = totalAssets - totalLiabilities;

    // Calculate income from transactions
    const totalIncome = transactions
        .filter(transaction => transaction.type === 'income')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    // Calculate expenses from transactions
    const totalExpenses = transactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

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
                <motion.div
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
                        <p className="text-gray-500">Manage your financial transactions and accounts</p>
                    </div>
                    <motion.div
                        className="flex gap-3"
                        whileHover={{ scale: 1.03 }}
                    >
                        {activeTab === 'transactions' ? (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAddTransaction}
                                className="flex items-center shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Transaction
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAddAccount}
                                className="flex items-center shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Account
                            </Button>
                        )}
                    </motion.div>
                </motion.div>

                {/* Financial Summary Cards */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={listVariants}
                >
                    <motion.div
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                        variants={cardVariants}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Assets</h3>
                                <p className="text-2xl font-bold text-gray-900">Rs. {totalAssets.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">Total value of all assets</div>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                        variants={cardVariants}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Liabilities</h3>
                                <p className="text-2xl font-bold text-gray-900">Rs. {totalLiabilities.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">Total value of all liabilities</div>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <CreditCard className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                        variants={cardVariants}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Equity</h3>
                                <p className="text-2xl font-bold text-gray-900">Rs. {totalEquity.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">Total business equity</div>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <PieChart className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                        variants={cardVariants}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Income</h3>
                                <p className="text-2xl font-bold text-green-600">Rs. {totalIncome.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">Total revenue and income</div>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                        variants={cardVariants}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Expenses</h3>
                                <p className="text-2xl font-bold text-red-600">Rs. {totalExpenses.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">Total expenses and costs</div>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                        variants={cardVariants}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Net Profit</h3>
                                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Rs. {netProfit.toLocaleString()}
                                </p>
                                <div className="mt-1 text-sm text-gray-600">Total profit after expenses</div>
                            </div>
                            <div className={`${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'} p-3 rounded-full`}>
                                <DollarSign className={`w-6 h-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                        variants={cardVariants}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Owner Withdrawals</h3>
                                <p className="text-2xl font-bold text-orange-600">Rs. {totalWithdrawals.toLocaleString()}</p>
                                <div className="mt-1 text-sm text-gray-600">Total owner drawings this period</div>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <ArrowUp className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`relative py-3 px-1 text-sm font-medium transition-colors duration-200 ${activeTab === 'transactions'
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Transactions
                            {activeTab === 'transactions' && (
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                    layoutId="activeTab"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('accounts')}
                            className={`relative py-3 px-1 text-sm font-medium transition-colors duration-200 ${activeTab === 'accounts'
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Accounts
                            {activeTab === 'accounts' && (
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                    layoutId="activeTab"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                        </button>
                    </nav>
                </div>

                {/* Search bar */}
                <motion.div
                    className="bg-white p-5 rounded-lg shadow-md border border-gray-100"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 transition-all duration-200"
                                placeholder={`Search ${activeTab === 'transactions' ? 'transactions' : 'accounts'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center justify-center transition-colors duration-200"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                    </div>

                    {/* Advanced filters */}
                    <AnimatePresence>
                        {isFilterOpen && activeTab === 'transactions' && (
                            <motion.div
                                className="mt-4 pt-4 border-t border-gray-200"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Filter by transaction type */}
                {activeTab === 'transactions' && (
                    <motion.div
                        className="mt-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <div className="text-sm font-medium mb-3">Filter by Type</div>
                        <div className="flex flex-wrap gap-2">
                            <motion.button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${activeTab === 'transactions' && !typeFilter ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('')}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                All
                            </motion.button>
                            <motion.button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${typeFilter === 'income' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('income')}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <TrendingUp className="w-3 h-3 mr-2" />
                                Income
                            </motion.button>
                            <motion.button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${typeFilter === 'expense' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('expense')}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <TrendingDown className="w-3 h-3 mr-2" />
                                Expense
                            </motion.button>
                            <motion.button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${typeFilter === 'withdrawal' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('withdrawal')}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <ArrowUp className="w-3 h-3 mr-2" />
                                Withdrawal
                            </motion.button>
                            <motion.button
                                className={`px-4 py-2 text-sm rounded-md flex items-center ${typeFilter === 'transfer' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                                onClick={() => setTypeFilter('transfer')}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Transfer
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Transactions Table */}
                {activeTab === 'transactions' && (
                    <motion.div
                        className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
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
                                <motion.tbody
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((transaction) => (
                                            <motion.tr
                                                key={transaction.id}
                                                className="border-b hover:bg-gray-50 transition-colors duration-150"
                                                variants={itemVariants}
                                                whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <span
                                                        onClick={() => router.push(`/accounting/transaction/${transaction.id}`)}
                                                        className="hover:underline hover:text-blue-600 cursor-pointer transition-colors duration-200"
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
                                                        <motion.button
                                                            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                                                            title="View"
                                                            onClick={() => router.push(`/accounting/transaction/${transaction.id}`)}
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                        </motion.button>
                                                        <motion.button
                                                            className="text-yellow-500 hover:text-yellow-700 transition-colors duration-200"
                                                            title="Edit"
                                                            onClick={() => router.push(`/accounting/edit-transaction/${transaction.id}`)}
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </motion.button>
                                                        <motion.button
                                                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                                            title="Delete"
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
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
                                </motion.tbody>
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
                    </motion.div>
                )}

                {/* Accounts Table */}
                {activeTab === 'accounts' && (
                    <motion.div
                        className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
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
                                <motion.tbody
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {filteredAccounts.length > 0 ? (
                                        filteredAccounts.map((account) => (
                                            <motion.tr
                                                key={account.id}
                                                className="border-b hover:bg-gray-50 transition-colors duration-150"
                                                variants={itemVariants}
                                                whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <span
                                                        onClick={() => router.push(`/accounting/account/${account.id}`)}
                                                        className="hover:underline hover:text-blue-600 cursor-pointer transition-colors duration-200"
                                                    >
                                                        {account.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${account.type === 'asset'
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
                                                <td className={`px-6 py-4 font-medium ${['income', 'asset'].includes(account.type)
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    Rs. {Number(account.balance).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {account.description || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${account.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {account.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <motion.button
                                                            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                                                            title="View"
                                                            onClick={() => router.push(`/accounting/account/${account.id}`)}
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                        </motion.button>
                                                        <motion.button
                                                            className="text-yellow-500 hover:text-yellow-700 transition-colors duration-200"
                                                            title="Edit"
                                                            onClick={() => router.push(`/accounting/edit-account/${account.id}`)}
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </motion.button>
                                                        <motion.button
                                                            className={`${account.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'} transition-colors duration-200`}
                                                            title={account.isActive ? 'Deactivate' : 'Activate'}
                                                            onClick={() => handleToggleAccountStatus(account)}
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            {account.isActive ? (
                                                                <Trash className="w-4 h-4" />
                                                            ) : (
                                                                <Plus className="w-4 h-4" />
                                                            )}
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
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
                                </motion.tbody>
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
                    </motion.div>
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