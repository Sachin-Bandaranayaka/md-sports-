'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Store, MapPin, Phone, Mail, Plus, Search, X } from 'lucide-react';

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

// Initial empty shop for the form
const emptyShop: Omit<Shop, 'id' | 'created_at' | 'updated_at'> = {
    name: '',
    location: '',
    contact_person: '',
    phone: '',
    email: '',
    is_active: true
};

export default function Shops() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal states
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [formData, setFormData] = useState<Omit<Shop, 'id' | 'created_at' | 'updated_at'>>(emptyShop);
    const [isEditMode, setIsEditMode] = useState(false);

    // Fetch shops from API
    useEffect(() => {
        fetchShops();
    }, []);

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

    // Handle view button click
    const handleViewShop = (shop: Shop) => {
        setSelectedShop(shop);
        setShowViewModal(true);
    };

    // Handle edit button click
    const handleEditShop = (shop: Shop) => {
        setSelectedShop(shop);
        setFormData({
            name: shop.name,
            location: shop.location,
            contact_person: shop.contact_person || '',
            phone: shop.phone || '',
            email: shop.email || '',
            is_active: shop.is_active
        });
        setIsEditMode(true);
        setShowAddEditModal(true);
    };

    // Handle add new shop button click
    const handleAddShop = () => {
        setSelectedShop(null);
        setFormData(emptyShop);
        setIsEditMode(false);
        setShowAddEditModal(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData(prev => ({
                ...prev,
                [name]: target.checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = isEditMode
                ? `/api/shops/${selectedShop?.id}`
                : '/api/shops';

            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} shop`);
            }

            // Refresh the shops list
            fetchShops();

            // Close the modal
            setShowAddEditModal(false);

            // Reset form
            setFormData(emptyShop);
            setIsEditMode(false);

        } catch (err) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} shop:`, err);
            alert(`Failed to ${isEditMode ? 'update' : 'create'} shop. Please try again.`);
        }
    };

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
                        <Button variant="primary" size="sm" onClick={handleAddShop}>
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
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 animate-pulse">
                        {/* Loading grid placeholder */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                    <div className="h-1 bg-gray-200 w-full"></div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between">
                                            <div className="space-y-2">
                                                <div className="h-5 bg-gray-200 rounded w-32"></div>
                                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                            </div>
                                            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                        </div>
                                        <div className="space-y-2">
                                            {[...Array(3)].map((_, j) => (
                                                <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                                            ))}
                                        </div>
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-3 gap-2">
                                                {[...Array(3)].map((_, j) => (
                                                    <div key={j} className="space-y-1">
                                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 pt-2">
                                            <div className="h-8 bg-gray-200 rounded w-full"></div>
                                            <div className="h-8 bg-gray-200 rounded w-full"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                                <p className="font-medium text-gray-900">
                                                    {shop.created_at ? new Date(shop.created_at).toLocaleString() : 'Invalid Date'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex space-x-2">
                                        <Button variant="outline" className="flex-1" size="sm" onClick={() => handleViewShop(shop)}>View</Button>
                                        <Button variant="outline" className="flex-1" size="sm" onClick={() => handleEditShop(shop)}>Edit</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* View Shop Modal */}
                {showViewModal && selectedShop && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h3 className="text-xl font-semibold text-gray-900">Shop Details</h3>
                                <button
                                    className="text-gray-400 hover:text-gray-500"
                                    onClick={() => setShowViewModal(false)}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-4">General Information</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Shop ID</p>
                                                <p className="font-medium">{selectedShop.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Name</p>
                                                <p className="font-medium">{selectedShop.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Status</p>
                                                <p className={`font-medium ${selectedShop.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                                    {selectedShop.is_active ? 'Active' : 'Inactive'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Created At</p>
                                                <p className="font-medium">
                                                    {selectedShop.created_at ? new Date(selectedShop.created_at).toLocaleString() : 'Invalid Date'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Last Updated</p>
                                                <p className="font-medium">
                                                    {selectedShop.updated_at ? new Date(selectedShop.updated_at).toLocaleString() : 'Invalid Date'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Location</p>
                                                <p className="font-medium">{selectedShop.location || 'No location provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Manager</p>
                                                <p className="font-medium">{selectedShop.contact_person || 'No manager assigned'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Phone</p>
                                                <p className="font-medium">{selectedShop.phone || 'No phone number'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Email</p>
                                                <p className="font-medium">{selectedShop.email || 'No email address'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowViewModal(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setShowViewModal(false);
                                            handleEditShop(selectedShop);
                                        }}
                                    >
                                        Edit Shop
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add/Edit Shop Modal */}
                {showAddEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {isEditMode ? 'Edit Shop' : 'Add New Shop'}
                                </h3>
                                <button
                                    className="text-gray-400 hover:text-gray-500"
                                    onClick={() => setShowAddEditModal(false)}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Shop Name *</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location *</label>
                                            <input
                                                type="text"
                                                id="location"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">Manager</label>
                                            <input
                                                type="text"
                                                id="contact_person"
                                                name="contact_person"
                                                value={formData.contact_person || ''}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone || ''}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email || ''}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center h-full pt-5">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 border-t flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setShowAddEditModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        type="submit"
                                    >
                                        {isEditMode ? 'Update Shop' : 'Create Shop'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 