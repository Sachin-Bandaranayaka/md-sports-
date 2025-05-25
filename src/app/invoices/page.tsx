'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, FileText, Download, Eye, CheckCircle, Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';

// Interface for Invoice
interface Invoice {
    id: string | number;
    invoiceNumber: string;
    customerId: number;
    total: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    // Relations and UI fields
    customerName?: string;
    date?: string;
    dueDate?: string;
    items?: number;
}

// Status badge colors
const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'Paid':
            return 'bg-green-100 text-green-800';
        case 'Pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'Overdue':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Invoices() {
    const [loading, setLoading] = useState<boolean>(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [statistics, setStatistics] = useState({
        totalOutstanding: 0,
        paidThisMonth: 0,
        overdueCount: 0
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    async function fetchInvoices() {
        try {
            // Fetch invoices from API
            const response = await fetch('/api/invoices');
            if (!response.ok) {
                throw new Error('Failed to fetch invoices');
            }
            const data = await response.json();

            console.log("Raw invoice data:", data);

            // Calculate statistics
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            let outstanding = 0;
            let paidThisMonth = 0;
            let overdueCount = 0;

            // Transform data for UI
            const formattedInvoices = await Promise.all(data.map(async (invoice: any) => {
                // Get customer name - in a real app this would be included in the API response
                let customerName = 'Unknown Customer';
                try {
                    const customerResponse = await fetch(`/api/customers/${invoice.customerId}`);
                    if (customerResponse.ok) {
                        const customer = await customerResponse.json();
                        customerName = customer.name;
                    }
                } catch (e) {
                    console.error('Error fetching customer:', e);
                }

                // Calculate statistics
                if (invoice.status === 'Paid' && new Date(invoice.updatedAt) >= firstDayOfMonth) {
                    paidThisMonth += invoice.total;
                } else if (invoice.status !== 'Paid') {
                    outstanding += invoice.total;
                }

                if (invoice.status === 'Overdue') {
                    overdueCount++;
                }

                // Create date and due date (30 days later)
                const createdDate = new Date(invoice.createdAt);
                const dueDate = new Date(createdDate);
                dueDate.setDate(dueDate.getDate() + 30);

                // Use the itemCount field from API or fall back to items.length if it exists
                const itemsCount = invoice.itemCount !== undefined ? invoice.itemCount :
                    (Array.isArray(invoice.items) ? invoice.items.length : 0);

                console.log(`Items count for invoice ${invoice.invoiceNumber}:`, itemsCount);

                return {
                    ...invoice,
                    customerName,
                    date: createdDate.toISOString().split('T')[0],
                    dueDate: dueDate.toISOString().split('T')[0],
                    items: itemsCount
                };
            }));

            console.log("Formatted invoices:", formattedInvoices);

            setInvoices(formattedInvoices);
            setStatistics({
                totalOutstanding: outstanding,
                paidThisMonth,
                overdueCount
            });
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    }

    // Handle recording payment for an invoice
    const handleRecordPayment = async (invoiceId: string | number) => {
        try {
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'Paid' }),
            });

            if (!response.ok) {
                throw new Error('Failed to update invoice status');
            }

            // Refresh invoices list after successful update
            fetchInvoices();
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment. Please try again.');
        }
    };

    // Handle deleting an invoice
    const handleDeleteInvoice = async (invoiceId: string | number) => {
        if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/invoices/${invoiceId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete invoice');
                }

                // Refresh invoices list after successful deletion
                fetchInvoices();
            } catch (error) {
                console.error('Error deleting invoice:', error);
                alert('Failed to delete invoice. Please try again.');
            }
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
                        <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
                        <p className="text-gray-500">Create and manage customer invoices</p>
                    </div>
                    <div className="flex gap-3">
                        <a href="/invoices/new">
                            <Button variant="primary" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Invoice
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
                                placeholder="Search invoices..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                                <option value="">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="overdue">Overdue</option>
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

                {/* Invoices table */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Invoice #</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Due Date</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Items</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length > 0 ? invoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-primary">
                                            <a href={`/invoices/${invoice.id}`} className="hover:underline">
                                                {invoice.invoiceNumber}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {invoice.customerName}
                                        </td>
                                        <td className="px-6 py-4">{invoice.date}</td>
                                        <td className="px-6 py-4">{invoice.dueDate}</td>
                                        <td className="px-6 py-4 font-medium">Rs. {invoice.total.toLocaleString()}</td>
                                        <td className="px-6 py-4">{invoice.items} items</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <a href={`/invoices/${invoice.id}`}>
                                                    <Button variant="ghost" size="sm" title="View Invoice">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                                <a href={`/invoices/${invoice.id}`}>
                                                    <Button variant="ghost" size="sm" title="Print/Download Invoice">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                                {invoice.status !== 'Paid' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Record Payment"
                                                        onClick={() => handleRecordPayment(invoice.id)}
                                                    >
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Delete Invoice"
                                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                            No invoices found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">1</span> to <span className="font-medium">{invoices.length}</span> of <span className="font-medium">{invoices.length}</span> invoices
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
                                <p className="text-sm text-gray-500">Total Outstanding</p>
                                <p className="text-2xl font-bold text-gray-900">Rs. {statistics.totalOutstanding.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-full bg-red-100">
                                <FileText className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Paid This Month</p>
                                <p className="text-2xl font-bold text-gray-900">Rs. {statistics.paidThisMonth.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Overdue Invoices</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.overdueCount}</p>
                            </div>
                            <div className="p-3 rounded-full bg-yellow-100">
                                <FileText className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 