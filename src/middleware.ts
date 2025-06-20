import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken, getShopIdFromToken } from '@/lib/auth';

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

// Shop-specific API routes that need shop-based filtering
const SHOP_RESTRICTED_ROUTES = [
    '/api/products',
    '/api/inventory',
    '/api/invoices',
    '/api/purchases',
    '/api/dashboard',
    '/api/reports'
];

// Routes that allow cross-shop access for admins
const ADMIN_CROSS_SHOP_ROUTES = [
    '/api/shops',
    '/api/users',
    '/api/settings',
    '/api/reports/shop-performance',
    '/api/reports/shop-comparison'
];

/**
 * Check if user has permission to access data from a specific shop
 */
async function validateShopAccess(req: NextRequest, targetShopId?: string | number): Promise<boolean> {
    try {
        const userShopId = await getShopIdFromToken(req);
        const _userId = await getUserIdFromToken(req);

        // Development mode - allow all access
        const token = req.headers.get('authorization')?.split(' ')[1];
        if (token === 'dev-token') {
            return true;
        }

        // If no target shop specified, allow access
        if (!targetShopId) {
            return true;
        }

        // For Edge Runtime compatibility, we'll skip permission checks in middleware
        // and rely on API route-level permission validation instead
        // This is a temporary fix to avoid Prisma Edge Runtime issues
        
        // Allow access for now - permission checks will happen in API routes
        // TODO: Implement edge-compatible permission checking if needed

        // Check if user belongs to the target shop
        const targetShopIdNum = typeof targetShopId === 'string' ? parseInt(targetShopId) : targetShopId;
        return userShopId === targetShopIdNum;

    } catch (error) {
        console.error('Error validating shop access:', error);
        return false;
    }
}

/**
 * Add shop context to request headers for API routes
 */
async function addShopContext(req: NextRequest, response: NextResponse): Promise<NextResponse> {
    const userShopId = await getShopIdFromToken(req);
    const userId = await getUserIdFromToken(req);

    if (userShopId) {
        response.headers.set('X-User-Shop-Id', userShopId.toString());
    }

    if (userId) {
        response.headers.set('X-User-Id', userId.toString());
    }

    return response;
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

// Static assets and paths to skip middleware processing
const SKIP_PATHS = [
    '/_next',
    '/images',
    '/favicon.ico',
    '/robots.txt',
    '/manifest.json',
    '/sitemap.xml',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.css',
    '.js',
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

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Skip middleware for static assets and non-critical paths
    if (SKIP_PATHS.some(path => pathname.startsWith(path) || pathname.endsWith(path)) ||
        pathname.startsWith('/_next') ||  // Skip Next.js internal paths
        pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|css|js)$/)) { // Skip static files
        return NextResponse.next();
    }

    // Skip middleware in development if needed
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_MIDDLEWARE === 'true') {
        return NextResponse.next();
    }

    let response = NextResponse.next();

    // Add shop-based access control for API routes
    if (pathname.startsWith('/api/')) {
        // Check if this is a shop-restricted route
        const isShopRestricted = SHOP_RESTRICTED_ROUTES.some(route => pathname.startsWith(route));
        const isAdminRoute = ADMIN_CROSS_SHOP_ROUTES.some(route => pathname.startsWith(route));

        if (isShopRestricted && !isAdminRoute) {
            // Extract shopId from query parameters if present
            const url = new URL(request.url);
            const queryShopId = url.searchParams.get('shopId');

            // Validate shop access
            const hasShopAccess = await validateShopAccess(request, queryShopId || undefined);

            if (!hasShopAccess) {
                return new NextResponse(JSON.stringify({
                    success: false,
                    message: 'Access denied: You can only access data from your assigned shop'
                }), {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        }

        // Add shop context to response headers
        response = await addShopContext(request, response);
    }

    // Get IP address from X-Forwarded-For header or remote address for rate limiting
    const ip = request.ip || 'unknown';

    // Only rate limit specific API endpoints
    const isRateLimitedRoute = API_ROUTES.some(route =>
        pathname.startsWith(route)
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

    // Set security headers only for HTML responses, not for API or assets
    if (!pathname.startsWith('/api/') && !pathname.includes('.')) {
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'same-origin');
    }

    // Add CSRF protection only for non-GET methods that are not static assets
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        const csrfTokenFromCookie = request.cookies.get('csrfToken')?.value;
        const csrfTokenFromHeader = request.headers.get('X-CSRF-Token');

        // Skip CSRF check for login and initial auth routes
        const isAuthRoute = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'].some(
            route => pathname.startsWith(route)
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
    // Only do this for HTML page requests, not for assets or API calls
    if (request.method === 'GET' &&
        !pathname.startsWith('/api/') &&
        !pathname.includes('.') &&
        !pathname.startsWith('/_next')) {

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
        // Exclude static assets and _next directory
        '/api/:path*',
        '/:path*',
        '/:path*/:subpath*',
    ],
};