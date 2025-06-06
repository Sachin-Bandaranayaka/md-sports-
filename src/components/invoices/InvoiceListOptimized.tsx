import React, { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Eye, Edit, Trash2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Invoice {
    id: string | number;
    invoiceNumber: string;
    customerId: number;
    customerName?: string;
    total: number;
    totalProfit?: number;
    profitMargin?: number;
    status: string;
    paymentMethod: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    date?: string;
    dueDate?: string;
    itemCount?: number;
}

interface InvoiceListOptimizedProps {
    invoices: Invoice[];
    selectedInvoices: Set<string>;
    onToggleSelection: (invoiceId: string) => void;
    onSelectAll: (invoiceIds: string[]) => void;
    onClearSelection: () => void;
    onView: (invoice: Invoice) => void;
    onEdit: (invoice: Invoice) => void;
    onDelete: (invoiceId: string | number) => void;
    onRecordPayment: (invoiceId: string | number) => void;
    isLoading?: boolean;
    height?: number;
}

// Memoized status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
    const variant = useMemo(() => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'overdue':
                return 'destructive';
            case 'cancelled':
                return 'outline';
            default:
                return 'secondary';
        }
    }, [status]);

    return (
        <Badge variant={variant} className="text-xs">
            {status}
        </Badge>
    );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized payment method badge
const PaymentMethodBadge = memo(({ method }: { method: string }) => {
    const config = useMemo(() => {
        switch (method.toLowerCase()) {
            case 'cash':
                return { variant: 'default' as const, className: 'bg-green-100 text-green-800' };
            case 'credit':
                return { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' };
            case 'bank_transfer':
                return { variant: 'outline' as const, className: 'bg-purple-100 text-purple-800' };
            default:
                return { variant: 'secondary' as const, className: '' };
        }
    }, [method]);

    return (
        <Badge variant={config.variant} className={cn('text-xs', config.className)}>
            {method.replace('_', ' ').toUpperCase()}
        </Badge>
    );
});

PaymentMethodBadge.displayName = 'PaymentMethodBadge';

// Memoized due status indicator
const DueStatusIndicator = memo(({ dueDate, status }: { dueDate?: string; status: string }) => {
    const dueStatus = useMemo(() => {
        if (status.toLowerCase() === 'paid') return null;
        if (!dueDate) return null;

        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `${Math.abs(diffDays)} days overdue`, className: 'text-red-600 font-medium' };
        } else if (diffDays <= 3) {
            return { text: `Due in ${diffDays} days`, className: 'text-orange-600 font-medium' };
        }
        return null;
    }, [dueDate, status]);

    if (!dueStatus) return null;

    return (
        <span className={cn('text-xs', dueStatus.className)}>
            {dueStatus.text}
        </span>
    );
});

DueStatusIndicator.displayName = 'DueStatusIndicator';

// Memoized action buttons
const ActionButtons = memo(({
    invoice,
    onView,
    onEdit,
    onDelete,
    onRecordPayment
}: {
    invoice: Invoice;
    onView: (invoice: Invoice) => void;
    onEdit: (invoice: Invoice) => void;
    onDelete: (invoiceId: string | number) => void;
    onRecordPayment: (invoiceId: string | number) => void;
}) => {
    const handleView = useCallback(() => onView(invoice), [invoice, onView]);
    const handleEdit = useCallback(() => onEdit(invoice), [invoice, onEdit]);
    const handleDelete = useCallback(() => onDelete(invoice.id), [invoice.id, onDelete]);
    const handleRecordPayment = useCallback(() => onRecordPayment(invoice.id), [invoice.id, onRecordPayment]);

    const canRecordPayment = useMemo(() =>
        invoice.status.toLowerCase() !== 'paid' && invoice.paymentMethod.toLowerCase() === 'credit',
        [invoice.status, invoice.paymentMethod]
    );

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="h-8 w-8 p-0"
            >
                <Eye className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
            >
                <Edit className="h-4 w-4" />
            </Button>
            {canRecordPayment && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRecordPayment}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                >
                    <CreditCard className="h-4 w-4" />
                </Button>
            )}
            <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
});

ActionButtons.displayName = 'ActionButtons';

// Memoized invoice row component
const InvoiceRow = memo(({
    index,
    style,
    data
}: {
    index: number;
    style: React.CSSProperties;
    data: {
        invoices: Invoice[];
        selectedInvoices: Set<string>;
        onToggleSelection: (invoiceId: string) => void;
        onView: (invoice: Invoice) => void;
        onEdit: (invoice: Invoice) => void;
        onDelete: (invoiceId: string | number) => void;
        onRecordPayment: (invoiceId: string | number) => void;
    };
}) => {
    const {
        invoices,
        selectedInvoices,
        onToggleSelection,
        onView,
        onEdit,
        onDelete,
        onRecordPayment
    } = data;

    const invoice = invoices[index];

    if (!invoice) {
        return (
            <div style={style} className="flex items-center px-4 py-2 border-b">
                <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
            </div>
        );
    }

    const handleToggleSelection = useCallback(() => {
        onToggleSelection(String(invoice.id));
    }, [invoice.id, onToggleSelection]);

    const isSelected = selectedInvoices.has(String(invoice.id));

    return (
        <div
            style={style}
            className={cn(
                "flex items-center px-4 py-2 border-b hover:bg-gray-50 transition-colors",
                isSelected && "bg-blue-50"
            )}
        >
            {/* Selection checkbox */}
            <div className="w-12 flex-shrink-0">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={handleToggleSelection}
                />
            </div>

            {/* Invoice Number */}
            <div className="w-32 flex-shrink-0">
                <span className="font-medium text-sm">{invoice.invoiceNumber}</span>
            </div>

            {/* Customer */}
            <div className="w-48 flex-shrink-0">
                <span className="text-sm">{invoice.customerName || `Customer ${invoice.customerId}`}</span>
            </div>

            {/* Date */}
            <div className="w-28 flex-shrink-0">
                <span className="text-sm text-gray-600">
                    {formatDate(invoice.date || invoice.createdAt)}
                </span>
            </div>

            {/* Due Status */}
            <div className="w-32 flex-shrink-0">
                <DueStatusIndicator dueDate={invoice.dueDate} status={invoice.status} />
            </div>

            {/* Total */}
            <div className="w-28 flex-shrink-0 text-right">
                <span className="font-medium text-sm">
                    {formatCurrency(invoice.total)}
                </span>
            </div>

            {/* Profit */}
            <div className="w-28 flex-shrink-0 text-right">
                <span className="text-sm text-green-600">
                    {invoice.totalProfit ? formatCurrency(invoice.totalProfit) : '-'}
                </span>
                {invoice.profitMargin && (
                    <div className="text-xs text-gray-500">
                        ({invoice.profitMargin.toFixed(1)}%)
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="w-16 flex-shrink-0 text-center">
                <span className="text-sm">{invoice.itemCount || 0}</span>
            </div>

            {/* Status */}
            <div className="w-24 flex-shrink-0">
                <StatusBadge status={invoice.status} />
            </div>

            {/* Payment Method */}
            <div className="w-32 flex-shrink-0">
                <PaymentMethodBadge method={invoice.paymentMethod} />
            </div>

            {/* Actions */}
            <div className="w-32 flex-shrink-0">
                <ActionButtons
                    invoice={invoice}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRecordPayment={onRecordPayment}
                />
            </div>
        </div>
    );
});

InvoiceRow.displayName = 'InvoiceRow';

// Header component
const InvoiceListHeader = memo(({
    invoices,
    selectedInvoices,
    onSelectAll,
    onClearSelection
}: {
    invoices: Invoice[];
    selectedInvoices: Set<string>;
    onSelectAll: (invoiceIds: string[]) => void;
    onClearSelection: () => void;
}) => {
    const allSelected = useMemo(() =>
        invoices.length > 0 && invoices.every(invoice => selectedInvoices.has(String(invoice.id))),
        [invoices, selectedInvoices]
    );

    const someSelected = useMemo(() =>
        selectedInvoices.size > 0 && !allSelected,
        [selectedInvoices.size, allSelected]
    );

    const handleSelectAll = useCallback(() => {
        if (allSelected) {
            onClearSelection();
        } else {
            onSelectAll(invoices.map(invoice => String(invoice.id)));
        }
    }, [allSelected, invoices, onSelectAll, onClearSelection]);

    return (
        <div className="flex items-center px-4 py-3 bg-gray-50 border-b font-medium text-sm text-gray-700">
            {/* Selection checkbox */}
            <div className="w-12 flex-shrink-0">
                <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                    }}
                    onCheckedChange={handleSelectAll}
                />
            </div>

            {/* Headers */}
            <div className="w-32 flex-shrink-0">Invoice #</div>
            <div className="w-48 flex-shrink-0">Customer</div>
            <div className="w-28 flex-shrink-0">Date</div>
            <div className="w-32 flex-shrink-0">Due Status</div>
            <div className="w-28 flex-shrink-0 text-right">Total</div>
            <div className="w-28 flex-shrink-0 text-right">Profit</div>
            <div className="w-16 flex-shrink-0 text-center">Items</div>
            <div className="w-24 flex-shrink-0">Status</div>
            <div className="w-32 flex-shrink-0">Payment</div>
            <div className="w-32 flex-shrink-0">Actions</div>
        </div>
    );
});

InvoiceListHeader.displayName = 'InvoiceListHeader';

// Main component
export const InvoiceListOptimized = memo<InvoiceListOptimizedProps>(({
    invoices,
    selectedInvoices,
    onToggleSelection,
    onSelectAll,
    onClearSelection,
    onView,
    onEdit,
    onDelete,
    onRecordPayment,
    isLoading = false,
    height = 600
}) => {
    const itemData = useMemo(() => ({
        invoices,
        selectedInvoices,
        onToggleSelection,
        onView,
        onEdit,
        onDelete,
        onRecordPayment
    }), [invoices, selectedInvoices, onToggleSelection, onView, onEdit, onDelete, onRecordPayment]);

    if (isLoading) {
        return (
            <div className="border rounded-lg">
                <InvoiceListHeader
                    invoices={[]}
                    selectedInvoices={new Set()}
                    onSelectAll={() => { }}
                    onClearSelection={() => { }}
                />
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading invoices...</p>
                </div>
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="border rounded-lg">
                <InvoiceListHeader
                    invoices={[]}
                    selectedInvoices={new Set()}
                    onSelectAll={() => { }}
                    onClearSelection={() => { }}
                />
                <div className="p-8 text-center text-gray-500">
                    <p>No invoices found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <InvoiceListHeader
                invoices={invoices}
                selectedInvoices={selectedInvoices}
                onSelectAll={onSelectAll}
                onClearSelection={onClearSelection}
            />
            <List
                height={height}
                itemCount={invoices.length}
                itemSize={60}
                itemData={itemData}
                overscanCount={5}
            >
                {InvoiceRow}
            </List>
        </div>
    );
});

InvoiceListOptimized.displayName = 'InvoiceListOptimized';

export default InvoiceListOptimized;