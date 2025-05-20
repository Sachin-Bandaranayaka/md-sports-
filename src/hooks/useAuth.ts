'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface User {
    id: number;
    username: string;
    fullName: string;
    email: string;
    roleId: number;
    roleName: string;
    shopId: number | null;
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

// Create context without JSX
const AuthContext = createContext<AuthContextType | null>(null);

// Create provider function
export const AuthProvider = (props: { children: React.ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Check for existing authentication
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    // No token found, user is not authenticated
                    setUser(null);
                    setLoading(false);
                    return;
                }

                // Validate token on the server
                const response = await fetch('/api/auth/validate', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (data.success && data.user) {
                    setUser(data.user);
                } else {
                    // Invalid token
                    localStorage.removeItem('authToken');
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth error:', err);
                setError('Authentication error');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success && data.token) {
                localStorage.setItem('authToken', data.token);
                setUser(data.user);
                router.push('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        router.push('/login');
    };

    // Create value object
    const value = {
        user,
        loading,
        error,
        login,
        logout
    };

    // Return provider with children and value
    return React.createElement(
        AuthContext.Provider,
        { value },
        props.children
    );
};

// Export hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 