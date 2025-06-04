import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Search, Filter, X, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';

// Types
interface InvoiceFilters {
    status?: string;
    paymentMethod?: string;
    customerId?: string;
    search?: string;
    timePeriod?: string;
    sortBy?: string;
    shopId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

interface Customer {
    id: number;
    name: string;
    email?: string;
}

interface InvoiceFiltersOptimizedProps {
    filters: InvoiceFilters;
    onFiltersChange: (filters: Partial<InvoiceFilters>) => void;
    customers?: Customer[];
    selectedCount: number;
    onBulkDelete?: () => void;
    onExport?: () => void;
    isLoading?: boolean;
    className?: string;
}

// Memoized search input with debouncing
const SearchInput = memo(({
    value,
    onChange,
    placeholder = "Search invoices...",
    debounceMs = 300
}: {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
}) => {
    const [localValue, setLocalValue] = useState(value || '');

    // Debounced onChange
    const debouncedOnChange = useMemo(
        () => debounce((searchValue: string) => {
            onChange(searchValue);
        }, debounceMs),
        [onChange, debounceMs]
    );

    // Update local value when external value changes
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    // Handle input change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        debouncedOnChange(newValue);
    }, [debouncedOnChange]);

    // Clear search
    const handleClear = useCallback(() => {
        setLocalValue('');
        onChange('');
    }, [onChange]);

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
                type="text"
                placeholder={placeholder}
                value={localValue}
                onChange={handleChange}
                className="pl-10 pr-10"
            />
            {localValue && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
});

SearchInput.displayName = 'SearchInput';

// Memoized status filter
const StatusFilter = memo(({
    value,
    onChange
}: {
    value?: string;
    onChange: (value: string) => void;
}) => {
    const statusOptions = useMemo(() => [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'cancelled', label: 'Cancelled' }
    ], []);

    return (
        <Select value={value || 'all'} onValueChange={onChange}>
            <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
});

StatusFilter.displayName = 'StatusFilter';

// Memoized payment method filter
const PaymentMethodFilter = memo(({
    value,
    onChange
}: {
    value?: string;
    onChange: (value: string) => void;
}) => {
    const paymentOptions = useMemo(() => [
        { value: 'all', label: 'All Methods' },
        { value: 'cash', label: 'Cash' },
        { value: 'credit', label: 'Credit' },
        { value: 'bank_transfer', label: 'Bank Transfer' }
    ], []);

    return (
        <Select value={value || 'all'} onValueChange={onChange}>
            <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
                {paymentOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
});

PaymentMethodFilter.displayName = 'PaymentMethodFilter';

// Memoized customer filter
const CustomerFilter = memo(({
    value,
    onChange,
    customers = []
}: {
    value?: string;
    onChange: (value: string) => void;
    customers?: Customer[];
}) => {
    const customerOptions = useMemo(() => [
        { value: 'all', label: 'All Customers' },
        ...customers.map(customer => ({
            value: String(customer.id),
            label: customer.name
        }))
    ], [customers]);

    return (
        <Select value={value || 'all'} onValueChange={onChange}>
            <SelectTrigger className="w-48">
                <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
                {customerOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
});

CustomerFilter.displayName = 'CustomerFilter';

// Memoized sort filter
const SortFilter = memo(({
    value,
    onChange
}: {
    value?: string;
    onChange: (value: string) => void;
}) => {
    const sortOptions = useMemo(() => [
        { value: 'createdAt_desc', label: 'Newest First' },
        { value: 'createdAt_asc', label: 'Oldest First' },
        { value: 'total_desc', label: 'Highest Amount' },
        { value: 'total_asc', label: 'Lowest Amount' },
        { value: 'dueDate_asc', label: 'Due Date (Earliest)' },
        { value: 'customerName_asc', label: 'Customer A-Z' },
        { value: 'customerName_desc', label: 'Customer Z-A' }
    ], []);

    return (
        <Select value={value || 'createdAt_desc'} onValueChange={onChange}>
            <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
});

SortFilter.displayName = 'SortFilter';

// Memoized date range filter
const DateRangeFilter = memo(({
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange
}: {
    dateFrom?: Date;
    dateTo?: Date;
    onDateFromChange: (date?: Date) => void;
    onDateToChange: (date?: Date) => void;
}) => {
    const [isFromOpen, setIsFromOpen] = useState(false);
    const [isToOpen, setIsToOpen] = useState(false);

    const handleFromSelect = useCallback((date?: Date) => {
        onDateFromChange(date);
        setIsFromOpen(false);
    }, [onDateFromChange]);

    const handleToSelect = useCallback((date?: Date) => {
        onDateToChange(date);
        setIsToOpen(false);
    }, [onDateToChange]);

    const clearDateRange = useCallback(() => {
        onDateFromChange(undefined);
        onDateToChange(undefined);
    }, [onDateFromChange, onDateToChange]);

    return (
        <div className="flex items-center gap-2">
            <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-36 justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={handleFromSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <span className="text-gray-400">to</span>

            <Popover open={isToOpen} onOpenChange={setIsToOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-36 justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={handleToSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateRange}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
});

DateRangeFilter.displayName = 'DateRangeFilter';

// Active filters display
const ActiveFilters = memo(({
    filters,
    onClearFilter,
    customers = []
}: {
    filters: InvoiceFilters;
    onClearFilter: (key: keyof InvoiceFilters) => void;
    customers?: Customer[];
}) => {
    const activeFilters = useMemo(() => {
        const active: Array<{ key: keyof InvoiceFilters; label: string; value: string }> = [];

        if (filters.status && filters.status !== 'all') {
            active.push({ key: 'status', label: 'Status', value: filters.status });
        }
        if (filters.paymentMethod && filters.paymentMethod !== 'all') {
            active.push({ key: 'paymentMethod', label: 'Payment', value: filters.paymentMethod });
        }
        if (filters.customerId && filters.customerId !== 'all') {
            const customer = customers.find(c => String(c.id) === filters.customerId);
            active.push({
                key: 'customerId',
                label: 'Customer',
                value: customer?.name || `Customer ${filters.customerId}`
            });
        }
        if (filters.search) {
            active.push({ key: 'search', label: 'Search', value: filters.search });
        }
        if (filters.dateFrom) {
            active.push({
                key: 'dateFrom',
                label: 'From',
                value: format(filters.dateFrom, "MMM dd, yyyy")
            });
        }
        if (filters.dateTo) {
            active.push({
                key: 'dateTo',
                label: 'To',
                value: format(filters.dateTo, "MMM dd, yyyy")
            });
        }

        return active;
    }, [filters, customers]);

    if (activeFilters.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {activeFilters.map(filter => (
                <Badge
                    key={filter.key}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                >
                    <span className="text-xs">
                        {filter.label}: {filter.value}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onClearFilter(filter.key)}
                        className="h-3 w-3 p-0 hover:bg-transparent"
                    >
                        <X className="h-2 w-2" />
                    </Button>
                </Badge>
            ))}
        </div>
    );
});

ActiveFilters.displayName = 'ActiveFilters';

// Bulk actions component
const BulkActions = memo(({
    selectedCount,
    onBulkDelete,
    onExport
}: {
    selectedCount: number;
    onBulkDelete?: () => void;
    onExport?: () => void;
}) => {
    if (selectedCount === 0) return null;

    return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
                {selectedCount} invoice{selectedCount > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-1 ml-auto">
                {onExport && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        className="h-8"
                    >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                    </Button>
                )}
                {onBulkDelete && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onBulkDelete}
                        className="h-8 text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                    </Button>
                )}
            </div>
        </div>
    );
});

BulkActions.displayName = 'BulkActions';

// Main component
export const InvoiceFiltersOptimized = memo<InvoiceFiltersOptimizedProps>(({
    filters,
    onFiltersChange,
    customers = [],
    selectedCount,
    onBulkDelete,
    onExport,
    isLoading = false,
    className
}) => {
    // Filter change handlers
    const handleSearchChange = useCallback((search: string) => {
        onFiltersChange({ search: search || undefined });
    }, [onFiltersChange]);

    const handleStatusChange = useCallback((status: string) => {
        onFiltersChange({ status: status === 'all' ? undefined : status });
    }, [onFiltersChange]);

    const handlePaymentMethodChange = useCallback((paymentMethod: string) => {
        onFiltersChange({ paymentMethod: paymentMethod === 'all' ? undefined : paymentMethod });
    }, [onFiltersChange]);

    const handleCustomerChange = useCallback((customerId: string) => {
        onFiltersChange({ customerId: customerId === 'all' ? undefined : customerId });
    }, [onFiltersChange]);

    const handleSortChange = useCallback((sortBy: string) => {
        onFiltersChange({ sortBy });
    }, [onFiltersChange]);

    const handleDateFromChange = useCallback((dateFrom?: Date) => {
        onFiltersChange({ dateFrom });
    }, [onFiltersChange]);

    const handleDateToChange = useCallback((dateTo?: Date) => {
        onFiltersChange({ dateTo });
    }, [onFiltersChange]);

    const handleClearFilter = useCallback((key: keyof InvoiceFilters) => {
        onFiltersChange({ [key]: undefined });
    }, [onFiltersChange]);

    const clearAllFilters = useCallback(() => {
        onFiltersChange({
            status: undefined,
            paymentMethod: undefined,
            customerId: undefined,
            search: undefined,
            dateFrom: undefined,
            dateTo: undefined
        });
    }, [onFiltersChange]);

    const hasActiveFilters = useMemo(() => {
        return !!(filters.status && filters.status !== 'all') ||
            !!(filters.paymentMethod && filters.paymentMethod !== 'all') ||
            !!(filters.customerId && filters.customerId !== 'all') ||
            !!filters.search ||
            !!filters.dateFrom ||
            !!filters.dateTo;
    }, [filters]);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Bulk Actions */}
            <BulkActions
                selectedCount={selectedCount}
                onBulkDelete={onBulkDelete}
                onExport={onExport}
            />

            {/* Main Filters */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="flex-1 min-w-64">
                    <SearchInput
                        value={filters.search}
                        onChange={handleSearchChange}
                        placeholder="Search by invoice #, customer, or amount..."
                    />
                </div>

                {/* Status Filter */}
                <StatusFilter
                    value={filters.status}
                    onChange={handleStatusChange}
                />

                {/* Payment Method Filter */}
                <PaymentMethodFilter
                    value={filters.paymentMethod}
                    onChange={handlePaymentMethodChange}
                />

                {/* Customer Filter */}
                <CustomerFilter
                    value={filters.customerId}
                    onChange={handleCustomerChange}
                    customers={customers}
                />

                {/* Sort Filter */}
                <SortFilter
                    value={filters.sortBy}
                    onChange={handleSortChange}
                />

                {/* Advanced Filters Toggle */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            More Filters
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="end">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Date Range
                                </label>
                                <DateRangeFilter
                                    dateFrom={filters.dateFrom}
                                    dateTo={filters.dateTo}
                                    onDateFromChange={handleDateFromChange}
                                    onDateToChange={handleDateToChange}
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Clear All Filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* Active Filters */}
            <ActiveFilters
                filters={filters}
                onClearFilter={handleClearFilter}
                customers={customers}
            />
        </div>
    );
});

InvoiceFiltersOptimized.displayName = 'InvoiceFiltersOptimized';

export default InvoiceFiltersOptimized;