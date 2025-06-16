'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { BarChart2, Download, Filter, Calendar, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import SalesReportViewModal from '@/components/reports/SalesReportViewModal';
import InventoryReportViewModal from '@/components/reports/InventoryReportViewModal';
import CustomerPaymentsViewModal from '@/components/reports/CustomerPaymentsViewModal';
import ProductPerformanceViewModal from '@/components/reports/ProductPerformanceViewModal';
import ShopPerformanceViewModal from '@/components/reports/ShopPerformanceViewModal';
import DailySalesReportModal from '@/components/reports/DailySalesReportModal';
import ScheduleReportModal from '@/components/reports/ScheduleReportModal';
import GenerateReportModal from '@/components/reports/GenerateReportModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}
import * as XLSX from 'xlsx';

interface Report {
    id: string;
    name: string;
    description: string;
    type: string;
    lastGenerated: string;
    format: string;
    data?: any; // To store fetched data for the report
}

// Initial dummy data for reports
const initialReports: Report[] = [
    {
        id: 'REP-006',
        name: 'Daily Sales Report',
        description: 'Daily sales breakdown by shop with Excel and PDF export',
        type: 'Sales',
        lastGenerated: 'loading...',
        format: 'Both'
    },
    {
        id: 'REP-001',
        name: 'Monthly Sales Summary',
        description: 'Summary of sales across all shops for the current month',
        type: 'Sales',
        lastGenerated: 'loading...',
        format: 'PDF'
    },
    {
        id: 'REP-002',
        name: 'Inventory Status Report',
        description: 'Current inventory levels across all products and shops',
        type: 'Inventory',
        lastGenerated: '2025-05-14',
        format: 'Excel'
    },
    {
        id: 'REP-003',
        name: 'Customer Payment History',
        description: 'Payment history for all credit customers',
        type: 'Financial',
        lastGenerated: '2025-05-10',
        format: 'PDF'
    },
    {
        id: 'REP-004',
        name: 'Product Performance Analysis',
        description: 'Sales performance analysis by product category',
        type: 'Analytics',
        lastGenerated: '2025-05-08',
        format: 'Excel'
    },
    {
        id: 'REP-005',
        name: 'Shop Performance Comparison',
        description: 'Comparative analysis of all shop performance',
        type: 'Analytics',
        lastGenerated: '2025-05-01',
        format: 'PDF'
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

// Helper function to convert array of objects to CSV string
const convertToCSV = (data: any[], invoiceDetails: any) => {
    if (!data || data.length === 0 || !invoiceDetails) return '';

    const csvRows = [];
    // Add headers
    const headers = [
        'Invoice Number',
        'Invoice Date',
        'Customer Name',
        'Shop Name',
        'Product Name',
        'Quantity',
        'Price Per Unit',
        'Item Total'
    ];
    csvRows.push(headers.join(','));

    // Add data rows
    invoiceDetails.forEach((invoice: any) => {
        invoice.items.forEach((item: any) => {
            const row = [
                `"${invoice.invoiceNumber}"`,
                `"${new Date(invoice.createdAt).toLocaleDateString()}"`,
                `"${invoice.customer.name.replace(/"/g, '""')}"`,
                `"${(invoice.shop?.name || 'N/A').replace(/"/g, '""')}"`,
                `"${(item.product?.name || 'N/A').replace(/"/g, '""')}"`,
                item.quantity,
                item.price,
                item.total
            ];
            csvRows.push(row.join(','));
        });
    });

    return csvRows.join('\n');
};

const generateSalesSummaryPDF = (reportData: any, reportName: string) => {
    if (!reportData || !reportData.summary || !reportData.details) {
        console.error('Missing data for PDF generation');
        alert('Could not generate PDF: data is missing.');
        return;
    }

    const doc = new jsPDF();
    const { summary, details } = reportData;

    // Title
    doc.setFontSize(18);
    doc.text(reportName, 14, 22);

    // Summary Info
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report for: ${summary.month} ${summary.year}`, 14, 32);
    doc.text(`Total Sales: ${summary.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 14, 38);
    doc.text(`Number of Invoices: ${summary.numberOfInvoices.toLocaleString()}`, 14, 44);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 50);

    // Table Data
    const tableColumn = ["Invoice #", "Date", "Customer", "Shop", "Total Amount"];
    const tableRows: any[][] = [];

    details.forEach((invoice: any) => {
        const invoiceDate = new Date(invoice.createdAt).toLocaleDateString();
        const ticketData = [
            invoice.invoiceNumber,
            invoiceDate,
            invoice.customer.name,
            invoice.shop?.name || 'N/A',
            invoice.total.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })
        ];
        tableRows.push(ticketData);
    });

    // Add table
    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        headStyles: { fillColor: [22, 160, 133] }, // Example header color
        styles: { fontSize: 8 },
        columnStyles: {
            4: { halign: 'right' } // Align total amount to the right
        }
    });

    doc.save(`${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateCustomerPaymentsPDF = (reportData: any, reportName: string) => {
    if (!reportData || !reportData.summary || !reportData.details) {
        console.error('Missing data for PDF generation');
        alert('Could not generate PDF: data is missing.');
        return;
    }

    const doc = new jsPDF();
    const { summary, details, message } = reportData;

    // Title
    doc.setFontSize(18);
    doc.text(reportName, 14, 22);

    // Summary Info / Message
    doc.setFontSize(11);
    doc.setTextColor(100);
    let startY = 32;

    if (message) {
        doc.text(message, 14, startY);
        startY += 6;
    } else if (summary) {
        doc.text(`Total Payments: ${summary.totalPaymentsAmount.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 14, startY);
        startY += 6;
        doc.text(`Number of Transactions: ${summary.numberOfPayments.toLocaleString()}`, 14, startY);
        startY += 6;
        doc.text(`Credit Customers w/ Payments: ${summary.numberOfCreditCustomersWithPayments.toLocaleString()}`, 14, startY);
        startY += 6;
    }
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, 14, startY);
    startY += 10; // Space before table

    // Table Data
    const tableColumn = ["Customer", "Date", "Method", "Reference #", "Invoice #", "Amount"];
    const tableRows: any[][] = [];

    if (details && details.length > 0) {
        details.forEach((payment: any) => {
            const paymentDate = new Date(payment.paymentDate).toLocaleString();
            const rowData = [
                payment.customerName,
                paymentDate,
                payment.paymentMethod || 'N/A',
                payment.referenceNumber || 'N/A',
                payment.invoiceNumber || 'N/A',
                payment.paymentAmount.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })
            ];
            tableRows.push(rowData);
        });
    }

    if (tableRows.length > 0) {
        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            headStyles: { fillColor: [22, 160, 133] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 40 }, // Customer
                1: { cellWidth: 35 }, // Date
                2: { cellWidth: 20 }, // Method
                3: { cellWidth: 25 }, // Reference
                4: { cellWidth: 25 }, // Invoice
                5: { halign: 'right', cellWidth: 25 } // Amount
            }
        });
    } else if (!message) {
        doc.text("No payment details found for credit customers.", 14, startY);
    }

    doc.save(`${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateShopPerformancePDF = (reportData: any, reportName: string) => {
    if (!reportData || !reportData.summary || !reportData.details) {
        console.error('Missing data for PDF generation');
        alert('Could not generate PDF: data is missing.');
        return;
    }

    const doc = new jsPDF();
    const { summary, details } = reportData;

    // Title
    doc.setFontSize(18);
    doc.text(reportName, 14, 22);

    // Summary Info
    doc.setFontSize(11);
    doc.setTextColor(100);
    let startY = 32;
    doc.text(`Report for: ${summary.month} ${summary.year}`, 14, startY);
    startY += 6;
    doc.text(`Total Shops Analyzed: ${summary.totalShopsAnalyzed.toLocaleString()}`, 14, startY);
    startY += 6;
    const overallTotalSales = details.reduce((sum: number, shop: any) => sum + shop.totalSalesAmount, 0);
    doc.text(`Overall Total Sales: ${overallTotalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 14, startY);
    startY += 6;
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, 14, startY);
    startY += 10; // Space before table

    // Table Data
    const tableColumn = ["Shop Name", "Location", "Total Sales (LKR)", "Transactions", "Qty Sold", "Avg. Txn Value (LKR)"];
    const tableRows: any[][] = [];

    details.forEach((shop: any) => {
        const rowData = [
            shop.shopName,
            shop.location || 'N/A',
            shop.totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            shop.numberOfTransactions.toLocaleString(),
            shop.totalQuantitySold.toLocaleString(),
            shop.averageTransactionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ];
        tableRows.push(rowData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        headStyles: { fillColor: [22, 160, 133] },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 35 }, // Shop Name
            1: { cellWidth: 30 }, // Location
            2: { halign: 'right', cellWidth: 30 }, // Total Sales
            3: { halign: 'right', cellWidth: 25 }, // Transactions
            4: { halign: 'right', cellWidth: 20 }, // Qty Sold
            5: { halign: 'right', cellWidth: 30 }  // Avg. Txn Value
        }
    });

    doc.save(`${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateInventoryExcel = (reportData: any, reportName: string) => {
    if (!reportData || !reportData.details) {
        console.error('Missing data for Excel generation');
        alert('Could not generate Excel: data is missing.');
        return;
    }

    const { details } = reportData;
    const worksheetData = [
        ['Product Name', 'SKU', 'Barcode', 'Category', 'Shop Name', 'Quantity', 'Price (Retail)', 'Total Value (Retail)'],
        ...details.map((item: any) => [
            item.productName,
            item.sku || '',
            item.barcode || '',
            item.category,
            item.shopName,
            item.quantity,
            item.price,
            item.totalValue
        ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Status');

    // Adjust column widths (optional, but improves readability)
    const columnWidths = [
        { wch: 30 }, // Product Name
        { wch: 15 }, // SKU
        { wch: 15 }, // Barcode
        { wch: 20 }, // Category
        { wch: 20 }, // Shop Name
        { wch: 10 }, // Quantity
        { wch: 15 }, // Price
        { wch: 20 }  // Total Value
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

const generateProductPerformanceExcel = (reportData: any, reportName: string) => {
    if (!reportData || !reportData.details) {
        console.error('Missing data for Excel generation');
        alert('Could not generate Excel: data is missing.');
        return;
    }

    const { details, summary } = reportData;
    const worksheetData: any[][] = [];

    // Header
    worksheetData.push([`Product Performance Analysis for ${summary?.month} ${summary?.year}`]);
    worksheetData.push([]); // Blank row
    worksheetData.push([
        'Category Name',
        'Product Name',
        'SKU',
        'Total Quantity Sold',
        'Total Sales Amount (LKR)'
    ]);

    details.forEach((category: any) => {
        category.products.forEach((product: any) => {
            worksheetData.push([
                category.categoryName,
                product.productName,
                product.sku || '',
                product.totalQuantitySold,
                product.totalSalesAmount
            ]);
        });
        // Add a summary row for the category
        worksheetData.push([
            `CATEGORY TOTAL: ${category.categoryName}`,
            '', // Product Name placeholder
            '', // SKU placeholder
            category.totalCategoryQuantity,
            category.totalCategorySales
        ]);
        worksheetData.push([]); // Blank row for separation
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Performance');

    // Adjust column widths
    const columnWidths = [
        { wch: 25 }, // Category Name
        { wch: 30 }, // Product Name
        { wch: 15 }, // SKU
        { wch: 20 }, // Total Quantity Sold
        { wch: 25 }  // Total Sales Amount
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

interface ReportOption {
    id: string;
    name: string;
    description: string;
    data?: any;
    isLoading: boolean;
}

export default function Reports() {
    const [reports, setReports] = useState<Report[]>(initialReports);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
    const [selectedSaleReportData, setSelectedSaleReportData] = useState<any | null>(null);

    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [selectedInventoryReportData, setSelectedInventoryReportData] = useState<any | null>(null);

    const [isCustomerPaymentsModalOpen, setIsCustomerPaymentsModalOpen] = useState(false);
    const [selectedCustomerPaymentsData, setSelectedCustomerPaymentsData] = useState<any | null>(null);

    const [isProductPerformanceModalOpen, setIsProductPerformanceModalOpen] = useState(false);
    const [selectedProductPerformanceData, setSelectedProductPerformanceData] = useState<any | null>(null);

    const [isShopPerformanceModalOpen, setIsShopPerformanceModalOpen] = useState(false);
    const [selectedShopPerformanceData, setSelectedShopPerformanceData] = useState<any | null>(null);

    const [isDailySalesModalOpen, setIsDailySalesModalOpen] = useState(false);
    const [selectedDailySalesData, setSelectedDailySalesData] = useState<any | null>(null);

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    const [selectedReportName, setSelectedReportName] = useState<string>('');

    // State for Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedFormat, setSelectedFormat] = useState('');
    const [filteredReports, setFilteredReports] = useState<Report[]>(initialReports);

    useEffect(() => {
        const fetchSalesSummary = async () => {
            setLoading(prev => ({ ...prev, 'REP-001': true }));
            setError(null);
            try {
                const response = await fetch('/api/reports/sales');
                if (!response.ok) {
                    throw new Error(`Failed to fetch sales summary: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.success) {
                    setReports(prevReports => prevReports.map(report => {
                        if (report.id === 'REP-001') {
                            return {
                                ...report,
                                description: `Sales for ${data.summary.month} ${data.summary.year}: Total ${data.summary.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}, ${data.summary.numberOfInvoices} invoices.`,
                                lastGenerated: new Date().toLocaleDateString('en-CA'),
                                data: data // Store full API response { summary: ..., details: ... }
                            };
                        }
                        return report;
                    }));
                } else {
                    throw new Error(data.message || 'Failed to fetch sales summary');
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message);
                setReports(prevReports => prevReports.map(report =>
                    report.id === 'REP-001' ? { ...report, description: 'Error loading sales data', lastGenerated: 'Error' } : report
                ));
            }
            setLoading(prev => ({ ...prev, 'REP-001': false }));
        };

        const fetchInventoryStatus = async () => {
            setLoading(prev => ({ ...prev, 'REP-002': true }));
            try {
                const response = await fetch('/api/reports/inventory');
                if (!response.ok) {
                    throw new Error(`Failed to fetch inventory status: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.success) {
                    setReports(prevReports => prevReports.map(report => {
                        if (report.id === 'REP-002') {
                            const totalItems = data.details.reduce((sum: number, item: any) => sum + item.quantity, 0);
                            const totalValue = data.details.reduce((sum: number, item: any) => sum + item.totalValue, 0);
                            return {
                                ...report,
                                description: `Total ${totalItems.toLocaleString()} items. Total value (Retail): ${totalValue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}.`,
                                lastGenerated: new Date(data.generatedAt).toLocaleDateString('en-CA'),
                                data: data // Store full API response { details: ..., generatedAt: ... }
                            };
                        }
                        return report;
                    }));
                } else {
                    throw new Error(data.message || 'Failed to fetch inventory status');
                }
            } catch (err: any) {
                console.error(err);
                setReports(prevReports => prevReports.map(report =>
                    report.id === 'REP-002' ? { ...report, description: 'Error loading inventory data', lastGenerated: 'Error' } : report
                ));
            }
            setLoading(prev => ({ ...prev, 'REP-002': false }));
        };

        const fetchCustomerPayments = async () => {
            setLoading(prev => ({ ...prev, 'REP-003': true }));
            try {
                const response = await fetch('/api/reports/customer-payments');
                if (!response.ok) {
                    throw new Error(`Failed to fetch customer payments: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.success) {
                    setReports(prevReports => prevReports.map(report => {
                        if (report.id === 'REP-003') {
                            let description = `Payment history for all credit customers.`;
                            if (data.message) {
                                description = data.message;
                            } else if (data.summary) {
                                description = `Total payments: ${data.summary.totalPaymentsAmount.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })} from ${data.summary.numberOfPayments} transactions by ${data.summary.numberOfCreditCustomersWithPayments} credit customer(s).`;
                            }
                            return {
                                ...report,
                                description,
                                lastGenerated: new Date(data.generatedAt).toLocaleDateString('en-CA'),
                                data: data // Store full API response { details: ..., summary: ..., generatedAt: ..., message?: ...}
                            };
                        }
                        return report;
                    }));
                } else {
                    throw new Error(data.message || 'Failed to fetch customer payments');
                }
            } catch (err: any) {
                console.error(err);
                setReports(prevReports => prevReports.map(report =>
                    report.id === 'REP-003' ? { ...report, description: 'Error loading payment data', lastGenerated: 'Error' } : report
                ));
            }
            setLoading(prev => ({ ...prev, 'REP-003': false }));
        };

        const fetchProductPerformance = async () => {
            setLoading(prev => ({ ...prev, 'REP-004': true }));
            try {
                const response = await fetch('/api/reports/product-performance');
                if (!response.ok) {
                    throw new Error(`Failed to fetch product performance: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.success) {
                    setReports(prevReports => prevReports.map(report => {
                        if (report.id === 'REP-004') {
                            let description = `Sales performance analysis by product category for ${data.summary?.month} ${data.summary?.year}.`;
                            if (data.message) {
                                description = data.message;
                            } else if (data.summary) {
                                description = `Analysis for ${data.summary.month} ${data.summary.year}: ${data.summary.overallTotalProductsSold.toLocaleString()} items sold across ${data.summary.numberOfCategoriesWithSales} categories, totaling ${data.summary.overallTotalRevenue.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}.`;
                            }
                            return {
                                ...report,
                                description,
                                lastGenerated: new Date(data.generatedAt).toLocaleDateString('en-CA'),
                                data: data
                            };
                        }
                        return report;
                    }));
                } else {
                    throw new Error(data.message || 'Failed to fetch product performance');
                }
            } catch (err: any) {
                console.error(err);
                setReports(prevReports => prevReports.map(report =>
                    report.id === 'REP-004' ? { ...report, description: 'Error loading product performance data', lastGenerated: 'Error' } : report
                ));
            }
            setLoading(prev => ({ ...prev, 'REP-004': false }));
        };

        const fetchShopPerformance = async () => {
            setLoading(prev => ({ ...prev, 'REP-005': true }));
            try {
                const response = await fetch('/api/reports/shop-performance');
                if (!response.ok) {
                    throw new Error(`Failed to fetch shop performance: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.success) {
                    setReports(prevReports => prevReports.map(report => {
                        if (report.id === 'REP-005') {
                            let description = `Comparative analysis of all shop performance for ${data.summary?.month} ${data.summary?.year}.`;
                            if (data.message) {
                                description = data.message;
                            } else if (data.summary && data.details) {
                                const totalOverallSales = data.details.reduce((sum: number, shop: any) => sum + shop.totalSalesAmount, 0);
                                description = `Shop comparison for ${data.summary.month} ${data.summary.year}: ${data.summary.totalShopsAnalyzed} shops analyzed. Overall sales: ${totalOverallSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}.`;
                            }
                            return {
                                ...report,
                                description,
                                lastGenerated: new Date(data.generatedAt).toLocaleDateString('en-CA'),
                                data: data
                            };
                        }
                        return report;
                    }));
                } else {
                    throw new Error(data.message || 'Failed to fetch shop performance');
                }
            } catch (err: any) {
                console.error(err);
                setReports(prevReports => prevReports.map(report =>
                    report.id === 'REP-005' ? { ...report, description: 'Error loading shop performance data', lastGenerated: 'Error' } : report
                ));
            }
            setLoading(prev => ({ ...prev, 'REP-005': false }));
        };

        const fetchDailySales = async () => {
            setLoading(prev => ({ ...prev, 'REP-006': true }));
            try {
                const response = await fetch('/api/reports/daily-sales');
                if (!response.ok) {
                    throw new Error(`Failed to fetch daily sales: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.success) {
                    setReports(prevReports => prevReports.map(report => {
                        if (report.id === 'REP-006') {
                            const totalSales = data.summary.totalSales;
                            const totalShops = data.summary.totalShops;
                            return {
                                ...report,
                                description: `Daily sales for ${data.summary.date}: ${totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })} across ${totalShops} shops.`,
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
                setReports(prevReports => prevReports.map(report =>
                    report.id === 'REP-006' ? { ...report, description: 'Error loading daily sales data', lastGenerated: 'Error' } : report
                ));
            }
            setLoading(prev => ({ ...prev, 'REP-006': false }));
        };

        fetchDailySales();
        fetchSalesSummary();
        fetchInventoryStatus();
        fetchCustomerPayments();
        fetchProductPerformance();
        fetchShopPerformance();
    }, []);

    // useEffect for filtering reports when data or filter criteria change
    useEffect(() => {
        let currentReports = reports.map(report => {
            // Ensure we have the latest data description from the main `reports` state,
            // rather than `initialReports` which has placeholder descriptions.
            const liveReportData = reports.find(r => r.id === report.id);
            return liveReportData || report; // Fallback to original if somehow not found (should not happen)
        });

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

    const handleViewReport = (report: Report) => {
        setSelectedReportName(report.name);
        if (report.id === 'REP-001' && report.data) {
            setSelectedSaleReportData(report.data);
            setIsSalesModalOpen(true);
        } else if (report.id === 'REP-002' && report.data) {
            setSelectedInventoryReportData(report.data);
            setIsInventoryModalOpen(true);
        } else if (report.id === 'REP-003' && report.data) {
            setSelectedCustomerPaymentsData(report.data);
            setIsCustomerPaymentsModalOpen(true);
        } else if (report.id === 'REP-004' && report.data) {
            setSelectedProductPerformanceData(report.data);
            setIsProductPerformanceModalOpen(true);
        } else if (report.id === 'REP-005' && report.data) {
            setSelectedShopPerformanceData(report.data);
            setIsShopPerformanceModalOpen(true);
        } else if (report.id === 'REP-006' && report.data) {
            setSelectedDailySalesData(report.data);
            setIsDailySalesModalOpen(true);
        } else {
            alert(`View functionality for "${report.name}" is not yet implemented or data is missing.`);
        }
        if (isGenerateModalOpen) setIsGenerateModalOpen(false);
    };

    const handleDownloadReport = (report: Report) => {
        if (report.id === 'REP-001' && report.data) {
            if (report.format === 'PDF') {
                generateSalesSummaryPDF(report.data, report.name);
            } else { // Fallback or other formats like CSV
                const csvData = convertToCSV(report.data.details, report.data.details);
                if (csvData) {
                    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `Monthly_Sales_Summary_${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } else {
                    alert('No data available to download for sales report.');
                }
            }
        } else if (report.id === 'REP-002' && report.data && report.data.details) {
            if (report.format === 'Excel') {
                generateInventoryExcel(report.data, report.name);
            } else {
                // CSV fallback for REP-002
                const headers = [
                    'Product Name', 'SKU', 'Barcode', 'Category', 'Shop Name',
                    'Quantity', 'Price (Retail)', 'Total Value (Retail)'
                ];
                const csvRows = [headers.join(',')];
                report.data.details.forEach((item: any) => {
                    const row = [
                        `"${item.productName.replace(/"/g, '""')}"`,
                        `"${(item.sku || '').replace(/"/g, '""')}"`,
                        `"${(item.barcode || '').replace(/"/g, '""')}"`,
                        `"${item.category.replace(/"/g, '""')}"`,
                        `"${item.shopName.replace(/"/g, '""')}"`,
                        item.quantity,
                        item.price,
                        item.totalValue
                    ];
                    csvRows.push(row.join(','));
                });
                const csvData = csvRows.join('\n');
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `Inventory_Status_Report_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } else if (report.id === 'REP-003' && report.data) {
            if (report.format === 'PDF') {
                generateCustomerPaymentsPDF(report.data, report.name);
            } else {
                // Fallback to CSV for REP-003
                if (report.data.details) {
                    const headers = [
                        'Payment ID', 'Customer Name', 'Payment Date', 'Payment Amount',
                        'Payment Method', 'Reference Number', 'Invoice Number'
                    ];
                    const csvRows = [headers.join(',')];
                    report.data.details.forEach((payment: any) => {
                        const row = [
                            payment.paymentId,
                            `"${payment.customerName.replace(/"/g, '""')}"`,
                            `"${new Date(payment.paymentDate).toLocaleString()}"`,
                            payment.paymentAmount,
                            `"${(payment.paymentMethod || '').replace(/"/g, '""')}"`,
                            `"${(payment.referenceNumber || '').replace(/"/g, '""')}"`,
                            `"${(payment.invoiceNumber || 'N/A').replace(/"/g, '""')}"`
                        ];
                        csvRows.push(row.join(','));
                    });
                    const csvData = csvRows.join('\n');
                    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `Customer_Payment_History_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } else {
                    alert('No details available to download CSV for Customer Payment History.');
                }
            }
        } else if (report.id === 'REP-004' && report.data && report.data.details) {
            if (report.format === 'Excel') {
                generateProductPerformanceExcel(report.data, report.name);
            } else {
                // CSV fallback for REP-004
                const headers = [
                    'Category Name', 'Product Name', 'SKU',
                    'Total Quantity Sold', 'Total Sales Amount (LKR)'
                ];
                const csvRows = [headers.join(',')];
                report.data.details.forEach((category: any) => {
                    category.products.forEach((product: any) => {
                        const row = [
                            `"${category.categoryName.replace(/"/g, '""')}"`,
                            `"${product.productName.replace(/"/g, '""')}"`,
                            `"${(product.sku || '').replace(/"/g, '""')}"`,
                            product.totalQuantitySold,
                            product.totalSalesAmount
                        ];
                        csvRows.push(row.join(','));
                    });
                    csvRows.push([
                        `"CATEGORY TOTAL: ${category.categoryName.replace(/"/g, '""')}"`,
                        '', '',
                        category.totalCategoryQuantity,
                        category.totalCategorySales
                    ].join(','));
                    csvRows.push(['', '', '', '', ''].join(','));
                });
                const csvData = csvRows.join('\n');
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `Product_Performance_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } else if (report.id === 'REP-005' && report.data && report.data.details) {
            if (report.format === 'PDF') {
                generateShopPerformancePDF(report.data, report.name);
            } else {
                // Fallback to CSV for REP-005
                const headers = [
                    'Shop Name', 'Location', 'Total Sales Amount (LKR)',
                    'Number of Transactions', 'Total Quantity Sold', 'Avg. Transaction Value (LKR)'
                ];
                const csvRows = [headers.join(',')];
                report.data.details.forEach((shop: any) => {
                    const row = [
                        `"${shop.shopName.replace(/"/g, '""')}"`,
                        `"${(shop.location || '').replace(/"/g, '""')}"`,
                        shop.totalSalesAmount,
                        shop.numberOfTransactions,
                        shop.totalQuantitySold,
                        shop.averageTransactionValue
                    ];
                    csvRows.push(row.join(','));
                });
                const csvData = csvRows.join('\n');
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `Shop_Performance_Comparison_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } else if (report.id === 'REP-006' && report.data) {
            // Daily Sales Report - supports both PDF and Excel
            if (report.format === 'Both' || report.format === 'PDF') {
                // Generate PDF using the same logic as in DailySalesReportModal
                const doc = new jsPDF();
                
                // Title
                doc.setFontSize(20);
                doc.text('Daily Sales Report', 20, 20);
                
                // Date and summary
                doc.setFontSize(12);
                doc.text(`Date: ${report.data.summary.date}`, 20, 35);
                doc.text(`Total Sales: ${report.data.summary.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'LKR' })}`, 20, 45);
                doc.text(`Total Invoices: ${report.data.summary.totalInvoices}`, 20, 55);
                doc.text(`Active Shops: ${report.data.summary.numberOfShops}`, 20, 65);
                
                // Shop summary table
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
                    startY: 75,
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [66, 139, 202] }
                });
                
                doc.save(`Daily_Sales_Report_${report.data.summary.date}.pdf`);
            }
            
            if (report.format === 'Both' || report.format === 'Excel') {
                // Generate Excel using the same logic as in DailySalesReportModal
                const wb = XLSX.utils.book_new();
                
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
                
                // Detailed invoices sheet
                const detailedData = [
                    ['Invoice Number', 'Shop', 'Customer', 'Total Amount', 'Payment Status', 'Created At', 'Items']
                ];
                report.data.shopData.forEach((shop: any) => {
                    shop.invoices.forEach((invoice: any) => {
                        const itemsText = invoice.items.map((item: any) => 
                            `${item.productName} (${item.quantity}x${item.unitPrice})`
                        ).join('; ');
                        
                        detailedData.push([
                            invoice.invoiceNumber,
                            shop.shopName,
                            invoice.customerName || 'Walk-in Customer',
                            invoice.totalAmount,
                            invoice.paymentStatus,
                            new Date(invoice.createdAt).toLocaleString(),
                            itemsText
                        ]);
                    });
                });
                const detailedWs = XLSX.utils.aoa_to_sheet(detailedData);
                XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed Invoices');
                
                XLSX.writeFile(wb, `Daily_Sales_Report_${report.data.summary.date}.xlsx`);
            }
        } else {
            alert(`Download functionality for "${report.name}" is not yet implemented or data is missing.`);
        }
    };

    const handleGenerateFromTemplate = (reportId: string) => {
        const reportToView = reports.find(r => r.id === reportId);
        if (reportToView && reportToView.data) {
            if (loading[reportId]) {
                alert('Report data is still loading. Please wait.');
                return;
            }
            handleViewReport(reportToView);
        } else if (reportToView && loading[reportId]) {
            alert('Report data is still loading. Please wait.');
        } else {
            alert('Report data not yet available or template is misconfigured. Please try again shortly.');
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
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-500">Generate and view business reports</p>
                    </div>
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
                            </select>
                            <Button variant="outline" size="sm" title="Filters apply automatically">
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Reports List - Now uses filteredReports */}
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
                                                    disabled={(report.id === 'REP-001' || report.id === 'REP-002' || report.id === 'REP-003' || report.id === 'REP-004' || report.id === 'REP-005') && (loading[report.id] || !report.data)}
                                                    onClick={() => handleViewReport(report)}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={(report.id === 'REP-001' || report.id === 'REP-002' || report.id === 'REP-003' || report.id === 'REP-004' || report.id === 'REP-005') && (loading[report.id] || !report.data)}
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
                        <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Sales by Shop</h3>
                                    <p className="text-sm text-gray-500 mt-1">Compare sales performance across different shop locations</p>
                                </div>
                                <div className="p-3 rounded-full bg-blue-100">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-6">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleGenerateFromTemplate('REP-005')}
                                    disabled={loading['REP-005'] || !reports.find(r => r.id === 'REP-005')?.data}
                                >
                                    Generate Report {loading['REP-005'] && '(Loading...)'}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Inventory Status</h3>
                                    <p className="text-sm text-gray-500 mt-1">Current inventory levels with low stock warnings</p>
                                </div>
                                <div className="p-3 rounded-full bg-green-100">
                                    <FileText className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="mt-6">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleGenerateFromTemplate('REP-002')}
                                    disabled={loading['REP-002'] || !reports.find(r => r.id === 'REP-002')?.data}
                                >
                                    Generate Report {loading['REP-002'] && '(Loading...)'}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
                                    <p className="text-sm text-gray-500 mt-1">Monthly financial overview with revenue and expenses</p>
                                </div>
                                <div className="p-3 rounded-full bg-yellow-100">
                                    <FileText className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                            <div className="mt-6">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleGenerateFromTemplate('REP-001')}
                                    disabled={loading['REP-001'] || !reports.find(r => r.id === 'REP-001')?.data}
                                >
                                    Generate Report {loading['REP-001'] && '(Loading...)'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isSalesModalOpen && selectedSaleReportData && (
                <SalesReportViewModal
                    isOpen={isSalesModalOpen}
                    onClose={() => setIsSalesModalOpen(false)}
                    reportName={selectedReportName}
                    reportData={selectedSaleReportData}
                />
            )}
            {isInventoryModalOpen && selectedInventoryReportData && (
                <InventoryReportViewModal
                    isOpen={isInventoryModalOpen}
                    onClose={() => setIsInventoryModalOpen(false)}
                    reportName={selectedReportName}
                    reportData={selectedInventoryReportData}
                />
            )}
            {isCustomerPaymentsModalOpen && selectedCustomerPaymentsData && (
                <CustomerPaymentsViewModal
                    isOpen={isCustomerPaymentsModalOpen}
                    onClose={() => setIsCustomerPaymentsModalOpen(false)}
                    reportName={selectedReportName}
                    reportData={selectedCustomerPaymentsData}
                />
            )}
            {isProductPerformanceModalOpen && selectedProductPerformanceData && (
                <ProductPerformanceViewModal
                    isOpen={isProductPerformanceModalOpen}
                    onClose={() => setIsProductPerformanceModalOpen(false)}
                    reportName={selectedReportName}
                    reportData={selectedProductPerformanceData}
                />
            )}
            {isShopPerformanceModalOpen && selectedShopPerformanceData && (
                <ShopPerformanceViewModal
                    isOpen={isShopPerformanceModalOpen}
                    onClose={() => setIsShopPerformanceModalOpen(false)}
                    reportName={selectedReportName}
                    reportData={selectedShopPerformanceData}
                />
            )}
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
        </MainLayout>
    );
}