'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { User, Users, MessageSquare, Settings as SettingsIcon, Save, Key } from 'lucide-react';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500">Manage application settings and preferences</p>
                </div>

                {/* Tabs and Content */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Tab navigation */}
                    <div className="flex flex-wrap border-b border-gray-200">
                        <button
                            className={`px-4 py-3 text-sm font-medium ${activeTab === 'general'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('general')}
                        >
                            <SettingsIcon className="w-4 h-4 inline mr-2" />
                            General
                        </button>
                        <button
                            className={`px-4 py-3 text-sm font-medium ${activeTab === 'users'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('users')}
                        >
                            <User className="w-4 h-4 inline mr-2" />
                            Users
                        </button>
                        <button
                            className={`px-4 py-3 text-sm font-medium ${activeTab === 'roles'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('roles')}
                        >
                            <Users className="w-4 h-4 inline mr-2" />
                            Roles & Permissions
                        </button>
                        <button
                            className={`px-4 py-3 text-sm font-medium ${activeTab === 'sms'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('sms')}
                        >
                            <MessageSquare className="w-4 h-4 inline mr-2" />
                            SMS Integration
                        </button>
                        <button
                            className={`px-4 py-3 text-sm font-medium ${activeTab === 'ai'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('ai')}
                        >
                            <Key className="w-4 h-4 inline mr-2" />
                            AI Settings
                        </button>
                    </div>

                    {/* Tab content */}
                    <div className="p-6">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                            defaultValue="MD Sports"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                        <input
                                            type="email"
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                            defaultValue="info@mdsports.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                        <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                                            <option value="lkr">Sri Lankan Rupee (LKR)</option>
                                            <option value="usd">US Dollar (USD)</option>
                                            <option value="eur">Euro (EUR)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                                        <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                                            <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                                            <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                                            <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">System Logo</label>
                                    <div className="flex items-center">
                                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">Logo</div>
                                        <Button variant="outline" size="sm" className="ml-4">Upload New</Button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <Button variant="primary" size="sm">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                                    <Button variant="primary" size="sm">Add User</Button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">Name</th>
                                                <th className="px-6 py-3">Email</th>
                                                <th className="px-6 py-3">Role</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">Admin User</td>
                                                <td className="px-6 py-4">admin@mdsports.com</td>
                                                <td className="px-6 py-4">Administrator</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm">Edit</Button>
                                                        <Button variant="ghost" size="sm">Reset Password</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">Manager User</td>
                                                <td className="px-6 py-4">manager@mdsports.com</td>
                                                <td className="px-6 py-4">Manager</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm">Edit</Button>
                                                        <Button variant="ghost" size="sm">Reset Password</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">Staff User</td>
                                                <td className="px-6 py-4">staff@mdsports.com</td>
                                                <td className="px-6 py-4">Staff</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Inactive</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm">Edit</Button>
                                                        <Button variant="ghost" size="sm">Reset Password</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'roles' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">Roles & Permissions</h2>
                                    <Button variant="primary" size="sm">Add Role</Button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">Role Name</th>
                                                <th className="px-6 py-3">Description</th>
                                                <th className="px-6 py-3">Users</th>
                                                <th className="px-6 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">Administrator</td>
                                                <td className="px-6 py-4">Full system access and control</td>
                                                <td className="px-6 py-4">1</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm">Edit</Button>
                                                        <Button variant="ghost" size="sm">Permissions</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">Manager</td>
                                                <td className="px-6 py-4">Shop management and reporting access</td>
                                                <td className="px-6 py-4">1</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm">Edit</Button>
                                                        <Button variant="ghost" size="sm">Permissions</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">Staff</td>
                                                <td className="px-6 py-4">Basic inventory and sales access</td>
                                                <td className="px-6 py-4">1</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm">Edit</Button>
                                                        <Button variant="ghost" size="sm">Permissions</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sms' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900">SMS Integration Settings</h2>

                                <div className="flex items-start gap-2 mb-4">
                                    <div className="flex h-5 items-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                                            defaultChecked
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <label className="font-medium text-gray-700">Enable SMS Notifications</label>
                                        <p className="text-gray-500">Send SMS alerts for low inventory, new orders, and payment reminders</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SMS Provider</label>
                                        <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                                            <option value="textit">TextIT</option>
                                            <option value="dialog">Dialog SMS API</option>
                                            <option value="mobitel">Mobitel SMS Gateway</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                        <input
                                            type="password"
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                            defaultValue="••••••••••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <Button variant="primary" size="sm">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Settings
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900">AI Integration Settings</h2>

                                <div className="flex items-start gap-2 mb-4">
                                    <div className="flex h-5 items-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                                            defaultChecked
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <label className="font-medium text-gray-700">Enable AI Predictions</label>
                                        <p className="text-gray-500">Use AI to predict inventory needs and sales patterns</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
                                        <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                                            <option value="openai">OpenAI</option>
                                            <option value="azure">Azure AI</option>
                                            <option value="google">Google Vertex AI</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                        <input
                                            type="password"
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                            defaultValue="••••••••••••••••"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">AI Feature Settings</label>
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 accent-primary mr-2"
                                                    defaultChecked
                                                />
                                                <label className="text-sm text-gray-700">Inventory Demand Prediction</label>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 accent-primary mr-2"
                                                    defaultChecked
                                                />
                                                <label className="text-sm text-gray-700">Sales Trend Analysis</label>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 accent-primary mr-2"
                                                    defaultChecked
                                                />
                                                <label className="text-sm text-gray-700">Customer Purchase Recommendations</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <Button variant="primary" size="sm">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Settings
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 