'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2, Search, Info, Users, Shield, BarChart3, Settings, Package, CreditCard } from 'lucide-react';

interface Shop {
    id: string | number;
    name: string;
}

interface RoleTemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    permissions: string[];
    color: string;
}

const roleTemplates: RoleTemplate[] = [
    {
        id: 'admin',
        name: 'Admin',
        description: 'Full administrative access to all system features',
        icon: Users,
        permissions: ['admin:all'],
        color: 'bg-red-100 text-red-800 border-red-200'
    },
    {
        id: 'shop_staff',
        name: 'Shop Staff',
        description: 'Shop operations including sales, customer management, quotations, and shop distribution access for assigned shop only',
        icon: Users,
        permissions: [
            'dashboard:view',
            'sales:view',
            'sales:manage',
            'invoice:create',
            'invoice:view',
            'customer:create',
            'customer:view',
            'quotation:create',
            'quotation:view',
            'shop:distribution:view',
            'inventory:transfer',
            'shop:assigned_only'
        ],
        color: 'bg-blue-100 text-blue-800 border-blue-200'
    }
];

export default function AddUserPage() {
    const router = useRouter();
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        shop: '',
        password: '',
        confirmPassword: '',
        permissions: [] as string[],
        roleName: '',
        allowedAccounts: [] as string[]
    });
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [dynamicShops, setDynamicShops] = useState<Shop[]>([]);
    const [shopsLoading, setShopsLoading] = useState(true);
    const [availableAccounts, setAvailableAccounts] = useState<Array<{
        id: number;
        name: string;
        type: string;
        parent?: { name: string };
    }>>([]);
    const [accountsLoading, setAccountsLoading] = useState(true);

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

    // Fetch accounts from database
    useEffect(() => {
        const fetchAccounts = async () => {
            setAccountsLoading(true);
            try {
                const response = await fetch('/api/accounting/accounts', {
                    headers: {
                        'Authorization': 'Bearer dev-token',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch accounts');
                }
                const data = await response.json();
                if (data.success) {
                    // Filter to only show income and asset accounts
                    const filteredAccounts = data.data.filter((account: any) => 
                        account.isActive && (account.type === 'income' || account.type === 'asset')
                    );
                    setAvailableAccounts(filteredAccounts);
                } else {
                    console.error('Failed to fetch accounts:', data.message);
                    setAvailableAccounts([]);
                }
            } catch (error) {
                console.error('Error fetching accounts:', error);
                setAvailableAccounts([]);
            } finally {
                setAccountsLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    // Available permissions - fetched dynamically
    const [availablePermissions, setAvailablePermissions] = useState<Array<{
        id: string;
        name: string;
        module: string;
        description?: string;
    }>>([]);
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [permissionSearch, setPermissionSearch] = useState('');
    const [showAdvancedPermissions, setShowAdvancedPermissions] = useState(false);

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
                            module: module.charAt(0).toUpperCase() + module.slice(1),
                            description: getPermissionDescription(permission.name)
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

    // Permission descriptions helper
    const getPermissionDescription = (permissionName: string): string => {
        const descriptions: Record<string, string> = {
            'inventory:view': 'View inventory items and stock levels',
            'inventory:create': 'Add new inventory items',
            'inventory:update': 'Edit existing inventory items',
            'inventory:delete': 'Remove inventory items',
            'inventory:manage': 'Full inventory management access',
            'sales:view': 'View sales data and transactions',
            'sales:create': 'Create new sales orders',
            'sales:update': 'Edit existing sales orders',
            'sales:manage': 'Full sales management access',
            'user:view': 'View user accounts',
            'user:create': 'Create new user accounts',
            'user:update': 'Edit user accounts',
            'user:delete': 'Delete user accounts',
            'reports:view': 'View system reports',
            'reports:export': 'Export reports to files',
            'settings:manage': 'Manage system settings',
            'dashboard:view': 'Access dashboard',
        };
        return descriptions[permissionName] || 'Permission access';
    };

    // Handle role template selection
    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = roleTemplates.find(t => t.id === templateId);
        if (template) {
            setUserForm(prev => ({
                ...prev,
                permissions: template.permissions,
                roleName: template.name
            }));
        } else {
            // Fetch raw permissions for custom role
            fetch('/api/permissions?raw=true').then(res => res.json()).then(data => {
                const allPermissions = data.success ? data.data.map((p: any) => p.name) : [];
                setUserForm(prev => ({
                    ...prev,
                    permissions: allPermissions,
                    roleName: 'Custom'
                }));
            }).catch(error => {
                console.error('Error fetching raw permissions:', error);
            });
        }
    };

    // Filter permissions based on search
    const filteredPermissions = availablePermissions.filter(permission =>
        permission.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        permission.module.toLowerCase().includes(permissionSearch.toLowerCase())
    );

    // Group permissions by module
    const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
        const module = permission.module || 'Other';
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
    }, {} as Record<string, typeof availablePermissions>);

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
                // Add all module permissions that aren't already selected
                newPermissions = Array.from(new Set([...prev.permissions, ...modulePermissionIds]));
            } else {
                // Remove all module permissions
                newPermissions = prev.permissions.filter(id => !modulePermissionIds.includes(id));
            }
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleAccountPermissionChange = (accountId: string) => {
        setUserForm(prev => {
            const newAllowedAccounts = prev.allowedAccounts.includes(accountId)
                ? prev.allowedAccounts.filter(id => id !== accountId)
                : [...prev.allowedAccounts, accountId];
            return { ...prev, allowedAccounts: newAllowedAccounts };
        });
    };

    const handleAllAccountsToggle = (isChecked: boolean) => {
        setUserForm(prev => ({
            ...prev,
            allowedAccounts: isChecked ? availableAccounts.map(acc => acc.id.toString()) : []
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

                        {/* Role Templates Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Quick Setup with Role Templates
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                {roleTemplates.map(template => {
                                    const IconComponent = template.icon;
                                    return (
                                        <div
                                            key={template.id}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                selectedTemplate === template.id
                                                    ? template.color + ' border-current'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => handleTemplateSelect(template.id)}
                                        >
                                            <div className="flex items-start space-x-2">
                                                <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium truncate">{template.name}</h4>
                                                    <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Permissions
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedPermissions(!showAdvancedPermissions)}
                                    className="text-sm text-primary hover:text-primary-dark"
                                >
                                    {showAdvancedPermissions ? 'Hide Advanced' : 'Show Advanced'}
                                </button>
                            </div>
                            
                            {/* Permission Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search permissions..."
                                    value={permissionSearch}
                                    onChange={(e) => setPermissionSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm"
                                />
                            </div>

                            <div className="border border-gray-300 rounded-lg p-4 max-h-80 overflow-y-auto">
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
                                                    className={`ml-2 text-sm font-medium ${isModulePartiallySelected(module) ? 'text-gray-500' : 'text-gray-700'
                                                        }`}
                                                >
                                                    {module}
                                                </label>
                                            </div>
                                            <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {groupedPermissions[module].map(permission => (
                                                    <div key={permission.id} className="flex items-start space-x-2 group">
                                                        <input
                                                            type="checkbox"
                                                            id={permission.id}
                                                            checked={userForm.permissions.includes(permission.id)}
                                                            onChange={() => handlePermissionChange(permission.id)}
                                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-0.5"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <label htmlFor={permission.id} className="text-sm text-gray-600 cursor-pointer">
                                                                {permission.name}
                                                            </label>
                                                            {showAdvancedPermissions && permission.description && (
                                                                <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                                                            )}
                                                        </div>
                                                        {permission.description && (
                                                            <div className="relative group">
                                                                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                                    {permission.description}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Account Permissions Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Account Permissions
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="all-accounts"
                                        checked={userForm.allowedAccounts.length === availableAccounts.length && availableAccounts.length > 0}
                                        onChange={(e) => handleAllAccountsToggle(e.target.checked)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="all-accounts" className="ml-2 text-sm text-gray-600">
                                        Select All
                                    </label>
                                </div>
                            </div>

                            <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                                {accountsLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        <span className="text-sm text-gray-500">Loading accounts...</span>
                                    </div>
                                ) : availableAccounts.length === 0 ? (
                                    <div className="text-center py-4">
                                        <span className="text-sm text-gray-500">No accounts available</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {availableAccounts.map(account => (
                                            <div key={account.id} className="flex items-start space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`account-${account.id}`}
                                                    checked={userForm.allowedAccounts.includes(account.id.toString())}
                                                    onChange={() => handleAccountPermissionChange(account.id.toString())}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-0.5"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <label htmlFor={`account-${account.id}`} className="text-sm text-gray-600 cursor-pointer">
                                                        {account.name} {account.parent ? `(${account.parent.name})` : ''}
                                                    </label>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Type: {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Select which accounts this user can record payments to. If none are selected, the user will not be able to record payments.
                            </p>
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