'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowLeft, Check, X, AlertCircle, ArrowLeftRight, Package } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { authFetch } from '@/utils/api';

interface TransferItem {
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    quantity: number;
    notes: string | null;
    retail_price: string;
}

interface Transfer {
    id: number;
    source_shop_id: number;
    destination_shop_id: number;
    source_shop_name: string;
    destination_shop_name: string;
    initiated_by: string;
    status: string;
    created_at: string;
    completed_at: string | null;
    items: TransferItem[];
}

export default function TransferDetailPage({ params }: { params: { id: string } }) {
    // Next.js requires us to unwrap params with React.use()
    const unwrappedParams = React.use(params);
    const transferId = unwrappedParams.id;

    const router = useRouter();
    const { user } = useAuth();
    const [transfer, setTransfer] = useState<Transfer | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTransferAnimation, setShowTransferAnimation] = useState(false);

    // Check if user has transfer permission
    const hasTransferPermission = user?.permissions.includes('inventory:transfer') || false;

    useEffect(() => {
        const fetchTransfer = async () => {
            try {
                console.log(`Fetching transfer details for ID: ${transferId}`);
                const response = await authFetch(`/api/inventory/transfers/${transferId}`);
                console.log(`Response status: ${response.status}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    console.error('Error response:', errorData);
                    throw new Error(errorData?.message || `Failed to load transfer details (${response.status})`);
                }

                const data = await response.json();
                console.log('Transfer data received:', data);

                if (data.success) {
                    setTransfer(data.data);
                } else {
                    throw new Error(data.message || 'Failed to load transfer');
                }
            } catch (err) {
                console.error('Error fetching transfer:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchTransfer();
    }, [transferId]);

    // Calculate totals
    const totalItems = transfer?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalValue = transfer?.items?.reduce(
        (sum, item) => sum + parseFloat(item.retail_price) * item.quantity,
        0
    ) || 0;

    // Handle complete transfer action
    const handleCompleteTransfer = async () => {
        if (window.confirm('Are you sure you want to complete this transfer? This will move the inventory between shops.')) {
            setActionLoading(true);
            setError(null);

            // Show animation first
            setShowTransferAnimation(true);

            // Delay the actual API call to show the animation
            setTimeout(async () => {
                try {
                    const response = await authFetch(`/api/inventory/transfers/${transferId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ action: 'complete' })
                    });

                    const data = await response.json();
                    if (data.success) {
                        // Keep animation visible for a moment after success
                        setTimeout(() => {
                            setShowTransferAnimation(false);
                            // Refresh transfer data
                            router.refresh();
                            // Reload page to get updated transfer
                            window.location.reload();
                        }, 1500);
                    } else {
                        setShowTransferAnimation(false);
                        throw new Error(data.message || 'Failed to complete transfer');
                    }
                } catch (err) {
                    setShowTransferAnimation(false);
                    console.error('Error completing transfer:', err);
                    setError(err instanceof Error ? err.message : 'An error occurred');
                    setActionLoading(false);
                }
            }, 1500); // Allow animation to play before API call
        }
    };

    // Handle cancel transfer action
    const handleCancelTransfer = async () => {
        if (window.confirm('Are you sure you want to cancel this transfer?')) {
            setActionLoading(true);
            setError(null);
            try {
                const response = await authFetch(`/api/inventory/transfers/${transferId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'cancel' })
                });

                const data = await response.json();
                if (data.success) {
                    // Refresh transfer data
                    router.refresh();
                    // Reload page to get updated transfer
                    window.location.reload();
                } else {
                    throw new Error(data.message || 'Failed to cancel transfer');
                }
            } catch (err) {
                console.error('Error canceling transfer:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setActionLoading(false);
            }
        }
    };

    // Handle delete transfer
    const handleDeleteTransfer = async () => {
        if (window.confirm('Are you sure you want to delete this transfer? This action cannot be undone.')) {
            setActionLoading(true);
            setError(null);
            try {
                const response = await authFetch(`/api/inventory/transfers/${transferId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();
                if (data.success) {
                    // Redirect to transfers list
                    router.push('/inventory/transfers');
                } else {
                    throw new Error(data.message || 'Failed to delete transfer');
                }
            } catch (err) {
                console.error('Error deleting transfer:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setActionLoading(false);
            }
        }
    };

    // Get status badge styling
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="h-full flex items-center justify-center p-20">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500">Loading transfer details...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!transfer) {
        return (
            <MainLayout>
                <div className="h-full flex items-center justify-center p-20">
                    <div className="text-center">
                        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                        <p className="text-red-500">Transfer not found</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => router.push('/inventory/transfers')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Transfers
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Transfer Animation Overlay */}
            {showTransferAnimation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-xl">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Transferring Inventory</h3>
                            <p className="text-gray-700">Moving {transfer?.items?.length || 0} products from {transfer?.source_shop_name} to {transfer?.destination_shop_name}</p>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gray-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                                        <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
                                    </svg>
                                </div>
                                <p className="font-medium text-gray-900">{transfer?.source_shop_name}</p>
                            </div>

                            <div className="flex-1 relative overflow-hidden h-8 mx-4">
                                <div className="product-animation-container">
                                    {Array.from({ length: Math.min(transfer?.items?.length || 0, 8) || 5 }).map((_, i) => (
                                        <div key={i} className="product-box" style={{
                                            animationDelay: `${i * 0.3}s`,
                                            top: `${((i % 3) * 30) + 50}%`
                                        }}>
                                            <Package size={16} />
                                        </div>
                                    ))}
                                </div>
                                <div className="h-0.5 bg-gray-200 absolute left-0 right-0 top-1/2 transform -translate-y-1/2"></div>
                                <ArrowLeftRight className="h-5 w-5 text-gray-400 absolute right-0 top-1/2 transform -translate-y-1/2" />
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gray-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                                        <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
                                    </svg>
                                </div>
                                <p className="font-medium text-gray-900">{transfer?.destination_shop_name}</p>
                            </div>
                        </div>

                        <div className="flex justify-center items-center flex-col">
                            <div className="w-full max-w-xs bg-gray-100 rounded-full h-2.5 relative overflow-hidden mb-2">
                                <div className="bg-primary h-full absolute left-0 top-0 progress-bar-animation"></div>
                            </div>
                            <p className="text-sm text-gray-600">Processing transfer, please wait...</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Transfer #{transfer.id}
                            </h1>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(transfer.status)}`}>
                                {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                            </span>
                        </div>
                        <p className="text-gray-500">
                            Created on {formatDate(transfer.created_at)}
                            {transfer.completed_at && ` • Completed on ${formatDate(transfer.completed_at)}`}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/inventory/transfers')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>

                        {/* Only show action buttons if transfer is pending */}
                        {transfer.status === 'pending' && hasTransferPermission && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelTransfer}
                                    disabled={actionLoading}
                                    className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <X className="w-4 h-4 mr-2" />
                                    )}
                                    Cancel Transfer
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleCompleteTransfer}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Complete Transfer
                                </Button>
                            </>
                        )}

                        {/* Delete option only for pending transfers */}
                        {transfer.status === 'pending' && hasTransferPermission && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteTransfer}
                                disabled={actionLoading}
                                className="text-red-500 hover:bg-red-50"
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Transfer summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900">Transfer Details</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-900">Source Shop:</span>
                                <span className="font-medium text-gray-900">{transfer.source_shop_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-900">Destination Shop:</span>
                                <span className="font-medium text-gray-900">{transfer.destination_shop_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-900">Initiated By:</span>
                                <span className="font-medium text-gray-900">{transfer.initiated_by || 'Unknown User'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-900">Created Date:</span>
                                <span className="font-medium text-gray-900">{formatDate(transfer.created_at)}</span>
                            </div>
                            {transfer.completed_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-900">Completed Date:</span>
                                    <span className="font-medium text-gray-900">{formatDate(transfer.completed_at)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-900">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(transfer.status)}`}>
                                    {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900">Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-900">Products:</span>
                                <span className="font-medium text-gray-900">{transfer.items.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-900">Total Units:</span>
                                <span className="font-medium text-gray-900">{totalItems}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-900">Total Value:</span>
                                <span className="font-medium text-gray-900">Rs. {totalValue.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transfer Items Table */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Transfer Items</h2>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm text-left text-gray-900">
                            <thead className="text-xs text-gray-900 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Product</th>
                                    <th className="px-6 py-3 font-semibold">SKU</th>
                                    <th className="px-6 py-3 text-right font-semibold">Unit Price</th>
                                    <th className="px-6 py-3 text-center font-semibold">Quantity</th>
                                    <th className="px-6 py-3 text-right font-semibold">Total</th>
                                    <th className="px-6 py-3 font-semibold">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfer.items.map((item) => {
                                    const itemTotal = parseFloat(item.retail_price) * item.quantity;
                                    return (
                                        <tr key={item.id} className="border-b">
                                            <td className="px-6 py-4 font-medium">{item.product_name}</td>
                                            <td className="px-6 py-4">{item.sku}</td>
                                            <td className="px-6 py-4 text-right">
                                                Rs. {parseFloat(item.retail_price).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right">
                                                Rs. {itemTotal.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.notes || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Footer with totals */}
                                <tr className="bg-gray-50 font-medium text-gray-900">
                                    <td className="px-6 py-4 font-semibold" colSpan={3}>
                                        Total
                                    </td>
                                    <td className="px-6 py-4 text-center font-semibold">
                                        {totalItems}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold">
                                        Rs. {totalValue.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 