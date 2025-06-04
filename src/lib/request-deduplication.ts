/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate API requests by caching ongoing requests
 * and returning the same promise for identical requests.
 */

import { PerformanceMonitor } from './performance';

const monitor = new PerformanceMonitor();

// Store for ongoing requests
const ongoingRequests = new Map<string, Promise<any>>();

// Store for request metadata
interface RequestMetadata {
    timestamp: number;
    count: number;
    lastAccess: number;
}

const requestMetadata = new Map<string, RequestMetadata>();

// Configuration
const DEDUPLICATION_CONFIG = {
    // How long to keep a request in the deduplication cache (ms)
    maxAge: 30 * 1000, // 30 seconds

    // Maximum number of concurrent requests to track
    maxConcurrentRequests: 100,

    // Cleanup interval for expired requests
    cleanupInterval: 60 * 1000, // 1 minute

    // Enable logging for debugging
    enableLogging: process.env.NODE_ENV === 'development'
};

/**
 * Generate a unique key for a request
 */
function generateRequestKey(
    url: string,
    method: string = 'GET',
    body?: any,
    headers?: Record<string, string>
): string {
    const normalizedUrl = url.toLowerCase();
    const normalizedMethod = method.toUpperCase();

    // Include relevant headers in the key (excluding auth tokens for security)
    const relevantHeaders = headers ? Object.entries(headers)
        .filter(([key]) => !key.toLowerCase().includes('authorization'))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|') : '';

    const bodyString = body ? JSON.stringify(body) : '';

    return `${normalizedMethod}:${normalizedUrl}:${bodyString}:${relevantHeaders}`;
}

/**
 * Clean up expired requests
 */
function cleanupExpiredRequests(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, metadata] of requestMetadata.entries()) {
        if (now - metadata.lastAccess > DEDUPLICATION_CONFIG.maxAge) {
            expiredKeys.push(key);
        }
    }

    for (const key of expiredKeys) {
        ongoingRequests.delete(key);
        requestMetadata.delete(key);
    }

    if (DEDUPLICATION_CONFIG.enableLogging && expiredKeys.length > 0) {
        console.log(`🧹 Cleaned up ${expiredKeys.length} expired request deduplication entries`);
    }
}

/**
 * Check if we're at the concurrent request limit
 */
function isAtConcurrentLimit(): boolean {
    return ongoingRequests.size >= DEDUPLICATION_CONFIG.maxConcurrentRequests;
}

/**
 * Deduplicate a request
 */
export async function deduplicateRequest<T>(
    requestFn: () => Promise<T>,
    url: string,
    method: string = 'GET',
    body?: any,
    headers?: Record<string, string>
): Promise<T> {
    const requestKey = generateRequestKey(url, method, body, headers);
    const now = Date.now();

    // Check if we already have this request ongoing
    const existingRequest = ongoingRequests.get(requestKey);
    if (existingRequest) {
        // Update metadata
        const metadata = requestMetadata.get(requestKey);
        if (metadata) {
            metadata.count++;
            metadata.lastAccess = now;
        }

        if (DEDUPLICATION_CONFIG.enableLogging) {
            console.log(`🔄 Deduplicating request: ${method} ${url} (${metadata?.count || 1} total)`);
        }

        return existingRequest;
    }

    // Clean up if we're at the limit
    if (isAtConcurrentLimit()) {
        cleanupExpiredRequests();

        // If still at limit, proceed without deduplication
        if (isAtConcurrentLimit()) {
            if (DEDUPLICATION_CONFIG.enableLogging) {
                console.warn(`⚠️ Request deduplication limit reached, proceeding without deduplication: ${method} ${url}`);
            }
            return requestFn();
        }
    }

    // Create new request
    const timer = monitor.startTimer('request-deduplication');

    const requestPromise = requestFn()
        .finally(() => {
            // Clean up after request completes
            ongoingRequests.delete(requestKey);
            monitor.endTimer(timer);
        });

    // Store the request
    ongoingRequests.set(requestKey, requestPromise);
    requestMetadata.set(requestKey, {
        timestamp: now,
        count: 1,
        lastAccess: now
    });

    if (DEDUPLICATION_CONFIG.enableLogging) {
        console.log(`🚀 Starting new request: ${method} ${url}`);
    }

    return requestPromise;
}

/**
 * Deduplicate a fetch request
 */
export async function deduplicatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const method = options.method || 'GET';
    const headers = options.headers as Record<string, string> || {};
    const body = options.body;

    return deduplicateRequest(
        () => fetch(url, options),
        url,
        method,
        body,
        headers
    );
}

/**
 * Deduplicate a JSON fetch request
 */
export async function deduplicatedFetchJson<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await deduplicatedFetch(url, options);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Clear all ongoing requests (useful for testing or manual cleanup)
 */
export function clearAllRequests(): void {
    ongoingRequests.clear();
    requestMetadata.clear();

    if (DEDUPLICATION_CONFIG.enableLogging) {
        console.log('🧹 Cleared all request deduplication entries');
    }
}

/**
 * Get statistics about request deduplication
 */
export function getDeduplicationStats(): {
    ongoingRequests: number;
    totalRequests: number;
    averageRequestCount: number;
    oldestRequest: number | null;
} {
    const now = Date.now();
    let totalRequests = 0;
    let oldestTimestamp = Infinity;

    for (const metadata of requestMetadata.values()) {
        totalRequests += metadata.count;
        if (metadata.timestamp < oldestTimestamp) {
            oldestTimestamp = metadata.timestamp;
        }
    }

    return {
        ongoingRequests: ongoingRequests.size,
        totalRequests,
        averageRequestCount: requestMetadata.size > 0 ? totalRequests / requestMetadata.size : 0,
        oldestRequest: oldestTimestamp === Infinity ? null : now - oldestTimestamp
    };
}

/**
 * Force cleanup of expired requests
 */
export function forceCleanup(): void {
    cleanupExpiredRequests();
}

// Start automatic cleanup
setInterval(cleanupExpiredRequests, DEDUPLICATION_CONFIG.cleanupInterval);

// Export configuration for testing
export { DEDUPLICATION_CONFIG };

/**
 * React hook for deduplicating API calls
 */
export function useDeduplicatedFetch() {
    return {
        fetch: deduplicatedFetch,
        fetchJson: deduplicatedFetchJson,
        getStats: getDeduplicationStats,
        clearAll: clearAllRequests
    };
}