'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Search, Filter, Plus, Eye, Edit, Trash2, CreditCard, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { formatCurrency } from '@/utils/formatters';
import ExpensePaymentForm from './components/ExpensePaymentForm';
import EditExpensePaymentForm from './components/EditExpensePaymentForm';

interface ExpensePayment {
  id: number;
  amount: number;
  description: string;
  reference?: string;
  referenceNumber?: string;
  date: string;
  createdAt: string;
  paymentMethod?: string;
  account: {
    id: number;
    name: string;
    type: string;
  };
  toAccount: {
    id: number;
    name: string;
    type: string;
  };
}

interface ExpenseStats {
    totalExpenses: number;
    expensesThisMonth: number;
    averageExpense: number;
}

export default function Payments() {
    const [loading, setLoading] = useState(true);
    const [expensePayments, setExpensePayments] = useState<ExpensePayment[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [stats, setStats] = useState<ExpenseStats>({
        totalExpenses: 0,
        expensesThisMonth: 0,
        averageExpense: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAccount, setFilterAccount] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<ExpensePayment | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<number | null>(null);

    useEffect(() => {
        fetchExpensePayments();
        fetchAccounts();
    }, []);

    const fetchExpensePayments = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/payments/expenses');
            const data = await response.json();
            
            if (response.ok) {
                setExpensePayments(data);
                calculateStats(data);
            } else {
                console.error('Failed to fetch expense payments:', data.message);
            }
        } catch (error) {
            console.error('Error fetching expense payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/accounting/accounts');
            if (response.ok) {
                const result = await response.json();
                setAccounts(result.data || []);
            } else {
                console.error('Failed to fetch accounts');
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const calculateStats = (data: ExpensePayment[]) => {
        const totalAmount = data.reduce((sum, payment) => sum + payment.amount, 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthPayments = data.filter(payment => {
            const paymentDate = new Date(payment.createdAt);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        });
        
        const thisMonthTotal = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        setStats({
            totalExpenses: totalAmount,
            expensesThisMonth: thisMonthTotal,
            averageExpense: data.length > 0 ? totalAmount / data.length : 0
        });
    };

    const handleEditExpense = (expense: ExpensePayment) => {
        setSelectedExpense(expense);
        setShowEditForm(true);
    };

    const handleEditSuccess = () => {
        fetchExpensePayments();
        setShowEditForm(false);
        setSelectedExpense(null);
    };

    const handleDeleteExpense = async (expenseId: number) => {
        if (!confirm('Are you sure you want to delete this expense payment? This action cannot be undone and will reverse all account balance changes.')) {
            return;
        }

        setDeletingExpense(expenseId);
        try {
            const response = await fetch(`/api/payments/expenses?id=${expenseId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchExpensePayments();
            } else {
                const errorData = await response.json();
                alert(`Failed to delete expense payment: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error deleting expense payment:', error);
            alert('An error occurred while deleting the expense payment');
        } finally {
            setDeletingExpense(null);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="space-y-6">
                    {/* Loading header placeholder */}
                    <div className="bg-tertiary p-5 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                                <div className="h-8 bg-gray-200 rounded w-64"></div>
                                <div className="h-4 bg-gray-200 rounded w-48"></div>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-9 bg-gray-200 rounded w-32"></div>
                            </div>
                        </div>
                    </div>

                    {/* Loading filters placeholder */}
                    <div className="bg-tertiary p-5 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                            <div className="flex flex-wrap gap-2">
                                <div className="h-10 bg-gray-200 rounded w-32"></div>
                                <div className="h-10 bg-gray-200 rounded w-32"></div>
                                <div className="h-10 bg-gray-200 rounded w-12"></div>
                            </div>
                        </div>
                    </div>

                    {/* Loading table placeholder */}
                    <div className="bg-tertiary rounded-xl shadow-sm overflow-hidden border border-gray-200 animate-pulse">
                        <div className="p-5">
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-full"></div>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded w-full"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Loading summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                                    </div>
                                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
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
                    <h1 className="text-2xl font-bold text-gray-900">Expense Payments</h1>
                    <p className="text-gray-500">Record and manage expense payments</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={() => setShowExpenseForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Record Expense Payment
                    </Button>
                </div>
            </div>

            {/* Search and filter bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Search expense payments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select 
                                value={filterAccount}
                                onChange={(e) => setFilterAccount(e.target.value)}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                            >
                                <option value="all">All Accounts</option>
                                {accounts
                                    .filter(account => account.type === 'expense' || account.name.toLowerCase().includes('expense'))
                                    .map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name}
                                        </option>
                                    ))
                                }
                            </select>
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Expense Payments table */}
            <Card>
                <CardHeader>
                    <CardTitle>Expense Payments</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Expense Account</th>
                                    <th className="px-6 py-3">Method</th>
                                    <th className="px-6 py-3">Reference</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filteredPayments = expensePayments.filter(expense => {
                                        // Apply search filter
                                        const matchesSearch = !searchTerm || 
                                            expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            expense.account?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            expense.id.toString().includes(searchTerm) ||
                                            expense.amount.toString().includes(searchTerm);
                                        
                                        // Apply account filter
                                        const matchesAccount = filterAccount === 'all' || 
                                            expense.account?.id?.toString() === filterAccount;
                                        
                                        return matchesSearch && matchesAccount;
                                    });
                                    
                                    return filteredPayments.length > 0 ? filteredPayments.map((expense) => (
                                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-primary">
                                            {expense.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(expense.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {expense.description || 'Expense Payment'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {expense.account?.name || 'Unknown Account'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {expense.paymentMethod || 'Cash'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {expense.referenceNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {formatCurrency(expense.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center space-x-1"
                                                    onClick={() => handleEditExpense(expense)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span>Edit</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:border-red-300"
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    disabled={deletingExpense === expense.id}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span>{deletingExpense === expense.id ? 'Deleting...' : 'Delete'}</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                                No expense payments found
                                            </td>
                                        </tr>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-700">
                            {(() => {
                                const filteredCount = expensePayments.filter(expense => {
                                    const matchesSearch = !searchTerm || 
                                        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        expense.account?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        expense.id.toString().includes(searchTerm) ||
                                        expense.amount.toString().includes(searchTerm);
                                    
                                    const matchesAccount = filterAccount === 'all' || 
                                        expense.account?.id?.toString() === filterAccount;
                                    
                                    return matchesSearch && matchesAccount;
                                }).length;
                                
                                return `Showing ${filteredCount > 0 ? '1' : '0'} to ${filteredCount} of ${filteredCount} expense payments`;
                            })()} 
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm" disabled>Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Expenses</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</p>
                            </div>
                            <div className="p-3 rounded-full bg-red-100">
                                <CreditCard className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Expenses This Month</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.expensesThisMonth)}</p>
                            </div>
                            <div className="p-3 rounded-full bg-orange-100">
                                <CreditCard className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Average Expense</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageExpense)}</p>
                            </div>
                            <div className="p-3 rounded-full bg-yellow-100">
                                <CreditCard className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Expense Payment Form Modal */}
            {showExpenseForm && (
                <ExpensePaymentForm
                    onSuccess={() => {
                        fetchExpensePayments();
                        setShowExpenseForm(false);
                    }}
                    onClose={() => setShowExpenseForm(false)}
                />
            )}

            {showEditForm && selectedExpense && (
                <EditExpensePaymentForm
                    expense={selectedExpense}
                    onSuccess={handleEditSuccess}
                    onClose={() => {
                        setShowEditForm(false);
                        setSelectedExpense(null);
                    }}
                />
            )}
            </div>
        </MainLayout>
    );
}