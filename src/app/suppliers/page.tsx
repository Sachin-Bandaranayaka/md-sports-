'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash, Phone, Mail, ExternalLink, X } from 'lucide-react';
import { Supplier } from '@/types';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Fetch suppliers from API
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/suppliers');
                if (!response.ok) {
                    throw new Error('Failed to fetch suppliers');
                }
                const data = await response.json();
                setSuppliers(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching suppliers:', err);
                setError('Failed to load suppliers. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchSuppliers();
    }, []);

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddSupplier = () => {
        setSelectedSupplier(null);
        setIsEditMode(false);
        setShowAddModal(true);
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsEditMode(true);
        setShowAddModal(true);
    };

    const handleViewSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setShowViewModal(true);
    };

    const handleDeleteSupplier = async (id: string) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
            try {
                const response = await fetch(`/api/suppliers/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete supplier');
                }

                setSuppliers(suppliers.filter(supplier => supplier.id !== id));
            } catch (err) {
                console.error('Error deleting supplier:', err);
                alert('Failed to delete supplier. Please try again.');
            }
        }
    };

    const handleSaveSupplier = async (supplier: Supplier) => {
        try {
            if (isEditMode) {
                // Update existing supplier
                const response = await fetch(`/api/suppliers/${supplier.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(supplier)
                });

                if (!response.ok) {
                    throw new Error('Failed to update supplier');
                }

                const updatedSupplier = await response.json();
                setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
            } else {
                // Create new supplier
                const response = await fetch('/api/suppliers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(supplier)
                });

                if (!response.ok) {
                    throw new Error('Failed to create supplier');
                }

                const newSupplier = await response.json();
                setSuppliers([...suppliers, newSupplier]);
            }
            setShowAddModal(false);
        } catch (err) {
            console.error('Error saving supplier:', err);
            alert('Failed to save supplier. Please try again.');
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
                        <p className="text-gray-500">Manage your suppliers, view purchase history and contact details</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" size="sm" onClick={handleAddSupplier}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Supplier
                        </Button>
                    </div>
                </div>

                {/* Search bar */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                            placeholder="Search suppliers by name, contact person, email, or city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Loading and error states */}
                {loading && (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 animate-pulse">
                        {/* Loading header placeholder */}
                        <div className="p-5">
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-full"></div>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded w-full"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="text-center py-4">
                        <p className="text-red-500">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="mt-2"
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {/* Suppliers table */}
                {!loading && !error && (
                    <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3">Supplier Name</th>
                                        <th className="px-6 py-3">Contact Person</th>
                                        <th className="px-6 py-3">City</th>
                                        <th className="px-6 py-3">Contact</th>
                                        <th className="px-6 py-3">Total Purchases</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSuppliers.map((supplier) => (
                                        <tr key={supplier.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {supplier.id}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {supplier.name}
                                            </td>
                                            <td className="px-6 py-4">{supplier.contactPerson}</td>
                                            <td className="px-6 py-4">{supplier.city}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <a href={`mailto:${supplier.email}`} className="text-blue-500 hover:text-blue-700">
                                                        <Mail className="w-4 h-4" />
                                                    </a>
                                                    <a href={`tel:${supplier.phone}`} className="text-blue-500 hover:text-blue-700">
                                                        <Phone className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">Rs. {supplier.totalPurchases?.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${supplier.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {supplier.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewSupplier(supplier)}
                                                        className="text-blue-500 hover:text-blue-700"
                                                        title="View Details"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditSupplier(supplier)}
                                                        className="text-yellow-500 hover:text-yellow-700"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSupplier(supplier.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Delete"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSuppliers.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-4 text-center">
                                                No suppliers found matching your search criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{filteredSuppliers.length}</span> suppliers
                            </div>
                        </div>
                    </div>
                )}

                {/* Add/Edit Supplier Modal */}
                {showAddModal && (
                    <SupplierFormModal
                        supplier={selectedSupplier}
                        isEdit={isEditMode}
                        onClose={() => setShowAddModal(false)}
                        onSave={handleSaveSupplier}
                    />
                )}

                {/* View Supplier Modal */}
                {showViewModal && selectedSupplier && (
                    <SupplierDetailsModal
                        supplier={selectedSupplier}
                        onClose={() => setShowViewModal(false)}
                        onEdit={() => {
                            setShowViewModal(false);
                            setIsEditMode(true);
                            setShowAddModal(true);
                        }}
                    />
                )}
            </div>
        </MainLayout>
    );
}

interface SupplierFormModalProps {
    supplier: Supplier | null;
    isEdit: boolean;
    onClose: () => void;
    onSave: (supplier: Supplier) => void;
}

function SupplierFormModal({ supplier, isEdit, onClose, onSave }: SupplierFormModalProps) {
    const [formData, setFormData] = useState<Partial<Supplier>>(
        supplier || {
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            notes: '',
            status: 'active'
        }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Supplier);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">{isEdit ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supplier Name*
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Person*
                            </label>
                            <input
                                type="text"
                                name="contactPerson"
                                value={formData.contactPerson}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email*
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone*
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-3 border-t">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">
                            {isEdit ? 'Update Supplier' : 'Add Supplier'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface SupplierDetailsModalProps {
    supplier: Supplier;
    onClose: () => void;
    onEdit: () => void;
}

function SupplierDetailsModal({ supplier, onClose, onEdit }: SupplierDetailsModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-bold">Supplier Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">{supplier.name}</h3>
                            <p className="text-gray-600 text-sm">ID: {supplier.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${supplier.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {supplier.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Contact Person</p>
                            <p className="text-gray-900">{supplier.contactPerson}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                                {supplier.email}
                            </a>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Phone</p>
                            <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
                                {supplier.phone}
                            </a>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">City</p>
                            <p className="text-gray-900">{supplier.city}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-sm font-medium text-gray-500">Address</p>
                            <p className="text-gray-900">{supplier.address}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Purchases</p>
                            <p className="text-gray-900 font-semibold">Rs. {supplier.totalPurchases?.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Since</p>
                            <p className="text-gray-900">{supplier.createdAt}</p>
                        </div>
                        {supplier.notes && (
                            <div className="md:col-span-2">
                                <p className="text-sm font-medium text-gray-500">Notes</p>
                                <p className="text-gray-900">{supplier.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button variant="primary" onClick={onEdit}>
                            Edit Details
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 