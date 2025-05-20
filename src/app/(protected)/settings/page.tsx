'use client';

import { useState } from 'react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General Settings' },
        { id: 'users', label: 'Users & Permissions' },
        { id: 'shops', label: 'Shop Management' },
        { id: 'system', label: 'System Settings' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>

                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="space-y-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                            <p className="text-gray-500">
                                These settings control the general behavior of your application.
                                <br />
                                <span className="text-primary font-medium">
                                    This page is only accessible to users with the settings:manage permission.
                                </span>
                            </p>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        defaultValue="MS Sport"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                                    <select className="w-full p-2 border border-gray-300 rounded-md">
                                        <option>LKR (Rs.)</option>
                                        <option>USD ($)</option>
                                        <option>EUR (€)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Date Format</label>
                                    <select className="w-full p-2 border border-gray-300 rounded-md">
                                        <option>DD/MM/YYYY</option>
                                        <option>MM/DD/YYYY</option>
                                        <option>YYYY-MM-DD</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                                    <select className="w-full p-2 border border-gray-300 rounded-md">
                                        <option>Asia/Colombo (GMT+5:30)</option>
                                        <option>UTC (GMT+0)</option>
                                        <option>Asia/Singapore (GMT+8:00)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Users & Permissions</h3>
                            <p className="text-gray-500 mb-6">Manage system users and their access permissions.</p>

                            <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                                    <h4 className="text-md font-medium text-gray-900">System Users</h4>
                                    <button className="px-3 py-1 text-sm bg-primary text-white rounded-md">
                                        Add User
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-tertiary divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">MS Sport Admin</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">admin@mssport.lk</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Administrator</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">All Shops</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right space-x-2">
                                                    <button className="text-blue-600 hover:text-blue-800">Edit</button>
                                                    <button className="text-red-600 hover:text-red-800">Disable</button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Store Manager</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">manager@mssport.lk</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Manager</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Main Store</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right space-x-2">
                                                    <button className="text-blue-600 hover:text-blue-800">Edit</button>
                                                    <button className="text-red-600 hover:text-red-800">Disable</button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shops' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Shop Management</h3>
                            <p className="text-gray-500 mb-6">Configure shops and locations in your system.</p>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                                <div className="bg-white p-4 rounded border border-gray-200">
                                    <h4 className="font-medium text-gray-900 mb-2">Main Store</h4>
                                    <p className="text-sm text-gray-500 mb-2">Location: Colombo</p>
                                    <p className="text-sm text-gray-500">Manager: Store Manager</p>
                                    <div className="mt-4 flex justify-end space-x-2">
                                        <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">Edit</button>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded border border-gray-200">
                                    <h4 className="font-medium text-gray-900 mb-2">Warehouse</h4>
                                    <p className="text-sm text-gray-500 mb-2">Location: Gampaha</p>
                                    <p className="text-sm text-gray-500">Manager: Warehouse Manager</p>
                                    <div className="mt-4 flex justify-end space-x-2">
                                        <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">Edit</button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button className="px-4 py-2 bg-primary text-white rounded-md">
                                    Add New Shop
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                            <p className="text-gray-500 mb-6">Configure technical aspects of the application.</p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Database Backup Schedule</label>
                                    <select className="w-full p-2 border border-gray-300 rounded-md">
                                        <option>Daily</option>
                                        <option>Weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Log Level</label>
                                    <select className="w-full p-2 border border-gray-300 rounded-md">
                                        <option>Info</option>
                                        <option>Warning</option>
                                        <option>Error</option>
                                        <option>Debug</option>
                                    </select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input type="checkbox" id="maintenance" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                    <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">Enable Maintenance Mode</label>
                                </div>

                                <div className="flex justify-end mt-6">
                                    <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 