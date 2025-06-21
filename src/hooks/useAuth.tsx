'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { hasPermission as checkPermission } from '@/lib/utils/permissions';

// Types
interface User {
    id: number;
    username: string;
    fullName: string;
    email: string;
    roleId: number;
    roleName: string;
    shopId?: number;
    permissions: string[];
    allowedAccounts?: string[];
}

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

    // Define logout function first to avoid hoisting issues
    const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authToken');
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
                const currentToken = accessToken || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
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
                if ((error.response?.status === 401) && !originalRequest._retry) { // Only retry on 401 for token refresh
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
                            localStorage.setItem('accessToken', newAccessToken);
                            localStorage.setItem('authToken', newAccessToken); // Keep for compatibility if still used

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
                const storedAccessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');

                if (storedAccessToken) {
                    console.log('Found stored accessToken, validating with /api/auth/validate...');
                    
                    // Retry logic for validation to handle network issues during hard refresh
                    let retryCount = 0;
                    const maxRetries = 2;
                    let validationSuccessful = false;
                    
                    while (retryCount <= maxRetries && !validationSuccessful) {
                        try {
                            const response = await api.get('/api/auth/validate', {
                                headers: { Authorization: `Bearer ${storedAccessToken}` },
                                timeout: 10000, // 10 second timeout
                            });
                            
                            if (response.data.success) {
                                setUser(response.data.user);
                                setAccessToken(storedAccessToken);
                                console.log('Stored accessToken is valid.');
                                validationSuccessful = true;
                            } else {
                                console.warn('/api/auth/validate returned success:false, but not an error status.');
                                break; // Don't retry for explicit validation failures
                            }
                        } catch (validationError: any) {
                            console.log(`Validation attempt ${retryCount + 1} failed. Error status:`, validationError?.response?.status);
                            
                            // Handle different types of errors
                            if (validationError.response?.status === 401) {
                                // Token is invalid/expired - let interceptor handle refresh
                                console.log('Token appears invalid, letting interceptor handle refresh...');
                                break;
                            } else if (validationError.code === 'ECONNABORTED' || validationError.code === 'NETWORK_ERROR' || !validationError.response) {
                                // Network/timeout errors - retry
                                retryCount++;
                                if (retryCount <= maxRetries) {
                                    console.log(`Network error detected, retrying in ${retryCount * 1000}ms...`);
                                    await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                                    continue;
                                } else {
                                    console.log('Max retries reached for network errors, assuming user is still authenticated');
                                    // Don't clear auth state for network issues - assume user is still valid
                                    setAccessToken(storedAccessToken);
                                    validationSuccessful = true;
                                }
                            } else {
                                // Other server errors (5xx) - don't clear auth immediately
                                console.log('Server error during validation, assuming temporary issue');
                                setAccessToken(storedAccessToken);
                                validationSuccessful = true;
                                break;
                            }
                        }
                    }
                } else {
                    console.log('No stored accessToken found.');
                    // No token, user is not logged in
                }
            } catch (error) {
                // Catch-all for unexpected errors - be more lenient
                console.error('Unexpected error in validateAuth:', error);
                const storedAccessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
                if (storedAccessToken) {
                    console.log('Keeping existing token despite validation error');
                    setAccessToken(storedAccessToken);
                }
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
                localStorage.setItem('accessToken', newAccessToken);
                localStorage.setItem('authToken', newAccessToken); // for compatibility

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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authToken');
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

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                hasPermission,
                getUserPermissions,
            }}
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