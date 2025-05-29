import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface ShopPerformanceDetail {
    shopId: number;
    shopName: string;
    location: string | null;
    totalSalesAmount: number;
    numberOfTransactions: number;
    totalQuantitySold: number;
    averageTransactionValue: number;
}

interface ShopPerformanceReportData {
    details: ShopPerformanceDetail[];
    summary: {
        month: string;
        year: number;
        totalShopsAnalyzed: number;
    };
    generatedAt: string;
    message?: string;
}

interface ShopPerformanceViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName?: string;
    reportData: ShopPerformanceReportData | null;
}

export default function ShopPerformanceViewModal({
    isOpen,
    onClose,
    reportName,
    reportData,
}: ShopPerformanceViewModalProps) {
    if (!isOpen || !reportData) return null;

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString(undefined, { style: 'currency', currency: 'LKR' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{reportName || 'Shop Performance Comparison'}</h2>
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
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">
                            Comparison for {reportData.summary.month} {reportData.summary.year} ({reportData.summary.totalShopsAnalyzed} Shops)
                        </h3>
                        <p className="text-xs">Overall Total Sales: {formatCurrency(reportData.details.reduce((sum, shop) => sum + shop.totalSalesAmount, 0))}</p>
                        <p className="text-xs">Generated at: {new Date(reportData.generatedAt).toLocaleString()}</p>
                    </div>
                )}

                <div className="overflow-y-auto flex-grow report-table-container pr-1">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2">Shop Name</th>
                                <th className="px-3 py-2">Location</th>
                                <th className="px-3 py-2 text-right">Total Sales (LKR)</th>
                                <th className="px-3 py-2 text-right">Transactions</th>
                                <th className="px-3 py-2 text-right">Items Sold</th>
                                <th className="px-3 py-2 text-right">Avg. Sale Value (LKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.details.map((shop) => (
                                <tr key={shop.shopId} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-900">{shop.shopName}</td>
                                    <td className="px-3 py-2">{shop.location || 'N/A'}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(shop.totalSalesAmount)}</td>
                                    <td className="px-3 py-2 text-right">{shop.numberOfTransactions.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right">{shop.totalQuantitySold.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(shop.averageTransactionValue)}</td>
                                </tr>
                            ))}
                            {reportData.details.length === 0 && !reportData.message && (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-gray-500">No shop performance data available.</td>
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