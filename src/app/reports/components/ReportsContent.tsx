'use client';

import { Button } from '@/components/ui/Button';
import { BarChart2, Download, Filter, Calendar, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authGet } from '@/utils/api';

// Lazy load heavy dependencies only when needed
import { lazy, Suspense } from 'react';

const DailySalesReportModal = lazy(() => import('@/components/reports/DailySalesReportModal'));
const ScheduleReportModal = lazy(() => import('@/components/reports/ScheduleReportModal'));
const GenerateReportModal = lazy(() => import('@/components/reports/GenerateReportModal'));
const SalesReportViewModal = lazy(() => import('@/components/reports/SalesReportViewModal'));
const InventoryReportViewModal = lazy(() => import('@/components/reports/InventoryReportViewModal'));
const ShopPerformanceViewModal = lazy(() => import('@/components/reports/ShopPerformanceViewModal'));
const ProductPerformanceViewModal = lazy(() => import('@/components/reports/ProductPerformanceViewModal'));
const CustomerSalesViewModal = lazy(() => import('@/components/reports/CustomerSalesViewModal'));

// Lazy load PDF/Excel libraries only when downloading
const loadPDFLibraries = () => import('jspdf').then(module => {
  const jsPDF = module.default;
  return import('jspdf-autotable').then(autoTableModule => {
    const autoTable = autoTableModule.default;
    return { jsPDF, autoTable };
  });
});

const loadExcelLibrary = () => import('xlsx');

interface Report {
    id: string;
    name: string;
    description: string;
    type: string;
    lastGenerated: string;
    format: string;
    data?: any;
}

interface ReportOption {
    id: string;
    name: string;
    description: string;
    data?: any;
    isLoading: boolean;
}

// Initial dummy data for reports
const initialReports: Report[] = [
    {
        id: 'REP-006',
        name: 'Daily Sales Report',
        description: 'Comprehensive daily sales breakdown by shop including all payment statuses (paid, pending, partial) with Excel and PDF export',
        type: 'Sales',
        lastGenerated: 'loading...',
        format: 'Both'
    },
    {
        id: 'REP-007',
        name: 'Inventory Quality Summary',
        description: 'Track low stock alerts, overstock items, dead stock, and stock turnover rates by shop',
        type: 'Inventory',
        lastGenerated: 'Not generated',
        format: 'Both'
    },
    {
        id: 'REP-008',
        name: 'Inventory Value Summary',
        description: 'Inventory valuation using shop-specific costs, breakdown by shop and category',
        type: 'Inventory',
        lastGenerated: 'Not generated',
        format: 'Both'
    },
    {
        id: 'REP-009',
        name: 'Sales Invoice Total by Customer',
        description: 'Customer sales analysis with custom date range and status filters',
        type: 'Sales',
        lastGenerated: 'Not generated',
        format: 'Both'
    },
    {
        id: 'REP-010',
        name: 'Sales Invoice Total by Product',
        description: 'Product sales analysis showing quantity sold and revenue with custom date range',
        type: 'Sales',
        lastGenerated: 'Not generated',
        format: 'Both'
    },
    {
        id: 'REP-011',
        name: 'Profit by Product',
        description: 'Product profit analysis using weighted average cost with profit margin calculations',
        type: 'Financial',
        lastGenerated: 'Not generated',
        format: 'Both'
    },
    {
        id: 'REP-012',
        name: 'Inventory Profit Margin by Products',
        description: 'Inventory profit margin analysis based on actual sold items with historical data',
        type: 'Financial',
        lastGenerated: 'Not generated',
        format: 'Both'
    },
    {
        id: 'REP-013',
        name: 'Trending Products Analysis',
        description: 'AI-powered analysis of most selling products with weekly/monthly trends and business insights',
        type: 'Analytics',
        lastGenerated: 'Not generated',
        format: 'Both'
    }
];

// Report type badge colors
const getReportTypeBadgeClass = (type: string) => {
    switch (type) {
        case 'Sales':
            return 'bg-blue-100 text-blue-800';
        case 'Inventory':
            return 'bg-green-100 text-green-800';
        case 'Financial':
            return 'bg-yellow-100 text-yellow-800';
        case 'Analytics':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function ReportsContent() {
    const [reports, setReports] = useState<Report[]>(initialReports);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    const [isDailySalesModalOpen, setIsDailySalesModalOpen] = useState(false);
    const [selectedDailySalesData, setSelectedDailySalesData] = useState<any | null>(null);

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    // New modal states for other reports
    const [isSalesReportModalOpen, setIsSalesReportModalOpen] = useState(false);
    const [isInventoryReportModalOpen, setIsInventoryReportModalOpen] = useState(false);
    const [isShopPerformanceModalOpen, setIsShopPerformanceModalOpen] = useState(false);
    const [isProductPerformanceModalOpen, setIsProductPerformanceModalOpen] = useState(false);
    const [isCustomerSalesModalOpen, setIsCustomerSalesModalOpen] = useState(false);
    const [selectedReportData, setSelectedReportData] = useState<any | null>(null);

    const [selectedReportName, setSelectedReportName] = useState<string>('');

    // State for Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedFormat, setSelectedFormat] = useState('');
    const [filteredReports, setFilteredReports] = useState<Report[]>(initialReports);

    useEffect(() => {
        const fetchDailySales = async () => {
            setLoading(prev => ({ ...prev, 'REP-006': true }));
            setError(null);
            try {
                const response = await authGet('/api/reports/daily-sales');
                if (!response.ok) {
                    throw new Error(`Failed to fetch daily sales: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.success) {
                    setReports(prevReports => prevReports.map(report => {
                        if (report.id === 'REP-006') {
                            const totalSales = data.summary.totalSales;
                            const totalShops = data.summary.totalShops;
                            const totalInvoices = data.summary.totalInvoices;
                            return {
                                ...report,
                                description: `Daily sales for ${data.summary.date}: ${totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })} from ${totalInvoices} invoices across ${totalShops} shops (all payment statuses included).`,
                                lastGenerated: new Date().toLocaleDateString('en-CA'),
                                data: data
                            };
                        }
                        return report;
                    }));
                } else {
                    throw new Error(data.message || 'Failed to fetch daily sales');
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message);
                setReports(prevReports => prevReports.map(report =>
                    report.id === 'REP-006' ? { ...report, description: 'Error loading daily sales data', lastGenerated: 'Error' } : report
                ));
            }
            setLoading(prev => ({ ...prev, 'REP-006': false }));
        };

        fetchDailySales();
    }, []);

    // useEffect for filtering reports
    useEffect(() => {
        let currentReports = [...reports];

        if (searchTerm) {
            currentReports = currentReports.filter(report =>
                report.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (selectedType) {
            currentReports = currentReports.filter(report => report.type === selectedType);
        }
        if (selectedFormat) {
            currentReports = currentReports.filter(report => report.format === selectedFormat);
        }
        setFilteredReports(currentReports);
    }, [searchTerm, selectedType, selectedFormat, reports]);

    const handleViewReport = async (report: Report) => {
        setSelectedReportName(report.name);
        
        if (report.id === 'REP-006' && report.data) {
            setSelectedDailySalesData(report.data);
            setIsDailySalesModalOpen(true);
        } else if (['REP-007', 'REP-008', 'REP-009', 'REP-010', 'REP-011', 'REP-012', 'REP-013'].includes(report.id)) {
            // Handle new reports by fetching data from their respective APIs
            try {
                setLoading(prev => ({ ...prev, [report.id]: true }));
                
                const apiEndpoints: Record<string, string> = {
                    'REP-007': '/api/reports/inventory-quality',
                    'REP-008': '/api/reports/inventory-value',
                    'REP-009': '/api/reports/sales-by-customer',
                    'REP-010': '/api/reports/sales-by-product',
                    'REP-011': '/api/reports/profit-by-product',
                    'REP-012': '/api/reports/inventory-profit-margin',
                    'REP-013': '/api/reports/trending-products'
                };
                
                const response = await authGet(apiEndpoints[report.id]);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${report.name}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    // Map API response to consistent data structure based on report type
                    let reportData;
                    switch (report.id) {
                        case 'REP-007': // Inventory Quality
                            reportData = { 
                                details: (data.data || data.details || []).map((item: any) => ({
                                    productName: item.productName,
                                    sku: item.sku,
                                    barcode: item.barcode || null,
                                    category: item.category,
                                    shopName: item.shopName,
                                    quantity: item.currentStock || item.quantity || 0,
                                    price: item.stockValue && item.currentStock ? item.stockValue / item.currentStock : 0,
                                    totalValue: item.stockValue || 0
                                })), 
                                summary: data.summary,
                                generatedAt: new Date().toISOString()
                            };
                            break;
                        case 'REP-008': // Inventory Value
                            reportData = { 
                                details: (data.details || data.data || []).map((item: any) => ({
                                    productName: item.productName,
                                    sku: item.sku,
                                    barcode: item.barcode,
                                    category: item.categoryName || item.category,
                                    shopName: item.shopName,
                                    quantity: item.quantity || 0,
                                    price: item.shopSpecificCost || item.price || 0,
                                    totalValue: item.totalValue || 0
                                })), 
                                summary: data.summary,
                                generatedAt: new Date().toISOString()
                            };
                            break;
                        case 'REP-009': // Sales by Customer
                            reportData = { 
                                details: data.customers || data.details || [], 
                                summary: data.summary,
                                generatedAt: new Date().toISOString()
                            };
                            break;
                        case 'REP-010': // Sales by Product
                            reportData = { 
                                details: data.products || data.details || [], 
                                summary: data.summary,
                                generatedAt: new Date().toISOString()
                            };
                            break;
                        case 'REP-011': // Profit by Product
                            reportData = { 
                                details: data.products || data.details || [], 
                                summary: data.summary,
                                generatedAt: new Date().toISOString()
                            };
                            break;
                        case 'REP-012': // Inventory Profit Margin
                            reportData = { 
                                details: data.products || data.details || [], 
                                summary: data.summary,
                                generatedAt: new Date().toISOString()
                            };
                            break;
                        case 'REP-013': // Trending Products
                            reportData = { 
                                details: data.topSellingProducts || data.details || [], 
                                summary: data.summary, 
                                aiInsights: data.aiInsights,
                                generatedAt: new Date().toISOString()
                            };
                            break;
                        default:
                            reportData = data;
                    }
                    
                    // Update the report with fetched data
                    setReports(prevReports => prevReports.map(r => 
                        r.id === report.id 
                            ? { ...r, data: reportData, lastGenerated: new Date().toLocaleDateString('en-CA') }
                            : r
                    ));
                    
                    // Open appropriate modal based on report type
                    setSelectedReportData(reportData);
                    switch (report.id) {
                        case 'REP-007': // Inventory Quality
                        case 'REP-008': // Inventory Value
                            setIsInventoryReportModalOpen(true);
                            break;
                        case 'REP-010': // Sales by Product
                            setIsSalesReportModalOpen(true);
                            break;
                        case 'REP-011': // Profit by Product
                        case 'REP-012': // Inventory Profit Margin
                            setIsProductPerformanceModalOpen(true);
                            break;
                        case 'REP-013': // Trending Products
                            setIsShopPerformanceModalOpen(true);
                            break;
                        case 'REP-009': // Sales by Customer
                            setIsCustomerSalesModalOpen(true);
                            break;
                        default:
                            alert(`${report.name} data loaded successfully! Use the download button to get PDF or Excel format.`);
                    }
                } else {
                    throw new Error(data.message || `Failed to generate ${report.name}`);
                }
            } catch (err: any) {
                console.error(err);
                alert(`Error generating ${report.name}: ${err.message}`);
            } finally {
                setLoading(prev => ({ ...prev, [report.id]: false }));
            }
        } else {
            alert(`View functionality for "${report.name}" is not yet implemented or data is missing.`);
        }
        
        if (isGenerateModalOpen) setIsGenerateModalOpen(false);
    };

    const handleDownloadReport = async (report: Report) => {
        console.log('Download button clicked for report:', report.id, report.name);
        console.log('Report data available:', !!report.data);
        
        // First ensure we have data for the report
        if (!report.data) {
            console.log('No data available, fetching report data first...');
            // Fetch data first if not available
            await handleViewReport(report);
            // Get updated report data
            const updatedReport = reports.find(r => r.id === report.id);
            if (!updatedReport?.data) {
                console.error('Failed to fetch report data after handleViewReport');
                alert('Unable to fetch report data. Please try again.');
                return;
            }
            report = updatedReport;
            console.log('Report data fetched successfully');
        }

        try {
            console.log('Starting report generation for format:', report.format);
            
            if (report.format === 'Both' || report.format === 'PDF') {
                console.log('Generating PDF report...');
                await generatePDFReport(report);
                console.log('PDF report generated successfully');
            }
            
            if (report.format === 'Both' || report.format === 'Excel') {
                console.log('Generating Excel report...');
                await generateExcelReport(report);
                console.log('Excel report generated successfully');
            }
            
            console.log('Report generation completed successfully');
        } catch (error: any) {
            console.error('Error generating report:', error);
            console.error('Error details:', error?.message, error?.stack);
            alert(`Error generating report: ${error?.message || 'Unknown error'}. Please check the console for details.`);
        }
    };

    const generatePDFReport = async (report: Report) => {
        const { jsPDF, autoTable } = await loadPDFLibraries();
        const doc = new jsPDF();
        
        // Common PDF styling
        doc.setFontSize(20);
        doc.text(report.name, 20, 20);
        doc.setFontSize(12);
        
        const currentDate = new Date().toLocaleDateString();
        doc.text(`Generated: ${currentDate}`, 20, 35);
        
        let startY = 50;
        
        switch (report.id) {
            case 'REP-006': // Daily Sales Report
                doc.text(`Date: ${report.data.summary.date}`, 20, startY);
                doc.text(`Total Sales: ${report.data.summary.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, startY + 10);
                doc.text(`Total Invoices: ${report.data.summary.totalInvoices}`, 20, startY + 20);
                doc.text(`Active Shops: ${report.data.summary.numberOfShops}`, 20, startY + 30);
                
                const shopTableData = report.data.shopData.map((shop: any) => [
                    shop.shopName,
                    shop.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' }),
                    shop.numberOfInvoices.toString(),
                    shop.totalQuantitySold.toString(),
                    shop.averageTransactionValue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })
                ]);
                
                autoTable(doc, {
                    head: [['Shop Name', 'Total Sales', 'Invoices', 'Quantity', 'Avg. Transaction']],
                    body: shopTableData,
                    startY: startY + 40,
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [66, 139, 202] }
                });
                break;
                
            case 'REP-007': // Inventory Quality Summary
                doc.text(`Total Items: ${report.data.summary.totalItems}`, 20, startY);
                doc.text(`Low Stock Items: ${report.data.summary.lowStockItems}`, 20, startY + 10);
                doc.text(`Overstock Items: ${report.data.summary.overstockItems}`, 20, startY + 20);
                doc.text(`Dead Stock Items: ${report.data.summary.deadStockItems}`, 20, startY + 30);
                
                const inventoryTableData = (report.data.items || []).slice(0, 20).map((item: any) => [
                    item.productName,
                    item.shopName,
                    item.currentStock.toString(),
                    item.status,
                    item.turnoverRate?.toFixed(2) || 'N/A'
                ]);
                
                autoTable(doc, {
                    head: [['Product', 'Shop', 'Stock', 'Status', 'Turnover Rate']],
                    body: inventoryTableData,
                    startY: startY + 40,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [66, 139, 202] }
                });
                break;
                
            case 'REP-008': // Inventory Value Summary
                doc.text(`Total Inventory Value: ${report.data.summary.totalValue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, startY);
                doc.text(`Total Items: ${report.data.summary.totalItems}`, 20, startY + 10);
                doc.text(`Average Value per Item: ${report.data.summary.averageValuePerItem.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, startY + 20);
                
                const valueTableData = (report.data.items || []).slice(0, 20).map((item: any) => [
                    item.productName,
                    item.shopName,
                    item.currentStock.toString(),
                    item.totalValue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })
                ]);
                
                autoTable(doc, {
                    head: [['Product', 'Shop', 'Stock', 'Total Value']],
                    body: valueTableData,
                    startY: startY + 30,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [66, 139, 202] }
                });
                break;
                
            case 'REP-009': // Sales by Customer
                doc.text(`Total Customers: ${report.data.summary.totalCustomers}`, 20, startY);
                doc.text(`Total Revenue: ${report.data.summary.totalRevenue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, startY + 10);
                doc.text(`Average per Customer: ${report.data.summary.averagePerCustomer.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, startY + 20);
                
                const customerTableData = (report.data.customers || []).slice(0, 20).map((customer: any) => [
                    customer.customerName,
                    customer.totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'LKR' }),
                    customer.invoiceCount.toString(),
                    customer.shopName
                ]);
                
                autoTable(doc, {
                    head: [['Customer', 'Total Amount', 'Invoices', 'Shop']],
                    body: customerTableData,
                    startY: startY + 30,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [66, 139, 202] }
                });
                break;
                
            case 'REP-010': // Sales by Product
                doc.text(`Total Products Sold: ${report.data.summary.totalProducts}`, 20, startY);
                doc.text(`Total Revenue: ${report.data.summary.totalRevenue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, startY + 10);
                doc.text(`Total Quantity: ${report.data.summary.totalQuantity}`, 20, startY + 20);
                
                const productTableData = (report.data.products || []).slice(0, 20).map((product: any) => [
                    product.productName,
                    product.totalQuantity.toString(),
                    product.totalRevenue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' }),
                    product.averagePrice.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })
                ]);
                
                autoTable(doc, {
                    head: [['Product', 'Quantity', 'Revenue', 'Avg Price']],
                    body: productTableData,
                    startY: startY + 30,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [66, 139, 202] }
                });
                break;
                
            case 'REP-011': // Profit by Product
                doc.text(`Total Profit: ${report.data.summary.totalProfit.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, startY);
                doc.text(`Average Margin: ${report.data.summary.averageMargin.toFixed(2)}%`, 20, startY + 10);
                doc.text(`Products Analyzed: ${report.data.summary.totalProducts}`, 20, startY + 20);
                
                const profitTableData = (report.data.products || []).slice(0, 20).map((product: any) => [
                    product.productName,
                    product.totalProfit.toLocaleString(undefined, { style: 'currency', currency: 'LKR' }),
                    `${product.profitMargin.toFixed(2)}%`,
                    product.totalRevenue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })
                ]);
                
                autoTable(doc, {
                    head: [['Product', 'Profit', 'Margin %', 'Revenue']],
                    body: profitTableData,
                    startY: startY + 30,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [66, 139, 202] }
                });
                break;
                
            case 'REP-012': // Inventory Profit Margin
                doc.text(`Total Inventory Value: ${report.data.summary.totalInventoryValue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, startY);
                doc.text(`Potential Profit: ${report.data.summary.totalPotentialProfit.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, startY + 10);
                doc.text(`Average Margin: ${report.data.summary.averageMargin.toFixed(2)}%`, 20, startY + 20);
                
                const marginTableData = (report.data.products || []).slice(0, 20).map((product: any) => [
                    product.productName,
                    product.currentStock.toString(),
                    `${product.profitMargin.toFixed(2)}%`,
                    product.potentialProfit.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })
                ]);
                
                autoTable(doc, {
                    head: [['Product', 'Stock', 'Margin %', 'Potential Profit']],
                    body: marginTableData,
                    startY: startY + 30,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [66, 139, 202] }
                });
                break;
                
            case 'REP-013': // Trending Products
                doc.text(`Analysis Period: ${report.data.summary.analysisType}`, 20, startY);
                doc.text(`Total Products: ${report.data.summary.totalProducts}`, 20, startY + 10);
                doc.text(`Growth Rate: ${report.data.summary.overallGrowthRate.toFixed(2)}%`, 20, startY + 20);
                
                // Add AI insights
                if (report.data.aiInsights) {
                    doc.text('AI Business Insights:', 20, startY + 35);
                    const insights = report.data.aiInsights.split('\n').slice(0, 3);
                    insights.forEach((insight: string, index: number) => {
                        doc.text(insight.substring(0, 80), 20, startY + 45 + (index * 8));
                    });
                }
                
                const trendingTableData = (report.data.topSellingProducts || []).slice(0, 15).map((product: any) => [
                    product.productName,
                    product.currentPeriodSales.toString(),
                    product.previousPeriodSales.toString(),
                    `${product.growthRate.toFixed(2)}%`
                ]);
                
                autoTable(doc, {
                    head: [['Product', 'Current Sales', 'Previous Sales', 'Growth %']],
                    body: trendingTableData,
                    startY: startY + 70,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [66, 139, 202] }
                });
                break;
        }
        
        const fileName = `${report.name.replace(/\s+/g, '_')}_${currentDate.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
    };

    const generateExcelReport = async (report: Report) => {
        const XLSX = await loadExcelLibrary();
        const wb = XLSX.utils.book_new();
        const currentDate = new Date().toLocaleDateString();
        
        switch (report.id) {
            case 'REP-006': // Daily Sales Report
                // Summary sheet
                const summaryData = [
                    ['Daily Sales Report Summary'],
                    ['Date', report.data.summary.date],
                    ['Total Sales', report.data.summary.totalSales],
                    ['Total Invoices', report.data.summary.totalInvoices],
                    ['Active Shops', report.data.summary.numberOfShops],
                    ['Average Per Shop', report.data.summary.averagePerShop]
                ];
                const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
                
                // Shop overview sheet
                const shopOverviewData = [
                    ['Shop Name', 'Total Sales', 'Invoice Count', 'Total Quantity', 'Average Transaction Value']
                ];
                report.data.shopData.forEach((shop: any) => {
                    shopOverviewData.push([
                        shop.shopName,
                        shop.totalSales,
                        shop.numberOfInvoices,
                        shop.totalQuantitySold,
                        shop.averageTransactionValue
                    ]);
                });
                const shopOverviewWs = XLSX.utils.aoa_to_sheet(shopOverviewData);
                XLSX.utils.book_append_sheet(wb, shopOverviewWs, 'Shop Overview');
                break;
                
            case 'REP-007': // Inventory Quality Summary
                const inventoryData = [
                    ['Product Name', 'Shop Name', 'Category', 'Current Stock', 'Status', 'Turnover Rate', 'Days Since Last Sale']
                ];
                (report.data.items || []).forEach((item: any) => {
                    inventoryData.push([
                        item.productName,
                        item.shopName,
                        item.categoryName,
                        item.currentStock,
                        item.status,
                        item.turnoverRate || 'N/A',
                        item.daysSinceLastSale || 'N/A'
                    ]);
                });
                const inventoryWs = XLSX.utils.aoa_to_sheet(inventoryData);
                XLSX.utils.book_append_sheet(wb, inventoryWs, 'Inventory Quality');
                break;
                
            case 'REP-008': // Inventory Value Summary
                const valueData = [
                    ['Product Name', 'Shop Name', 'Category', 'Current Stock', 'Unit Cost', 'Total Value']
                ];
                (report.data.items || []).forEach((item: any) => {
                    valueData.push([
                        item.productName,
                        item.shopName,
                        item.categoryName,
                        item.currentStock,
                        item.unitCost,
                        item.totalValue
                    ]);
                });
                const valueWs = XLSX.utils.aoa_to_sheet(valueData);
                XLSX.utils.book_append_sheet(wb, valueWs, 'Inventory Value');
                break;
                
            case 'REP-009': // Sales by Customer
                const customerData = [
                    ['Customer Name', 'Shop Name', 'Total Amount', 'Invoice Count', 'Paid Amount', 'Pending Amount']
                ];
                (report.data.customers || []).forEach((customer: any) => {
                    customerData.push([
                        customer.customerName,
                        customer.shopName,
                        customer.totalAmount,
                        customer.invoiceCount,
                        customer.paidAmount,
                        customer.pendingAmount
                    ]);
                });
                const customerWs = XLSX.utils.aoa_to_sheet(customerData);
                XLSX.utils.book_append_sheet(wb, customerWs, 'Sales by Customer');
                break;
                
            case 'REP-010': // Sales by Product
                const productData = [
                    ['Product Name', 'Category', 'Total Quantity', 'Total Revenue', 'Average Price', 'Invoice Count']
                ];
                (report.data.products || []).forEach((product: any) => {
                    productData.push([
                        product.productName,
                        product.categoryName,
                        product.totalQuantity,
                        product.totalRevenue,
                        product.averagePrice,
                        product.invoiceCount
                    ]);
                });
                const productWs = XLSX.utils.aoa_to_sheet(productData);
                XLSX.utils.book_append_sheet(wb, productWs, 'Sales by Product');
                break;
                
            case 'REP-011': // Profit by Product
                const profitData = [
                    ['Product Name', 'Category', 'Total Revenue', 'Total Cost', 'Total Profit', 'Profit Margin %', 'Quantity Sold']
                ];
                (report.data.products || []).forEach((product: any) => {
                    profitData.push([
                        product.productName,
                        product.categoryName,
                        product.totalRevenue,
                        product.totalCost,
                        product.totalProfit,
                        product.profitMargin,
                        product.quantitySold
                    ]);
                });
                const profitWs = XLSX.utils.aoa_to_sheet(profitData);
                XLSX.utils.book_append_sheet(wb, profitWs, 'Profit by Product');
                break;
                
            case 'REP-012': // Inventory Profit Margin
                const marginData = [
                    ['Product Name', 'Shop Name', 'Current Stock', 'Current Price', 'Cost', 'Profit Margin %', 'Potential Profit', 'Turnover Rate']
                ];
                (report.data.products || []).forEach((product: any) => {
                    marginData.push([
                        product.productName,
                        product.shopName,
                        product.currentStock,
                        product.currentPrice,
                        product.cost,
                        product.profitMargin,
                        product.potentialProfit,
                        product.turnoverRate
                    ]);
                });
                const marginWs = XLSX.utils.aoa_to_sheet(marginData);
                XLSX.utils.book_append_sheet(wb, marginWs, 'Inventory Profit Margin');
                break;
                
            case 'REP-013': // Trending Products
                const trendingData = [
                    ['Product Name', 'Category', 'Current Period Sales', 'Previous Period Sales', 'Growth Rate %', 'Trend']
                ];
                (report.data.topSellingProducts || []).forEach((product: any) => {
                    trendingData.push([
                        product.productName,
                        product.categoryName,
                        product.currentPeriodSales,
                        product.previousPeriodSales,
                        product.growthRate,
                        product.trend
                    ]);
                });
                const trendingWs = XLSX.utils.aoa_to_sheet(trendingData);
                XLSX.utils.book_append_sheet(wb, trendingWs, 'Trending Products');
                
                // Add AI insights sheet if available
                if (report.data.aiInsights) {
                    const insightsData = [
                        ['AI Business Insights'],
                        ['Generated Date', currentDate],
                        ['Analysis Type', report.data.summary.analysisType],
                        [''],
                        ['Insights'],
                        [report.data.aiInsights]
                    ];
                    const insightsWs = XLSX.utils.aoa_to_sheet(insightsData);
                    XLSX.utils.book_append_sheet(wb, insightsWs, 'AI Insights');
                }
                break;
        }
        
        const fileName = `${report.name.replace(/\s+/g, '_')}_${currentDate.replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const handleGenerateFromTemplate = (reportId: string) => {
        const reportToView = reports.find(r => r.id === reportId);
        if (reportToView) {
            if (loading[reportId]) {
                alert('Report data is still loading. Please wait.');
                return;
            }
            
            // For REP-006 (Daily Sales), check if data exists
            if (reportId === 'REP-006' && reportToView.data) {
                handleViewReport(reportToView);
            } 
            // For new reports (REP-007 to REP-013), always generate fresh data
            else if (['REP-007', 'REP-008', 'REP-009', 'REP-010', 'REP-011', 'REP-012', 'REP-013'].includes(reportId)) {
                handleViewReport(reportToView);
            }
            // For REP-006 without data
            else if (reportId === 'REP-006' && !reportToView.data) {
                alert('Daily sales data is still loading. Please wait.');
            }
            else {
                alert('Report data not yet available or template is misconfigured. Please try again shortly.');
            }
        } else {
            alert('Report not found.');
        }
    };

    const handleGenerateAdhocReport = (reportId: string) => {
        const reportToView = reports.find(r => r.id === reportId);
        if (reportToView) {
            handleViewReport(reportToView);
        }
    };

    const reportOptionsForModal: ReportOption[] = reports.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        data: r.data,
        isLoading: loading[r.id] || false
    }));

    return (
        <>
            {/* Header with actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(true)}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Report
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setIsGenerateModalOpen(true)}>
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Generate Report
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Filter bar */}
            <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            placeholder="Search reports by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Sales">Sales</option>
                            <option value="Inventory">Inventory</option>
                            <option value="Financial">Financial</option>
                            <option value="Analytics">Analytics</option>
                        </select>
                        <select
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                        >
                            <option value="">All Formats</option>
                            <option value="PDF">PDF</option>
                            <option value="Excel">Excel</option>
                            <option value="Both">Both</option>
                        </select>
                        <Button variant="outline" size="sm" title="Filters apply automatically">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Report Name</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Last Generated</th>
                                <th className="px-6 py-3">Format</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map((report) => (
                                <tr key={report.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {report.name}
                                        {loading[report.id] && <span className="text-xs text-gray-500 ml-2">(loading...)</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {report.description}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getReportTypeBadgeClass(report.type)}`}>
                                            {report.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{report.lastGenerated}</td>
                                    <td className="px-6 py-4">{report.format}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={report.id === 'REP-006' && (loading[report.id] || !report.data)}
                                                onClick={() => handleViewReport(report)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={report.id === 'REP-006' && (loading[report.id] || !report.data)}
                                                onClick={() => handleDownloadReport(report)}
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredReports.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No reports match your filter criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Report Templates */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Report Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Daily Sales Report */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Daily Sales Report</h3>
                                <p className="text-sm text-gray-500 mt-1">Comprehensive daily sales breakdown by shop including all payment statuses</p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleGenerateFromTemplate('REP-006')}
                                disabled={loading['REP-006'] || !reports.find(r => r.id === 'REP-006')?.data}
                            >
                                Generate Report {loading['REP-006'] && '(Loading...)'}
                            </Button>
                        </div>
                    </div>

                    {/* Inventory Quality Summary */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Inventory Quality</h3>
                                <p className="text-sm text-gray-500 mt-1">Track low stock, overstock, dead stock, and turnover rates</p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <BarChart2 className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleGenerateFromTemplate('REP-007')}
                                disabled={loading['REP-007']}
                            >
                                Generate Report {loading['REP-007'] && '(Loading...)'}
                            </Button>
                        </div>
                    </div>

                    {/* Inventory Value Summary */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Inventory Value</h3>
                                <p className="text-sm text-gray-500 mt-1">Valuation using shop-specific costs by shop and category</p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleGenerateFromTemplate('REP-008')}
                                disabled={loading['REP-008']}
                            >
                                Generate Report {loading['REP-008'] && '(Loading...)'}
                            </Button>
                        </div>
                    </div>

                    {/* Sales by Customer */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Sales by Customer</h3>
                                <p className="text-sm text-gray-500 mt-1">Customer sales analysis with custom date range filters</p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <BarChart2 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleGenerateFromTemplate('REP-009')}
                                disabled={loading['REP-009']}
                            >
                                Generate Report {loading['REP-009'] && '(Loading...)'}
                            </Button>
                        </div>
                    </div>

                    {/* Sales by Product */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Sales by Product</h3>
                                <p className="text-sm text-gray-500 mt-1">Product sales showing quantity sold and revenue</p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleGenerateFromTemplate('REP-010')}
                                disabled={loading['REP-010']}
                            >
                                Generate Report {loading['REP-010'] && '(Loading...)'}
                            </Button>
                        </div>
                    </div>

                    {/* Profit by Product */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Profit by Product</h3>
                                <p className="text-sm text-gray-500 mt-1">Product profit analysis with margin calculations</p>
                            </div>
                            <div className="p-3 rounded-full bg-yellow-100">
                                <BarChart2 className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleGenerateFromTemplate('REP-011')}
                                disabled={loading['REP-011']}
                            >
                                Generate Report {loading['REP-011'] && '(Loading...)'}
                            </Button>
                        </div>
                    </div>

                    {/* Inventory Profit Margin */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Inventory Profit Margin</h3>
                                <p className="text-sm text-gray-500 mt-1">Profit margin analysis based on actual sold items</p>
                            </div>
                            <div className="p-3 rounded-full bg-yellow-100">
                                <FileText className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleGenerateFromTemplate('REP-012')}
                                disabled={loading['REP-012']}
                            >
                                Generate Report {loading['REP-012'] && '(Loading...)'}
                            </Button>
                        </div>
                    </div>

                    {/* Trending Products Analysis */}
                    <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Trending Products</h3>
                                <p className="text-sm text-gray-500 mt-1">AI-powered analysis with weekly/monthly trends</p>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100">
                                <BarChart2 className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleGenerateFromTemplate('REP-013')}
                                disabled={loading['REP-013']}
                            >
                                Generate Report {loading['REP-013'] && '(Loading...)'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals - Lazy loaded */}
            <Suspense fallback={<div>Loading modal...</div>}>
                {isDailySalesModalOpen && selectedDailySalesData && (
                    <DailySalesReportModal
                        isOpen={isDailySalesModalOpen}
                        onClose={() => setIsDailySalesModalOpen(false)}
                        reportName={selectedReportName}
                        reportData={selectedDailySalesData}
                    />
                )}
                {isScheduleModalOpen && (
                    <ScheduleReportModal
                        isOpen={isScheduleModalOpen}
                        onClose={() => setIsScheduleModalOpen(false)}
                    />
                )}
                {isGenerateModalOpen && (
                    <GenerateReportModal
                        isOpen={isGenerateModalOpen}
                        onClose={() => setIsGenerateModalOpen(false)}
                        reports={reportOptionsForModal}
                        onGenerate={handleGenerateAdhocReport}
                    />
                )}
                {isSalesReportModalOpen && selectedReportData && (
                    <SalesReportViewModal
                        isOpen={isSalesReportModalOpen}
                        onClose={() => setIsSalesReportModalOpen(false)}
                        reportName={selectedReportName}
                        reportData={selectedReportData}
                    />
                )}
                {isInventoryReportModalOpen && selectedReportData && (
                    <InventoryReportViewModal
                        isOpen={isInventoryReportModalOpen}
                        onClose={() => setIsInventoryReportModalOpen(false)}
                        reportName={selectedReportName}
                        reportData={selectedReportData}
                    />
                )}
                {isShopPerformanceModalOpen && selectedReportData && (
                    <ShopPerformanceViewModal
                        isOpen={isShopPerformanceModalOpen}
                        onClose={() => setIsShopPerformanceModalOpen(false)}
                        reportName={selectedReportName}
                        reportData={selectedReportData}
                    />
                )}
                {isProductPerformanceModalOpen && selectedReportData && (
                    <ProductPerformanceViewModal
                        isOpen={isProductPerformanceModalOpen}
                        onClose={() => setIsProductPerformanceModalOpen(false)}
                        reportName={selectedReportName}
                        reportData={selectedReportData}
                    />
                )}
                {isCustomerSalesModalOpen && selectedReportData && (
                    <CustomerSalesViewModal
                        isOpen={isCustomerSalesModalOpen}
                        onClose={() => setIsCustomerSalesModalOpen(false)}
                        reportName={selectedReportName}
                        reportData={selectedReportData}
                    />
                )}
            </Suspense>
        </>
    );
}