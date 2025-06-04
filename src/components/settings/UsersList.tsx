'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, RotateCcw, Edit, Trash2, Shield, MapPin } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
    shopId?: number;
    permissions: string[];
    createdAt: string;
    shop?: {
        id: number;
        name: string;
    };
    role?: {
        id: number;
        name: string;
    };
}

interface UsersListProps {
    onAddUser: () => void;
}

export default function UsersList({ onAddUser }: UsersListProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedUser, setExpandedUser] = useState<number | null>(null);
    const [resetPasswordLoading, setResetPasswordLoading] = useState<number | null>(null);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': 'Bearer dev-token',
                },
            });
            const data = await response.json();

            if (data.success) {
                setUsers(data.users || []);
            } else {
                setError(data.message || 'Failed to fetch users');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (userId: number, userEmail: string) => {
        if (!confirm(`Are you sure you want to reset the password for ${userEmail}?`)) {
            return;
        }

        setResetPasswordLoading(userId);
        try {
            const response = await fetch(`/api/users/${userId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer dev-token',
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();

            if (data.success) {
                alert(`Password reset successfully! New password: ${data.newPassword}`);
            } else {
                alert(data.message || 'Failed to reset password');
            }
        } catch (err) {
            console.error('Error resetting password:', err);
            alert('Failed to reset password');
        } finally {
            setResetPasswordLoading(null);
        }
    };

    const handleEditUser = (userId: number) => {
        // Navigate to edit user page or open edit modal
        window.location.href = `/settings/users/edit/${userId}`;
    };

    const handleDeleteUser = async (userId: number, userName: string) => {
        if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer dev-token',
                },
            });
            const data = await response.json();

            if (data.success) {
                alert('User deleted successfully!');
                // Refresh the users list
                fetchUsers();
            } else {
                alert(data.message || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Failed to delete user');
        }
    };

    const toggleUserExpansion = (userId: number) => {
        setExpandedUser(expandedUser === userId ? null : userId);
    };

    const formatPermissions = (permissions: string[]) => {
        // If permissions array is empty or undefined, return empty array
        if (!permissions || permissions.length === 0) {
            return [];
        }

        const grouped = permissions.reduce((acc, permission) => {
            const [module] = permission.split(':');
            if (!acc[module]) acc[module] = [];
            acc[module].push(permission);
            return acc;
        }, {} as Record<string, string[]>);

        return Object.entries(grouped).map(([module, perms]) => ({
            module: module.charAt(0).toUpperCase() + module.slice(1),
            permissions: perms
        }));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Users & Permissions</h3>
                    <p className="text-gray-500">Manage user accounts and their permissions</p>
                </div>
                <Button onClick={onAddUser} className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Add New User
                </Button>
            </div>

            {users.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No users found</h4>
                    <p className="text-gray-500 mb-4">Get started by creating your first user account.</p>
                    <Button onClick={onAddUser}>Create First User</Button>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <div key={user.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-medium text-primary">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {user.name}
                                                </h4>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                                {user.shop && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{user.shop.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditUser(user.id)}
                                            className="flex items-center gap-1"
                                        >
                                            <Edit className="h-3 w-3" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleResetPassword(user.id, user.email)}
                                            disabled={resetPasswordLoading === user.id}
                                            className="flex items-center gap-1"
                                        >
                                            <RotateCcw className={`h-3 w-3 ${resetPasswordLoading === user.id ? 'animate-spin' : ''
                                                }`} />
                                            Reset Password
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleUserExpansion(user.id)}
                                            className="flex items-center gap-1"
                                        >
                                            {expandedUser === user.id ? (
                                                <><EyeOff className="h-3 w-3" /> Hide Details</>
                                            ) : (
                                                <><Eye className="h-3 w-3" /> View Details</>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {expandedUser === user.id && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h5 className="text-sm font-medium text-gray-900 mb-2">User Information</h5>
                                                <dl className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <dt className="text-gray-500">Email:</dt>
                                                        <dd className="text-gray-900">{user.email}</dd>
                                                    </div>
                                                    {user.phone && (
                                                        <div className="flex justify-between text-sm">
                                                            <dt className="text-gray-500">Phone:</dt>
                                                            <dd className="text-gray-900">{user.phone}</dd>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-sm">
                                                        <dt className="text-gray-500">Shop:</dt>
                                                        <dd className="text-gray-900">
                                                            {user.shop ? user.shop.name : 'No shop assigned'}
                                                        </dd>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <dt className="text-gray-500">Created:</dt>
                                                        <dd className="text-gray-900">
                                                            {new Date(user.createdAt).toLocaleDateString()}
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-medium text-gray-900 mb-2">Permissions</h5>
                                                {(!user.permissions || user.permissions.length === 0) ? (
                                                    <div className="text-sm text-gray-500">
                                                        <p>No direct permissions assigned</p>
                                                        {user.role && (
                                                            <p className="mt-1 text-xs text-blue-600">
                                                                Role: {user.role.name} (may have role-based permissions)
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {formatPermissions(user.permissions).map(({ module, permissions }) => (
                                                            <div key={module} className="text-sm">
                                                                <span className="font-medium text-gray-700">{module}:</span>
                                                                <div className="ml-2 flex flex-wrap gap-1 mt-1">
                                                                    {permissions.map((permission) => (
                                                                        <span
                                                                            key={permission}
                                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                                                        >
                                                                            {permission.split(':')[1]}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {user.role && (
                                                            <p className="mt-2 text-xs text-blue-600">
                                                                Role: {user.role.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}