/**
 * Centralized Permission Service
 * 
 * Provides a unified interface for permission checking with caching,
 * context-aware validation, and performance optimizations.
 */

import { PERMISSIONS, Permission, isValidPermission } from '@/lib/constants/permissions';
import { AuthenticatedUser } from '@/types/auth';

interface PermissionContext {
  shopId?: string;
  userId?: string;
  resourceId?: string;
  action?: string;
}

interface CacheEntry {
  result: boolean;
  timestamp: number;
  ttl: number;
}

class PermissionService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Check if user has a specific permission
   */
  hasPermission(
    user: AuthenticatedUser | null,
    permission: Permission | string,
    context?: PermissionContext
  ): boolean {
    if (!user || !user.permissions) {
      return false;
    }

    // Validate permission format
    if (!isValidPermission(permission)) {
      console.warn(`Invalid permission format: ${permission}`);
      return false;
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(user.id, permission, context);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Perform permission check
    const result = this.checkPermission(user, permission, context);
    
    // Cache the result
    this.setCache(cacheKey, result);
    
    return result;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(
    user: AuthenticatedUser | null,
    permissions: (Permission | string)[],
    context?: PermissionContext
  ): boolean {
    return permissions.some(permission => 
      this.hasPermission(user, permission, context)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(
    user: AuthenticatedUser | null,
    permissions: (Permission | string)[],
    context?: PermissionContext
  ): boolean {
    return permissions.every(permission => 
      this.hasPermission(user, permission, context)
    );
  }

  /**
   * Check if user is admin (has admin permissions)
   */
  isAdmin(user: AuthenticatedUser | null): boolean {
    if (!user) return false;
    
    return this.hasAnyPermission(user, [
      PERMISSIONS.ADMIN_ALL,
      PERMISSIONS.LEGACY_ALL,
      PERMISSIONS.WILDCARD
    ]);
  }

  /**
   * Check if user has shop-specific access
   */
  hasShopAccess(
    user: AuthenticatedUser | null,
    targetShopId: string,
    permission: Permission | string
  ): boolean {
    if (!user) return false;

    // Admin users have access to all shops
    if (this.isAdmin(user)) {
      return true;
    }

    // Check if user has shop:assigned_only restriction
    if (user.permissions.includes(PERMISSIONS.SHOP_ASSIGNED_ONLY)) {
      // User can only access their assigned shop
      if (user.shopId !== targetShopId) {
        return false;
      }
    }

    // Check the specific permission
    return this.hasPermission(user, permission, { shopId: targetShopId });
  }

  /**
   * Get user's accessible shop IDs based on permissions
   */
  getAccessibleShopIds(user: AuthenticatedUser | null): string[] {
    if (!user) return [];

    // Admin users have access to all shops
    if (this.isAdmin(user)) {
      return ['*']; // Wildcard for all shops
    }

    // Check if user has shop:assigned_only restriction
    if (user.permissions.includes(PERMISSIONS.SHOP_ASSIGNED_ONLY)) {
      return user.shopId ? [user.shopId] : [];
    }

    // For other users, return their assigned shop or all if they have shop:manage
    if (this.hasPermission(user, PERMISSIONS.SHOP_MANAGE)) {
      return ['*']; // Can manage all shops
    }

    return user.shopId ? [user.shopId] : [];
  }

  /**
   * Clear permission cache for a user
   */
  clearUserCache(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(`${userId}:`));
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all permission cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  // Private methods

  private checkPermission(
    user: AuthenticatedUser,
    permission: Permission | string,
    context?: PermissionContext
  ): boolean {
    // Check if permission is defined
    if (!permission) {
      return false;
    }

    const userPermissions = user.permissions || [];

    // Check for wildcard permissions
    if (userPermissions.includes(PERMISSIONS.WILDCARD) ||
        userPermissions.includes(PERMISSIONS.LEGACY_ALL) ||
        userPermissions.includes(PERMISSIONS.ADMIN_ALL)) {
      return true;
    }

    // Check for exact permission match
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Check for module-level permissions (e.g., 'sales:manage' includes 'sales:view')
    if (permission && typeof permission === 'string' && permission.includes(':')) {
      const [module, action] = permission.split(':');
      if (action && userPermissions.includes(`${module}:manage`)) {
        return true;
      }
    }

    // Context-specific checks
    if (context) {
      return this.checkContextualPermission(user, permission, context);
    }

    return false;
  }

  private checkContextualPermission(
    user: AuthenticatedUser,
    permission: Permission | string,
    context: PermissionContext
  ): boolean {
    // Shop-specific permission checks
    if (context.shopId) {
      // Check if user has shop:assigned_only and is accessing their shop
      if (user.permissions.includes(PERMISSIONS.SHOP_ASSIGNED_ONLY)) {
        return user.shopId === context.shopId;
      }
    }

    // Add more contextual checks as needed
    return false;
  }

  private generateCacheKey(
    userId: string,
    permission: Permission | string,
    context?: PermissionContext
  ): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${userId}:${permission}:${contextStr}`;
  }

  private getFromCache(key: string): boolean | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry is expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  private setCache(key: string, result: boolean, ttl?: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
export default permissionService;