/**
 * Utility for making authenticated API requests
 */

// Token provider - will be set by AuthProvider
let tokenProvider: (() => string | null) | null = null;

/**
 * Set the token provider function
 * This should be called by the AuthProvider to provide access to the current token
 */
export const setTokenProvider = (provider: () => string | null) => {
    tokenProvider = provider;
};

/**
 * Get the current authentication token
 */
const getAuthToken = (): string | null => {
    // Use the token provider if available
    if (tokenProvider) {
        return tokenProvider();
    }
    
    // Fallback to cookies only (not localStorage) for security
    // This is only used during SSR or before the auth provider is initialized
    if (typeof document !== 'undefined') {
        // Try to get token from cookie (if server sets it as non-httpOnly for development)
        const value = `; ${document.cookie}`;
        const parts = value.split(`; accessToken=`);
        if (parts.length === 2) {
            const token = parts.pop()?.split(';').shift();
            if (token) return token;
        }
    }
    
    return null;
};

/**
 * Get CSRF token from cookies
 */
export const getCsrfToken = (): string | undefined => {
    if (typeof document === 'undefined') return undefined;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrfToken=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
};

/**
 * Enhanced fetch function that automatically adds authentication token
 */
export const authFetch = async (url: string, options: RequestInit = {}) => {
    // Get token using the centralized method
    const token = getAuthToken();

    if (!token) {
        console.warn('No auth token found for request to:', url);
    } else {
        console.log(`Making authenticated request to ${url} with token: ${token.substring(0, 10)}...`);
    }

    // Prepare headers with authentication
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
        'Authorization': token ? `Bearer ${token}` : '',
    };

    // If content type is not explicitly set and we're not sending FormData,
    // default to JSON content type
    if (
        !options.headers?.hasOwnProperty('Content-Type') &&
        !(options.body instanceof FormData)
    ) {
        headers['Content-Type'] = 'application/json';
    }

    // Add CSRF token for non-GET requests
    if (options.method && options.method !== 'GET' && options.method !== 'HEAD') {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
    }

    // Make the request with authentication header
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // If unauthorized and not on the login page, redirect to login
    if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.warn('Authentication error (401) for request to:', url);
        // Don't clear localStorage - let the auth provider handle this
        window.location.href = '/login';
        return response;
    }

    return response;
};

/**
 * GET request with authentication
 */
export const authGet = async (url: string, options: RequestInit = {}) => {
    return authFetch(url, { ...options, method: 'GET' });
};

/**
 * POST request with authentication
 */
export const authPost = async (url: string, data: any, options: RequestInit = {}) => {
    return authFetch(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * PUT request with authentication
 */
export const authPut = async (url: string, data: any, options: RequestInit = {}) => {
    return authFetch(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

/**
 * DELETE request with authentication
 */
export const authDelete = async (url: string, options: RequestInit = {}) => {
    return authFetch(url, { ...options, method: 'DELETE' });
};

/**
 * PATCH request with authentication
 */
export const authPatch = async (url: string, data: any, options: RequestInit = {}) => {
    return authFetch(url, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

/**
 * Setup global fetch interceptor to add authentication token to all API calls
 * Call this once at the app initialization
 */
export const setupFetchInterceptor = () => {
    if (typeof window !== 'undefined') {
        const originalFetch = window.fetch;

        window.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
            // Only intercept API calls to our own API (starting with /api)
            const urlString = url.toString();
            if (urlString.startsWith('/api') || urlString.startsWith(window.location.origin + '/api')) {
                options = options || {};
                options.headers = options.headers || {};

                // Cast headers to any to allow string indexing
                const headers = options.headers as any;

                // Add authentication header if token exists
                const token = getAuthToken();
                if (token && !headers['Authorization']) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                // Add CSRF token for non-GET requests
                if (options.method && options.method !== 'GET' && options.method !== 'HEAD') {
                    const csrfToken = getCsrfToken();
                    if (csrfToken && !headers['X-CSRF-Token']) {
                        headers['X-CSRF-Token'] = csrfToken;
                        console.log(`Adding CSRF token for ${options.method} request to ${urlString}`);
                    }
                }
            }

            return originalFetch(url, options);
        };

        console.log('Fetch interceptor set up successfully');
    }
};