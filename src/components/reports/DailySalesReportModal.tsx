'use client';

import { useState } from 'react';
import { X, Download, Calendar, TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DailySalesReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportName: string;
    reportData: any;
}

const DailySalesReportModal: React.FC<DailySalesReportModalProps> = ({
    isOpen,
    onClose,
    reportName,
    reportData
}) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

    if (!isOpen || !reportData) return null;

    const { summary, shopData } = reportData;

    const generatePDF = () => {
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(18);
        doc.text('Daily Sales Report', 14, 22);
        
        // Report Info
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date: ${summary.date}`, 14, 32);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
        
        // Summary Section
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Summary', 14, 50);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Total Sales: ${summary.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 14, 58);
        doc.text(`Total Invoices: ${summary.totalInvoices}`, 14, 64);
        doc.text(`Total Quantity Sold: ${summary.totalQuantitySold}`, 14, 70);
        doc.text(`Number of Shops: ${summary.numberOfShops}`, 14, 76);
        doc.text(`Average per Shop: ${summary.averagePerShop.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 14, 82);
        
        // Shop Performance Table
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Shop Performance', 14, 95);
        
        const tableColumn = ['Shop Name', 'Location', 'Sales (LKR)', 'Invoices', 'Qty Sold', 'Avg. Transaction'];
        const tableRows: any[][] = [];
        
        shopData.forEach((shop: any) => {
            const row = [
                shop.shopName,
                shop.location || 'N/A',
                shop.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                shop.numberOfInvoices.toString(),
                shop.totalQuantitySold.toString(),
                shop.averageTransactionValue.toLocaleString(undefined, { minimumFractionDigits: 2 })
            ];
            tableRows.push(row);
        });
        
        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 105,
            headStyles: { fillColor: [22, 160, 133] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 35 }, // Shop Name
                1: { cellWidth: 30 }, // Location
                2: { halign: 'right', cellWidth: 25 }, // Sales
                3: { halign: 'right', cellWidth: 20 }, // Invoices
                4: { halign: 'right', cellWidth: 20 }, // Qty Sold
                5: { halign: 'right', cellWidth: 25 }  // Avg Transaction
            }
        });
        
        doc.save(`Daily_Sales_Report_${reportData.reportDate}.pdf`);
    };

    const generateExcel = () => {
        // Summary Sheet
        const summaryData = [
            ['Daily Sales Report'],
            ['Date:', summary.date],
            ['Generated:', new Date().toLocaleString()],
            [],
            ['SUMMARY'],
            ['Total Sales (LKR):', summary.totalSales],
            ['Total Invoices:', summary.totalInvoices],
            ['Total Quantity Sold:', summary.totalQuantitySold],
            ['Number of Shops:', summary.numberOfShops],
            ['Average per Shop (LKR):', summary.averagePerShop]
        ];
        
        // Shop Performance Sheet
        const shopPerformanceData = [
            ['Shop Name', 'Location', 'Total Sales (LKR)', 'Number of Invoices', 'Total Quantity Sold', 'Average Transaction Value (LKR)'],
            ...shopData.map((shop: any) => [
                shop.shopName,
                shop.location || 'N/A',
                shop.totalSales,
                shop.numberOfInvoices,
                shop.totalQuantitySold,
                shop.averageTransactionValue
            ])
        ];
        
        // Detailed Transactions Sheet
        const transactionData = [['Shop Name', 'Invoice Number', 'Customer Name', 'Date', 'Total Amount (LKR)', 'Items Count']];
        
        shopData.forEach((shop: any) => {
            shop.invoices.forEach((invoice: any) => {
                transactionData.push([
                    shop.shopName,
                    invoice.invoiceNumber,
                    invoice.customer.name,
                    new Date(invoice.createdAt).toLocaleString(),
                    invoice.total,
                    invoice.items.length
                ]);
            });
        });
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        
        // Add sheets
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        const shopSheet = XLSX.utils.aoa_to_sheet(shopPerformanceData);
        const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);
        
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        XLSX.utils.book_append_sheet(workbook, shopSheet, 'Shop Performance');
        XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Detailed Transactions');
        
        // Set column widths
        summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
        shopSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 22 }];
        transactionSheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 12 }];
        
        XLSX.writeFile(workbook, `Daily_Sales_Report_${reportData.reportDate}.xlsx`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{reportName}</h2>
                        <p className="text-sm text-gray-500 mt-1">{summary.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={generatePDF}>
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={generateExcel}>
                            <Download className="w-4 h-4 mr-2" />
                            Excel
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'summary'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Summary
                        </button>
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'details'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Shop Details
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {activeTab === 'summary' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <DollarSign className="w-8 h-8 text-blue-600" />
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-blue-600">Total Sales</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {summary.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <TrendingUp className="w-8 h-8 text-green-600" />
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-green-600">Total Invoices</p>
                                            <p className="text-lg font-semibold text-gray-900">{summary.totalInvoices}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <Package className="w-8 h-8 text-purple-600" />
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-purple-600">Items Sold</p>
                                            <p className="text-lg font-semibold text-gray-900">{summary.totalQuantitySold}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <Users className="w-8 h-8 text-orange-600" />
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-orange-600">Active Shops</p>
                                            <p className="text-lg font-semibold text-gray-900">{summary.numberOfShops}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Status Breakdown */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Status Breakdown</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-sm font-medium text-green-700">Paid Invoices</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {shopData.reduce((total: number, shop: any) => total + (shop.paidSales || 0), 0).toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {shopData.reduce((total: number, shop: any) => total + (shop.paidInvoices || 0), 0)} invoices
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-sm font-medium text-yellow-700">Pending Invoices</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {shopData.reduce((total: number, shop: any) => total + (shop.pendingSales || 0), 0).toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}
                                                </p>
                                                <p className="text-xs text-yellow-600">
                                                    {shopData.reduce((total: number, shop: any) => total + (shop.pendingInvoices || 0), 0)} invoices
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-sm font-medium text-orange-700">Partial Payments</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {shopData.reduce((total: number, shop: any) => total + (shop.partialSales || 0), 0).toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}
                                                </p>
                                                <p className="text-xs text-orange-600">
                                                    {shopData.reduce((total: number, shop: any) => total + (shop.partialInvoices || 0), 0)} invoices
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shop Performance Table */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Shop Performance Overview</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Invoices</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Partial</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Items Sold</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {shopData.map((shop: any, index: number) => (
                                                <tr key={shop.shopId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {shop.shopName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {shop.location || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {shop.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {shop.numberOfInvoices}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{shop.paidInvoices || 0}</span>
                                                            <span className="text-xs">{(shop.paidSales || 0).toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 text-right">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{shop.pendingInvoices || 0}</span>
                                                            <span className="text-xs">{(shop.pendingSales || 0).toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{shop.partialInvoices || 0}</span>
                                                            <span className="text-xs">{(shop.partialSales || 0).toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {shop.totalQuantitySold}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {shopData.map((shop: any) => (
                                <div key={shop.shopId} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{shop.shopName}</h3>
                                            <p className="text-sm text-gray-500">{shop.location || 'Location not specified'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-gray-900">
                                                {shop.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}
                                            </p>
                                            <p className="text-sm text-gray-500">{shop.numberOfInvoices} invoices</p>
                                        </div>
                                    </div>
                                    
                                    {shop.invoices.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {shop.invoices.map((invoice: any) => (
                                                        <tr key={invoice.id}>
                                                            <td className="px-4 py-2 text-sm text-gray-900">{invoice.invoiceNumber}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-900">{invoice.customer.name}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-500">
                                                                {new Date(invoice.createdAt).toLocaleTimeString()}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                                                {invoice.total.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                                                {invoice.items.length}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No sales recorded for this shop today</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailySalesReportModal;