import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface PaymentDetail {
    paymentId: number;
    customerName: string;
    paymentDate: string; // Assuming ISO string from API
    paymentAmount: number;
    paymentMethod: string | null;
    referenceNumber: string | null;
    invoiceNumber: string;
}

interface PaymentReportSummary {
    totalPaymentsAmount: number;
    numberOfPayments: number;
    numberOfCreditCustomersWithPayments: number;
}

interface CustomerPaymentsReportData {
    details: PaymentDetail[];
    summary: PaymentReportSummary;
    generatedAt: string;
    message?: string; // Optional message e.g. "No credit customers found"
}

interface CustomerPaymentsViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName?: string;
    reportData: CustomerPaymentsReportData | null;
}

export default function CustomerPaymentsViewModal({
    isOpen,
    onClose,
    reportName,
    reportData,
}: CustomerPaymentsViewModalProps) {
    if (!isOpen || !reportData) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString(undefined, { style: 'currency', currency: 'LKR' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{reportName || 'Customer Payment History'}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {reportData.message && (
                    <div className="mb-4 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                        {reportData.message}
                    </div>
                )}

                {reportData.summary && !reportData.message && (
                    <div className="text-sm text-gray-600 mb-3 pb-3 border-b">
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <p>Total Payments: <span className="font-semibold">{formatCurrency(reportData.summary.totalPaymentsAmount)}</span></p>
                            <p>Transactions: <span className="font-semibold">{reportData.summary.numberOfPayments.toLocaleString()}</span></p>
                            <p>Customers w/ Payments: <span className="font-semibold">{reportData.summary.numberOfCreditCustomersWithPayments.toLocaleString()}</span></p>
                        </div>
                        <p className="mt-1 text-xs">Generated at: {new Date(reportData.generatedAt).toLocaleString()}</p>
                    </div>
                )}

                <div className="overflow-y-auto flex-grow report-table-container pr-1">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2">Customer Name</th>
                                <th className="px-3 py-2">Payment Date</th>
                                <th className="px-3 py-2">Payment Method</th>
                                <th className="px-3 py-2">Reference #</th>
                                <th className="px-3 py-2">Invoice #</th>
                                <th className="px-3 py-2 text-right">Amount (LKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.details.map((payment) => (
                                <tr key={payment.paymentId} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-900">{payment.customerName}</td>
                                    <td className="px-3 py-2">{formatDate(payment.paymentDate)}</td>
                                    <td className="px-3 py-2">{payment.paymentMethod || 'N/A'}</td>
                                    <td className="px-3 py-2">{payment.referenceNumber || 'N/A'}</td>
                                    <td className="px-3 py-2">{payment.invoiceNumber}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(payment.paymentAmount)}</td>
                                </tr>
                            ))}
                            {reportData.details.length === 0 && !reportData.message && (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-gray-500">No payment history found for credit customers.</td>
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