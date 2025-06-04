'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface Shop {
    id: string | number;
    name: string;
}

export default function AddUserPage() {
    const router = useRouter();
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        role: '',
        shop: '',
        password: '',
        confirmPassword: '',
        permissions: [] as string[]
    });
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [dynamicShops, setDynamicShops] = useState<Shop[]>([]);
    const [shopsLoading, setShopsLoading] = useState(true);

    // Available shops - This will be replaced by dynamic fetching
    // const shops = [
    //     { id: 1, name: 'All Shops' },
    //     { id: 2, name: 'Main Store' },
    //     { id: 3, name: 'Warehouse' }
    // ];

    useEffect(() => {
        const fetchShops = async () => {
            setShopsLoading(true);
            try {
                // TODO: Replace with actual token or auth mechanism
                const response = await fetch('/api/shops', {
                    headers: {
                        'Authorization': 'Bearer dev-token', // Example authorization
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch shops');
                }
                const data = await response.json();
                if (data.success) {
                    setDynamicShops(data.data || []);
                } else {
                    console.error("Failed to fetch shops:", data.message);
                    setDynamicShops([]); // Set to empty array on failure
                }
            } catch (error) {
                console.error('Error fetching shops:', error);
                setDynamicShops([]); // Set to empty array on error
            } finally {
                setShopsLoading(false);
            }
        };

        fetchShops();
    }, []);

    // Available permissions
    const availablePermissions = [
        { id: 'dashboard:view', name: 'View Dashboard', module: 'Dashboard' },
        { id: 'dashboard:manage', name: 'Manage Dashboard', module: 'Dashboard' },
        { id: 'inventory:view', name: 'View Inventory', module: 'Inventory' },
        { id: 'inventory:manage', name: 'Manage Inventory', module: 'Inventory' },
        { id: 'inventory:create', name: 'Create Items', module: 'Inventory' },
        { id: 'inventory:update', name: 'Update Items', module: 'Inventory' },
        { id: 'inventory:delete', name: 'Delete Items', module: 'Inventory' },
        { id: 'inventory:transfer', name: 'Transfer Items', module: 'Inventory' },
        { id: 'sales:view', name: 'View Sales', module: 'Sales' },
        { id: 'sales:manage', name: 'Manage Sales', module: 'Sales' },
        { id: 'sales:create', name: 'Create Sales', module: 'Sales' },
        { id: 'sales:update', name: 'Update Sales', module: 'Sales' },
        { id: 'sales:delete', name: 'Delete Sales', module: 'Sales' },
        { id: 'user:view', name: 'View Users', module: 'Users' },
        { id: 'user:manage', name: 'Manage Users', module: 'Users' },
        { id: 'user:create', name: 'Create Users', module: 'Users' },
        { id: 'user:update', name: 'Update Users', module: 'Users' },
        { id: 'user:delete', name: 'Delete Users', module: 'Users' },
        { id: 'settings:view', name: 'View Settings', module: 'Settings' },
        { id: 'settings:manage', name: 'Manage Settings', module: 'Settings' }
    ];

    // Group permissions by module
    const groupedPermissions = availablePermissions.reduce((acc, permission) => {
        const module = permission.module || 'Other';
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
    }, {} as Record<string, typeof availablePermissions>);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setUserForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (permissionId: string) => {
        setUserForm(prev => {
            const newPermissions = prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId];
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleModulePermissions = (module: string, isChecked: boolean) => {
        const modulePermissionIds = groupedPermissions[module].map(p => p.id);

        setUserForm(prev => {
            let newPermissions;
            if (isChecked) {
                // Add all module permissions that aren't already selected
                newPermissions = [...new Set([...prev.permissions, ...modulePermissionIds])];
            } else {
                // Remove all module permissions
                newPermissions = prev.permissions.filter(id => !modulePermissionIds.includes(id));
            }
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError('');
        setFormSuccess('');

        // Password validation
        if (userForm.password !== userForm.confirmPassword) {
            setFormError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer dev-token',
                },
                body: JSON.stringify(userForm),
            });

            const data = await response.json();

            if (data.success) {
                setFormSuccess('User added successfully! Redirecting...');
                setTimeout(() => {
                    router.push('/settings?tab=users');
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

    // Check if all permissions in a module are selected
    const isModuleSelected = (module: string) => {
        const modulePermissions = groupedPermissions[module].map(p => p.id);
        return modulePermissions.every(id => userForm.permissions.includes(id));
    };

    // Check if any permissions in a module are selected
    const isModulePartiallySelected = (module: string) => {
        const modulePermissions = groupedPermissions[module].map(p => p.id);
        return modulePermissions.some(id => userForm.permissions.includes(id)) &&
            !modulePermissions.every(id => userForm.permissions.includes(id));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h1 className="text-xl font-semibold text-gray-900">Add New User</h1>
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

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={userForm.name}
                                onChange={handleFormChange}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={userForm.email}
                                onChange={handleFormChange}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="role"
                                    name="role"
                                    value={userForm.role}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Store Manager, Admin, Cashier"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-1">
                                    Shop <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="shop"
                                    name="shop"
                                    value={userForm.shop}
                                    onChange={handleFormChange}
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    required
                                    disabled={shopsLoading}
                                >
                                    {shopsLoading ? (
                                        <option value="">Loading shops...</option>
                                    ) : (
                                        <>
                                            <option value="">Select a shop</option>
                                            {dynamicShops.length > 0 ? (
                                                dynamicShops.map(shop => (
                                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                                ))
                                            ) : (
                                                <option value="" disabled>No shops available</option>
                                            )}
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Permissions
                            </label>
                            <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                                {Object.keys(groupedPermissions).map(module => (
                                    <div key={module} className="mb-4">
                                        <div className="flex items-center mb-2">
                                            <input
                                                type="checkbox"
                                                id={`module-${module}`}
                                                checked={isModuleSelected(module)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                onChange={(e) => handleModulePermissions(module, e.target.checked)}
                                            />
                                            <label
                                                htmlFor={`module-${module}`}
                                                className={`ml-2 text-sm font-medium ${isModulePartiallySelected(module) ? 'text-gray-500' : 'text-gray-700'
                                                    }`}
                                            >
                                                {module}
                                            </label>
                                        </div>
                                        <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {groupedPermissions[module].map(permission => (
                                                <div key={permission.id} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={permission.id}
                                                        checked={userForm.permissions.includes(permission.id)}
                                                        onChange={() => handlePermissionChange(permission.id)}
                                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={permission.id} className="ml-2 text-sm text-gray-600">
                                                        {permission.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={userForm.password}
                                    onChange={handleFormChange}
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={userForm.confirmPassword}
                                    onChange={handleFormChange}
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/settings?tab=users')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create User'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
} 