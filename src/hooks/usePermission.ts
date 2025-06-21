'use client';


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
    '/invoices': 'sales:view',  // Changed from invoice:view to sales:view
    '/accounting': 'accounting:view',
    '/reports': 'report:view',
    '/settings': 'settings:manage',
};

export function usePermission() {
    const { user } = useAuth();
    const _router = useRouter();
    const pathname = usePathname();

    const hasPermission = (permission: string): boolean => {
        if (!permission) return true; // No permission required
        if (!user?.permissions || !user.permissions.length) return false;
        
        // Check for admin permissions first
        if (user.permissions.includes('*') || user.permissions.includes('admin:all') || user.permissions.includes('ALL')) {
            return true;
        }
        
        return user.permissions.includes(permission);
    };

    // Check if user can edit/delete invoices
    const canEditInvoices = (): boolean => {
        return hasPermission('sales:manage') || hasPermission('admin:all') || hasPermission('ALL') || hasPermission('*');
    };

    // Check if user can view quotations
    const canViewQuotations = (): boolean => {
        return hasPermission('quotation:view') || hasPermission('admin:all') || hasPermission('ALL') || hasPermission('*');
    };

    // Check if user can create quotations
    const canCreateQuotations = (): boolean => {
        return hasPermission('quotation:manage') || hasPermission('admin:all') || hasPermission('ALL') || hasPermission('*');
    };

    // Check if user can edit/delete quotations
    const canEditQuotations = (): boolean => {
        return hasPermission('quotation:manage') || hasPermission('admin:all') || hasPermission('ALL') || hasPermission('*');
    };

    // Check if user can view cost data
    const canViewCosts = (): boolean => {
        return hasPermission('shop:view_costs') || hasPermission('admin:all') || hasPermission('ALL') || hasPermission('*');
    };

    // Check if user can record payments to specific accounts
    const canRecordPaymentToAccount = (accountId: number): boolean => {
        // Admin can record to any account
        if (hasPermission('admin:all') || hasPermission('ALL') || hasPermission('*')) {
            return true;
        }
        
        // Check if user has payment:record permission
        if (!hasPermission('payment:record') && !hasPermission('invoice:create')) {
            return false;
        }
        
        // Check if user has specific account permissions
        if (user?.allowedAccounts && user.allowedAccounts.length > 0) {
            return user.allowedAccounts.includes(accountId.toString());
        }
        
        // For users without specific account restrictions, allow all income/asset accounts
        // This maintains backward compatibility
        return true;
    };

    // Get list of accounts user can record payments to
    const getAllowedAccountIds = (): string[] => {
        // Admin can use any account
        if (hasPermission('admin:all') || hasPermission('ALL') || hasPermission('*')) {
            return [];
        }
        
        // Return user's allowed accounts or empty array if no restrictions
        return user?.allowedAccounts || [];
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
        checkRoutePermission,
        canEditInvoices,
        canViewQuotations,
        canCreateQuotations,
        canEditQuotations,
        canViewCosts,
        canRecordPaymentToAccount,
        getAllowedAccountIds
    };
}