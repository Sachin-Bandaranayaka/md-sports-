'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const { checkRoutePermission } = usePermission();
    const router = useRouter();
    const pathname = usePathname();

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Check route permission
    const hasRouteAccess = checkRoutePermission();

    if (!hasRouteAccess) {
        return (
            <MainLayout>
                <div className="p-6">
                    <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                            You don't have permission to access this page. Current route: {pathname}
                        </AlertDescription>
                    </Alert>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>{children}</MainLayout>
    );
}