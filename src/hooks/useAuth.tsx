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
                        const refreshResponse = await axios.post('/api/auth/refresh', {}, {
                            withCredentials: true
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
                        if (refreshError.response) {
                            console.error('Refresh attempt failed with status:', refreshError.response.status, 'data:', refreshError.response.data);
                        }
                        await logout(); // Logout on any error during refresh process
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
    }, [accessToken]); // Added accessToken to dependency array

    useEffect(() => {
        const validateAuth = async () => {
            setIsLoading(true);
            try {
                const storedAccessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');

                if (storedAccessToken) {
                    console.log('Found stored accessToken, validating with /api/auth/validate...');
                    try {
                        const response = await api.get('/api/auth/validate', {
                            headers: { Authorization: `Bearer ${storedAccessToken}` },
                        });
                        if (response.data.success) {
                            setUser(response.data.user);
                            setAccessToken(storedAccessToken); // Keep current token if still valid
                            // The /api/auth/validate does not return a token, it validates the existing one.
                            // No need to set localStorage items here again if they were already set.
                            console.log('Stored accessToken is valid.');
                        } else {
                            // This case should ideally be handled by the 401 response from /validate directly
                            console.warn('/api/auth/validate returned success:false, but not an error status. This is unusual.');
                            // Attempt refresh if validate says not success but didn't error with 401
                            // This scenario might indicate a valid token but inactive user, etc. which validate handles.
                            // For now, let the interceptor handle 401s if validate actually throws one.
                        }
                    } catch (validationError: any) {
                        console.log('Initial /api/auth/validate call failed. Error status:', validationError?.response?.status);
                        // If validation fails (e.g. 401), the response interceptor will try to refresh.
                        // If refresh also fails, user will be logged out by interceptor.
                        // No need to explicitly call refresh here if interceptor handles it.
                        if (!(validationError.response?.status === 401 && !validationError.config?._retry)) {
                            // If it's not a 401 that the interceptor will handle, or if it's already a retry, clear auth.
                            // This might happen if /validate returns e.g. 500, or if it was a 401 and refresh already failed.
                            console.log('Clearing auth state due to unhandled validation error or failed refresh.');
                            setUser(null);
                            setAccessToken(null);
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('authToken');
                        }
                        // The error will be re-thrown or handled by the interceptor trying to refresh
                    }
                } else {
                    console.log('No stored accessToken found.');
                    // No token, user is not logged in
                }
            } catch (error) {
                // Catch-all for unexpected errors during initial auth validation phase
                console.error('Unexpected error in validateAuth:', error);
                setUser(null);
                setAccessToken(null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('authToken');
            } finally {
                setIsLoading(false);
            }
        };
        validateAuth();
    }, []); // Validate auth only on initial mount

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

    const logout = async (): Promise<void> => {
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