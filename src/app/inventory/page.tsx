'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Package, Filter, Search, X } from 'lucide-react';

// Dummy data for demonstration
const inventoryItems = [
    {
        id: 'MD-001',
        name: 'Cricket Bat - Professional',
        category: 'Cricket',
        stock: 45,
        retailPrice: 8500,
        wholesalePrice: 7200,
        averageCost: 6500,
        status: 'In Stock',
        branchStock: [
            { branchId: 'SH001', branchName: 'Main Shop', quantity: 20 },
            { branchId: 'SH002', branchName: 'City Center', quantity: 15 },
            { branchId: 'SH003', branchName: 'Stadium Shop', quantity: 10 }
        ]
    },
    {
        id: 'MD-002',
        name: 'Basketball - Size 7',
        category: 'Basketball',
        stock: 28,
        retailPrice: 3200,
        wholesalePrice: 2800,
        averageCost: 2300,
        status: 'In Stock',
        branchStock: [
            { branchId: 'SH001', branchName: 'Main Shop', quantity: 13 },
            { branchId: 'SH002', branchName: 'City Center', quantity: 10 },
            { branchId: 'SH003', branchName: 'Stadium Shop', quantity: 5 }
        ]
    },
    {
        id: 'MD-003',
        name: 'Football - Size 5',
        category: 'Football',
        stock: 15,
        retailPrice: 2800,
        wholesalePrice: 2400,
        averageCost: 2000,
        status: 'Low Stock',
        branchStock: [
            { branchId: 'SH001', branchName: 'Main Shop', quantity: 7 },
            { branchId: 'SH002', branchName: 'City Center', quantity: 5 },
            { branchId: 'SH003', branchName: 'Stadium Shop', quantity: 3 }
        ]
    },
    {
        id: 'MD-004',
        name: 'Tennis Racket - Professional',
        category: 'Tennis',
        stock: 8,
        retailPrice: 12500,
        wholesalePrice: 11000,
        averageCost: 9500,
        status: 'Low Stock',
        branchStock: [
            { branchId: 'SH001', branchName: 'Main Shop', quantity: 3 },
            { branchId: 'SH002', branchName: 'City Center', quantity: 3 },
            { branchId: 'SH003', branchName: 'Stadium Shop', quantity: 2 }
        ]
    },
    {
        id: 'MD-005',
        name: 'Swimming Goggles - Adult',
        category: 'Swimming',
        stock: 0,
        retailPrice: 1500,
        wholesalePrice: 1200,
        averageCost: 950,
        status: 'Out of Stock',
        branchStock: [
            { branchId: 'SH001', branchName: 'Main Shop', quantity: 0 },
            { branchId: 'SH002', branchName: 'City Center', quantity: 0 },
            { branchId: 'SH003', branchName: 'Stadium Shop', quantity: 0 }
        ]
    },
];

// Status badge colors
const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'In Stock':
            return 'bg-green-100 text-green-800';
        case 'Low Stock':
            return 'bg-yellow-100 text-yellow-800';
        case 'Out of Stock':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Inventory() {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const openProductDetails = (product: any) => {
        setSelectedProduct(product);
    };

    const closeProductDetails = () => {
        setSelectedProduct(null);
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                        <p className="text-gray-500">Manage your product inventory across all shops</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="primary" size="sm">
                            <Package className="w-4 h-4 mr-2" />
                            Add Product
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
                                placeholder="Search inventory..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                                <option value="">All Categories</option>
                                <option value="cricket">Cricket</option>
                                <option value="football">Football</option>
                                <option value="basketball">Basketball</option>
                                <option value="tennis">Tennis</option>
                                <option value="swimming">Swimming</option>
                            </select>
                            <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                                <option value="">All Status</option>
                                <option value="in-stock">In Stock</option>
                                <option value="low-stock">Low Stock</option>
                                <option value="out-of-stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Inventory table */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Product Name</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Stock</th>
                                    <th className="px-6 py-3">Retail Price</th>
                                    <th className="px-6 py-3">Wholesale Price</th>
                                    <th className="px-6 py-3">Avg Cost</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryItems.map((item) => (
                                    <tr key={item.id}
                                        className="border-b hover:bg-gray-50 cursor-pointer"
                                        onClick={() => openProductDetails(item)}
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4">{item.category}</td>
                                        <td className="px-6 py-4">{item.stock}</td>
                                        <td className="px-6 py-4">Rs. {item.retailPrice.toLocaleString()}</td>
                                        <td className="px-6 py-4">Rs. {item.wholesalePrice.toLocaleString()}</td>
                                        <td className="px-6 py-4">Rs. {item.averageCost.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
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
                            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">50</span> items
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-center border-b p-4">
                            <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                            <button onClick={closeProductDetails} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Product ID</p>
                                    <p className="font-medium">{selectedProduct.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <p className="font-medium">{selectedProduct.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Stock</p>
                                    <p className="font-medium">{selectedProduct.stock}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(selectedProduct.status)}`}>
                                        {selectedProduct.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Retail Price</p>
                                    <p className="font-medium">Rs. {selectedProduct.retailPrice.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Wholesale Price</p>
                                    <p className="font-medium">Rs. {selectedProduct.wholesalePrice.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Average Cost</p>
                                    <p className="font-medium">Rs. {selectedProduct.averageCost.toLocaleString()}</p>
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg mb-2">Stock by Branch</h3>
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2">Branch ID</th>
                                        <th className="px-4 py-2">Branch Name</th>
                                        <th className="px-4 py-2">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProduct.branchStock.map((branch: any) => (
                                        <tr key={branch.branchId} className="border-b">
                                            <td className="px-4 py-2">{branch.branchId}</td>
                                            <td className="px-4 py-2">{branch.branchName}</td>
                                            <td className="px-4 py-2">{branch.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t p-4 flex justify-end">
                            <Button variant="outline" size="sm" onClick={closeProductDetails}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
} 