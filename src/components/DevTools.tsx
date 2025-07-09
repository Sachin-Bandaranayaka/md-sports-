'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function DevTools() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, login, logout } = useAuth();

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    const handleQuickLogin = async (role: 'admin' | 'shopStaff') => {
        // Use the proper login flow instead of setting localStorage
        if (role === 'admin') {
            await login('admin@mssport.lk', 'password123'); // Use actual admin credentials
        } else {
            await login('sachin@gmail.com', 'password123'); // Use actual shop staff credentials
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700"
            >
                Dev Tools
            </button>

            {isOpen && (
                <div className="absolute bottom-12 right-0 bg-white border rounded-lg shadow-xl p-4 w-64">
                    <h3 className="font-semibold mb-3">Development Tools</h3>
                    
                    <div className="space-y-2">
                        {user ? (
                            <>
                                <p className="text-sm text-gray-600">
                                    Logged in as: {user.username} ({user.roleName || 'Admin'})
                                </p>
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleQuickLogin('admin')}
                                    className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                >
                                    Login as Admin
                                </button>
                                <button
                                    onClick={() => handleQuickLogin('shopStaff')}
                                    className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                >
                                    Login as Shop Staff
                                </button>
                            </>
                        )}
                        
                        <hr className="my-2" />
                        
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 