'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';

// Map routes to required permissions
const routePermissions: Record<string, string> = {
    '/dashboard': '',  // Everyone can access dashboard
    '/inventory': 'inventory:view',
    '/inventory/transfers': 'inventory:view',
    '/suppliers': 'inventory:view',
    '/purchases': 'inventory:manage',
    '/quotations': 'sales:view',
    '/shops': 'inventory:view',
    '/customers': 'sales:view',
    '/invoices': 'sales:view',
    '/receipts': 'sales:view',
    '/accounting': 'sales:manage',
    '/reports': 'reports:view',
    '/settings': 'settings:manage',
};

export function usePermission() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const hasPermission = (permission: string): boolean => {
        if (!permission) return true; // No permission required
        if (!user?.permissions || !user.permissions.length) return false;
        return user.permissions.includes(permission);
    };

    // Check if user has permission to access the current route
    const checkRoutePermission = (): boolean => {
        // Default to dashboard for root path
        if (pathname === '/') return true;

        // Login page is always accessible
        if (pathname === '/login') return true;

        // For exact route matches
        const requiredPermission = routePermissions[pathname];
        if (requiredPermission !== undefined) {
            return hasPermission(requiredPermission);
        }

        // For routes that don't have an exact match, check parent routes
        for (const route in routePermissions) {
            if (pathname.startsWith(route + '/')) {
                return hasPermission(routePermissions[route]);
            }
        }

        // If no matching route found, allow access by default
        return true;
    };

    return {
        hasPermission,
        checkRoutePermission
    };
} 