import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface InvoiceItemDetail {
    id: number;
    product: { name: string; };
    quantity: number;
    price: number;
    total: number;
}

interface InvoiceDetail {
    id: number;
    invoiceNumber: string;
    createdAt: string;
    customer: { name: string; } | null;
    shop: { name: string | null; } | null;
    total: number;
    items: InvoiceItemDetail[];
}

interface SalesReportData {
    summary: {
        month: string;
        year: number;
        totalSales: number;
        numberOfInvoices: number;
    };
    details: InvoiceDetail[];
}

interface SalesReportViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName?: string;
    reportData: SalesReportData | null;
}

export default function SalesReportViewModal({ isOpen, onClose, reportName, reportData }: SalesReportViewModalProps) {
    if (!isOpen || !reportData) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return (amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'LKR' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{reportName || 'Sales Report Details'}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Summary for {reportData.summary.month} {reportData.summary.year}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <p>Total Sales: <span className="font-semibold">{formatCurrency(reportData.summary.totalSales)}</span></p>
                        <p>Number of Invoices: <span className="font-semibold">{(reportData.summary.numberOfInvoices || 0).toLocaleString()}</span></p>
                    </div>
                </div>
                <div className="overflow-y-auto flex-grow report-table-container pr-1">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2">Invoice #</th>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Customer</th>
                                <th className="px-3 py-2">Shop</th>
                                <th className="px-3 py-2 text-right">Total Amount (LKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.details.map((invoice) => (
                                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2">{invoice.invoiceNumber}</td>
                                    <td className="px-3 py-2">{formatDate(invoice.createdAt)}</td>
                                    <td className="px-3 py-2">{invoice.customer?.name || 'N/A'}</td>
                                    <td className="px-3 py-2">{invoice.shop?.name || 'N/A'}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(invoice.total)}</td>
                                </tr>
                            ))}
                            {reportData.details.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-gray-500">No invoices found for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 text-right">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}