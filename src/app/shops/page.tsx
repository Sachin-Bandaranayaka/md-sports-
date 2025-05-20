'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Store, MapPin, Phone, Mail, Plus, Search } from 'lucide-react';

// Define the Shop type
type Shop = {
    id: number;
    name: string;
    location: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    total_inventory?: number;
};

export default function Shops() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch shops from API
    useEffect(() => {
        const fetchShops = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/shops');
                if (!response.ok) {
                    throw new Error('Failed to fetch shops');
                }
                const data = await response.json();
                if (data.success) {
                    setShops(data.data);
                } else {
                    throw new Error(data.message || 'Failed to fetch shops');
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching shops:', err);
                setError('Failed to load shops. Please try again later.');
                // Fallback to empty array if fetch fails
                setShops([]);
            } finally {
                setLoading(false);
            }
        };

        fetchShops();
    }, []);

    // Filter shops based on search term and status filter
    const filteredShops = shops.filter(shop => {
        const matchesSearch =
            shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (shop.location && shop.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (shop.phone && shop.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (shop.email && shop.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
            statusFilter === '' ||
            (statusFilter === 'active' && shop.is_active) ||
            (statusFilter === 'inactive' && !shop.is_active);

        return matchesSearch && matchesStatus;
    });

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Shop Management</h1>
                        <p className="text-gray-500">View and manage all your retail locations</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Shop
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
                                placeholder="Search shops..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <p>Loading shops...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">
                        <p>{error}</p>
                    </div>
                ) : filteredShops.length === 0 ? (
                    <div className="text-center py-8">
                        <p>No shops found.</p>
                    </div>
                ) : (
                    /* Shops grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredShops.map((shop) => (
                            <div key={shop.id} className="bg-tertiary rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className={`p-1 text-center ${shop.is_active ? 'bg-green-500' : 'bg-red-500'} text-white text-xs`}>
                                    {shop.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{shop.name}</h3>
                                            <p className="text-sm text-gray-500">ID: {shop.id}</p>
                                        </div>
                                        <Store className="h-8 w-8 text-primary" />
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-start">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                                            <span className="text-sm text-gray-900">{shop.location || 'No address available'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">{shop.phone || 'No phone available'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">{shop.email || 'No email available'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <p className="text-sm text-gray-500">Manager</p>
                                                <p className="font-medium text-gray-900">{shop.contact_person || 'No manager'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Inventory</p>
                                                <p className="font-medium text-gray-900">{shop.total_inventory || 0} items</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Created</p>
                                                <p className="font-medium text-gray-900">{new Date(shop.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex space-x-2">
                                        <Button variant="outline" className="flex-1" size="sm">View</Button>
                                        <Button variant="outline" className="flex-1" size="sm">Edit</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 