'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, UserPlus, Filter, X, Trash2, Loader2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { authDelete } from '@/utils/api';

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
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchSuggestions, setSearchSuggestions] = useState<Customer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [deleteLoading, setDeleteLoading] = useState<string | number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Event handler for clicks outside the suggestions box
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
                const formattedCustomers = data.map((customer: Customer) => {
                    // Parse the JSON stored in address field to get additional properties
                    let addressData = {};
                    try {
                        if (customer.address) {
                            addressData = JSON.parse(customer.address);
                        }
                    } catch (e) {
                        console.error('Error parsing customer address data:', e);
                    }

                    // Extract relevant data from the parsed address
                    const { 
                        paymentType = 'Cash', 
                        creditLimit = 0, 
                        contactPerson = null,
                        customerType = 'Retail'
                    } = addressData as any;

                    return {
                        ...customer,
                        // Use actual data from the customer record
                        type: paymentType,
                        // Only show balance for Credit customers
                        balance: paymentType === 'Credit' ? creditLimit : 0,
                        lastPurchase: new Date(customer.updatedAt).toISOString().split('T')[0],
                        status: 'Active',
                        contactPerson: contactPerson || customer.name
                    };
                });

                setAllCustomers(formattedCustomers);
                setCustomers(formattedCustomers);
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchCustomers();
    }, []);

    // Function to search customers and update suggestions
    const searchCustomers = (value: string) => {
        setSearchTerm(value);

        if (value.trim() === '') {
            // Apply just the filters without search term
            filterCustomers('', selectedType, selectedStatus);
            setSearchSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const lowerCaseValue = value.toLowerCase();
        const matchedCustomers = allCustomers.filter(customer =>
            (customer.name && customer.name.toLowerCase().includes(lowerCaseValue)) ||
            (customer.phone && customer.phone.toLowerCase().includes(lowerCaseValue)) ||
            (typeof customer.id === 'number' && `cus-${String(customer.id).padStart(3, '0')}`.toLowerCase().includes(lowerCaseValue))
        );

        // Update suggestions (limit to 5)
        setSearchSuggestions(matchedCustomers.slice(0, 5));
        setShowSuggestions(true);

        // Filter the list with the current filters
        filterCustomers(value, selectedType, selectedStatus);
    };

    // Function to handle suggestion click
    const handleSuggestionClick = (customer: Customer) => {
        setSearchTerm(customer.name);
        setShowSuggestions(false);
        filterCustomers(customer.name, selectedType, selectedStatus);
    };

    // Function to filter customers based on search term and filters
    const filterCustomers = (search: string, type: string, status: string) => {
        let filteredCustomers = [...allCustomers];

        // Apply search filter
        if (search) {
            const lowerCaseSearch = search.toLowerCase();
            filteredCustomers = filteredCustomers.filter(customer =>
                (customer.name && customer.name.toLowerCase().includes(lowerCaseSearch)) ||
                (customer.phone && customer.phone.toLowerCase().includes(lowerCaseSearch)) ||
                (typeof customer.id === 'number' && `cus-${String(customer.id).padStart(3, '0')}`.toLowerCase().includes(lowerCaseSearch))
            );
        }

        // Apply type filter
        if (type) {
            const lowerCaseType = type.toLowerCase();
            filteredCustomers = filteredCustomers.filter(customer =>
                customer.type && customer.type.toLowerCase() === lowerCaseType
            );
        }

        // Apply status filter
        if (status) {
            const lowerCaseStatus = status.toLowerCase();
            filteredCustomers = filteredCustomers.filter(customer =>
                customer.status && customer.status.toLowerCase() === lowerCaseStatus
            );
        }

        setCustomers(filteredCustomers);
    };

    // Function to handle filter changes
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedType(value);
        filterCustomers(searchTerm, value, selectedStatus);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedStatus(value);
        filterCustomers(searchTerm, selectedType, value);
    };

    // Function to clear search
    const clearSearch = () => {
        setSearchTerm('');
        setShowSuggestions(false);
        filterCustomers('', selectedType, selectedStatus);
    };

    // Add delete customer handler
    const handleDeleteCustomer = async (customerId: string | number) => {
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            return;
        }

        setDeleteLoading(customerId);
        setError(null);

        try {
            const response = await authDelete(`/api/customers/${customerId}`);

            const data = await response.json();

            if (data.success) {
                // Remove the deleted customer from the state
                setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== customerId));
                setAllCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== customerId));
            } else {
                setError(data.message || 'Failed to delete customer');
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            setError('Failed to delete customer. Please try again later.');
        } finally {
            setDeleteLoading(null);
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
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

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
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 pr-10 p-2.5"
                                placeholder="Search by name, phone, or ID..."
                                value={searchTerm}
                                onChange={(e) => searchCustomers(e.target.value)}
                                onFocus={() => searchTerm && setShowSuggestions(true)}
                            />
                            {searchTerm && (
                                <button
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                                    onClick={clearSearch}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}

                            {/* Search suggestions */}
                            {showSuggestions && searchSuggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg"
                                >
                                    <ul className="py-1 text-sm text-gray-700">
                                        {searchSuggestions.map((customer) => (
                                            <li
                                                key={customer.id}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => handleSuggestionClick(customer)}
                                            >
                                                <div className="font-medium">{customer.name}</div>
                                                <div className="text-xs flex justify-between">
                                                    <span>{customer.phone || 'No phone'}</span>
                                                    <span className="text-gray-500">
                                                        {typeof customer.id === 'number' ? `CUS-${String(customer.id).padStart(3, '0')}` : customer.id}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                                value={selectedType}
                                onChange={handleTypeChange}
                            >
                                <option value="">All Types</option>
                                <option value="credit">Credit</option>
                                <option value="cash">Cash</option>
                            </select>
                            <select
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                                value={selectedStatus}
                                onChange={handleStatusChange}
                            >
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
                                            {customer.type === 'Credit' ? (
                                                customer.balance ? `Rs. ${customer.balance.toLocaleString()}` : 'Rs. 0'
                                            ) : (
                                                '-'
                                            )}
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
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteCustomer(customer.id)}
                                                    disabled={deleteLoading === customer.id}
                                                >
                                                    {deleteLoading === customer.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
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