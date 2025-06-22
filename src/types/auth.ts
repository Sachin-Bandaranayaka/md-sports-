/**
 * Authentication and Authorization Types
 */

export interface User {
    id: string;
    name: string;
    email: string;
    roleId: string | null;
    roleName: string | null;
    shopId?: string | null;
    permissions: string[];
    allowedAccounts?: string[];
}

// Alias for backward compatibility
export type AuthenticatedUser = User;

export interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    getUserPermissions: () => string[];
}

export interface PermissionContext {
    shopId?: string;
    userId?: string;
    resourceId?: string;
    action?: string;
}