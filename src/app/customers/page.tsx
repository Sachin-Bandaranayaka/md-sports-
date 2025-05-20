'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, UserPlus, Filter } from 'lucide-react';
import { prisma } from '@/lib/prisma';

// Interface for Customer
interface Customer {
    id: string | number;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    createdAt: Date;
    updatedAt: Date;
    // Custom fields for UI
    type?: 'Credit' | 'Cash';
    balance?: number;
    lastPurchase?: string;
    status?: 'Active' | 'Inactive';
    contactPerson?: string;
}

// Status badge colors
const getStatusBadgeClass = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

const getCustomerTypeClass = (type: string) => {
    return type === 'Credit' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
};

export default function Customers() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        async function fetchCustomers() {
            try {
                // Fetch customers from API
                const response = await fetch('/api/customers');
                if (!response.ok) {
                    throw new Error('Failed to fetch customers');
                }
                const data = await response.json();

                // Transform data for UI
                const formattedCustomers = data.map((customer: Customer) => ({
                    ...customer,
                    // Default values for demonstration - in a real app these would come from related data
                    type: customer.id % 2 === 0 ? 'Cash' : 'Credit',
                    balance: customer.id % 2 === 0 ? 0 : 45000 + Math.floor(Math.random() * 80000),
                    lastPurchase: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'Active',
                    contactPerson: customer.name
                }));

                setCustomers(formattedCustomers);
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchCustomers();
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
                            <div className="h-10 bg-gray-200 rounded w-48 md:w-48"></div>
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
                        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
                        <p className="text-gray-500">Manage your business clients and individual customers</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" size="sm" onClick={() => router.push('/customers/new')}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Customer
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
                                placeholder="Search customers..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                                <option value="">All Types</option>
                                <option value="credit">Credit</option>
                                <option value="cash">Cash</option>
                            </select>
                            <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Customers table */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Customer Name</th>
                                    <th className="px-6 py-3">Contact Person</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Outstanding</th>
                                    <th className="px-6 py-3">Last Purchase</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length > 0 ? customers.map((customer) => (
                                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {typeof customer.id === 'number' ? `CUS-${String(customer.id).padStart(3, '0')}` : customer.id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {customer.name}
                                            <div className="text-xs text-gray-500">{customer.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.contactPerson}
                                            <div className="text-xs text-gray-500">{customer.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getCustomerTypeClass(customer.type || 'Cash')}`}>
                                                {customer.type || 'Cash'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.balance && customer.balance > 0 ? `Rs. ${customer.balance.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4">{customer.lastPurchase || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(customer.status || 'Active')}`}>
                                                {customer.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm">View</Button>
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                            No customers found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">1</span> to <span className="font-medium">{customers.length}</span> of <span className="font-medium">{customers.length}</span> customers
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm" disabled>Next</Button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 