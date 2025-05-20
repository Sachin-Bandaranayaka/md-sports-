'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PermissionGuard from '@/components/auth/PermissionGuard';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PermissionGuard>
            <MainLayout>{children}</MainLayout>
        </PermissionGuard>
    );
} 