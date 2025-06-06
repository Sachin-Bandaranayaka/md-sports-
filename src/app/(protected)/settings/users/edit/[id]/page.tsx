'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authGet, authPut } from '@/utils/api';

interface Shop {
    id: string | number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    shopId: number;
    permissions: string[];
    shop?: {
        id: number;
        name: string;
    };
}

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;
    const { user: currentUser, isAuthenticated, hasPermission } = useAuth();
    
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        shop: '',
        permissions: [] as string[]
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [dynamicShops, setDynamicShops] = useState<Shop[]>([]);
    const [shopsLoading, setShopsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    // Check authentication and permissions
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        
        if (!hasPermission('user:manage') && !hasPermission('user:update')) {
            setFormError('You do not have permission to edit users');
            return;
        }
    }, [isAuthenticated, hasPermission, router]);

    // Available permissions - fetched dynamically
    const [availablePermissions, setAvailablePermissions] = useState<Array<{
        id: string;
        name: string;
        module: string;
    }>>([]);
    const [permissionsLoading, setPermissionsLoading] = useState(true);

    // Fetch permissions from database
    useEffect(() => {
        const fetchPermissions = async () => {
            setPermissionsLoading(true);
            try {
                const response = await fetch('/api/permissions', {
                    headers: {
                        'Authorization': 'Bearer dev-token',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch permissions');
                }
                const data = await response.json();
                if (data.success) {
                    // Transform permissions to include module based on name prefix
                    const transformedPermissions = data.data.map((permission: any) => {
                        const [module, action] = permission.name.split(':');
                        return {
                            id: permission.id.toString(),
                            name: permission.description || permission.name,
                            module: module.charAt(0).toUpperCase() + module.slice(1)
                        };
                    });
                    setAvailablePermissions(transformedPermissions);
                } else {
                    console.error('Failed to fetch permissions:', data.message);
                    setAvailablePermissions([]);
                }
            } catch (error) {
                console.error('Error fetching permissions:', error);
                setAvailablePermissions([]);
            } finally {
                setPermissionsLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    // Group permissions by module
    const groupedPermissions = availablePermissions.reduce((acc, permission) => {
        const module = permission.module || 'Other';
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
    }, {} as Record<string, typeof availablePermissions>);

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            
            setIsLoadingUser(true);
            try {
                const response = await authGet(`/api/users/${userId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }
                
                const data = await response.json();
                if (data.success) {
                    const userData = data.user;
                    setUser(userData);
                    setUserForm({
                        name: userData.name || '',
                        email: userData.email || '',
                        shop: userData.shopId?.toString() || '',
                        permissions: userData.permissions || []
                    });
                } else {
                    setFormError(data.message || 'Failed to fetch user');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setFormError('Failed to load user data');
            } finally {
                setIsLoadingUser(false);
            }
        };

        fetchUser();
    }, [userId]);

    // Fetch shops
    useEffect(() => {
        const fetchShops = async () => {
            setShopsLoading(true);
            try {
                const response = await authGet('/api/shops');
                if (!response.ok) {
                    throw new Error('Failed to fetch shops');
                }
                const data = await response.json();
                if (data.success) {
                    setDynamicShops(data.data || []);
                } else {
                    console.error("Failed to fetch shops:", data.message);
                    setDynamicShops([]);
                }
            } catch (error) {
                console.error('Error fetching shops:', error);
                setDynamicShops([]);
            } finally {
                setShopsLoading(false);
            }
        };

        fetchShops();
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                newPermissions = [...new Set([...prev.permissions, ...modulePermissionIds])];
            } else {
                newPermissions = prev.permissions.filter(id => !modulePermissionIds.includes(id));
            }
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError('');
        setFormSuccess('');

        try {
                const response = await authPut(`/api/users/${userId}`, userForm);

                const data = await response.json();

            if (data.success) {
                setFormSuccess('User updated successfully! Redirecting...');
                setTimeout(() => {
                    router.push('/settings?tab=users');
                }, 1500);
            } else {
                setFormError(data.message || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
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

    if (isLoadingUser) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading user data...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
                    <div className="text-center py-8">
                        <h1 className="text-xl font-semibold text-gray-900 mb-4">User Not Found</h1>
                        <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
                        <Button onClick={() => router.push('/settings?tab=users')}>Back to Users</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h1 className="text-xl font-semibold text-gray-900">Edit User: {user.name}</h1>
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

                        <div>
                            <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-1">
                                Shop Assignment <span className="text-red-500">*</span>
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Permissions
                            </label>
                            <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                                {permissionsLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        <span className="text-sm text-gray-500">Loading permissions...</span>
                                    </div>
                                ) : Object.keys(groupedPermissions).length === 0 ? (
                                    <div className="text-center py-4">
                                        <span className="text-sm text-gray-500">No permissions available</span>
                                    </div>
                                ) : (
                                    Object.keys(groupedPermissions).map(module => (
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
                                                    className={`ml-2 text-sm font-medium ${
                                                        isModulePartiallySelected(module) ? 'text-gray-500' : 'text-gray-700'
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
                                    ))
                                )}
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
                                        Updating...
                                    </>
                                ) : (
                                    'Update User'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}