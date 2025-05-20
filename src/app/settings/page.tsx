'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import {
    User,
    Users,
    MessageSquare,
    Settings as SettingsIcon,
    Save,
    Key,
    X,
    Store,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react';
import { authFetch, authPost } from '@/utils/api';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('general');

    // Add modal state
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedUserName, setSelectedUserName] = useState('');

    // Password reset state
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordResetError, setPasswordResetError] = useState('');
    const [passwordResetSuccess, setPasswordResetSuccess] = useState('');
    const [passwordResetLoading, setPasswordResetLoading] = useState(false);

    // Form states
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // List states
    const [shops, setShops] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // User form state
    const [userForm, setUserForm] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        roleId: '',
        shopId: '',
        isActive: true
    });

    // Password visibility toggle
    const [showPassword, setShowPassword] = useState(false);

    // Permission list - will be populated from database
    const [permissions, setPermissions] = useState<any[]>([]);

    // Fetch shops and roles on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch shops
                const shopsResponse = await authFetch('/api/shops');
                if (shopsResponse.ok) {
                    const shopsData = await shopsResponse.json();
                    if (shopsData.success) {
                        setShops(shopsData.data || []);
                    }
                }

                // Fetch roles
                const rolesResponse = await authFetch('/api/users/roles');
                if (rolesResponse.ok) {
                    const rolesData = await rolesResponse.json();
                    if (rolesData.success) {
                        setRoles(rolesData.data || []);
                    }
                }

                // Fetch users
                const usersResponse = await authFetch('/api/users');
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    if (usersData.success) {
                        setUsers(usersData.data || []);
                    }
                }

                // Fetch permissions
                const permissionsResponse = await authFetch('/api/permissions');
                if (permissionsResponse.ok) {
                    const permissionsData = await permissionsResponse.json();
                    if (permissionsData.success) {
                        setPermissions(permissionsData.data || []);
                    } else {
                        // Fall back to static permissions if the API fails
                        setFallbackPermissions();
                    }
                } else {
                    // Fall back to static permissions if the API fails
                    setFallbackPermissions();
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                // Fall back to static permissions if there's an error
                setFallbackPermissions();
            }
        };

        fetchData();
    }, []);

    // Fallback function to set static permissions if API fails
    const setFallbackPermissions = () => {
        setPermissions([
            // Dashboard permissions
            { id: 'dashboard:view', name: 'Dashboard Access' },
            { id: 'dashboard:manage', name: 'Manage Dashboard' },

            // Inventory permissions
            { id: 'inventory:view', name: 'View Inventory' },
            { id: 'inventory:manage', name: 'Manage Inventory' },
            { id: 'inventory:create', name: 'Create Inventory Items' },
            { id: 'inventory:update', name: 'Update Inventory Items' },
            { id: 'inventory:delete', name: 'Delete Inventory Items' },
            { id: 'inventory:transfer', name: 'Transfer Inventory' },

            // Sales permissions
            { id: 'sales:view', name: 'View Sales' },
            { id: 'sales:manage', name: 'Manage Sales' },
            { id: 'sales:create', name: 'Create Sales' },
            { id: 'sales:update', name: 'Update Sales' },
            { id: 'sales:delete', name: 'Delete Sales' },
            { id: 'sales:discount', name: 'Apply Discounts' },

            // User permissions
            { id: 'user:view', name: 'View Users' },
            { id: 'user:manage', name: 'Manage Users' },
            { id: 'user:create', name: 'Create Users' },
            { id: 'user:update', name: 'Update Users' },
            { id: 'user:delete', name: 'Delete Users' },

            // Invoice permissions
            { id: 'invoice:view', name: 'View Invoices' },
            { id: 'invoice:create', name: 'Create Invoices' },
            { id: 'invoice:update', name: 'Update Invoices' },
            { id: 'invoice:delete', name: 'Delete Invoices' },
            { id: 'invoice:void', name: 'Void Invoices' },

            // Report permissions
            { id: 'report:view', name: 'View Reports' },
            { id: 'report:generate', name: 'Generate Reports' },
            { id: 'report:export', name: 'Export Reports' },

            // Customer permissions
            { id: 'customer:view', name: 'View Customers' },
            { id: 'customer:manage', name: 'Manage Customers' },
            { id: 'customer:create', name: 'Create Customers' },
            { id: 'customer:update', name: 'Update Customers' },
            { id: 'customer:delete', name: 'Delete Customers' },

            // Supplier permissions
            { id: 'supplier:view', name: 'View Suppliers' },
            { id: 'supplier:manage', name: 'Manage Suppliers' },
            { id: 'supplier:create', name: 'Create Suppliers' },
            { id: 'supplier:update', name: 'Update Suppliers' },
            { id: 'supplier:delete', name: 'Delete Suppliers' },

            // Shop permissions
            { id: 'shop:view', name: 'View Shops' },
            { id: 'shop:manage', name: 'Manage Shops' },
            { id: 'shop:create', name: 'Create Shops' },
            { id: 'shop:update', name: 'Update Shops' },
            { id: 'shop:delete', name: 'Delete Shops' },

            // Payment permissions
            { id: 'payment:view', name: 'View Payments' },
            { id: 'payment:manage', name: 'Manage Payments' },
            { id: 'payment:create', name: 'Create Payments' },
            { id: 'payment:update', name: 'Update Payments' },
            { id: 'payment:delete', name: 'Delete Payments' },

            // Setting permissions
            { id: 'settings:view', name: 'View Settings' },
            { id: 'settings:manage', name: 'Manage Settings' },

            // Category permissions
            { id: 'category:view', name: 'View Categories' },
            { id: 'category:manage', name: 'Manage Categories' },
            { id: 'category:create', name: 'Create Categories' },
            { id: 'category:update', name: 'Update Categories' },
            { id: 'category:delete', name: 'Delete Categories' },

            // Purchase permissions
            { id: 'purchase:view', name: 'View Purchases' },
            { id: 'purchase:manage', name: 'Manage Purchases' },
            { id: 'purchase:create', name: 'Create Purchases' },
            { id: 'purchase:update', name: 'Update Purchases' },
            { id: 'purchase:delete', name: 'Delete Purchases' },
        ]);
    };

    const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setUserForm(prev => ({ ...prev, [name]: newValue }));
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError('');
        setFormSuccess('');

        // Validate form
        if (userForm.password !== userForm.confirmPassword) {
            setFormError("Passwords don't match");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: userForm.username,
                    fullName: userForm.fullName,
                    email: userForm.email,
                    password: userForm.password,
                    phone: userForm.phone,
                    roleId: parseInt(userForm.roleId),
                    shopId: userForm.shopId ? parseInt(userForm.shopId) : null,
                    isActive: userForm.isActive
                }),
            });

            const data = await response.json();

            if (data.success) {
                setFormSuccess('User added successfully!');
                // Reset form
                setUserForm({
                    username: '',
                    fullName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    phone: '',
                    roleId: '',
                    shopId: '',
                    isActive: true
                });

                // Close modal after a delay
                setTimeout(() => {
                    setShowAddUserModal(false);
                    // Refresh page to show new user
                    window.location.reload();
                }, 1500);
            } else {
                setFormError(data.message || 'Failed to add user');
            }
        } catch (error) {
            console.error('Error adding user:', error);
            setFormError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenResetPassword = (userId: number, userName: string) => {
        setSelectedUserId(userId);
        setSelectedUserName(userName);
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordResetError('');
        setPasswordResetSuccess('');
        setShowResetPasswordModal(true);
    };

    const handleResetPassword = async () => {
        if (!selectedUserId) return;

        setPasswordResetLoading(true);
        setPasswordResetError('');
        setPasswordResetSuccess('');

        // Validate passwords
        if (newPassword !== confirmNewPassword) {
            setPasswordResetError("Passwords don't match");
            setPasswordResetLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setPasswordResetError("Password must be at least 6 characters");
            setPasswordResetLoading(false);
            return;
        }

        try {
            const response = await authPost(`/api/users/${selectedUserId}/reset-password`, {
                newPassword
            });

            const data = await response.json();

            if (data.success) {
                setPasswordResetSuccess('Password reset successfully');
                // Close modal after a delay
                setTimeout(() => {
                    setShowResetPasswordModal(false);
                }, 1500);
            } else {
                setPasswordResetError(data.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setPasswordResetError('An error occurred. Please try again.');
        } finally {
            setPasswordResetLoading(false);
        }
    };

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
                                            defaultValue="MS Sport"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                        <input
                                            type="email"
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                            defaultValue="info@mssport.lk"
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
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setShowAddUserModal(true)}
                                    >
                                        Add User
                                    </Button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">Name</th>
                                                <th className="px-6 py-3">Email</th>
                                                <th className="px-6 py-3">Role</th>
                                                <th className="px-6 py-3">Shop</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.length > 0 ? (
                                                users.map((user) => (
                                                    <tr key={user.id} className="border-b hover:bg-gray-50">
                                                        <td className="px-6 py-4 font-medium text-gray-900">{user.fullName}</td>
                                                        <td className="px-6 py-4">{user.email}</td>
                                                        <td className="px-6 py-4">{user.role?.name || 'N/A'}</td>
                                                        <td className="px-6 py-4">
                                                            {user.shopId ? shops.find(shop => shop.id === user.shopId)?.name : 'All Shops'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs ${user.isActive
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {user.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="sm">Edit</Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenResetPassword(user.id, user.fullName)}
                                                                >
                                                                    Reset Password
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                // Fallback to static data if no users are fetched
                                                <>
                                                    <tr className="border-b hover:bg-gray-50">
                                                        <td className="px-6 py-4 font-medium text-gray-900">Admin User</td>
                                                        <td className="px-6 py-4">admin@mssport.lk</td>
                                                        <td className="px-6 py-4">Administrator</td>
                                                        <td className="px-6 py-4">All Shops</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="sm">Edit</Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenResetPassword(1, 'Admin User')}
                                                                >
                                                                    Reset Password
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b hover:bg-gray-50">
                                                        <td className="px-6 py-4 font-medium text-gray-900">Manager User</td>
                                                        <td className="px-6 py-4">manager@mssport.lk</td>
                                                        <td className="px-6 py-4">Manager</td>
                                                        <td className="px-6 py-4">All Shops</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="sm">Edit</Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenResetPassword(2, 'Manager User')}
                                                                >
                                                                    Reset Password
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b hover:bg-gray-50">
                                                        <td className="px-6 py-4 font-medium text-gray-900">Staff User</td>
                                                        <td className="px-6 py-4">staff@mssport.lk</td>
                                                        <td className="px-6 py-4">Staff</td>
                                                        <td className="px-6 py-4">Shop A</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Inactive</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="sm">Edit</Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenResetPassword(3, 'Staff User')}
                                                                >
                                                                    Reset Password
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'roles' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">Roles & Permissions</h2>
                                    <Link href="/settings/roles/add">
                                        <Button variant="primary" size="sm">
                                            Add Role
                                        </Button>
                                    </Link>
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
                                            {roles.map(role => (
                                                <tr key={role.id} className="border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{role.name}</td>
                                                    <td className="px-6 py-4">{role.description}</td>
                                                    <td className="px-6 py-4">{role.userCount || 0}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="sm">Edit</Button>
                                                            <Button variant="ghost" size="sm">Permissions</Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {roles.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No roles found.</td>
                                                </tr>
                                            )}
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

                {/* Add User Modal */}
                {showAddUserModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={() => setShowAddUserModal(false)}
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {formError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                                        {formError}
                                    </div>
                                )}

                                {formSuccess && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                                        {formSuccess}
                                    </div>
                                )}

                                <form onSubmit={handleAddUser}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Username */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Username <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={userForm.username}
                                                onChange={handleUserFormChange}
                                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                                required
                                            />
                                        </div>

                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={userForm.fullName}
                                                onChange={handleUserFormChange}
                                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                                required
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={userForm.email}
                                                onChange={handleUserFormChange}
                                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                                required
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone
                                            </label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={userForm.phone}
                                                onChange={handleUserFormChange}
                                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                            />
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Password <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={userForm.password}
                                                    onChange={handleUserFormChange}
                                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <Eye className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirm Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm Password <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="confirmPassword"
                                                    value={userForm.confirmPassword}
                                                    onChange={handleUserFormChange}
                                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Role <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="roleId"
                                                value={userForm.roleId}
                                                onChange={handleUserFormChange}
                                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                                required
                                            >
                                                <option value="">Select a role</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Shop - Only required for staff roles */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Assign to Shop {userForm.roleId === '3' && <span className="text-red-500">*</span>}
                                            </label>
                                            <div className="flex items-center">
                                                <Store className="h-5 w-5 text-gray-400 mr-2" />
                                                <select
                                                    name="shopId"
                                                    value={userForm.shopId}
                                                    onChange={handleUserFormChange}
                                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                                    required={userForm.roleId === '3'} // Only required for staff role
                                                >
                                                    <option value="">All Shops (Full Access)</option>
                                                    {shops.map(shop => (
                                                        <option key={shop.id} value={shop.id}>
                                                            {shop.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {userForm.roleId === '3' && !userForm.shopId && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    Staff users should be assigned to a specific shop
                                                </p>
                                            )}
                                        </div>

                                        {/* Active Status */}
                                        <div className="md:col-span-2">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="isActive"
                                                    name="isActive"
                                                    checked={userForm.isActive}
                                                    onChange={handleUserFormChange}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                                    Active account
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end mt-6 border-t border-gray-200 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowAddUserModal(false)}
                                            disabled={isLoading}
                                            className="mr-2"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>Add User</>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reset Password Modal */}
                {showResetPasswordModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="text-lg font-medium">Reset Password for {selectedUserName}</h3>
                                <button
                                    onClick={() => setShowResetPasswordModal(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                {passwordResetError && (
                                    <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                        {passwordResetError}
                                    </div>
                                )}

                                {passwordResetSuccess && (
                                    <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-md text-sm">
                                        {passwordResetSuccess}
                                    </div>
                                )}

                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-10"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="flex justify-end gap-3 p-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowResetPasswordModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    isLoading={passwordResetLoading}
                                    onClick={handleResetPassword}
                                >
                                    Reset Password
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 