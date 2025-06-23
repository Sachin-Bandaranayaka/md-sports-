'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Store, MapPin, Phone, Mail, Plus, Search, X, AlertTriangle, Trash2 } from 'lucide-react';

// Define the Shop type
type Shop = {
    id: string;
    name: string;
    location: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    opening_time: string | null;
    closing_time: string | null;
    manager_id: number | null;
    manager?: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
    } | null;
    opening_date: string | null;
    status: string;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    tax_rate: number | null;
    createdAt: string;
    updatedAt: string;
    total_inventory?: number;
    inventory?: any[];
    relatedRecords?: {
        inventoryItems?: number;
        users?: number;
        transfers?: number;
        products?: number;
    };
    hasRelatedRecords?: boolean;
};

// Initial empty shop for the form
const emptyShop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | 'manager'> = {
    name: '',
    location: '',
    contact_person: '',
    phone: '',
    email: '',
    is_active: true,
    opening_time: null,
    closing_time: null,
    manager_id: null,
    opening_date: null,
    status: 'open',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Malaysia',
    latitude: null,
    longitude: null,
    tax_rate: 0
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
    const [formData, setFormData] = useState<Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | 'manager'>>(emptyShop);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
            is_active: shop.is_active,
            opening_time: shop.opening_time || null,
            closing_time: shop.closing_time || null,
            manager_id: shop.manager_id || null,
            opening_date: shop.opening_date || null,
            status: shop.status,
            address_line1: shop.address_line1 || '',
            address_line2: shop.address_line2 || '',
            city: shop.city || '',
            state: shop.state || '',
            postal_code: shop.postal_code || '',
            country: shop.country || 'Malaysia',
            latitude: shop.latitude || null,
            longitude: shop.longitude || null,
            tax_rate: shop.tax_rate || 0
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

    // Handle confirm delete
    const confirmDeleteShop = async () => {
        if (!selectedShop) return;

        try {
            setIsDeleting(true);

            // ID is already a string, no parsing needed
            const shopId = selectedShop.id;

            const response = await fetch(`/api/shops/${shopId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    // Handle conflict - shop has related records
                    const relatedRecords = result.relatedRecords || {};

                    // Update the shop object with detected related records
                    setSelectedShop(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            relatedRecords: relatedRecords,
                            hasRelatedRecords: true
                        };
                    });

                    return;
                }

                throw new Error(`Failed to delete shop: ${result.message || response.statusText}`);
            }

            // Refresh shops list
            fetchShops();
            setShowDeleteModal(false);
            setSelectedShop(null);
        } catch (err) {
            console.error('Error deleting shop:', err);
            alert('Failed to delete shop. Please try again later.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle delete button click
    const handleDeleteShop = (shop: Shop) => {
        setSelectedShop(shop);
        setShowDeleteModal(true);
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('/shops/analytics', '_self')}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            Analytics
                        </Button>
                        {/* Compare button hidden as requested */}
                        {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('/shops/compare', '_self')}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                            </svg>
                            Compare
                        </Button> */}
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
                                    {shop.is_active ? 'ACTIVE' : 'INACTIVE'}{shop.status !== 'open' && shop.is_active ? ` - ${shop.status.toUpperCase()}` : ''}
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{shop.name}</h3>
                                        </div>
                                        <Store className="h-8 w-8 text-primary" />
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-start">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                                            <span className="text-sm text-gray-900">
                                                {shop.address_line1 ? (
                                                    <>
                                                        {shop.address_line1}
                                                        {shop.city && shop.state ? <>, {shop.city}, {shop.state}</> : null}
                                                    </>
                                                ) : (
                                                    shop.location || 'No address available'
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">{shop.phone || 'No phone available'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">{shop.email || 'No email available'}</span>
                                        </div>

                                        {/* Business hours */}
                                        {(shop.opening_time || shop.closing_time) && (
                                            <div className="flex items-center text-sm text-gray-600 mt-1">
                                                <span className="font-medium">Hours:</span>
                                                <span className="ml-1">{shop.opening_time || '?'} - {shop.closing_time || '?'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <p className="text-sm text-gray-500">Manager</p>
                                                <p className="font-medium">
                                                    {shop.contact_person || 'No manager'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Inventory</p>
                                                <p className="font-medium text-gray-900">{shop.total_inventory || 0} items</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Created</p>
                                                <p className="font-medium text-gray-900">
                                                    {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : 'Invalid Date'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex space-x-2">
                                        <Button variant="outline" className="flex-1" size="sm" onClick={() => handleViewShop(shop)}>View</Button>
                                        <Button variant="outline" className="flex-1" size="sm" onClick={() => handleEditShop(shop)}>Edit</Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => window.open(`/inventory?shop=${shop.id}`, '_blank')}
                                        >
                                            Inventory
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-10 text-red-600 hover:text-white hover:bg-red-600 border-red-200 hover:border-red-600"
                                            onClick={() => handleDeleteShop(shop)}
                                            title="Delete Shop"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* View Shop Modal */}
                {showViewModal && selectedShop && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-4">General Information</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-900">Shop ID</p>
                                                <p className="font-medium">{selectedShop.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Name</p>
                                                <p className="font-medium">{selectedShop.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Status</p>
                                                <p className={`font-medium ${selectedShop.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                                    {selectedShop.is_active ? 'Active' : 'Inactive'} - {selectedShop.status}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Created At</p>
                                                <p className="font-medium">
                                                    {selectedShop.createdAt ? new Date(selectedShop.createdAt).toLocaleString() : 'Invalid Date'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Last Updated</p>
                                                <p className="font-medium">
                                                    {selectedShop.updatedAt ? new Date(selectedShop.updatedAt).toLocaleString() : 'Invalid Date'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Opening Date</p>
                                                <p className="font-medium">
                                                    {selectedShop.opening_date ? new Date(selectedShop.opening_date).toLocaleDateString() : 'Not set'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Business Hours</p>
                                                <p className="font-medium">
                                                    {selectedShop.opening_time && selectedShop.closing_time
                                                        ? `${selectedShop.opening_time} - ${selectedShop.closing_time}`
                                                        : 'Not set'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Tax Rate</p>
                                                <p className="font-medium">
                                                    {selectedShop.tax_rate !== null ? `${selectedShop.tax_rate}%` : '0%'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-900">Location</p>
                                                <p className="font-medium">{selectedShop.location || 'Not set'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Address</p>
                                                <p className="font-medium">
                                                    {selectedShop.address_line1 || 'No address provided'}<br />
                                                    {selectedShop.address_line2}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">City / State / Postal</p>
                                                <p className="font-medium">
                                                    {[selectedShop.city, selectedShop.state, selectedShop.postal_code].filter(Boolean).join(' / ') || 'Not provided'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Country</p>
                                                <p className="font-medium">{selectedShop.country || 'Malaysia'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Manager</p>
                                                <p className="font-medium">{selectedShop.contact_person || 'No manager assigned'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">System Manager</p>
                                                <p className="font-medium">
                                                    {selectedShop.manager_id ? `Manager ID: ${selectedShop.manager_id}` : 'No system manager assigned'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Phone</p>
                                                <p className="font-medium">{selectedShop.phone || 'No phone number'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Email</p>
                                                <p className="font-medium">{selectedShop.email || 'No email address'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-4">Inventory & Performance</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-900">Total Inventory</p>
                                                <p className="font-medium">{selectedShop.total_inventory !== undefined ? `${selectedShop.total_inventory} items` : 'Loading...'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">Coordinates</p>
                                                <p className="font-medium">
                                                    {selectedShop.latitude && selectedShop.longitude
                                                        ? `${selectedShop.latitude}, ${selectedShop.longitude}`
                                                        : 'Not set'}
                                                </p>
                                            </div>

                                            {selectedShop.inventory && selectedShop.inventory.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Top Products</p>
                                                    <div className="max-h-40 overflow-y-auto">
                                                        <table className="min-w-full text-sm">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-2 py-1 text-left">Product</th>
                                                                    <th className="px-2 py-1 text-right">Qty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200">
                                                                {selectedShop.inventory.slice(0, 5).map(item => (
                                                                    <tr key={item.id}>
                                                                        <td className="px-2 py-1">{item.product_name}</td>
                                                                        <td className="px-2 py-1 text-right">{item.quantity}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`/inventory?shop=${selectedShop.id}`, '_blank')}
                                    >
                                        View Inventory
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`/invoices?shop=${selectedShop.id}`, '_blank')}
                                    >
                                        View Sales
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            // Could open a map view in the future
                                            if (selectedShop.latitude && selectedShop.longitude) {
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${selectedShop.latitude},${selectedShop.longitude}`, '_blank');
                                            } else {
                                                alert('No coordinates available for this shop');
                                            }
                                        }}
                                    >
                                        View on Map
                                    </Button>
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
                                                value={formData.name || ''}
                                                onChange={handleInputChange}
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location *</label>
                                            <input
                                                type="text"
                                                id="location"
                                                name="location"
                                                value={formData.location || ''}
                                                onChange={handleInputChange}
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                id="status"
                                                name="status"
                                                value={formData.status || 'open'}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                                            >
                                                <option value="open">Open</option>
                                                <option value="closed">Closed</option>
                                                <option value="maintenance">Maintenance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="is_active" className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_active"
                                                    name="is_active"
                                                    checked={formData.is_active || false}
                                                    onChange={handleInputChange}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Active Shop</span>
                                            </label>
                                        </div>
                                    </div>



                                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Shop Confirmation Modal */}
                {showDeleteModal && selectedShop && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="bg-red-100 p-3 rounded-full mb-2">
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Delete Shop</h3>
                                <p className="text-gray-500 mt-2">
                                    Are you sure you want to delete "{selectedShop.name}"? This action cannot be undone.
                                </p>

                                {/* Related records warning */}
                                {(selectedShop.hasRelatedRecords || selectedShop.total_inventory > 0) && (
                                    <div className="mt-3 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
                                        <p className="font-semibold mb-1">This shop has related records that prevent deletion:</p>
                                        <ul className="list-disc list-inside text-left mb-3">
                                            {/* Inventory items */}
                                            {(selectedShop.relatedRecords?.inventoryItems > 0 || selectedShop.total_inventory > 0) && (
                                                <li>
                                                    {selectedShop.relatedRecords?.inventoryItems || selectedShop.total_inventory} inventory items
                                                    <div className="mt-2 flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-sm py-1"
                                                            onClick={() => {
                                                                window.open(`/inventory?shop=${selectedShop.id}`, '_blank');
                                                            }}
                                                        >
                                                            View Items
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-sm py-1 text-red-600 hover:text-red-800"
                                                            onClick={async () => {
                                                                if (!selectedShop) return;

                                                                if (confirm(`Are you sure you want to delete ALL inventory items for "${selectedShop.name}"? This action cannot be undone.`)) {
                                                                    try {
                                                                        setIsDeleting(true);
                                                                        const response = await fetch(`/api/inventory/shop/${selectedShop.id}/delete`, {
                                                                            method: 'DELETE'
                                                                        });

                                                                        const result = await response.json();

                                                                        if (response.ok) {
                                                                            // Update the selected shop
                                                                            setSelectedShop(prev => {
                                                                                if (!prev) return null;
                                                                                return {
                                                                                    ...prev,
                                                                                    total_inventory: 0,
                                                                                    relatedRecords: {
                                                                                        ...(prev.relatedRecords || {}),
                                                                                        inventoryItems: 0
                                                                                    }
                                                                                };
                                                                            });

                                                                            // Try to delete the shop again
                                                                            confirmDeleteShop();
                                                                        } else {
                                                                            alert(`Failed to clear inventory: ${result.message}`);
                                                                        }
                                                                    } catch (err) {
                                                                        console.error('Error clearing inventory:', err);
                                                                        alert('Failed to clear inventory items. Please try again.');
                                                                    } finally {
                                                                        setIsDeleting(false);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Clear All Items
                                                        </Button>
                                                    </div>
                                                </li>
                                            )}

                                            {/* Users */}
                                            {selectedShop.relatedRecords?.users > 0 && (
                                                <li>
                                                    {selectedShop.relatedRecords.users} users assigned to this shop
                                                    <div className="mt-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-sm py-1"
                                                            onClick={() => {
                                                                window.open(`/users`, '_blank');
                                                            }}
                                                        >
                                                            Manage Users
                                                        </Button>
                                                    </div>
                                                </li>
                                            )}

                                            {/* Transfers */}
                                            {selectedShop.relatedRecords?.transfers > 0 && (
                                                <li>
                                                    {selectedShop.relatedRecords.transfers} inventory transfers
                                                    <div className="mt-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-sm py-1"
                                                            onClick={() => {
                                                                window.open(`/transfers`, '_blank');
                                                            }}
                                                        >
                                                            View Transfers
                                                        </Button>
                                                    </div>
                                                </li>
                                            )}

                                            {/* Products */}
                                            {selectedShop.relatedRecords?.products > 0 && (
                                                <li>
                                                    {selectedShop.relatedRecords.products} products
                                                    <div className="mt-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-sm py-1"
                                                            onClick={() => {
                                                                window.open(`/products`, '_blank');
                                                            }}
                                                        >
                                                            Manage Products
                                                        </Button>
                                                    </div>
                                                </li>
                                            )}
                                        </ul>
                                        <p className="text-sm">Please remove or reassign these items before deleting this shop.</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-end space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={confirmDeleteShop}
                                        disabled={isDeleting || selectedShop.hasRelatedRecords || selectedShop.total_inventory > 0}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete Shop'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}