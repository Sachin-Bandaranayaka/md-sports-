'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, CreditCard, AlertTriangle, Tag, TrendingUp, TrendingDown } from 'lucide-react';

// Types for our data
interface SummaryItem {
    title: string;
    value: string;
    icon: string;
    trend: string;
    trendUp: boolean;
}

// Dummy data for backup
const dummySummaryData: SummaryItem[] = [
    { title: 'Total Inventory Value', value: 'Rs. 1,245,800', icon: 'Package', trend: '+5%', trendUp: true },
    { title: 'Pending Transfers', value: '12', icon: 'Truck', trend: '+2', trendUp: true },
    { title: 'Outstanding Invoices', value: 'Rs. 320,450', icon: 'CreditCard', trend: '-8%', trendUp: false },
    { title: 'Low Stock Items', value: '28', icon: 'AlertTriangle', trend: '+5', trendUp: false },
];

interface DashboardMetricsProps {
    summaryData: SummaryItem[] | null;
    isLoading?: boolean;
}

export default function DashboardMetrics({ summaryData, isLoading = false }: DashboardMetricsProps) {
    // Map icon names to components
    const iconMap: Record<string, React.ElementType> = {
        'Package': Package,
        'Truck': Truck,
        'CreditCard': CreditCard,
        'AlertTriangle': AlertTriangle,
        'Tag': Tag,
        'TrendingUp': TrendingUp
    };

    // Use provided data or fallback to dummy data
    const displayData = summaryData || dummySummaryData;

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

    // Filter out "Total Retail Value" card
    const filteredDisplayData = displayData.filter(item => item.title !== 'Total Retail Value');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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