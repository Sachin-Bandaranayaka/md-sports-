'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, FileText, Download, Eye } from 'lucide-react';

// Dummy data for demonstration
const invoices = [
    {
        id: 'INV-001',
        customerName: 'Colombo Cricket Club',
        date: '2025-05-12',
        dueDate: '2025-06-11',
        amount: 45000,
        status: 'Paid',
        items: 12
    },
    {
        id: 'INV-002',
        customerName: 'Kandy Sports Association',
        date: '2025-05-10',
        dueDate: '2025-06-09',
        amount: 28500,
        status: 'Pending',
        items: 8
    },
    {
        id: 'INV-003',
        customerName: 'Nuwara Eliya Tennis Club',
        date: '2025-05-08',
        dueDate: '2025-06-07',
        amount: 32000,
        status: 'Overdue',
        items: 10
    },
    {
        id: 'INV-004',
        customerName: 'Sampath Perera',
        date: '2025-05-15',
        dueDate: '2025-05-15',
        amount: 12500,
        status: 'Paid',
        items: 3
    },
    {
        id: 'INV-005',
        customerName: 'Galle School District',
        date: '2025-04-28',
        dueDate: '2025-05-28',
        amount: 78000,
        status: 'Overdue',
        items: 25
    }
];

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
                        <Button variant="primary" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Invoice
                        </Button>
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
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-primary">
                                            {invoice.id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {invoice.customerName}
                                        </td>
                                        <td className="px-6 py-4">{invoice.date}</td>
                                        <td className="px-6 py-4">{invoice.dueDate}</td>
                                        <td className="px-6 py-4 font-medium">Rs. {invoice.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">{invoice.items} items</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">5</span> invoices
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
                                <p className="text-2xl font-bold text-gray-900">Rs. 138,500</p>
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
                                <p className="text-2xl font-bold text-gray-900">Rs. 57,500</p>
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
                                <p className="text-2xl font-bold text-gray-900">2</p>
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