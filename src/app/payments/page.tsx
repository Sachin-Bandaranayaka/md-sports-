'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, CreditCard, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

// Interface for Payment
interface Payment {
    id: number;
    invoiceId: number;
    customerId: number;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string | null;
    createdAt: string;
    updatedAt: string;
    // Relations
    invoice?: {
        invoiceNumber: string;
    };
    customer?: {
        name: string;
    };
    // UI fields
    date?: string;
}

export default function Payments() {
    const [loading, setLoading] = useState<boolean>(true);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [statistics, setStatistics] = useState({
        totalPayments: 0,
        paymentsThisMonth: 0,
        avgPaymentAmount: 0
    });

    useEffect(() => {
        async function fetchPayments() {
            try {
                // Fetch payments from API
                const response = await fetch('/api/payments');
                if (!response.ok) {
                    throw new Error('Failed to fetch payments');
                }
                const data = await response.json();

                // Calculate statistics
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                let totalAmount = 0;
                let monthlyTotal = 0;

                // Format data for UI
                const formattedPayments = data.map((payment: Payment) => {
                    const paymentDate = new Date(payment.createdAt);

                    // Add to statistics
                    totalAmount += payment.amount;
                    if (paymentDate >= firstDayOfMonth) {
                        monthlyTotal += payment.amount;
                    }

                    return {
                        ...payment,
                        date: paymentDate.toISOString().split('T')[0]
                    };
                });

                setPayments(formattedPayments);
                setStatistics({
                    totalPayments: data.length,
                    paymentsThisMonth: data.filter((p: Payment) => new Date(p.createdAt) >= firstDayOfMonth).length,
                    avgPaymentAmount: data.length > 0 ? totalAmount / data.length : 0
                });
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPayments();
    }, []);

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
                        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
                        <p className="text-gray-500">View and manage payment records</p>
                    </div>
                    <div className="flex gap-3">
                        <a href="/payments/new">
                            <Button variant="primary" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Record Payment
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Search and filter bar */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                                placeholder="Search payments..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                                <option value="">All Methods</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Check">Check</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Online Payment">Online Payment</option>
                            </select>
                            <input
                                type="date"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                                placeholder="From Date"
                            />
                            <input
                                type="date"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                                placeholder="To Date"
                            />
                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Payments table */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Payment ID</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Invoice</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Method</th>
                                    <th className="px-6 py-3">Reference</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? payments.map((payment) => (
                                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-primary">
                                            {payment.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.date}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <a href={`/invoices/${payment.invoiceId}`} className="hover:underline">
                                                {payment.invoice?.invoiceNumber || `Invoice #${payment.invoiceId}`}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.customer?.name || `Customer #${payment.customerId}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.paymentMethod}
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.referenceNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <a href={`/invoices/${payment.invoiceId}`}>
                                                    <Button variant="ghost" size="sm" title="View Invoice">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                            No payments found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">1</span> to <span className="font-medium">{payments.length}</span> of <span className="font-medium">{payments.length}</span> payments
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm" disabled>Next</Button>
                        </div>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Payments</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.totalPayments}</p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <CreditCard className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Payments This Month</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.paymentsThisMonth}</p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <CreditCard className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Average Payment</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.avgPaymentAmount)}</p>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100">
                                <CreditCard className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 