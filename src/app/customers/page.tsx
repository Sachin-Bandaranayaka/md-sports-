'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, UserPlus, Users, Filter } from 'lucide-react';

// Dummy data for demonstration
const customers = [
    {
        id: 'CUS-001',
        name: 'Colombo Cricket Club',
        contactPerson: 'Dinesh Chandimal',
        phoneNumber: '+94 112 345 123',
        email: 'info@colombocricket.lk',
        type: 'Credit',
        balance: 125000,
        lastPurchase: '2025-05-12',
        status: 'Active'
    },
    {
        id: 'CUS-002',
        name: 'Kandy Sports Association',
        contactPerson: 'Mahela Jayawardene',
        phoneNumber: '+94 812 345 456',
        email: 'info@kandysports.lk',
        type: 'Credit',
        balance: 78500,
        lastPurchase: '2025-05-10',
        status: 'Active'
    },
    {
        id: 'CUS-003',
        name: 'Galle School District',
        contactPerson: 'Kumar Sangakkara',
        phoneNumber: '+94 912 345 789',
        email: 'sports@galleschools.lk',
        type: 'Credit',
        balance: 0,
        lastPurchase: '2025-04-28',
        status: 'Inactive'
    },
    {
        id: 'CUS-004',
        name: 'Sampath Perera',
        contactPerson: 'Sampath Perera',
        phoneNumber: '+94 712 345 678',
        email: 'sampath@gmail.com',
        type: 'Cash',
        balance: 0,
        lastPurchase: '2025-05-15',
        status: 'Active'
    },
    {
        id: 'CUS-005',
        name: 'Nuwara Eliya Tennis Club',
        contactPerson: 'Roshan Fernando',
        phoneNumber: '+94 522 345 123',
        email: 'info@netennisclub.lk',
        type: 'Credit',
        balance: 45000,
        lastPurchase: '2025-05-08',
        status: 'Active'
    }
];

// Status badge colors
const getStatusBadgeClass = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

const getCustomerTypeClass = (type: string) => {
    return type === 'Credit' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
};

export default function Customers() {
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
                        <Button variant="primary" size="sm">
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
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {customer.id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {customer.name}
                                            <div className="text-xs text-gray-500">{customer.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.contactPerson}
                                            <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getCustomerTypeClass(customer.type)}`}>
                                                {customer.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.balance > 0 ? `Rs. ${customer.balance.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4">{customer.lastPurchase}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(customer.status)}`}>
                                                {customer.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm">View</Button>
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">5</span> customers
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