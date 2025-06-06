'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, CreditCard, AlertTriangle, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Types for our data
interface SummaryItem {
    title: string;
    value: string;
    icon: string;
    trend: string;
    trendUp: boolean;
    requiredPermission?: string;
}

// Dummy data for backup with permissions
const dummySummaryData: SummaryItem[] = [
    { title: 'Total Inventory Value', value: 'Rs. 1,245,800', icon: 'Package', trend: '+5%', trendUp: true, requiredPermission: 'inventory:view' },
    { title: 'Pending Transfers', value: '12', icon: 'Truck', trend: '+2', trendUp: true, requiredPermission: 'inventory:view' },
    { title: 'Outstanding Invoices', value: 'Rs. 320,450', icon: 'CreditCard', trend: '-8%', trendUp: false, requiredPermission: 'sales:view' },
    { title: 'Low Stock Items', value: '28', icon: 'AlertTriangle', trend: '+5', trendUp: false, requiredPermission: 'inventory:view' },
];

interface DashboardMetricsProps {
    summaryData: SummaryItem[] | null;
    isLoading?: boolean;
}

export default function DashboardMetrics({ summaryData, isLoading = false }: DashboardMetricsProps) {
    const { user } = useAuth();

    // Map icon names to components
    const iconMap: Record<string, React.ElementType> = {
        'Package': Package,
        'Truck': Truck,
        'CreditCard': CreditCard,
        'AlertTriangle': AlertTriangle,
        'Tag': Tag,
        'TrendingUp': TrendingUp
    };

    // Check if user has the required permission
    const hasPermission = (requiredPermission?: string): boolean => {
        if (!requiredPermission) return true; // No permission required
        if (!user?.permissions || !user.permissions.length) return false;
        return user.permissions.includes(requiredPermission);
    };

    // Use provided data or fallback to dummy data
    const displayData = summaryData || dummySummaryData;

    // Filter metrics based on user permissions
    const getAuthorizedMetrics = () => {
        return displayData.filter(item => hasPermission(item.requiredPermission));
    };

    const authorizedMetrics = getAuthorizedMetrics();

    // Simple loading state without animations
    if (isLoading && !summaryData) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-sm text-gray-400">Loading...</div>
                    </div>
                ))}
            </div>
        );
    }

    // Filter out "Total Retail Value" card and apply permission filtering
    const filteredDisplayData = authorizedMetrics.filter(item => item.title !== 'Total Retail Value');

    // Show message if no metrics are available
    if (filteredDisplayData.length === 0 && !isLoading) {
        return (
            <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                <p className="text-gray-500">No dashboard metrics available with your current permissions.</p>
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${filteredDisplayData.length >= 3 ? 'lg:grid-cols-4' : filteredDisplayData.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
            {filteredDisplayData.map((item, index) => {
                // Get the corresponding icon component
                const IconComponent = iconMap[item.icon] || Package;

                return (
                    <div
                        key={index}
                        className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{item.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{item.value}</h3>

                            </div>
                            <div className="bg-gray-100 p-3 rounded-full">
                                <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}