'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Store, MapPin, Phone, Mail, Plus, Search } from 'lucide-react';

// Dummy data for demonstration
const shops = [
    {
        id: 'SH-001',
        name: 'Colombo Central Shop',
        address: '123 Main Street, Colombo 03',
        phoneNumber: '+94 112 345 678',
        email: 'colombo@mdsports.com',
        active: true,
        manager: 'Nimal Perera',
        inventoryCount: 450,
        employees: 8
    },
    {
        id: 'SH-002',
        name: 'Kandy City Branch',
        address: '45 Temple Road, Kandy',
        phoneNumber: '+94 812 234 567',
        email: 'kandy@mdsports.com',
        active: true,
        manager: 'Kamal Silva',
        inventoryCount: 320,
        employees: 5
    },
    {
        id: 'SH-003',
        name: 'Galle Shop',
        address: '78 Beach Road, Galle Fort',
        phoneNumber: '+94 912 345 678',
        email: 'galle@mdsports.com',
        active: true,
        manager: 'Sunil Fernando',
        inventoryCount: 280,
        employees: 4
    },
    {
        id: 'SH-004',
        name: 'Jaffna Branch',
        address: '12 Market Street, Jaffna',
        phoneNumber: '+94 212 345 678',
        email: 'jaffna@mdsports.com',
        active: true,
        manager: 'Rajan Kumar',
        inventoryCount: 210,
        employees: 4
    },
    {
        id: 'SH-005',
        name: 'Batticaloa Store',
        address: '34 Coastal Road, Batticaloa',
        phoneNumber: '+94 652 345 678',
        email: 'batticaloa@mdsports.com',
        active: false,
        manager: 'Priya Ramachandran',
        inventoryCount: 0,
        employees: 0
    }
];

export default function Shops() {
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
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Shops grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shops.map((shop) => (
                        <div key={shop.id} className="bg-tertiary rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className={`p-1 text-center ${shop.active ? 'bg-green-500' : 'bg-red-500'} text-white text-xs`}>
                                {shop.active ? 'ACTIVE' : 'INACTIVE'}
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
                                        <span className="text-sm">{shop.address}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm">{shop.phoneNumber}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm">{shop.email}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-sm text-gray-500">Manager</p>
                                            <p className="font-medium">{shop.manager}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Inventory</p>
                                            <p className="font-medium">{shop.inventoryCount} items</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Staff</p>
                                            <p className="font-medium">{shop.employees}</p>
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
            </div>
        </MainLayout>
    );
} 