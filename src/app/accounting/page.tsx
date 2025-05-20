'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, X, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Transaction, Account } from '@/types';

// Dummy data for demonstration
const transactionsData: Transaction[] = [
    {
        id: 'TRX001',
        date: '2024-03-15',
        description: 'Supplier payment - Sports World Ltd.',
        accountId: 'ACC002',
        accountName: 'Bank Account',
        type: 'expense',
        amount: 117850,
        reference: 'INV-001-2023',
        category: 'Inventory Purchase',
        createdAt: '2024-03-15'
    },
    {
        id: 'TRX002',
        date: '2024-03-16',
        description: 'Sales - Green Valley School',
        accountId: 'ACC001',
        accountName: 'Cash Account',
        type: 'income',
        amount: 114020,
        reference: 'RCPT-001-2023',
        category: 'Sales Revenue',
        createdAt: '2024-03-16'
    },
    {
        id: 'TRX003',
        date: '2024-03-18',
        description: 'Rent payment',
        accountId: 'ACC002',
        accountName: 'Bank Account',
        type: 'expense',
        amount: 45000,
        reference: 'RENT-MAR-2024',
        category: 'Rent Expense',
        createdAt: '2024-03-18'
    },
    {
        id: 'TRX004',
        date: '2024-03-20',
        description: 'Utility Bills',
        accountId: 'ACC002',
        accountName: 'Bank Account',
        type: 'expense',
        amount: 12500,
        reference: 'UTIL-MAR-2024',
        category: 'Utilities Expense',
        createdAt: '2024-03-20'
    },
    {
        id: 'TRX005',
        date: '2024-03-22',
        description: 'Sales - Walk-in Customer',
        accountId: 'ACC001',
        accountName: 'Cash Account',
        type: 'income',
        amount: 28500,
        reference: 'POS-SALE-324',
        category: 'Sales Revenue',
        createdAt: '2024-03-22'
    }
];

const accountsData: Account[] = [
    {
        id: 'ACC001',
        name: 'Cash Account',
        type: 'asset',
        balance: 142520,
        description: 'Main cash account',
        isActive: true,
        createdAt: '2023-01-01'
    },
    {
        id: 'ACC002',
        name: 'Bank Account',
        type: 'asset',
        balance: 425650,
        description: 'Main bank account',
        isActive: true,
        createdAt: '2023-01-01'
    },
    {
        id: 'ACC003',
        name: 'Accounts Receivable',
        type: 'asset',
        balance: 75000,
        description: 'Money owed by customers',
        isActive: true,
        createdAt: '2023-01-01'
    },
    {
        id: 'ACC004',
        name: 'Accounts Payable',
        type: 'liability',
        balance: 132500,
        description: 'Money owed to suppliers',
        isActive: true,
        createdAt: '2023-01-01'
    },
    {
        id: 'ACC005',
        name: 'Sales Revenue',
        type: 'income',
        balance: 850000,
        description: 'Income from sales',
        isActive: true,
        createdAt: '2023-01-01'
    },
    {
        id: 'ACC006',
        name: 'Inventory Expense',
        type: 'expense',
        balance: 425000,
        description: 'Cost of goods sold',
        isActive: true,
        createdAt: '2023-01-01'
    },
    {
        id: 'ACC007',
        name: 'Operating Expenses',
        type: 'expense',
        balance: 215000,
        description: 'Office and admin expenses',
        isActive: true,
        createdAt: '2023-01-01'
    }
];

export default function Accounting() {
    const [activeTab, setActiveTab] = useState<'transactions' | 'accounts'>('transactions');
    const [transactions, setTransactions] = useState<Transaction[]>(transactionsData);
    const [accounts, setAccounts] = useState<Account[]>(accountsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);

    // Filter transactions based on search term
    const filteredTransactions = transactions.filter((transaction) =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter accounts based on search term
    const filteredAccounts = accounts.filter((account) =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate financial summary
    const totalAssets = accounts
        .filter(account => account.type === 'asset')
        .reduce((sum, account) => sum + account.balance, 0);

    const totalLiabilities = accounts
        .filter(account => account.type === 'liability')
        .reduce((sum, account) => sum + account.balance, 0);

    const totalEquity = totalAssets - totalLiabilities;

    const totalIncome = accounts
        .filter(account => account.type === 'income')
        .reduce((sum, account) => sum + account.balance, 0);

    const totalExpenses = accounts
        .filter(account => account.type === 'expense')
        .reduce((sum, account) => sum + account.balance, 0);

    const netProfit = totalIncome - totalExpenses;

    const handleAddTransaction = () => {
        setShowAddTransactionModal(true);
    };

    const handleAddAccount = () => {
        setShowAddAccountModal(true);
    };

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
                        <div className="mt-1 text-sm text-gray-600">Total profit or loss</div>
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
                                    {filteredTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                {transaction.date}
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
                                                    : 'text-red-600'
                                                    }`}>
                                                    {transaction.type === 'income' ? (
                                                        <ArrowUp className="w-4 h-4" />
                                                    ) : (
                                                        <ArrowDown className="w-4 h-4" />
                                                    )}
                                                    <span>{transaction.type === 'income' ? 'Income' : 'Expense'}</span>
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 font-medium ${transaction.type === 'income'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {transaction.type === 'income' ? '+' : '-'} Rs. {transaction.amount.toLocaleString()}
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
                                    ))}
                                    {filteredTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-4 text-center">
                                                No transactions found matching your search.
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
                                    {filteredAccounts.map((account) => (
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
                                                Rs. {account.balance.toLocaleString()}
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
                                    ))}
                                    {filteredAccounts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center">
                                                No accounts found matching your search.
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
                    onSave={(transaction) => {
                        const newId = `TRX${(transactions.length + 1).toString().padStart(3, '0')}`;
                        const newTransaction = {
                            ...transaction,
                            id: newId,
                            createdAt: new Date().toISOString().split('T')[0]
                        };
                        setTransactions([...transactions, newTransaction]);
                        setShowAddTransactionModal(false);
                    }}
                    accounts={accounts}
                />
            )}

            {/* Add Account Modal */}
            {showAddAccountModal && (
                <AccountFormModal
                    onClose={() => setShowAddAccountModal(false)}
                    onSave={(account) => {
                        const newId = `ACC${(accounts.length + 1).toString().padStart(3, '0')}`;
                        const newAccount = {
                            ...account,
                            id: newId,
                            createdAt: new Date().toISOString().split('T')[0]
                        };
                        setAccounts([...accounts, newAccount]);
                        setShowAddAccountModal(false);
                    }}
                />
            )}
        </MainLayout>
    );
}

interface TransactionFormModalProps {
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
    accounts: Account[];
}

function TransactionFormModal({ onClose, onSave, accounts }: TransactionFormModalProps) {
    const [formData, setFormData] = useState<Partial<Transaction>>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        accountId: '',
        accountName: '',
        type: 'expense',
        amount: 0,
        reference: '',
        category: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'accountId') {
            const selectedAccount = accounts.find(account => account.id === value);
            setFormData({
                ...formData,
                accountId: value,
                accountName: selectedAccount ? selectedAccount.name : ''
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Transaction, 'id' | 'createdAt'>);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">Add New Transaction</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date*
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description*
                            </label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account*
                            </label>
                            <select
                                name="accountId"
                                value={formData.accountId || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="">Select Account</option>
                                {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} ({account.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type*
                            </label>
                            <select
                                name="type"
                                value={formData.type || 'expense'}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (Rs.)*
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category*
                            </label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reference
                            </label>
                            <input
                                type="text"
                                name="reference"
                                value={formData.reference || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-6 pt-3 border-t">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">
                            Create Transaction
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface AccountFormModalProps {
    onClose: () => void;
    onSave: (account: Omit<Account, 'id' | 'createdAt'>) => void;
}

function AccountFormModal({ onClose, onSave }: AccountFormModalProps) {
    const [formData, setFormData] = useState<Partial<Account>>({
        name: '',
        type: 'asset',
        balance: 0,
        description: '',
        isActive: true
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData({ ...formData, [name]: target.checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Account, 'id' | 'createdAt'>);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">Add New Account</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Name*
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Type*
                            </label>
                            <select
                                name="type"
                                value={formData.type || 'asset'}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="asset">Asset</option>
                                <option value="liability">Liability</option>
                                <option value="equity">Equity</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Opening Balance (Rs.)
                            </label>
                            <input
                                type="number"
                                name="balance"
                                value={formData.balance || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            ></textarea>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label className="ml-2 text-sm font-medium text-gray-700">
                                Account is active
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-6 pt-3 border-t">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">
                            Create Account
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 