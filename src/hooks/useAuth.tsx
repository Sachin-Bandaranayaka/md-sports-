'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { hasPermission as checkPermission } from '@/lib/utils/permissions';
import { AuthenticatedUser as User } from '@/types/auth';
import { setTokenProvider } from '@/utils/api';

// Types
interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    getUserPermissions: () => string[];
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create axios instance with interceptors
const api = axios.create({
    baseURL: '/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Set up the token provider for the API utility
    useEffect(() => {
        setTokenProvider(() => accessToken);
    }, [accessToken]);

    // Define logout function first to avoid hoisting issues
    const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setUser(null);
        setAccessToken(null);
        try {
            // Call the backend to invalidate the refresh token and clear cookies
            await api.post('/api/auth/logout');
            console.log('Logout successful, server-side session cleared.');
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Still clear client-side, even if server call fails
        }
        router.push('/login'); // Redirect to login page
        setIsLoading(false);
    }, [router]);

    // Setup axios interceptors for token refresh
    useEffect(() => {
        const requestInterceptor = api.interceptors.request.use(
            (config) => {
                const currentToken = accessToken;
                if (currentToken) {
                    config.headers.Authorization = `Bearer ${currentToken}`;
                }
                // CSRF token logic remains unchanged
                const csrfToken = getCookie('csrfToken');
                if (csrfToken && config.method !== 'get' && config.method !== 'head') { // Ensure method check is robust
                    config.headers['X-CSRF-Token'] = csrfToken;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                // Avoid infinite loop: do NOT attempt to refresh if the failed request *is* the refresh endpoint itself
                const isRefreshEndpoint = originalRequest?.url?.includes('/api/auth/refresh');

                if ((error.response?.status === 401) && !originalRequest._retry && !isRefreshEndpoint) { // Only retry on 401 for token refresh and not already retried, and skip if refresh itself failed
                    originalRequest._retry = true;
                    try {
                        console.log('Access Token expired or invalid, attempting to refresh via /api/auth/refresh...');
                        // Send an empty object or no body. Relies on httpOnly refreshToken cookie.
                        // Use api instance to ensure CSRF token is included
                        const refreshResponse = await api.post('/api/auth/refresh', {}, {
                            withCredentials: true,
                            timeout: 10000 // 10 second timeout for refresh
                        });

                        if (refreshResponse.data.success) {
                            const newAccessToken = refreshResponse.data.accessToken;
                            setUser(refreshResponse.data.user);
                            setAccessToken(newAccessToken);

                            console.log('Token refreshed successfully. New accessToken:', newAccessToken.substring(0, 10) + '...');
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            return api(originalRequest);
                        } else {
                            console.error('Token refresh explicitly failed by API:', refreshResponse.data.message);
                            await logout(); // Logout if refresh attempt itself fails
                            return Promise.reject(error); // Reject with original error
                        }
                    } catch (refreshError: any) {
                        console.error('Full error during token refresh attempt:', refreshError);
                        
                        // Be more lenient with network errors during refresh
                        if (refreshError.code === 'ECONNABORTED' || refreshError.code === 'NETWORK_ERROR' || !refreshError.response) {
                            console.log('Network error during token refresh, not logging out user');
                            // Don't logout for network issues - let the user try again
                            return Promise.reject(error); // Reject with original error, but don't logout
                        } else if (refreshError.response) {
                            console.error('Refresh attempt failed with status:', refreshError.response.status, 'data:', refreshError.response.data);
                            // Only logout for actual authentication failures (401, 403)
                            if (refreshError.response.status === 401 || refreshError.response.status === 403) {
                                await logout();
                            } else {
                                console.log('Server error during refresh, not logging out user');
                            }
                        } else {
                            await logout(); // Logout for other unexpected errors
                        }
                        return Promise.reject(refreshError); // Reject with refresh error
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.request.eject(requestInterceptor);
            api.interceptors.response.eject(responseInterceptor);
        };
    }, [accessToken, logout]); // Added accessToken and logout to dependency array

    useEffect(() => {
        const validateAuth = async () => {
            setIsLoading(true);
            try {
                // Don't use localStorage for authentication
                // Instead, try to validate using the cookie-based refresh token
                console.log('Validating authentication via refresh token...');
                
                try {
                    // Try to refresh the token using the httpOnly refresh token cookie
                    const response = await api.post('/api/auth/refresh', {}, {
                        timeout: 10000, // 10 second timeout
                    });
                    
                    if (response.data.success) {
                        const userData = response.data.user;
                        console.log('Auth validation - User data received:', {
                            id: userData.id,
                            username: userData.username,
                            roleName: userData.roleName,
                            permissions: userData.permissions?.length || 0
                        });
                        
                        setUser(userData);
                        setAccessToken(response.data.accessToken);
                        console.log('Authentication validated via refresh token');
                    } else {
                        console.log('No valid session found');
                    }
                } catch (error: any) {
                    // Network error during validation
                    if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || !error.response) {
                        console.log('Network error during validation, skipping');
                    } else if (error.response?.status === 401 || error.response?.status === 400) {
                        console.log('No valid refresh token, user needs to login');
                        // Clear any cached user data
                        setUser(null);
                        setAccessToken(null);
                    } else {
                        console.error('Unexpected error during validation:', error);
                    }
                }
            } catch (error) {
                console.error('Unexpected error in validateAuth:', error);
            } finally {
                setIsLoading(false);
            }
        };
        validateAuth();
    }, []); // Empty dependency array as no dependencies are used in this useEffect

    const login = async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            if (response.data.success) {
                const { accessToken: newAccessToken, user: userData } = response.data;
                setUser(userData);
                setAccessToken(newAccessToken);

                // The refreshToken should have been set as an httpOnly cookie by the /api/auth/login endpoint
                console.log('Login successful. AccessToken set. RefreshToken should be in httpOnly cookie.');
                setIsLoading(false);
                return true;
            }
        } catch (error: any) {
            console.error('Login failed:', error.response?.data?.message || error.message);
        }
        setIsLoading(false);
        setUser(null);
        setAccessToken(null);
        return false;
    };

    // Check if user has a specific permission
    const hasPermission = (permission: string): boolean => {
        if (!user || !user.permissions) return false;
        return checkPermission(user.permissions, permission);
    };

    // Get all user permissions
    const getUserPermissions = (): string[] => {
        if (!user || !user.permissions) return [];
        return [...user.permissions];
    };

    // Helper function to get cookie value
    const getCookie = (name: string): string | undefined => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
    };

    const value: AuthContextType = {
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        getUserPermissions
    };

    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Hook for using the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Export the axios instance for reuse
export { api };