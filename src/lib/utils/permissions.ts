/**
 * Centralized permission checking utilities
 */

/**
 * Check if user has admin permissions or specific permission
 * @param permissions - Array of user permissions
 * @param requiredPermission - The specific permission required
 * @returns boolean indicating if user has permission
 */
export function hasPermission(permissions: string[], requiredPermission: string): boolean {
    return permissions.includes('*') || 
           permissions.includes('admin:all') || 
           permissions.includes(requiredPermission);
}

/**
 * Check if user has any of the specified permissions or admin permissions
 * @param permissions - Array of user permissions
 * @param requiredPermissions - Array of permissions, user needs at least one
 * @returns boolean indicating if user has any of the required permissions
 */
export function hasAnyPermission(permissions: string[], requiredPermissions: string[]): boolean {
    return permissions.includes('*') || 
           permissions.includes('admin:all') || 
           requiredPermissions.some(permission => permissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions or admin permissions
 * @param permissions - Array of user permissions
 * @param requiredPermissions - Array of permissions, user needs all of them
 * @returns boolean indicating if user has all required permissions
 */
export function hasAllPermissions(permissions: string[], requiredPermissions: string[]): boolean {
    return permissions.includes('*') || 
           permissions.includes('admin:all') || 
           requiredPermissions.every(permission => permissions.includes(permission));
}

/**
 * Check if user is an admin (has admin:all, *, or specific admin permissions)
 * @param permissions - Array of user permissions
 * @returns boolean indicating if user is an admin
 */
export function isAdmin(permissions: string[]): boolean {
    return permissions.includes('*') || 
           permissions.includes('admin:all') || 
           permissions.includes('shop:manage') || 
           permissions.includes('user:manage');
}