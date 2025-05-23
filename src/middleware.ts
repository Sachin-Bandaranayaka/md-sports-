import { NextResponse, NextRequest } from 'next/server';

// Generate UUID using Web Crypto API instead of Node.js crypto
function generateUUID() {
    // This implementation works in Edge Runtime
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// In-memory store for rate limiting (use Redis in production)
interface RateLimitStore {
    [ip: string]: {
        count: number;
        resetTime: number;
    };
}

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const rateLimitStore: RateLimitStore = {};

// API routes that should be protected
const API_ROUTES = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
];

// Function to clean up expired rate limit entries
const cleanupRateLimitStore = () => {
    const now = Date.now();
    for (const ip in rateLimitStore) {
        if (rateLimitStore[ip].resetTime < now) {
            delete rateLimitStore[ip];
        }
    }
};

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimitStore, 60000);
}

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Skip middleware in development if needed
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_MIDDLEWARE === 'true') {
        return response;
    }

    // Get IP address for rate limiting
    const ip = request.ip || 'unknown';

    // Only rate limit specific API endpoints
    const isRateLimitedRoute = API_ROUTES.some(route =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isRateLimitedRoute) {
        // Apply rate limiting
        const now = Date.now();

        if (!rateLimitStore[ip]) {
            rateLimitStore[ip] = {
                count: 0,
                resetTime: now + RATE_LIMIT_WINDOW_MS,
            };
        }

        // Reset count if window has passed
        if (rateLimitStore[ip].resetTime < now) {
            rateLimitStore[ip] = {
                count: 0,
                resetTime: now + RATE_LIMIT_WINDOW_MS,
            };
        }

        // Increment count
        rateLimitStore[ip].count++;

        // Set rate limiting headers
        response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
        response.headers.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - rateLimitStore[ip].count).toString());
        response.headers.set('X-RateLimit-Reset', rateLimitStore[ip].resetTime.toString());

        // Check if rate limit exceeded
        if (rateLimitStore[ip].count > RATE_LIMIT_MAX_REQUESTS) {
            return new NextResponse(JSON.stringify({
                success: false,
                message: 'Too many requests, please try again later.'
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60',
                    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': rateLimitStore[ip].resetTime.toString(),
                }
            });
        }
    }

    // Set security headers for all responses
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'same-origin');

    // Add CSRF protection
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        const csrfTokenFromCookie = request.cookies.get('csrfToken')?.value;
        const csrfTokenFromHeader = request.headers.get('X-CSRF-Token');

        // Skip CSRF check for login and initial auth routes
        const isAuthRoute = ['/api/auth/login', '/api/auth/register'].some(
            route => request.nextUrl.pathname.startsWith(route)
        );

        if (!isAuthRoute && (!csrfTokenFromCookie || csrfTokenFromHeader !== csrfTokenFromCookie)) {
            return new NextResponse(JSON.stringify({
                success: false,
                message: 'Invalid CSRF token'
            }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }

    // For GET requests to pages, set a new CSRF token if one doesn't exist
    if (request.method === 'GET' && !request.nextUrl.pathname.startsWith('/api/')) {
        const currentToken = request.cookies.get('csrfToken')?.value;
        if (!currentToken) {
            const csrfToken = generateUUID();
            response.cookies.set({
                name: 'csrfToken',
                value: csrfToken,
                httpOnly: false, // Made accessible to JavaScript
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24, // 1 day
            });
        }
    }

    return response;
}

export const config = {
    matcher: [
        // Apply the middleware to all API routes and page routes
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ],
}; 