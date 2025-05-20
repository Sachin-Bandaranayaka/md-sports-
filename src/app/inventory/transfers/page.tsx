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
                <div className="h-full flex items-center justify-center p-20">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500">Loading transfers...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900">Inventory Transfers</h1>
                        <p className="text-gray-500">Manage transfers between shops</p>
                    </div>
                    <div className="flex gap-3">
                        {console.log('User permissions:', user?.permissions)}
                        {console.log('Has transfer permission:', user?.permissions?.includes('inventory:transfer'))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/inventory')}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Inventory
                        </Button>
                        {user && user.permissions.includes('inventory:transfer') && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleNewTransfer}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Transfer
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                                placeholder="Search shops..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block md:w-48 p-2.5"
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
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">From</th>
                                <th className="px-6 py-3">To</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransfers.length > 0 ? (
                                filteredTransfers.map((transfer) => (
                                    <tr
                                        key={transfer.id}
                                        className="border-b hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 font-medium text-primary">
                                            {transfer.id}
                                        </td>
                                        <td className="px-6 py-4">{transfer.source_shop_name}</td>
                                        <td className="px-6 py-4">{transfer.destination_shop_name}</td>
                                        <td className="px-6 py-4">{formatDate(transfer.created_at)}</td>
                                        <td className="px-6 py-4">{transfer.item_count} items ({transfer.total_items} units)</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(transfer.status)}`}>
                                                {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewTransfer(transfer.id)}
                                            >
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        {transfers.length === 0 ? (
                                            <div className="flex flex-col items-center">
                                                <ArrowLeftRight className="h-10 w-10 text-gray-300 mb-2" />
                                                <p className="mb-1">No transfers found</p>
                                                <p className="text-sm">Create your first inventory transfer to move products between shops</p>
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
        </MainLayout>
    );
} 