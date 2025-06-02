'use client';

import { useEffect, useState, useCallback } from 'react';
import { Package, Truck, CreditCard, AlertTriangle, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardUpdates } from '@/hooks/useWebSocket';

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
}

export default function DashboardMetrics({ summaryData: initialSummaryData }: DashboardMetricsProps) {
    // State to track the current summary data
    const [summaryData, setSummaryData] = useState<SummaryItem[] | null>(initialSummaryData);

    // Memoized callback for WebSocket updates
    const handleDashboardUpdate = useCallback((data: any) => {
        if (data && data.summaryData) {
            console.log('Received dashboard metrics update (memoized):', data.summaryData);
            setSummaryData(data.summaryData);
        }
    }, []); // Empty dependency array as setSummaryData is stable and data is from the event

    // Subscribe to dashboard updates via WebSocket
    useDashboardUpdates(handleDashboardUpdate);

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayData.map((item, index) => {
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
                                <div className="flex items-center mt-2">
                                    {item.trendUp ? (
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                    )}
                                    <span
                                        className={`text-sm ml-1 ${item.trendUp ? 'text-green-500' : 'text-red-500'
                                            }`}
                                    >
                                        {item.trend}
                                    </span>
                                </div>
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