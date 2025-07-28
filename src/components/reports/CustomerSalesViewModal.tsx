import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface CustomerDetail {
    customerName: string;
    shopName: string;
    totalAmount: number;
    invoiceCount: number;
    paidAmount: number;
    pendingAmount: number;
}

interface CustomerSalesReportData {
    summary: {
        totalCustomers: number;
        grandTotal: number;
        totalPaid: number;
        totalPending: number;
        totalInvoices: number;
    };
    details: CustomerDetail[];
    generatedAt: string;
}

interface CustomerSalesViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName?: string;
    reportData: CustomerSalesReportData | null;
}

export default function CustomerSalesViewModal({ isOpen, onClose, reportName, reportData }: CustomerSalesViewModalProps) {
    if (!isOpen || !reportData) return null;

    const formatCurrency = (amount: number) => {
        return (amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'LKR' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{reportName || 'Customer Sales Report'}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {reportData.summary && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Report Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Total Customers</p>
                                <p className="font-semibold text-lg">{(reportData.summary.totalCustomers || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Grand Total</p>
                                <p className="font-semibold text-lg text-green-600">{formatCurrency(reportData.summary.grandTotal)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Total Paid</p>
                                <p className="font-semibold text-lg text-blue-600">{formatCurrency(reportData.summary.totalPaid)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Total Pending</p>
                                <p className="font-semibold text-lg text-orange-600">{formatCurrency(reportData.summary.totalPending)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Total Invoices</p>
                                <p className="font-semibold text-lg">{(reportData.summary.totalInvoices || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                            Generated on: {formatDate(reportData.generatedAt)}
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto flex-grow report-table-container pr-1">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2">Customer Name</th>
                                <th className="px-3 py-2">Shop</th>
                                <th className="px-3 py-2 text-right">Total Amount</th>
                                <th className="px-3 py-2 text-right">Paid Amount</th>
                                <th className="px-3 py-2 text-right">Pending Amount</th>
                                <th className="px-3 py-2 text-center">Invoice Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(reportData.details || []).map((customer, index) => (
                                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-900">{customer.customerName || 'N/A'}</td>
                                    <td className="px-3 py-2">{customer.shopName || 'N/A'}</td>
                                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(customer.totalAmount)}</td>
                                    <td className="px-3 py-2 text-right text-blue-600">{formatCurrency(customer.paidAmount)}</td>
                                    <td className="px-3 py-2 text-right text-orange-600">{formatCurrency(customer.pendingAmount)}</td>
                                    <td className="px-3 py-2 text-center">{(customer.invoiceCount || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {(!reportData.details || reportData.details.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                            No customer sales data available for the selected period.
                        </div>
                    )}
                </div>
                
                <div className="mt-6 text-right">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}