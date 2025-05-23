'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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

    // Setup axios interceptors for token refresh
    useEffect(() => {
        const requestInterceptor = api.interceptors.request.use(
            (config) => {
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }

                // Add CSRF token from cookie if available
                const csrfToken = getCookie('csrfToken');
                if (csrfToken && config.method !== 'get') {
                    config.headers['X-CSRF-Token'] = csrfToken;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor to handle token refresh
        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If error is 401 Unauthorized or 403 Forbidden and we haven't tried to refresh the token yet
                if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        console.log('Token expired, attempting to refresh...');
                        // Try to refresh the token, include current token as refreshToken
                        const refreshResponse = await axios.post('/api/auth/refresh',
                            { refreshToken: accessToken },
                            { withCredentials: true }
                        );

                        if (refreshResponse.data.success) {
                            // Update the access token
                            const newAccessToken = refreshResponse.data.accessToken;
                            setAccessToken(newAccessToken);
                            setUser(refreshResponse.data.user);

                            // Update localStorage
                            localStorage.setItem('accessToken', newAccessToken);
                            localStorage.setItem('authToken', newAccessToken);

                            // Update the auth header and retry the original request
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            return api(originalRequest);
                        } else {
                            // If refresh explicitly failed with error message
                            await logout();
                            return Promise.reject(error);
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        // If refresh failed, log the user out
                        await logout();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );

        // Clean up interceptors on unmount
        return () => {
            api.interceptors.request.eject(requestInterceptor);
            api.interceptors.response.eject(responseInterceptor);
        };
    }, [accessToken]);

    // Check if user is logged in on mount
    useEffect(() => {
        const validateAuth = async () => {
            try {
                setIsLoading(true);

                // Try to get user from stored token (check both key names for compatibility)
                const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');

                if (!storedToken) {
                    // No token, user is not logged in
                    setIsLoading(false);
                    return;
                }

                try {
                    // Validate token with backend
                    const response = await api.get('/api/auth/validate', {
                        headers: {
                            Authorization: `Bearer ${storedToken}`,
                        },
                    });

                    if (response.data.success) {
                        setUser(response.data.user);
                        setAccessToken(storedToken);

                        // Ensure both token keys are set
                        localStorage.setItem('accessToken', storedToken);
                        localStorage.setItem('authToken', storedToken);
                    }
                } catch (validationError: any) {
                    console.log('Token validation failed, attempting refresh...');

                    // If token validation fails with 401/403, try refresh
                    if (validationError.response?.status === 401 || validationError.response?.status === 403) {
                        try {
                            const refreshResponse = await axios.post('/api/auth/refresh',
                                { refreshToken: storedToken }, // Send current token as refresh token
                                { withCredentials: true }
                            );

                            if (refreshResponse.data.success) {
                                setUser(refreshResponse.data.user);
                                setAccessToken(refreshResponse.data.accessToken);
                                localStorage.setItem('accessToken', refreshResponse.data.accessToken);
                                localStorage.setItem('authToken', refreshResponse.data.accessToken);
                            } else {
                                throw new Error('Refresh token invalid');
                            }
                        } catch (refreshError) {
                            console.error('Refresh token failed:', refreshError);
                            // Clean up on refresh failure
                            setUser(null);
                            setAccessToken(null);
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('authToken');
                            // Don't redirect here to avoid interrupting the UX
                        }
                    } else {
                        // For other errors, clear auth state
                        console.error('Auth error:', validationError);
                        setUser(null);
                        setAccessToken(null);
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('authToken');
                    }
                }
            } catch (error) {
                console.error('Auth validation error:', error);
                setUser(null);
                setAccessToken(null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('authToken');
            } finally {
                setIsLoading(false);
            }
        };

        validateAuth();
    }, []);

    // Login function
    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await api.post('/api/auth/login', { email, password });

            if (response.data.success) {
                setUser(response.data.user);
                setAccessToken(response.data.accessToken);

                // Store both tokens for compatibility
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('authToken', response.data.accessToken);

                console.log("Login successful, redirecting to dashboard");
                return true;
            } else {
                console.error('Login failed:', response.data.message);
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Logout function
    const logout = async (): Promise<void> => {
        try {
            await api.post('/api/auth/logout', {});
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clean up regardless of API success
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('authToken');
            router.push('/login');
        }
    };

    // Check if user has a specific permission
    const hasPermission = (permission: string): boolean => {
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
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