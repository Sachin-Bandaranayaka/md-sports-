'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, X } from 'lucide-react'; // Assuming X might be used for a cancel icon/button if not text

// Define the structure for a Permission if not already globally available
interface Permission {
    id: string;
    name: string;
    description?: string;
    module?: string;
}

export default function AddRolePage() {
    const router = useRouter();
    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        permissions: [] as string[]
    });
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Fetch permissions on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissionsResponse = await fetch('/api/permissions');
                if (permissionsResponse.ok) {
                    const permissionsData = await permissionsResponse.json();
                    if (permissionsData.success) {
                        setPermissions(permissionsData.data || []);
                    } else {
                        setFallbackPermissions();
                    }
                } else {
                    setFallbackPermissions();
                }
            } catch (error) {
                console.error('Error fetching permissions:', error);
                setFallbackPermissions();
            }
        };
        fetchData();
    }, []);

    const setFallbackPermissions = () => {
        setPermissions([
            { id: 'dashboard:view', name: 'Dashboard Access' },
            { id: 'dashboard:manage', name: 'Manage Dashboard' },
            { id: 'inventory:view', name: 'View Inventory' },
            { id: 'inventory:manage', name: 'Manage Inventory' },
            { id: 'inventory:create', name: 'Create Inventory Items' },
            { id: 'inventory:update', name: 'Update Inventory Items' },
            { id: 'inventory:delete', name: 'Delete Inventory Items' },
            { id: 'inventory:transfer', name: 'Transfer Inventory' },
            { id: 'sales:view', name: 'View Sales' },
            { id: 'sales:manage', name: 'Manage Sales' },
            { id: 'sales:create', name: 'Create Sales' },
            { id: 'sales:update', name: 'Update Sales' },
            { id: 'sales:delete', name: 'Delete Sales' },
            { id: 'sales:discount', name: 'Apply Discounts' },
            { id: 'user:view', name: 'View Users' },
            { id: 'user:manage', name: 'Manage Users' },
            { id: 'user:create', name: 'Create Users' },
            { id: 'user:update', name: 'Update Users' },
            { id: 'user:delete', name: 'Delete Users' },
            { id: 'invoice:view', name: 'View Invoices' },
            { id: 'invoice:create', name: 'Create Invoices' },
            { id: 'invoice:update', name: 'Update Invoices' },
            { id: 'invoice:delete', name: 'Delete Invoices' },
            { id: 'invoice:void', name: 'Void Invoices' },
            { id: 'report:view', name: 'View Reports' },
            { id: 'report:generate', name: 'Generate Reports' },
            { id: 'report:export', name: 'Export Reports' },
            { id: 'customer:view', name: 'View Customers' },
            { id: 'customer:manage', name: 'Manage Customers' },
            { id: 'customer:create', name: 'Create Customers' },
            { id: 'customer:update', name: 'Update Customers' },
            { id: 'customer:delete', name: 'Delete Customers' },
            { id: 'supplier:view', name: 'View Suppliers' },
            { id: 'supplier:manage', name: 'Manage Suppliers' },
            { id: 'supplier:create', name: 'Create Suppliers' },
            { id: 'supplier:update', name: 'Update Suppliers' },
            { id: 'supplier:delete', name: 'Delete Suppliers' },
            { id: 'shop:view', name: 'View Shops' },
            { id: 'shop:manage', name: 'Manage Shops' },
            { id: 'shop:create', name: 'Create Shops' },
            { id: 'shop:update', name: 'Update Shops' },
            { id: 'shop:delete', name: 'Delete Shops' },
            { id: 'payment:view', name: 'View Payments' },
            { id: 'payment:manage', name: 'Manage Payments' },
            { id: 'payment:create', name: 'Create Payments' },
            { id: 'payment:update', name: 'Update Payments' },
            { id: 'payment:delete', name: 'Delete Payments' },
            { id: 'settings:view', name: 'View Settings' },
            { id: 'settings:manage', name: 'Manage Settings' },
            { id: 'category:view', name: 'View Categories' },
            { id: 'category:manage', name: 'Manage Categories' },
            { id: 'category:create', name: 'Create Categories' },
            { id: 'category:update', name: 'Update Categories' },
            { id: 'category:delete', name: 'Delete Categories' },
            { id: 'purchase:view', name: 'View Purchases' },
            { id: 'purchase:manage', name: 'Manage Purchases' },
            { id: 'purchase:create', name: 'Create Purchases' },
            { id: 'purchase:update', name: 'Update Purchases' },
            { id: 'purchase:delete', name: 'Delete Purchases' },
        ]);
    };

    const handleRoleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setRoleForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (permissionId: string) => {
        setRoleForm(prev => {
            const newPermissions = prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId];
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleAddRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError('');
        setFormSuccess('');

        try {
            const response = await fetch('/api/users/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roleForm),
            });

            const data = await response.json();

            if (data.success) {
                setFormSuccess('Role added successfully! Redirecting...');
                setRoleForm({ name: '', description: '', permissions: [] });
                setTimeout(() => {
                    router.push('/settings?tab=roles'); // Or a more specific roles page
                }, 1500);
            } else {
                setFormError(data.message || 'Failed to add role');
            }
        } catch (error) {
            console.error('Error adding role:', error);
            setFormError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b">
                        <h1 className="text-xl font-semibold text-gray-900">Add New Role</h1>
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

                    <form onSubmit={handleAddRole}>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Role Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="roleName"
                                    name="name"
                                    value={roleForm.name}
                                    onChange={handleRoleFormChange}
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={roleForm.description}
                                    onChange={handleRoleFormChange}
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    rows={3}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Permissions
                                </label>
                                {/* Quick actions */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const allPermissionIds = permissions.map(p => p.id);
                                            setRoleForm(prev => ({ ...prev, permissions: allPermissionIds }));
                                        }}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setRoleForm(prev => ({ ...prev, permissions: [] }))}
                                    >
                                        Deselect All
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const viewPermIds = permissions
                                                .filter(p => String(p.id).includes(':view'))
                                                .map(p => p.id);
                                            setRoleForm(prev => ({ ...prev, permissions: viewPermIds }));
                                        }}
                                    >
                                        View Access Only
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const managePermIds = permissions
                                                .filter(p => String(p.id).includes(':manage'))
                                                .map(p => p.id);
                                            setRoleForm(prev => ({
                                                ...prev,
                                                permissions: [
                                                    ...new Set([...prev.permissions, ...managePermIds]) // Use Set to avoid duplicates
                                                ]
                                            }));
                                        }}
                                    >
                                        Add All Management
                                    </Button>
                                </div>

                                <div className="border border-gray-200 rounded-md p-4 max-h-[400px] overflow-y-auto">
                                    {(() => {
                                        const moduleGroups: { [key: string]: Permission[] } = {};
                                        permissions.forEach(permission => {
                                            const module = permission.module || String(permission.id).split(':')[0];
                                            if (!moduleGroups[module]) {
                                                moduleGroups[module] = [];
                                            }
                                            moduleGroups[module].push(permission);
                                        });
                                        const sortedModules = Object.keys(moduleGroups).sort();

                                        return sortedModules.map(module => (
                                            <div key={module} className="mb-4 last:mb-0">
                                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                                                    <h4 className="font-semibold text-md text-gray-800 capitalize">{module}</h4>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`select-all-${module}`}
                                                            checked={moduleGroups[module].every(p => roleForm.permissions.includes(p.id))}
                                                            onChange={() => {
                                                                const allModulePermIds = moduleGroups[module].map(p => p.id);
                                                                const allSelected = moduleGroups[module].every(p => roleForm.permissions.includes(p.id));
                                                                setRoleForm(prev => {
                                                                    let newPermissions = [...prev.permissions];
                                                                    if (allSelected) {
                                                                        newPermissions = newPermissions.filter(pId => !allModulePermIds.includes(pId));
                                                                    } else {
                                                                        allModulePermIds.forEach(pId => {
                                                                            if (!newPermissions.includes(pId)) {
                                                                                newPermissions.push(pId);
                                                                            }
                                                                        });
                                                                    }
                                                                    return { ...prev, permissions: newPermissions };
                                                                });
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <label htmlFor={`select-all-${module}`} className="ml-2 text-sm text-gray-600 cursor-pointer">
                                                            Select All in {module}
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                                    {moduleGroups[module].map(permission => (
                                                        <div key={permission.id} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={permission.id}
                                                                checked={roleForm.permissions.includes(permission.id)}
                                                                onChange={() => handlePermissionChange(permission.id)}
                                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <label htmlFor={permission.id} className="ml-3 block text-sm text-gray-700 cursor-pointer">
                                                                {permission.name}
                                                                {permission.description && (
                                                                    <span className="block text-xs text-gray-500">
                                                                        ({permission.description})
                                                                    </span>
                                                                )}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    {roleForm.permissions.length} of {permissions.length} permissions selected
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end mt-8 border-t border-gray-200 pt-5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/settings?tab=roles')} // Navigate back
                                className="mr-3"
                                disabled={isLoading}
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
                                        Saving Role...
                                    </>
                                ) : (
                                    'Save Role'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
} 