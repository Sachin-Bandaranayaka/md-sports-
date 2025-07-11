'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Search, UserPlus, Filter, X, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { authDelete } from '@/utils/api';

// Interface for Customer
interface Customer {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    due?: number;
    customerType: 'wholesale' | 'retail';
    creditLimit?: number | null;
    creditPeriod?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastPurchaseDate?: Date | null;
    latestInvoicePaymentStatus?: string | null;
    balance?: number;
    contactPerson?: string;
}

// Status badge colors for customer isActive
const getCustomerActivityBadgeClass = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

// Badge colors for invoice payment status
const getInvoicePaymentStatusBadgeClass = (status?: string | null): string => {
    if (!status) return 'bg-gray-100 text-gray-800'; // Default for N/A or null
    switch (status.toLowerCase()) {
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'unpaid':
            return 'bg-red-100 text-red-800';
        case 'partial':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getCustomerTypeClass = (customerType: 'wholesale' | 'retail') => {
    return customerType.toLowerCase() === 'wholesale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
};

const getCustomerTypeRowClass = (customerType: 'wholesale' | 'retail') => {
    return customerType.toLowerCase() === 'wholesale' ? 'bg-blue-50' : 'bg-green-50';
};

interface CustomerClientWrapperProps {
    initialCustomers: Customer[];
    initialTotalPages: number;
    initialCurrentPage: number;
}

export default function CustomerClientWrapper({ initialCustomers, initialTotalPages, initialCurrentPage }: CustomerClientWrapperProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false); // Data loading will be handled by parent server component
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [allCustomers, setAllCustomers] = useState<Customer[]>(initialCustomers); // This might need adjustment based on pagination strategy
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchSuggestions, setSearchSuggestions] = useState<Customer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [deleteLoading, setDeleteLoading] = useState<string | number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Add state for filter modal
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [filterOptions, setFilterOptions] = useState({
        balanceMin: '',
        balanceMax: '',
        lastPurchaseFrom: '',
        lastPurchaseTo: '',
        customerType: '',
        customerStatus: ''
    });
    const filterModalRef = useRef<HTMLDivElement>(null);

    const [currentPage, setCurrentPage] = useState(initialCurrentPage);
    const [totalPages, setTotalPages] = useState(initialTotalPages);

    // Toggle to show/hide Customer ID column
    const showCustomerIdColumn = false;

    // Selection and bulk delete state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState<boolean>(false);
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState<boolean>(false);


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

    // Add handler for filter modal outside clicks
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) {
                setShowFilterModal(false);
            }
        }

        if (showFilterModal) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showFilterModal]);

    useEffect(() => {
        setCustomers(initialCustomers);
        setAllCustomers(initialCustomers); // Assuming initialCustomers is the full list for the current page
        setTotalPages(initialTotalPages);
        setCurrentPage(initialCurrentPage);
    }, [initialCustomers, initialTotalPages, initialCurrentPage]);

    // Initialize filter states from URL parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const search = urlParams.get('search') || '';
        const type = urlParams.get('type') || '';
        const status = urlParams.get('status') || '';
        const balanceMin = urlParams.get('balanceMin') || '';
        const balanceMax = urlParams.get('balanceMax') || '';
        const lastPurchaseFrom = urlParams.get('lastPurchaseFrom') || '';
        const lastPurchaseTo = urlParams.get('lastPurchaseTo') || '';

        setSearchTerm(search);
        setSelectedType(type);
        setSelectedStatus(status);
        setFilterOptions({
            customerType: type,
            customerStatus: status,
            balanceMin,
            balanceMax,
            lastPurchaseFrom,
            lastPurchaseTo
        });
    }, []);


    // Function to search customers and update suggestions
    const searchCustomers = (value: string) => {
        setSearchTerm(value);
        // Client-side search on the current page's data, or refetch from server
        // For now, let's assume client-side search on current page data for simplicity,
        // but a server-side search might be better for large datasets.
        if (value.trim() === '') {
            filterCustomers('', selectedType, selectedStatus); // Apply filters if search is cleared
            setSearchSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const lowerCaseValue = value.toLowerCase();
        const matchedCustomers = customers.filter(customer => // Search within current page customers
            (customer.name && customer.name.toLowerCase().includes(lowerCaseValue)) ||
            (customer.phone && customer.phone.toLowerCase().includes(lowerCaseValue)) ||
            (typeof customer.id === 'number' && `cus-${String(customer.id).padStart(3, '0')}`.toLowerCase().includes(lowerCaseValue))
        );
        setSearchSuggestions(matchedCustomers.slice(0, 5));
        setShowSuggestions(true);
        // The main customer list will be updated by filterCustomers or handleApplyFilters
    };

    const handleApplyFilters = () => {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.set('search', searchTerm);
        if (filterOptions.customerType) queryParams.set('type', filterOptions.customerType);
        if (filterOptions.customerStatus) queryParams.set('status', filterOptions.customerStatus);
        if (filterOptions.balanceMin) queryParams.set('balanceMin', filterOptions.balanceMin);
        if (filterOptions.balanceMax) queryParams.set('balanceMax', filterOptions.balanceMax);
        if (filterOptions.lastPurchaseFrom) queryParams.set('lastPurchaseFrom', filterOptions.lastPurchaseFrom);
        if (filterOptions.lastPurchaseTo) queryParams.set('lastPurchaseTo', filterOptions.lastPurchaseTo);
        queryParams.set('page', '1'); // Reset to page 1 on new filter/search
        router.push(`/customers?${queryParams.toString()}`);
        setShowFilterModal(false);
    };


    // Function to handle suggestion click
    const handleSuggestionClick = (customer: Customer) => {
        setSearchTerm(customer.name);
        setShowSuggestions(false);
        // Re-trigger filtering/searching with the selected customer name
        // This might also involve a new fetch if searching is server-side
        handleApplyFilters();
    };

    // Function to filter customers based on search term and filters (client-side for current page)
    const filterCustomers = (search: string, type: string, status: string) => {
        let filteredCustomers = [...allCustomers]; // Start with all customers for the current page

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
                customer.customerType && customer.customerType.toLowerCase() === lowerCaseType
            );
        }

        // Apply status filter
        if (status) {
            const lowerCaseStatus = status.toLowerCase();
            filteredCustomers = filteredCustomers.filter(customer =>
                customer.isActive && customer.isActive.toString().toLowerCase() === lowerCaseStatus
            );
        }
        // This function should ideally not set state directly if pagination/filtering is server-side
        // For now, it filters the current page's data.
        setCustomers(filteredCustomers);
    };

    // Function to handle filter changes (for simple dropdowns, might need adjustment)
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedType(value);
        // Update filterOptions and then call handleApplyFilters or similar
        setFilterOptions(prev => ({ ...prev, customerType: value }));
        // Apply filter instantly:
        const queryParams = new URLSearchParams(window.location.search);
        if (searchTerm) queryParams.set('search', searchTerm);
        if (value) {
            queryParams.set('type', value);
        } else {
            queryParams.delete('type');
        }
        if (selectedStatus) queryParams.set('status', selectedStatus);
        queryParams.set('page', '1');
        router.push(`/customers?${queryParams.toString()}`);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedStatus(value);
        setFilterOptions(prev => ({ ...prev, customerStatus: value }));
        // If we want instant apply:
        // const queryParams = new URLSearchParams();
        // if (searchTerm) queryParams.set('search', searchTerm);
        // if (selectedType) queryParams.set('type', selectedType);
        // queryParams.set('status', value);
        // queryParams.set('page', '1');
        // router.push(`/customers?${queryParams.toString()}`);
    };


    // Function to clear search
    const clearSearch = () => {
        setSearchTerm('');
        setShowSuggestions(false);
        // Re-apply filters without search term, or refetch if server-side
        const queryParams = new URLSearchParams();
        if (filterOptions.customerType) queryParams.set('type', filterOptions.customerType);
        if (filterOptions.customerStatus) queryParams.set('status', filterOptions.customerStatus);
        // Add other filters from filterOptions
        queryParams.set('page', currentPage.toString()); // Stay on current page or reset to 1
        router.push(`/customers?${queryParams.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.set('page', newPage.toString());
        router.push(`/customers?${queryParams.toString()}`);
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
                // Remove the deleted customer from the state immediately for better UX
                setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== customerId));
                setAllCustomers(prevAllCustomers => prevAllCustomers.filter(customer => customer.id !== customerId));
                
                // Refresh the page to get updated data from server
                router.refresh();
            } else {
                setError(data.message || 'Failed to delete customer. Please try again.');
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setDeleteLoading(null);
        }
    };

    // Selection handlers
    const handleToggleSelection = (customerId: string | number) => {
        const id = String(customerId);
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems(new Set());
        } else {
            const allIds = customers.map(customer => String(customer.id));
            setSelectedItems(new Set(allIds));
        }
        setSelectAll(!selectAll);
    };

    const handleClearSelection = () => {
        setSelectedItems(new Set());
        setSelectAll(false);
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return;

        const confirmMessage = `Are you sure you want to delete ${selectedItems.size} customer${selectedItems.size > 1 ? 's' : ''}? This action cannot be undone.`;
        if (!confirm(confirmMessage)) return;

        setBulkDeleteLoading(true);
        setError(null);

        try {
            const deletePromises = Array.from(selectedItems).map(async (customerId) => {
                const response = await authDelete(`/api/customers/${customerId}`);
                const data = await response.json();
                if (!data.success) {
                    throw new Error(`Failed to delete customer ${customerId}: ${data.message}`);
                }
                return customerId;
            });

            const deletedIds = await Promise.all(deletePromises);

            // Update state to remove deleted customers immediately for better UX
            setCustomers(prevCustomers => 
                prevCustomers.filter(customer => !deletedIds.includes(String(customer.id)))
            );
            setAllCustomers(prevAllCustomers => 
                prevAllCustomers.filter(customer => !deletedIds.includes(String(customer.id)))
            );

            // Clear selection
            setSelectedItems(new Set());
            setSelectAll(false);
            
            // Force a page refresh to clear any cached data
            window.location.reload();

        } catch (err) {
            console.error('Error during bulk delete:', err);
            setError('Some customers could not be deleted. Please try again.');
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    // Update selectAll state based on current selection
    useEffect(() => {
        const allCurrentIds = customers.map(customer => String(customer.id));
        const allSelected = allCurrentIds.length > 0 && allCurrentIds.every(id => selectedItems.has(id));
        setSelectAll(allSelected);
    }, [selectedItems, customers]);

    // Clear selection when search term changes
    useEffect(() => {
        setSelectedItems(new Set());
        setSelectAll(false);
    }, [searchTerm]);

    const applyAdvancedFilters = () => {
        // This function body was not fully provided in the original file snippet
        // Assuming it uses filterOptions to construct query params and navigate
        console.log("Applying advanced filters:", filterOptions);
        handleApplyFilters(); // Use the unified apply function
    };

    const handleFilterOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilterOptions(prevOptions => ({
            ...prevOptions,
            [name]: value,
        }));
    };

    const resetFilters = () => {
        setFilterOptions({
            balanceMin: '',
            balanceMax: '',
            lastPurchaseFrom: '',
            lastPurchaseTo: '',
            customerType: '',
            customerStatus: ''
        });
        setSelectedType('');
        setSelectedStatus('');
        // Also clear search term and navigate to base page or re-apply empty filters
        setSearchTerm('');
        const queryParams = new URLSearchParams();
        queryParams.set('page', '1');
        router.push(`/customers?${queryParams.toString()}`);
        setShowFilterModal(false);
    };


    return (
        <>
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
                    {error}
                    <button onClick={() => setError(null)} className="ml-4 text-red-700 font-bold">X</button>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Manage Customers</h1>
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => router.push('/customers/new')} className="flex items-center">
                        <UserPlus size={18} className="mr-2" /> Add New Customer
                    </Button>
                    <Button variant="outline" onClick={() => setShowFilterModal(true)} className="flex items-center">
                        <Filter size={18} className="mr-2" /> Filters
                    </Button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedItems.size} customer{selectedItems.size > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearSelection}
                                className="text-blue-600 border-blue-300 hover:bg-blue-100"
                            >
                                Clear Selection
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={bulkDeleteLoading}
                                className="flex items-center gap-2"
                            >
                                {bulkDeleteLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Delete Selected
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Simple Filters */}
            <div className="mb-6 p-4 bg-white shadow rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="relative md:col-span-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Customer</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                id="search"
                                placeholder="Search by name, phone, or ID (e.g., cus-001)"
                                value={searchTerm}
                                onChange={(e) => searchCustomers(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {searchTerm && (
                                <X
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    size={20}
                                    onClick={clearSearch}
                                />
                            )}
                        </div>
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div ref={suggestionsRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                {searchSuggestions.map((customer) => (
                                    <div
                                        key={customer.id}
                                        onClick={() => handleSuggestionClick(customer)}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <p className="font-semibold">{customer.name}</p>
                                        <p className="text-sm text-gray-500">{customer.phone || `ID: cus-${String(customer.id).padStart(3, '0')}`}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="customerType" className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                        <select
                            id="customerType"
                            value={selectedType}
                            onChange={handleTypeChange}
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                        >
                            <option value="">All Types</option>
                            <option value="wholesale">Wholesale</option>
                            <option value="retail">Retail</option>
                        </select>
                    </div>
                    {/* Status filter hidden as requested */}
                    {/* <div>
                        <label htmlFor="customerStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            id="customerStatus"
                            value={selectedStatus}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSelectedStatus(value);
                                setFilterOptions(prev => ({ ...prev, customerStatus: value }));
                                const queryParams = new URLSearchParams(window.location.search);
                                queryParams.set('status', value);
                                queryParams.set('page', '1');
                                router.push(`/customers?${queryParams.toString()}`);
                            }}
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                        >
                            <option value="">All Statuses</option>
                            <option value="Active">Active (Customer)</option>
                            <option value="Inactive">Inactive (Customer)</option>
                            <option value="paid">Paid (Invoice)</option>
                            <option value="pending">Pending (Invoice)</option>
                            <option value="unpaid">Unpaid (Invoice)</option>
                            <option value="partial">Partial (Invoice)</option>
                        </select>
                    </div> */}
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div ref={filterModalRef} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Advanced Filters</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowFilterModal(false)}>
                                <X size={20} />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="filterCustomerType" className="block text-sm font-medium text-gray-700">Customer Type</label>
                                <select
                                    id="filterCustomerType"
                                    name="customerType"
                                    value={filterOptions.customerType}
                                    onChange={handleFilterOptionChange}
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Any</option>
                                    <option value="wholesale">Wholesale</option>
                                    <option value="retail">Retail</option>
                                </select>
                            </div>
                            {/* Status filter hidden as requested */}
                            {/* <div>
                                <label htmlFor="filterCustomerStatus" className="block text-sm font-medium text-gray-700">Customer/Invoice Status</label>
                                <select
                                    id="filterCustomerStatus"
                                    name="customerStatus"
                                    value={filterOptions.customerStatus}
                                    onChange={handleFilterOptionChange}
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Any</option>
                                    <option value="Active">Active (Customer)</option>
                                    <option value="Inactive">Inactive (Customer)</option>
                                    <option value="paid">Paid (Invoice)</option>
                                    <option value="pending">Pending (Invoice)</option>
                                    <option value="unpaid">Unpaid (Invoice)</option>
                                    <option value="partial">Partial (Invoice)</option>
                                </select>
                            </div> */}
                            <div>
                                <label htmlFor="balanceMin" className="block text-sm font-medium text-gray-700">Min Balance</label>
                                <input
                                    type="number"
                                    id="balanceMin"
                                    name="balanceMin"
                                    value={filterOptions.balanceMin}
                                    onChange={handleFilterOptionChange}
                                    placeholder="e.g., 100"
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="balanceMax" className="block text-sm font-medium text-gray-700">Max Balance</label>
                                <input
                                    type="number"
                                    id="balanceMax"
                                    name="balanceMax"
                                    value={filterOptions.balanceMax}
                                    onChange={handleFilterOptionChange}
                                    placeholder="e.g., 5000"
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastPurchaseFrom" className="block text-sm font-medium text-gray-700">Last Purchase From</label>
                                <input
                                    type="date"
                                    id="lastPurchaseFrom"
                                    name="lastPurchaseFrom"
                                    value={filterOptions.lastPurchaseFrom}
                                    onChange={handleFilterOptionChange}
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastPurchaseTo" className="block text-sm font-medium text-gray-700">Last Purchase To</label>
                                <input
                                    type="date"
                                    id="lastPurchaseTo"
                                    name="lastPurchaseTo"
                                    value={filterOptions.lastPurchaseTo}
                                    onChange={handleFilterOptionChange}
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button variant="outline" onClick={resetFilters}>Reset</Button>
                            <Button variant="primary" onClick={applyAdvancedFilters}>Apply Filters</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customers Table */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-indigo-600" size={48} />
                    <p className="ml-3 text-lg text-gray-600">Loading customers...</p>
                </div>
            ) : customers.length === 0 ? (
                <div className="text-center py-10">
                    <UserPlus size={48} className="mx-auto text-gray-400" />
                    <h3 className="mt-2 text-xl font-semibold text-gray-700">No Customers Found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || selectedType || selectedStatus || Object.values(filterOptions).some(v => v)
                            ? "Try adjusting your search or filter criteria."
                            : "Get started by adding a new customer."}
                    </p>
                    {(searchTerm || selectedType || selectedStatus || Object.values(filterOptions).some(v => v)) && (
                        <Button variant="outline" onClick={resetFilters} className="mt-4">Clear All Filters</Button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto bg-white shadow rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </th>
                                {showCustomerIdColumn && (
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                                )}
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit / Period</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Status</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customers.map((customer) => (
                                <tr key={customer.id} className={`hover:bg-gray-50 transition-colors duration-150 ${
                                    selectedItems.has(String(customer.id)) ? 'bg-blue-50 border-blue-200' : getCustomerTypeRowClass(customer.customerType)
                                }`}>
                                    <td className="px-3 py-2 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(String(customer.id))}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleToggleSelection(customer.id);
                                            }}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </td>
                                    {showCustomerIdColumn && (
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{customer.id}</td>
                                    )}
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                        <button onClick={() => router.push(`/customers/${customer.id}`)} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                            {customer.name}
                                        </button>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                                        <span className={`px-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${getCustomerTypeClass(customer.customerType)}`}>
                                            {customer.customerType.charAt(0).toUpperCase() + customer.customerType.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{customer.phone || 'N/A'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{`Rs ${new Intl.NumberFormat('en-US').format(customer.due ?? 0)}`}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                        {customer.customerType.toLowerCase() === 'wholesale' && customer.creditLimit !== undefined && customer.creditLimit !== null ? (
                                            <div>
                                                <div className="font-medium text-xs">Rs {new Intl.NumberFormat('en-US').format(customer.creditLimit)}</div>
                                                <div className="text-xs text-gray-400">
                                                    {customer.creditPeriod ? `${customer.creditPeriod} days` : 'No period set'}
                                                </div>
                                            </div>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                        {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                                        <span className={`px-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${getInvoicePaymentStatusBadgeClass(customer.latestInvoicePaymentStatus)}`}>
                                            {customer.latestInvoicePaymentStatus ? customer.latestInvoicePaymentStatus.charAt(0).toUpperCase() + customer.latestInvoicePaymentStatus.slice(1) : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                                        <div className="flex items-center space-x-1">
                                            <Button variant="link" size="sm" onClick={() => router.push(`/customers/${customer.id}`)} className="text-indigo-600 hover:text-indigo-900 text-xs">
                                                View
                                            </Button>
                                            <Button variant="link" size="sm" onClick={() => router.push(`/customers/${customer.id}/edit`)} className="text-yellow-600 hover:text-yellow-900 text-xs">
                                                Edit
                                            </Button>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => handleDeleteCustomer(customer.id)}
                                                className="text-red-600 hover:text-red-900"
                                                disabled={deleteLoading === customer.id}
                                            >
                                                {deleteLoading === customer.id ? (
                                                    <Loader2 className="animate-spin" size={14} />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                    >
                        Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                            key={page}
                            variant={currentPage === page ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                        >
                            {page}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                    >
                        Next
                    </Button>
                </div>
            )}
        </>
    );
}