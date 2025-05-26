'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PermissionsDebugContent() {
    const { user, isLoading, getUserPermissions, hasPermission } = useAuth();
    const [permissionToCheck, setPermissionToCheck] = useState('');
    const [hasPermissionResult, setHasPermissionResult] = useState<boolean | null>(null);
    const [tokenInfo, setTokenInfo] = useState<{ token: string | null; type: string }>({ token: null, type: 'none' });

    const commonPermissions = [
        'category:view', 'category:create', 'category:update', 'category:delete',
        'product:view', 'product:create', 'product:update', 'product:delete',
        'inventory:view', 'inventory:create', 'inventory:update', 'inventory:delete',
        'user:view', 'user:create', 'user:update', 'user:delete',
        'shop:view', 'shop:create', 'shop:update', 'shop:delete',
    ];

    useEffect(() => {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
        let type = 'none';

        if (token) {
            if (token === 'dev-token') {
                type = 'development';
            } else {
                type = 'normal';
            }
        }

        setTokenInfo({ token, type });
    }, []);

    const checkPermission = () => {
        if (!permissionToCheck) return;
        setHasPermissionResult(hasPermission(permissionToCheck));
    };

    const enableDevToken = () => {
        localStorage.setItem('accessToken', 'dev-token');
        localStorage.setItem('authToken', 'dev-token');
        setTokenInfo({ token: 'dev-token', type: 'development' });
        alert('Dev token enabled. Reload the page to apply.');
    };

    const clearToken = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authToken');
        setTokenInfo({ token: null, type: 'none' });
        alert('Token cleared. Reload the page to apply.');
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-4">Not logged in</h1>
                <div className="mb-4">
                    <button
                        onClick={enableDevToken}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded mr-2"
                    >
                        Enable Dev Token
                    </button>
                    <p className="text-sm text-gray-500 mt-1">
                        Use this for development only. Reload the page after enabling.
                    </p>
                </div>
                <Link href="/login" className="text-blue-500 hover:underline">
                    Go to Login
                </Link>
            </div>
        );
    }

    const userPermissions = getUserPermissions();

    return (
        <>
            <div className="mb-6 p-4 bg-gray-100 rounded">
                <div className="mb-2"><strong>User ID:</strong> {user.id}</div>
                <div className="mb-2"><strong>Username:</strong> {user.username}</div>
                <div className="mb-2"><strong>Role:</strong> {user.roleName} (ID: {user.roleId})</div>
                <div className="mb-2">
                    <strong>Token Type:</strong> {' '}
                    <span className={tokenInfo.type === 'development' ? 'text-green-600 font-bold' : ''}>
                        {tokenInfo.type}
                    </span>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Your Permissions ({userPermissions.length})</h2>
                {userPermissions.length === 0 ? (
                    <div className="p-4 bg-red-100 text-red-700 rounded">
                        No permissions found for this user
                    </div>
                ) : (
                    <ul className="list-disc list-inside bg-gray-50 p-4 rounded">
                        {userPermissions.map(perm => (
                            <li key={perm} className="mb-1">{perm}</li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Check Specific Permission</h2>
                <div className="flex mb-2">
                    <input
                        type="text"
                        value={permissionToCheck}
                        onChange={(e) => setPermissionToCheck(e.target.value)}
                        placeholder="Enter permission (e.g., category:delete)"
                        className="p-2 border rounded mr-2 flex-grow"
                    />
                    <button
                        onClick={checkPermission}
                        disabled={!permissionToCheck}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300"
                    >
                        Check
                    </button>
                </div>

                {hasPermissionResult !== null && (
                    <div className={`p-3 rounded mt-2 ${hasPermissionResult ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {hasPermissionResult
                            ? `User HAS the permission: ${permissionToCheck}`
                            : `User DOES NOT HAVE the permission: ${permissionToCheck}`}
                    </div>
                )}

                <div className="mt-4">
                    <h3 className="font-medium mb-2">Common permissions to try:</h3>
                    <div className="flex flex-wrap gap-2">
                        {commonPermissions.map(perm => (
                            <button
                                key={perm}
                                onClick={() => {
                                    setPermissionToCheck(perm);
                                    setHasPermissionResult(hasPermission(perm));
                                }}
                                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
                            >
                                {perm}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Development Tools</h2>
                <div className="flex gap-2">
                    <button
                        onClick={enableDevToken}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded"
                    >
                        Enable Dev Token
                    </button>
                    <button
                        onClick={clearToken}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    >
                        Clear Token
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Note: You need to reload the page after changing tokens.
                </p>
            </div>

            <div>
                <Link href="/dashboard" className="text-blue-500 hover:underline">
                    Back to Dashboard
                </Link>
            </div>
        </>
    );
} 