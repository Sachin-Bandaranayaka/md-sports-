'use client';

import { useState } from 'react';
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

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by receipt number, customer name, or invoice number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:ring-primary focus:border-primary"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    <Button type="submit" variant="primary">Search</Button>
                </form>
            </div>

            {/* Delete Confirmation Dialog */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-tertiary rounded-lg p-6 max-w-md w-full shadow-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this receipt? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={handleCancelDelete}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipts Table */}
            <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading receipts...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-red-500">{error}</p>
                    </div>
                ) : receipts.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">No receipts found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Receipt Number
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Invoice
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment Method
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reference
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-tertiary divide-y divide-gray-200">
                                {receipts.map((receipt) => (
                                    <tr key={receipt.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {receipt.receiptNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(receipt.receiptDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {receipt.payment.invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {receipt.payment.customer.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(receipt.payment.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {receipt.payment.paymentMethod}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {receipt.payment.referenceNumber || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/receipts/${receipt.id}`)}
                                                    title="View Receipt"
                                                >
                                                    <Eye className="h-4 w-4 text-primary" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/receipts/edit/${receipt.id}`)}
                                                    title="Edit Receipt"
                                                >
                                                    <Edit className="h-4 w-4 text-yellow-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(receipt.id)}
                                                    title="Delete Receipt"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
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
                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                    <span className="font-medium">{totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-tertiary text-sm font-medium text-gray-500 hover:bg-gray-50"
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
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-tertiary text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-tertiary text-sm font-medium text-gray-500 hover:bg-gray-50"
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