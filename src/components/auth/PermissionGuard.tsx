'use client';

import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS, Permission } from '@/lib/constants/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PermissionGuardProps {
  /** Required permission(s) to access the content */
  permission: Permission | Permission[] | string | string[];
  /** Optional context for permission checking */
  context?: {
    shopId?: string;
    userId?: string;
    resourceId?: string;
  };
  /** Content to render when user has permission */
  children: React.ReactNode;
  /** Custom fallback component when permission is denied */
  fallback?: React.ReactNode;
  /** Whether to show a default unauthorized message */
  showUnauthorized?: boolean;
  /** Custom unauthorized message */
  unauthorizedMessage?: string;
  /** Whether to redirect on unauthorized access */
  redirectOnUnauthorized?: boolean;
  /** Redirect path for unauthorized access */
  redirectPath?: string;
  /** Require ALL permissions (AND logic) vs ANY permission (OR logic) */
  requireAll?: boolean;
}

/**
 * PermissionGuard component that conditionally renders content based on user permissions
 * 
 * @example
 * // Basic usage
 * <PermissionGuard permission={PERMISSIONS.SALES_VIEW}>
 *   <SalesComponent />
 * </PermissionGuard>
 * 
 * @example
 * // Multiple permissions (OR logic)
 * <PermissionGuard permission={[PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_EDIT]}>
 *   <SalesComponent />
 * </PermissionGuard>
 * 
 * @example
 * // Multiple permissions (AND logic)
 * <PermissionGuard 
 *   permission={[PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_EDIT]} 
 *   requireAll
 * >
 *   <SalesEditComponent />
 * </PermissionGuard>
 * 
 * @example
 * // With context
 * <PermissionGuard 
 *   permission={PERMISSIONS.SHOP_VIEW} 
 *   context={{ shopId: '123' }}
 * >
 *   <ShopComponent />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  context,
  children,
  fallback,
  showUnauthorized = true,
  unauthorizedMessage,
  redirectOnUnauthorized = false,
  redirectPath = '/unauthorized',
  requireAll = false,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();
  const router = useRouter();

  // Determine if user has required permission(s)
  const hasAccess = React.useMemo(() => {
    if (Array.isArray(permission)) {
      return requireAll
        ? hasAllPermissions(permission, context)
        : hasAnyPermission(permission, context);
    }
    return hasPermission(permission, context);
  }, [permission, context, hasPermission, hasAnyPermission, hasAllPermissions, requireAll]);

  // Handle redirect on unauthorized access
  React.useEffect(() => {
    if (!hasAccess && redirectOnUnauthorized) {
      router.push(redirectPath);
    }
  }, [hasAccess, redirectOnUnauthorized, redirectPath, router]);

  // Return children if user has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Return custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Return nothing if showUnauthorized is false and no fallback
  if (!showUnauthorized) {
    return null;
  }

  // Default unauthorized message
  const defaultMessage = unauthorizedMessage || 
    `You don't have permission to access this content. Required: ${Array.isArray(permission) ? permission.join(requireAll ? ' AND ' : ' OR ') : permission}`;

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        {defaultMessage}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Higher-order component version of PermissionGuard
 */
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[] | string | string[],
  options?: Omit<PermissionGuardProps, 'permission' | 'children'>
) {
  return function PermissionGuardedComponent(props: P) {
    return (
      <PermissionGuard permission={permission} {...options}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export function usePermissionGuard(
  permission: Permission | Permission[] | string | string[],
  context?: PermissionGuardProps['context'],
  requireAll = false
) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  const hasAccess = React.useMemo(() => {
    if (Array.isArray(permission)) {
      return requireAll
        ? hasAllPermissions(permission, context)
        : hasAnyPermission(permission, context);
    }
    return hasPermission(permission, context);
  }, [permission, context, hasPermission, hasAnyPermission, hasAllPermissions, requireAll]);

  return hasAccess;
}

/**
 * Component for rendering different content based on permission levels
 */
interface PermissionSwitchProps {
  /** Permission cases to check */
  cases: Array<{
    permission: Permission | Permission[] | string | string[];
    component: React.ReactNode;
    requireAll?: boolean;
    context?: PermissionGuardProps['context'];
  }>;
  /** Default component when no permissions match */
  defaultComponent?: React.ReactNode;
}

export function PermissionSwitch({ cases, defaultComponent }: PermissionSwitchProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  for (const { permission, component, requireAll = false, context } of cases) {
    const hasAccess = Array.isArray(permission)
      ? requireAll
        ? hasAllPermissions(permission, context)
        : hasAnyPermission(permission, context)
      : hasPermission(permission, context);

    if (hasAccess) {
      return <>{component}</>;
    }
  }

  return defaultComponent ? <>{defaultComponent}</> : null;
}

/**
 * Button component that's only enabled when user has permission
 */
interface PermissionButtonProps extends React.ComponentProps<typeof Button> {
  permission: Permission | Permission[] | string | string[];
  context?: PermissionGuardProps['context'];
  requireAll?: boolean;
  disabledTooltip?: string;
}

export function PermissionButton({
  permission,
  context,
  requireAll = false,
  disabledTooltip,
  children,
  disabled,
  ...props
}: PermissionButtonProps) {
  const hasAccess = usePermissionGuard(permission, context, requireAll);
  const isDisabled = disabled || !hasAccess;

  return (
    <Button
      {...props}
      disabled={isDisabled}
      title={!hasAccess ? disabledTooltip || 'Insufficient permissions' : props.title}
    >
      {children}
    </Button>
  );
}

export default PermissionGuard;