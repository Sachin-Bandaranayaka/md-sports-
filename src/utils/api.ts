/**
 * Utility for making authenticated API requests
 */

/**
 * Enhanced fetch function that automatically adds authentication token
 */
export const authFetch = async (url: string, options: RequestInit = {}) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (!token) {
        console.warn('No auth token found for request to:', url);
    } else {
        console.log(`Making authenticated request to ${url} with token: ${token.substring(0, 10)}...`);
    }

    // Prepare headers with authentication
    const headers = {
        ...(options.headers || {}),
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

    // Make the request with authentication header
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // If unauthorized and not on the login page, redirect to login
    if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.warn('Authentication error (401) for request to:', url);
        localStorage.removeItem('authToken');
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
                const token = localStorage.getItem('authToken');

                // Add authentication header if token exists
                if (token) {
                    options = options || {};
                    options.headers = options.headers || {};

                    // Cast headers to any to allow string indexing
                    const headers = options.headers as any;

                    // Only add if Authorization header doesn't already exist
                    if (!headers['Authorization']) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                }
            }

            return originalFetch(url, options);
        };
    }
}; 