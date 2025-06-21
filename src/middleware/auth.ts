import { NextRequest, NextResponse } from 'next/server';
import { PERMISSIONS, Permission } from '@/lib/constants/permissions';
import { permissionService } from '@/lib/services/PermissionService';
import { AuthenticatedUser } from '@/types/auth';

// Route permission mapping
const ROUTE_PERMISSIONS: Record<string, Permission | Permission[]> = {
  '/dashboard': PERMISSIONS.SALES_VIEW, // Dashboard requires at least sales view
  '/inventory': PERMISSIONS.INVENTORY_VIEW,
  '/inventory/products': PERMISSIONS.INVENTORY_VIEW,
  '/inventory/categories': PERMISSIONS.CATEGORIES_VIEW,
  '/inventory/brands': PERMISSIONS.BRANDS_VIEW,
  '/inventory/transfers': PERMISSIONS.TRANSFERS_VIEW,
  '/sales': PERMISSIONS.SALES_VIEW,
  '/sales/invoices': PERMISSIONS.SALES_VIEW,
  '/sales/quotations': PERMISSIONS.QUOTATIONS_VIEW,
  '/customers': PERMISSIONS.CUSTOMERS_VIEW,
  '/suppliers': PERMISSIONS.SUPPLIERS_VIEW,
  '/purchases': PERMISSIONS.PURCHASES_VIEW,
  '/reports': PERMISSIONS.REPORTS_VIEW,
  '/accounting': PERMISSIONS.ACCOUNTING_VIEW,
  '/settings': PERMISSIONS.SETTINGS_VIEW,
  '/users': PERMISSIONS.USERS_VIEW,
  '/shops': PERMISSIONS.SHOP_VIEW,
};

// Admin-only routes
const ADMIN_ROUTES = [
  '/users/create',
  '/users/edit',
  '/settings/system',
  '/settings/permissions',
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
];

/**
 * Extract user information from request headers or cookies
 * This would typically come from your authentication system
 */
function getUserFromRequest(request: NextRequest): AuthenticatedUser | null {
  try {
    // This is a placeholder - replace with your actual auth logic
    const authHeader = request.headers.get('authorization');
    const sessionCookie = request.cookies.get('session');
    
    // You would decode JWT token or validate session here
    // For now, returning null to indicate no user found
    return null;
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a route requires admin permissions
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Get required permission for a route
 */
function getRoutePermission(pathname: string): Permission | Permission[] | null {
  // Check for exact match first
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }
  
  // Check for partial matches (e.g., /inventory/products/123)
  for (const route in ROUTE_PERMISSIONS) {
    if (pathname.startsWith(route + '/')) {
      return ROUTE_PERMISSIONS[route];
    }
  }
  
  return null;
}

/**
 * Main authentication middleware
 */
export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    isPublicRoute(pathname)
  ) {
    return NextResponse.next();
  }
  
  // Get user from request
  const user = getUserFromRequest(request);
  
  // Redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check admin routes
  if (isAdminRoute(pathname)) {
    if (!permissionService.isAdmin(user)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    return NextResponse.next();
  }
  
  // Check route permissions
  const requiredPermission = getRoutePermission(pathname);
  if (requiredPermission) {
    const hasAccess = Array.isArray(requiredPermission)
      ? permissionService.hasAnyPermission(user, requiredPermission)
      : permissionService.hasPermission(user, requiredPermission);
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  // Add user info to headers for downstream components
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-permissions', JSON.stringify(user.permissions));
  
  return response;
}

/**
 * Higher-order function to create route-specific middleware
 */
export function createRouteMiddleware(requiredPermission: Permission | Permission[]) {
  return (request: NextRequest) => {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const hasAccess = Array.isArray(requiredPermission)
      ? permissionService.hasAnyPermission(user, requiredPermission)
      : permissionService.hasPermission(user, requiredPermission);
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    return NextResponse.next();
  };
}

/**
 * Utility function to check permissions in API routes
 */
export function checkApiPermission(
  request: NextRequest,
  requiredPermission: Permission | Permission[]
): { authorized: boolean; user: AuthenticatedUser | null; error?: string } {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return { authorized: false, user: null, error: 'Authentication required' };
  }
  
  const hasAccess = Array.isArray(requiredPermission)
    ? permissionService.hasAnyPermission(user, requiredPermission)
    : permissionService.hasPermission(user, requiredPermission);
  
  if (!hasAccess) {
    return { 
      authorized: false, 
      user, 
      error: `Insufficient permissions. Required: ${Array.isArray(requiredPermission) ? requiredPermission.join(' OR ') : requiredPermission}` 
    };
  }
  
  return { authorized: true, user };
}

export default authMiddleware;