'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowLeftRight, FileText, Plus, Search } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { authFetch } from '@/utils/api';

interface TransferItem {
    id: number;
    status: string;
    source_shop_name: string;
    destination_shop_name: string;
    initiated_by: string;
    created_at: string;
    completed_at: string | null;
    item_count: number;
    total_items: number;
}

export default function TransfersPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [transfers, setTransfers] = useState<TransferItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch transfers data
    useEffect(() => {
        const fetchTransfers = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Fetching transfers data...');
                const response = await authFetch('/api/inventory/transfers');
                console.log('Response status:', response.status);

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Authentication failed. Please login again.');
                    }
                    throw new Error(`Failed to fetch transfers: ${response.status}`);
                }

                const data = await response.json();
                console.log('Transfers data:', data);

                if (data.success) {
                    console.log('Setting transfers:', data.data);
                    setTransfers(data.data || []);
                } else {
                    throw new Error(data.message || 'Failed to fetch transfers');
                }
            } catch (err) {
                console.error('Error fetching transfers:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchTransfers();
    }, []);

    // Handle creating a new transfer
    const handleNewTransfer = () => {
        router.push('/inventory/transfers/new');
    };

    // Handle viewing a transfer
    const handleViewTransfer = (id: number) => {
        router.push(`/inventory/transfers/${id}`);
    };

    // Filter transfers based on search and status
    const filteredTransfers = transfers.filter(transfer => {
        const matchesSearch =
            searchTerm === '' ||
            transfer.source_shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transfer.destination_shop_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === '' || transfer.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Get status badge class
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="space-y-6">
                    {/* Loading header placeholder */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                                <div className="h-8 bg-gray-200 rounded w-64"></div>
                                <div className="h-4 bg-gray-200 rounded w-48"></div>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-9 bg-gray-200 rounded w-32"></div>
                                <div className="h-9 bg-gray-200 rounded w-32"></div>
                            </div>
                        </div>
                    </div>

                    {/* Loading filters placeholder */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                            <div className="h-10 bg-gray-200 rounded w-48 md:w-48"></div>
                        </div>
                    </div>

                    {/* Loading table placeholder */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 animate-pulse">
                        <div className="p-5">
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-full"></div>
                                {[...Array(4)].map((_, i) => (
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ArrowLeftRight className="h-6 w-6 text-primary" />
                            Inventory Transfers
                        </h1>
                        <p className="text-gray-500 mt-1">Manage transfers between shops</p>
                    </div>
                    <div className="flex gap-3">
                        {console.log('User permissions:', user?.permissions)}
                        {console.log('Has transfer permission:', user?.permissions?.includes('inventory:transfer'))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/inventory')}
                            className="shadow-sm"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Inventory
                        </Button>
                        {user && user.permissions.includes('inventory:transfer') && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleNewTransfer}
                                className="shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Transfer
                            </Button>
                        )}
                    </div>
                </div>

                {/* Error message if any */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-300 focus:border-primary-300 block w-full pl-10 p-2.5 transition-all duration-200"
                                placeholder="Search shops..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-300 focus:border-primary-300 block md:w-48 p-2.5 transition-all duration-200"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Transfers table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-800">ID</th>
                                    <th className="px-6 py-4 font-semibold text-gray-800">From</th>
                                    <th className="px-6 py-4 font-semibold text-gray-800">To</th>
                                    <th className="px-6 py-4 font-semibold text-gray-800">Date</th>
                                    <th className="px-6 py-4 font-semibold text-gray-800">Items</th>
                                    <th className="px-6 py-4 font-semibold text-gray-800">Status</th>
                                    <th className="px-6 py-4 font-semibold text-gray-800">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransfers.length > 0 ? (
                                    filteredTransfers.map((transfer) => (
                                        <tr
                                            key={transfer.id}
                                            className="hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 font-medium text-primary">
                                                {transfer.id}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{transfer.source_shop_name}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{transfer.destination_shop_name}</td>
                                            <td className="px-6 py-4 text-gray-700">{formatDate(transfer.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-medium text-gray-900">{transfer.item_count}</span>
                                                    <span className="text-gray-900">items</span>
                                                    <span className="text-gray-600 mx-1">•</span>
                                                    <span className="font-medium text-gray-900">{transfer.total_items}</span>
                                                    <span className="text-gray-900">units</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {transfer.status === 'pending' && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                                        Pending
                                                    </span>
                                                )}
                                                {transfer.status === 'completed' && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                        Completed
                                                    </span>
                                                )}
                                                {transfer.status === 'cancelled' && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                        Cancelled
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewTransfer(transfer.id)}
                                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                                >
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            {transfers.length === 0 ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-gray-50 p-4 rounded-full mb-3">
                                                        <ArrowLeftRight className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-700 font-medium mb-1">No transfers found</p>
                                                    <p className="text-sm text-gray-500">Create your first inventory transfer to move products between shops</p>
                                                    {user && user.permissions.includes('inventory:transfer') && (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={handleNewTransfer}
                                                            className="mt-4"
                                                        >
                                                            <Plus className="w-4 h-4 mr-2" />
                                                            New Transfer
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                "No transfers match your search"
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 