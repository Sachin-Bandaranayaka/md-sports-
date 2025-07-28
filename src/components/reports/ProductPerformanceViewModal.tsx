import { Button } from '@/components/ui/Button';
import React from 'react';
import { X } from 'lucide-react';

interface ProductPerformanceDetail {
    productId: number;
    productName: string;
    sku: string | null;
    totalQuantitySold: number;
    totalSalesAmount: number;
}

interface CategoryPerformanceDetail {
    categoryName: string;
    products: ProductPerformanceDetail[];
    totalCategorySales: number;
    totalCategoryQuantity: number;
}

interface ProductPerformanceSummary {
    month: string;
    year: number;
    overallTotalRevenue: number;
    overallTotalProductsSold: number;
    numberOfCategoriesWithSales: number;
}

interface ProductPerformanceReportData {
    details: CategoryPerformanceDetail[]; // Array of categories
    summary: ProductPerformanceSummary;
    generatedAt: string;
    message?: string;
}

interface ProductPerformanceViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName?: string;
    reportData: ProductPerformanceReportData | null;
}

export default function ProductPerformanceViewModal({
    isOpen,
    onClose,
    reportName,
    reportData,
}: ProductPerformanceViewModalProps) {
    if (!isOpen || !reportData) return null;

    const formatCurrency = (amount: number) => {
        return (amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'LKR' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{reportName || 'Product Performance Analysis'}</h2>
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
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">Summary for {reportData.summary.month} {reportData.summary.year}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <p>Total Revenue: <span className="font-semibold">{formatCurrency(reportData.summary.overallTotalRevenue)}</span></p>
                            <p>Total Items Sold: <span className="font-semibold">{(reportData.summary.overallTotalProductsSold || 0).toLocaleString()}</span></p>
                            <p>Categories w/ Sales: <span className="font-semibold">{(reportData.summary.numberOfCategoriesWithSales || 0).toLocaleString()}</span></p>
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto flex-grow report-table-container pr-1">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2">Category</th>
                                <th className="px-3 py-2">Product Name</th>
                                <th className="px-3 py-2">SKU</th>
                                <th className="px-3 py-2 text-right">Qty Sold</th>
                                <th className="px-3 py-2 text-right">Sales Amount (LKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.details?.map((category: CategoryPerformanceDetail, catIndex: number) => (
                                <React.Fragment key={catIndex}>
                                    {(category.products || []).map((product: ProductPerformanceDetail, prodIndex: number) => (
                                        <tr key={product.productId || prodIndex} className="border-b hover:bg-gray-50">
                                            {prodIndex === 0 && (
                                                <td rowSpan={(category.products || []).length + 1} className="px-3 py-2 align-top font-medium border-r">
                                                    {category.categoryName}
                                                </td>
                                            )}
                                            <td className="px-3 py-2">{product.productName}</td>
                                            <td className="px-3 py-2">{product.sku}</td>
                                            <td className="px-3 py-2 text-right">{(product.totalQuantitySold || 0).toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(product.totalSalesAmount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-semibold border-b">
                                        <td colSpan={3} className="px-3 py-2 text-right">Category Total:</td>
                                        <td className="px-3 py-2 text-right">{(category.totalCategoryQuantity || 0).toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(category.totalCategorySales)}</td>
                                    </tr>
                                </React.Fragment>
                            ))}
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