'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Eye, Edit, Search, ArrowUpDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface Receipt {
    id: number;
    receiptNumber: string;
    receiptDate: string;
    paymentId: number;
    bankName: string | null;
    accountNumber: string | null;
    chequeNumber: string | null;
    transactionId: string | null;
    notes: string | null;
    payment: {
        id: number;
        amount: number;
        paymentMethod: string;
        referenceNumber: string | null;
        invoice: {
            id: number;
            invoiceNumber: string;
        };
        customer: {
            id: number;
            name: string;
        };
        account: {
            id: number;
            name: string;
        } | null;
    };
    confirmedByUser: {
        id: number;
        name: string;
    } | null;
    createdAt: string;
}

interface ReceiptsClientWrapperProps {
    initialReceipts: Receipt[];
    initialTotalPages: number;
    initialCurrentPage: number;
    initialSearch: string;
}

export default function ReceiptsClientWrapper({
    initialReceipts,
    initialTotalPages,
    initialCurrentPage,
    initialSearch
}: ReceiptsClientWrapperProps) {
    const router = useRouter();
    const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const [currentPage, setCurrentPage] = useState(initialCurrentPage);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

    // Sync local state when props change (e.g., after search or pagination)
    useEffect(() => {
        setReceipts(initialReceipts);
        setTotalPages(initialTotalPages);
        setCurrentPage(initialCurrentPage);
        setSearchQuery(initialSearch);
        // Clear selection when data changes
        setSelectedReceipts([]);
    }, [initialReceipts, initialTotalPages, initialCurrentPage, initialSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/receipts?page=1&search=${encodeURIComponent(searchQuery)}`);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        router.push(`/receipts?page=${page}${searchParam}`);
    };

    const handleDeleteClick = (receiptId: number) => {
        setConfirmDelete(receiptId);
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;

        try {
            setDeleteLoading(true);
            const response = await fetch(`/api/receipts/${confirmDelete}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete receipt');
            }

            // Remove deleted receipt from state
            setReceipts(receipts.filter(receipt => receipt.id !== confirmDelete));
            setConfirmDelete(null);
        } catch (err) {
            console.error('Error deleting receipt:', err);
            alert(err instanceof Error ? err.message : 'An error occurred while deleting the receipt');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setConfirmDelete(null);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedReceipts(receipts.map(receipt => receipt.id));
        } else {
            setSelectedReceipts([]);
        }
    };

    const handleSelectReceipt = (receiptId: number, checked: boolean) => {
        if (checked) {
            setSelectedReceipts(prev => [...prev, receiptId]);
        } else {
            setSelectedReceipts(prev => prev.filter(id => id !== receiptId));
        }
    };

    const handleBulkDelete = () => {
        if (selectedReceipts.length === 0) return;
        setShowBulkDeleteConfirm(true);
    };

    const handleConfirmBulkDelete = async () => {
        if (selectedReceipts.length === 0) return;

        try {
            setBulkDeleteLoading(true);
            
            // Delete all selected receipts
            const deletePromises = selectedReceipts.map(receiptId => 
                fetch(`/api/receipts/${receiptId}`, { method: 'DELETE' })
            );
            
            const responses = await Promise.all(deletePromises);
            
            // Check if all deletions were successful
            const failedDeletions = responses.filter(response => !response.ok);
            if (failedDeletions.length > 0) {
                throw new Error(`Failed to delete ${failedDeletions.length} receipt(s)`);
            }

            // Remove deleted receipts from state
            setReceipts(receipts.filter(receipt => !selectedReceipts.includes(receipt.id)));
            setSelectedReceipts([]);
            setShowBulkDeleteConfirm(false);
        } catch (err) {
            console.error('Error deleting receipts:', err);
            alert(err instanceof Error ? err.message : 'An error occurred while deleting the receipts');
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    const handleCancelBulkDelete = () => {
        setShowBulkDeleteConfirm(false);
    };

    const isAllSelected = receipts.length > 0 && selectedReceipts.length === receipts.length;
    const isIndeterminate = selectedReceipts.length > 0 && selectedReceipts.length < receipts.length;

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <form onSubmit={handleSearch} className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by receipt number, customer name, or invoice number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border-2 border-gray-300 pl-12 pr-4 py-3 text-sm text-black placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                        />
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    <Button type="submit" variant="primary" className="px-6 py-3 bg-primary hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200">Search</Button>
                </form>
            </div>

            {/* Bulk Actions Bar */}
            {selectedReceipts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-blue-900">
                                {selectedReceipts.length} receipt{selectedReceipts.length !== 1 ? 's' : ''} selected
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReceipts([])}
                                className="text-blue-700 border-blue-300 hover:bg-blue-100"
                            >
                                Clear Selection
                            </Button>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
                        <h3 className="text-xl font-semibold text-black mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Are you sure you want to delete this receipt? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <Button
                                variant="outline"
                                onClick={handleCancelDelete}
                                disabled={deleteLoading}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Dialog */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
                        <h3 className="text-xl font-semibold text-black mb-4">Confirm Bulk Delete</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Are you sure you want to delete {selectedReceipts.length} selected receipt{selectedReceipts.length !== 1 ? 's' : ''}? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <Button
                                variant="outline"
                                onClick={handleCancelBulkDelete}
                                disabled={bulkDeleteLoading}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmBulkDelete}
                                disabled={bulkDeleteLoading}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                            >
                                {bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedReceipts.length} Receipt${selectedReceipts.length !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipts Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600 font-medium">Loading receipts...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <p className="text-red-600 font-medium">{error}</p>
                    </div>
                ) : receipts.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-600 font-medium">No receipts found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            ref={(el) => {
                                                if (el) el.indeterminate = isIndeterminate;
                                            }}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Receipt Number
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Invoice
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Account
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Notes
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {receipts.map((receipt) => (
                                    <tr key={receipt.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedReceipts.includes(receipt.id)}
                                                onChange={(e) => handleSelectReceipt(receipt.id, e.target.checked)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-black">
                                            {receipt.receiptNumber}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-black">
                                            {formatDate(receipt.receiptDate)}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-black">
                                            {receipt.payment.invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-black">
                                            {receipt.payment.customer.name}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-green-600">
                                            {formatCurrency(receipt.payment.amount)}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-black">
                                            {receipt.payment.account?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-black">
                                            {receipt.notes || 'N/A'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/receipts/${receipt.id}/detail`)}
                                                    title="View Receipt Details"
                                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                >
                                                    <Eye className="h-5 w-5 text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/receipts/edit/${receipt.id}`)}
                                                    title="Edit Receipt"
                                                    className="p-2 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                                                >
                                                    <Edit className="h-5 w-5 text-yellow-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(receipt.id)}
                                                    title="Delete Receipt"
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                >
                                                    <Trash2 className="h-5 w-5 text-red-600" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && receipts.length > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-black font-medium">
                                    Showing page <span className="font-semibold text-primary">{currentPage}</span> of{' '}
                                    <span className="font-semibold text-primary">{totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-3 py-2 rounded-l-lg border-2 border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? 'primary' : 'outline'}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`relative inline-flex items-center px-4 py-2 border-2 text-sm font-medium transition-colors duration-200 ${
                                                    currentPage === pageNum
                                                        ? 'border-primary bg-primary text-white hover:bg-red-700'
                                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-3 py-2 rounded-r-lg border-2 border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}