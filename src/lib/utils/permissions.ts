/**
 * Permission utility functions
 * 
 * @deprecated Use PermissionService instead for better performance and consistency
 */

import { PERMISSIONS, Permission, isValidPermission } from '@/lib/constants/permissions';
import { permissionService } from '@/lib/services/PermissionService';
import { AuthenticatedUser } from '@/types/auth';

/**
 * @deprecated Use permissionService.hasPermission() instead
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // Add defensive type checking
  if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0) {
    console.error('hasPermission: userPermissions is not a valid array:', {
      type: typeof userPermissions,
      value: userPermissions,
      requiredPermission,
      stack: new Error().stack
    });
    return false;
  }

  // Check if requiredPermission is defined
  if (!requiredPermission) {
    return false;
  }

  // Validate permission format
  if (!isValidPermission(requiredPermission)) {
    console.warn(`Invalid permission format: ${requiredPermission}`);
    return false;
  }

  // Check for wildcard permissions
  if (userPermissions.includes(PERMISSIONS.WILDCARD) || 
      userPermissions.includes(PERMISSIONS.ADMIN_ALL) || 
      userPermissions.includes(PERMISSIONS.LEGACY_ALL)) {
    return true;
  }

  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for module-level permissions (e.g., 'sales:manage' includes 'sales:view')
  if (requiredPermission && requiredPermission.includes(':')) {
    const [module, action] = requiredPermission.split(':');
    if (action && userPermissions.includes(`${module}:manage`)) {
      return true;
    }
  }

  return false;
}

/**
 * @deprecated Use permissionService.hasAnyPermission() instead
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

/**
 * @deprecated Use permissionService.hasAllPermissions() instead
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

/**
 * @deprecated Use permissionService.isAdmin() instead
 */
export function isAdmin(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, [PERMISSIONS.WILDCARD, PERMISSIONS.ADMIN_ALL, PERMISSIONS.LEGACY_ALL]);
}

// New utility functions using PermissionService

/**
 * Check if user has permission using the new PermissionService
 */
export function checkUserPermission(
  user: AuthenticatedUser | null,
  permission: Permission | string,
  context?: { shopId?: string; userId?: string; resourceId?: string }
): boolean {
  return permissionService.hasPermission(user, permission, context);
}

/**
 * Check if user has shop access
 */
export function checkShopAccess(
  user: AuthenticatedUser | null,
  shopId: string,
  permission: Permission | string
): boolean {
  return permissionService.hasShopAccess(user, shopId, permission);
}

/**
 * Check if user is admin
 */
export function checkIsAdmin(user: AuthenticatedUser | null): boolean {
  return permissionService.isAdmin(user);
}