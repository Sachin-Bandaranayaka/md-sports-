'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { BarChart2, Download, Filter, Calendar, FileText } from 'lucide-react';

// Dummy data for reports
const reports = [
    {
        id: 'REP-001',
        name: 'Monthly Sales Summary',
        description: 'Summary of sales across all shops for the current month',
        type: 'Sales',
        lastGenerated: '2025-05-15',
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

export default function Reports() {
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
                        <Button variant="outline" size="sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Report
                        </Button>
                        <Button variant="primary" size="sm">
                            <BarChart2 className="w-4 h-4 mr-2" />
                            Generate Report
                        </Button>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="bg-tertiary p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                placeholder="Search reports..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                                <option value="">All Types</option>
                                <option value="sales">Sales</option>
                                <option value="inventory">Inventory</option>
                                <option value="financial">Financial</option>
                                <option value="analytics">Analytics</option>
                            </select>
                            <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                                <option value="">All Formats</option>
                                <option value="pdf">PDF</option>
                                <option value="excel">Excel</option>
                            </select>
                            <Button variant="outline" size="sm">
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
                                {reports.map((report) => (
                                    <tr key={report.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {report.name}
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
                                                <Button variant="ghost" size="sm">View</Button>
                                                <Button variant="ghost" size="sm">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
                                <Button variant="outline" className="w-full">Generate Report</Button>
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
                                <Button variant="outline" className="w-full">Generate Report</Button>
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
                                <Button variant="outline" className="w-full">Generate Report</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 