import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface InventoryItemDetail {
    productName: string;
    sku: string | null;
    barcode: string | null;
    category: string;
    shopName: string;
    quantity: number;
    price: number; // Retail price from Product.price
    totalValue: number; // quantity * price
    // weightedAverageCost?: number; // Could be added later
    // totalWACValue?: number; // Could be added later
}

interface InventoryReportData {
    details: InventoryItemDetail[];
    generatedAt: string;
    // Add summary fields if any are calculated in API, e.g., total_items, grand_total_value
}

interface InventoryReportViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName?: string;
    reportData: InventoryReportData | null;
}

export default function InventoryReportViewModal({
    isOpen,
    onClose,
    reportName,
    reportData,
}: InventoryReportViewModalProps) {
    if (!isOpen || !reportData) return null;

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString(undefined, { style: 'currency', currency: 'LKR' });
    };

    const overallTotalItems = reportData.details.reduce((sum, item) => sum + item.quantity, 0);
    const overallTotalValue = reportData.details.reduce((sum, item) => sum + item.totalValue, 0);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{reportName || 'Inventory Status Details'}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                    <p>Generated At: {new Date(reportData.generatedAt).toLocaleString()}</p>
                    <p>Overall Total Items: {overallTotalItems.toLocaleString()}</p>
                    <p>Overall Total Value (Retail): {formatCurrency(overallTotalValue)}</p>
                </div>
                <div className="overflow-y-auto flex-grow">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-3 py-2">Product Name</th>
                                <th className="px-3 py-2">SKU</th>
                                <th className="px-3 py-2">Shop</th>
                                <th className="px-3 py-2">Category</th>
                                <th className="px-3 py-2 text-right">Quantity</th>
                                <th className="px-3 py-2 text-right">Price (Retail)</th>
                                <th className="px-3 py-2 text-right">Total Value (Retail)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.details.map((item, index) => (
                                <tr key={`${item.sku}-${item.shopName}-${index}`} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-900">{item.productName}</td>
                                    <td className="px-3 py-2">{item.sku || 'N/A'}</td>
                                    <td className="px-3 py-2">{item.shopName}</td>
                                    <td className="px-3 py-2">{item.category}</td>
                                    <td className="px-3 py-2 text-right">{item.quantity.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(item.totalValue)}</td>
                                </tr>
                            ))}
                            {reportData.details.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-4 text-gray-500">No inventory items found.</td>
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