'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, X, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Transaction, Account } from '@/types';
import { authGet, authPost } from '@/utils/api';

export default function Accounting() {
    const [activeTab, setActiveTab] = useState<'transactions' | 'accounts'>('transactions');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [typeFilter, setTypeFilter] = useState<Transaction['type'] | ''>('');
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

    // Filter transactions based on search term and type filter
    const filteredTransactions = transactions.filter((transaction) => {
        const matchesSearch =
            transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter ? transaction.type === typeFilter : true;

        return matchesSearch && matchesType;
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
        setShowAddTransactionModal(true);
    };

    const handleAddAccount = () => {
        setShowAddAccountModal(true);
    };

    // Handle saving a new transaction
    const handleSaveTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
        try {
            const response = await authPost('/api/accounting/transactions', transaction);
            if (!response.ok) {
                throw new Error('Failed to create transaction');
            }
            const data = await response.json();

            // Add the new transaction to the state
            setTransactions([...transactions, data.data]);

            // Close the modal
            setShowAddTransactionModal(false);

            // Refresh accounts to get updated balances
            const accountsResponse = await authGet('/api/accounting/accounts');
            if (accountsResponse.ok) {
                const accountsData = await accountsResponse.json();
                setAccounts(accountsData.data);
            }
        } catch (err) {
            console.error('Error creating transaction:', err);
            alert('Failed to create transaction. Please try again.');
        }
    };

    // Handle saving a new account
    const handleSaveAccount = async (account: Omit<Account, 'id' | 'createdAt'>) => {
        try {
            const response = await authPost('/api/accounting/accounts', account);
            if (!response.ok) {
                throw new Error('Failed to create account');
            }
            const data = await response.json();

            // Add the new account to the state
            setAccounts([...accounts, data.data]);

            // Close the modal
            setShowAddAccountModal(false);
        } catch (err) {
            console.error('Error creating account:', err);
            alert('Failed to create account. Please try again.');
        }
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
                        <Button variant="outline" size="sm">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                    </div>
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
                                                    {transaction.description}
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
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Delete"
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
                                                    {account.name}
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
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className={`${account.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                                                            title={account.isActive ? 'Deactivate' : 'Activate'}
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

            {/* Add Transaction Modal */}
            {showAddTransactionModal && (
                <TransactionFormModal
                    onClose={() => setShowAddTransactionModal(false)}
                    onSave={handleSaveTransaction}
                    accounts={accounts}
                />
            )}

            {/* Add Account Modal */}
            {showAddAccountModal && (
                <AccountFormModal
                    onClose={() => setShowAddAccountModal(false)}
                    onSave={handleSaveAccount}
                />
            )}
        </MainLayout>
    );
}

// TransactionFormModal Component
interface TransactionFormModalProps {
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
    accounts: Account[];
}

function TransactionFormModal({ onClose, onSave, accounts }: TransactionFormModalProps) {
    const [type, setType] = useState<Transaction['type']>('income');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [accountId, setAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [category, setCategory] = useState('');

    // Filter accounts for the "To Account" dropdown (exclude the selected "From Account")
    const toAccountOptions = accounts.filter(account => account.id !== accountId && account.isActive);

    const handleSubmit = (e: React.FormEvent) => {
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

        onSave(transaction);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">New Transaction</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Transaction Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transaction Type
                        </label>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                className={`px-3 py-2 text-sm rounded-md flex-1 ${type === 'income' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                onClick={() => setType('income')}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-2 text-sm rounded-md flex-1 ${type === 'expense' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                onClick={() => setType('expense')}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-2 text-sm rounded-md flex-1 ${type === 'withdrawal' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                onClick={() => setType('withdrawal')}
                            >
                                Withdrawal
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-2 text-sm rounded-md flex-1 ${type === 'transfer' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                                onClick={() => setType('transfer')}
                            >
                                Transfer
                            </button>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter description"
                            required
                        />
                    </div>

                    {/* From Account */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {type === 'transfer' ? 'From Account' : 'Account'}
                        </label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                    {type === 'transfer' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Account
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                    )}

                    {/* Amount */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (Rs.)
                        </label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* Reference */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reference (Optional)
                        </label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Invoice #, Receipt #, etc."
                        />
                    </div>

                    {/* Category */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Enter category"
                            required
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Save Transaction
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// AccountFormModal Component
interface AccountFormModalProps {
    onClose: () => void;
    onSave: (account: Omit<Account, 'id' | 'createdAt'>) => void;
}

function AccountFormModal({ onClose, onSave }: AccountFormModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('asset');
    const [balance, setBalance] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!name || !type) {
            alert('Please fill in all required fields');
            return;
        }

        // Create account object
        const account: Omit<Account, 'id' | 'createdAt'> = {
            name,
            type,
            balance: balance ? parseFloat(balance) : 0,
            description,
            isActive
        };

        onSave(account);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">New Account</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Account Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Name
                        </label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter account name"
                            required
                        />
                    </div>

                    {/* Account Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Type
                        </label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={type}
                            onChange={(e) => setType(e.target.value as Account['type'])}
                            required
                        >
                            <option value="asset">Asset</option>
                            <option value="liability">Liability</option>
                            <option value="equity">Equity</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    {/* Initial Balance */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Initial Balance (Rs.)
                        </label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            placeholder="Enter initial balance"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter description"
                            rows={3}
                        />
                    </div>

                    {/* Status */}
                    <div className="mb-6">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                Active
                            </label>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Save Account
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 