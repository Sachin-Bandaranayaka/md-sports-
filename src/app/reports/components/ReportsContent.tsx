'use client';

import { Button } from '@/components/ui/Button';
import { BarChart2, Download, Filter, Calendar, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

// Lazy load heavy dependencies only when needed
import { lazy, Suspense } from 'react';

const DailySalesReportModal = lazy(() => import('@/components/reports/DailySalesReportModal'));
const ScheduleReportModal = lazy(() => import('@/components/reports/ScheduleReportModal'));
const GenerateReportModal = lazy(() => import('@/components/reports/GenerateReportModal'));

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

    const handleViewReport = (report: Report) => {
        setSelectedReportName(report.name);
        if (report.id === 'REP-006' && report.data) {
            setSelectedDailySalesData(report.data);
            setIsDailySalesModalOpen(true);
        } else {
            alert(`View functionality for "${report.name}" is not yet implemented or data is missing.`);
        }
        if (isGenerateModalOpen) setIsGenerateModalOpen(false);
    };

    const handleDownloadReport = async (report: Report) => {
        if (report.id === 'REP-006' && report.data) {
            try {
                if (report.format === 'Both' || report.format === 'PDF') {
                    // Lazy load PDF libraries
                    const { jsPDF, autoTable } = await loadPDFLibraries();
                    
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
                    // Lazy load Excel library
                    const XLSX = await loadExcelLibrary();
                    
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
                    
                    XLSX.writeFile(wb, `Daily_Sales_Report_${report.data.summary.date}.xlsx`);
                }
            } catch (error) {
                console.error('Error generating report:', error);
                alert('Error generating report. Please try again.');
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
            </Suspense>
        </>
    );
}