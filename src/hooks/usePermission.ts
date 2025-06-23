'use client';


import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';
import { PERMISSIONS, Permission } from '@/lib/constants/permissions';
import { permissionService } from '@/lib/services/PermissionService';

// Define route permissions mapping using constants
const routePermissions: Record<string, Permission> = {
    '/dashboard': PERMISSIONS.SALES_VIEW, // Dashboard requires at least sales view
    '/inventory': PERMISSIONS.INVENTORY_VIEW,
    '/sales': PERMISSIONS.SALES_VIEW,
    '/quotations': PERMISSIONS.QUOTATIONS_VIEW,
    '/reports': PERMISSIONS.REPORTS_VIEW,
    '/settings': PERMISSIONS.SETTINGS_VIEW,
    '/users': PERMISSIONS.USERS_VIEW,
};

interface PermissionContext {
    shopId?: string;
    userId?: string;
    resourceId?: string;
}

export function usePermission() {
    const { user } = useAuth();
    const _router = useRouter();
    const pathname = usePathname();

    const hasPermission = (
        requiredPermission: Permission | string,
        context?: PermissionContext
    ): boolean => {
        return permissionService.hasPermission(user, requiredPermission, context);
    };

    const hasAnyPermission = (
        requiredPermissions: (Permission | string)[],
        context?: PermissionContext
    ): boolean => {
        return permissionService.hasAnyPermission(user, requiredPermissions, context);
    };

    const hasAllPermissions = (
        requiredPermissions: (Permission | string)[],
        context?: PermissionContext
    ): boolean => {
        return permissionService.hasAllPermissions(user, requiredPermissions, context);
    };

    const isAdmin = (): boolean => {
        return permissionService.isAdmin(user);
    };

    const hasShopAccess = (shopId: string, permission: Permission | string): boolean => {
        return permissionService.hasShopAccess(user, shopId, permission);
    };

    const getAccessibleShopIds = (): string[] => {
        return permissionService.getAccessibleShopIds(user);
    };

    // Check if user can create invoices
    const canCreateInvoices = (): boolean => {
        if (!user) return false;
        // A user can create an invoice if they have general sales management permission
        // or the specific permission to create invoices for their own shop.
        return hasPermission(PERMISSIONS.SALES_MANAGE) || hasPermission(PERMISSIONS.INVOICE_CREATE);
    };

    // Check if user can edit/delete invoices
    const canManageInvoices = (): boolean => {
        if (!user) return false;
        
        // Shop staff role cannot edit/delete invoices, this is a business rule.
        if (user.roleName === 'Shop Staff') {
            return false;
        }
        
        // For other roles, check for the required permissions
        return hasAnyPermission([
            'invoice:manage',
            PERMISSIONS.SALES_EDIT, 
            PERMISSIONS.SALES_DELETE
        ]);
    };

    const canDeleteInvoices = (): boolean => {
        if (!user) return false;
        
        // Shop staff role cannot edit/delete invoices
        if (user.roleName === 'Shop Staff') {
            return false;
        }
        
        return hasAnyPermission(['invoice:manage', PERMISSIONS.SALES_DELETE]);
    };

    const canManageUsers = (): boolean => {
        return hasAnyPermission([
            PERMISSIONS.USERS_CREATE,
            PERMISSIONS.USERS_EDIT,
            PERMISSIONS.USERS_DELETE
        ]);
    };

    const canManageInventory = (): boolean => {
        return hasAnyPermission([
            PERMISSIONS.INVENTORY_CREATE,
            PERMISSIONS.INVENTORY_EDIT,
            PERMISSIONS.INVENTORY_DELETE,
            PERMISSIONS.INVENTORY_MANAGE
        ]);
    };

    const canViewReports = (): boolean => {
        return hasPermission(PERMISSIONS.REPORTS_VIEW);
    };

    const canViewDashboard = (): boolean => {
        if (!user) return false;

        // Shop staff are not allowed to see the main dashboard
        if (user.roleName === 'Shop Staff') {
            return false;
        }

        // For other roles, check for the required permission
        return hasPermission(PERMISSIONS.DASHBOARD_VIEW);
    };

    const canAccessRoute = (route: string): boolean => {
        const requiredPermission = routePermissions[route];
        if (!requiredPermission) {
            return true; // No specific permission required
        }
        return hasPermission(requiredPermission);
    };

    // Check if user can view quotations
    const canViewQuotations = (): boolean => {
        if (!user) return false;
        // Allow viewing if user has general sales view, specific quotation view permission, or is a Shop Staff
        return hasPermission(PERMISSIONS.SALES_VIEW) || hasPermission(PERMISSIONS.QUOTATION_VIEW) || user.roleName === 'Shop Staff';
    };

    // Check if user can create quotations
    const canCreateQuotations = (): boolean => {
        if (!user) return false;
        // Allow creation if user has manage or create permission
        return hasPermission(PERMISSIONS.QUOTATION_MANAGE) || hasPermission(PERMISSIONS.QUOTATION_CREATE);
    };

    // Check if user can edit/delete quotations
    const canEditQuotations = (): boolean => {
        if (!user) return false;
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
        // Core permission functions
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAdmin,
        hasShopAccess,
        getAccessibleShopIds,
        
        // Specific business logic functions
        canCreateInvoices,
        canManageInvoices,
        canDeleteInvoices,
        canManageUsers,
        canManageInventory,
        canViewReports,
        canViewDashboard,
        canAccessRoute,
        checkRoutePermission,
        canViewQuotations,
        canCreateQuotations,
        canEditQuotations,
        canViewCosts,
        canRecordPaymentToAccount,
        getAllowedAccountIds,
        
        // Legacy support
        routePermissions,
    };
}