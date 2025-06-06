'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';

interface PermissionGuardProps {
    children: ReactNode;
}

export default function PermissionGuard({ children }: PermissionGuardProps) {
    const { user, isLoading } = useAuth();
    const { checkRoutePermission } = usePermission();
    const router = useRouter();

    useEffect(() => {
        // If authentication is still loading, do nothing
        if (isLoading) return;

        // Redirect to login if user is not authenticated
        if (!user) {
            router.push('/login');
            return;
        }

        // Check permission for current route
        const hasAccess = checkRoutePermission();
        if (!hasAccess) {
            console.warn('Access denied: Insufficient permissions');
            router.push('/dashboard');
        }
    }, [user, isLoading, router, checkRoutePermission]);

    // Show nothing while checking authentication or permissions
    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Render children if user has necessary permissions
    return <>{children}</>;
}