'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';

// Map routes to required permissions
const routePermissions: Record<string, string> = {
    '/dashboard': 'view_dashboard',  // Require dashboard permission
    '/inventory': 'inventory:view',  // Full inventory access (blocked for shop staff)
    '/inventory/transfers': 'inventory:transfer',
    '/inventory/distribution': 'shop:distribution:view',  // Shop distribution access
    '/suppliers': 'supplier:view',
    '/purchases': 'purchase:view',
    '/quotations': 'quotation:view',
    '/shops': 'shop:view',
    '/customers': 'customer:view',
    '/invoices': 'invoice:view',
    '/accounting': 'accounting:view',
    '/reports': 'report:view',
    '/settings': 'settings:view',
};

export function usePermission() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const hasPermission = (permission: string): boolean => {
        if (!permission) return true; // No permission required
        if (!user?.permissions || !user.permissions.length) return false;
        
        // Check for admin permissions first
        if (user.permissions.includes('*') || user.permissions.includes('admin:all')) {
            return true;
        }
        
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