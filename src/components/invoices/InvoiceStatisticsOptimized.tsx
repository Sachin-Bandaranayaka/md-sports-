import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    AlertTriangle,
    Calendar,
    Target,
    BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Types
interface InvoiceStatistics {
    totalOutstanding: number;
    paidThisMonth: number;
    overdueCount: number;
    totalCreditSales: number;
    totalNonCreditSales: number;
    totalInvoices?: number;
    averageInvoiceValue?: number;
    paymentRate?: number;
    monthlyGrowth?: number;
    profitMargin?: number;
    topCustomers?: Array<{
        id: number;
        name: string;
        totalSpent: number;
        invoiceCount: number;
    }>;
}

interface InvoiceStatisticsOptimizedProps {
    statistics?: InvoiceStatistics;
    isLoading?: boolean;
    className?: string;
    showDetailed?: boolean;
}

// Memoized stat card component
const StatCard = memo(({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    description,
    variant = 'default',
    isLoading = false
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    description?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    isLoading?: boolean;
}) => {
    const cardStyles = useMemo(() => {
        switch (variant) {
            case 'success':
                return 'border-green-200 bg-green-50';
            case 'warning':
                return 'border-orange-200 bg-orange-50';
            case 'danger':
                return 'border-red-200 bg-red-50';
            default:
                return 'border-gray-200';
        }
    }, [variant]);

    const iconStyles = useMemo(() => {
        switch (variant) {
            case 'success':
                return 'text-green-600';
            case 'warning':
                return 'text-orange-600';
            case 'danger':
                return 'text-red-600';
            default:
                return 'text-blue-600';
        }
    }, [variant]);

    const trendIcon = useMemo(() => {
        if (!trend || trend === 'neutral') return null;
        return trend === 'up' ? TrendingUp : TrendingDown;
    }, [trend]);

    const trendStyles = useMemo(() => {
        if (!trend || trend === 'neutral') return '';
        return trend === 'up' ? 'text-green-600' : 'text-red-600';
    }, [trend]);

    if (isLoading) {
        return (
            <Card className={cardStyles}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        {title}
                    </CardTitle>
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-4"></div>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse bg-gray-200 rounded h-8 w-24 mb-2"></div>
                    {description && (
                        <div className="animate-pulse bg-gray-200 rounded h-4 w-32"></div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cardStyles}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <Icon className={cn('h-4 w-4', iconStyles)} />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{value}</div>
                    {trendValue && trendIcon && (
                        <div className={cn('flex items-center text-sm', trendStyles)}>
                            {React.createElement(trendIcon, { className: 'h-3 w-3 mr-1' })}
                            {trendValue}
                        </div>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-gray-600 mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
});

StatCard.displayName = 'StatCard';

// Memoized progress card component
const ProgressCard = memo(({
    title,
    current,
    target,
    unit = '',
    icon: Icon,
    variant = 'default',
    isLoading = false
}: {
    title: string;
    current: number;
    target: number;
    unit?: string;
    icon: React.ElementType;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    isLoading?: boolean;
}) => {
    const percentage = useMemo(() => {
        if (target === 0) return 0;
        return Math.min((current / target) * 100, 100);
    }, [current, target]);

    const progressVariant = useMemo(() => {
        if (percentage >= 90) return 'success';
        if (percentage >= 70) return 'warning';
        return 'danger';
    }, [percentage]);

    const cardStyles = useMemo(() => {
        switch (variant) {
            case 'success':
                return 'border-green-200';
            case 'warning':
                return 'border-orange-200';
            case 'danger':
                return 'border-red-200';
            default:
                return 'border-gray-200';
        }
    }, [variant]);

    if (isLoading) {
        return (
            <Card className={cardStyles}>
                <CardHeader className="pb-2">
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-32"></div>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse bg-gray-200 rounded h-2 w-full mb-2"></div>
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-24"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cardStyles}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">
                            {current.toLocaleString()}{unit}
                        </span>
                        <span className="text-gray-600">
                            of {target.toLocaleString()}{unit}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500">
                        {percentage.toFixed(1)}% of target
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

ProgressCard.displayName = 'ProgressCard';

// Memoized top customers component
const TopCustomers = memo(({
    customers = [],
    isLoading = false
}: {
    customers?: Array<{
        id: number;
        name: string;
        totalSpent: number;
        invoiceCount: number;
    }>;
    isLoading?: boolean;
}) => {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="animate-pulse bg-gray-200 rounded h-4 w-24"></div>
                                <div className="animate-pulse bg-gray-200 rounded h-4 w-16"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (customers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">No customer data available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {customers.slice(0, 5).map((customer, index) => (
                        <div key={customer.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                                    {index + 1}
                                </Badge>
                                <span className="text-sm font-medium">{customer.name}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium">
                                    {formatCurrency(customer.totalSpent)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {customer.invoiceCount} invoice{customer.invoiceCount !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
});

TopCustomers.displayName = 'TopCustomers';

// Main component
export const InvoiceStatisticsOptimized = memo<InvoiceStatisticsOptimizedProps>(({
    statistics,
    isLoading = false,
    className,
    showDetailed = false
}) => {
    // Memoized computed values
    const computedStats = useMemo(() => {
        if (!statistics) return null;

        const totalSales = statistics.totalCreditSales + statistics.totalNonCreditSales;
        const collectionRate = totalSales > 0 ? (statistics.paidThisMonth / totalSales) * 100 : 0;
        const creditRatio = totalSales > 0 ? (statistics.totalCreditSales / totalSales) * 100 : 0;

        return {
            totalSales,
            collectionRate,
            creditRatio,
            outstandingRatio: totalSales > 0 ? (statistics.totalOutstanding / totalSales) * 100 : 0
        };
    }, [statistics]);

    // Memoized main stats
    const mainStats = useMemo(() => {
        if (!statistics || !computedStats) return [];

        return [
            {
                title: 'Total Outstanding',
                value: formatCurrency(statistics.totalOutstanding),
                icon: AlertTriangle,
                variant: statistics.totalOutstanding > 0 ? 'warning' : 'success',
                description: `${computedStats.outstandingRatio.toFixed(1)}% of total sales`
            },
            {
                title: 'Paid This Month',
                value: formatCurrency(statistics.paidThisMonth),
                icon: DollarSign,
                variant: 'success',
                trend: statistics.monthlyGrowth ? (statistics.monthlyGrowth > 0 ? 'up' : 'down') : undefined,
                trendValue: statistics.monthlyGrowth ? `${Math.abs(statistics.monthlyGrowth).toFixed(1)}%` : undefined
            },
            {
                title: 'Overdue Invoices',
                value: statistics.overdueCount,
                icon: Calendar,
                variant: statistics.overdueCount > 0 ? 'danger' : 'success',
                description: statistics.overdueCount > 0 ? 'Requires attention' : 'All up to date'
            },
            {
                title: 'Credit Sales',
                value: formatCurrency(statistics.totalCreditSales),
                icon: CreditCard,
                variant: 'default',
                description: `${computedStats.creditRatio.toFixed(1)}% of total sales`
            }
        ] as const;
    }, [statistics, computedStats]);

    // Memoized detailed stats
    const detailedStats = useMemo(() => {
        if (!statistics || !computedStats) return [];

        return [
            {
                title: 'Cash Sales',
                value: formatCurrency(statistics.totalNonCreditSales),
                icon: DollarSign,
                variant: 'success',
                description: `${(100 - computedStats.creditRatio).toFixed(1)}% of total sales`
            },
            {
                title: 'Average Invoice',
                value: statistics.averageInvoiceValue ? formatCurrency(statistics.averageInvoiceValue) : '-',
                icon: BarChart3,
                variant: 'default'
            },
            {
                title: 'Payment Rate',
                value: `${computedStats.collectionRate.toFixed(1)}%`,
                icon: Target,
                variant: computedStats.collectionRate >= 80 ? 'success' : computedStats.collectionRate >= 60 ? 'warning' : 'danger'
            },
            {
                title: 'Profit Margin',
                value: statistics.profitMargin ? `${statistics.profitMargin.toFixed(1)}%` : '-',
                icon: TrendingUp,
                variant: statistics.profitMargin && statistics.profitMargin >= 20 ? 'success' : 'warning'
            }
        ] as const;
    }, [statistics, computedStats]);

    return (
        <div className={cn('space-y-6', className)}>
            {/* Main Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mainStats.map((stat, index) => (
                    <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        variant={stat.variant}
                        trend={stat.trend}
                        trendValue={stat.trendValue}
                        description={stat.description}
                        isLoading={isLoading}
                    />
                ))}
            </div>

            {/* Detailed Statistics */}
            {showDetailed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {detailedStats.map((stat, index) => (
                        <StatCard
                            key={index}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            variant={stat.variant}
                            description={stat.description}
                            isLoading={isLoading}
                        />
                    ))}
                </div>
            )}

            {/* Progress Cards and Top Customers */}
            {showDetailed && statistics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Collection Progress */}
                    <ProgressCard
                        title="Collection Progress"
                        current={statistics.paidThisMonth}
                        target={statistics.paidThisMonth + statistics.totalOutstanding}
                        unit=""
                        icon={Target}
                        isLoading={isLoading}
                    />

                    {/* Monthly Target (if available) */}
                    {statistics.averageInvoiceValue && (
                        <ProgressCard
                            title="Monthly Target"
                            current={statistics.paidThisMonth}
                            target={statistics.averageInvoiceValue * 30} // Assuming 30 invoices target
                            unit=""
                            icon={Calendar}
                            isLoading={isLoading}
                        />
                    )}

                    {/* Top Customers */}
                    <TopCustomers
                        customers={statistics.topCustomers}
                        isLoading={isLoading}
                    />
                </div>
            )}
        </div>
    );
});

InvoiceStatisticsOptimized.displayName = 'InvoiceStatisticsOptimized';

export default InvoiceStatisticsOptimized;