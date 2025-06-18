'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Calendar, Clock, Mail, FileText } from 'lucide-react';

interface ScheduleReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        reportType: '',
        frequency: 'daily',
        time: '09:00',
        recipients: '',
        startDate: new Date().toISOString().split('T')[0],
        format: 'pdf'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const reportTypes = [
        { value: 'sales', label: 'Sales Report' },
        { value: 'inventory', label: 'Inventory Report' },
        { value: 'customer-payments', label: 'Customer Payments Report' },
        { value: 'product-performance', label: 'Product Performance Report' },
        { value: 'shop-performance', label: 'Shop Performance Report' }
    ];

    const frequencies = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' }
    ];

    const formats = [
        { value: 'pdf', label: 'PDF' },
        { value: 'excel', label: 'Excel' },
        { value: 'csv', label: 'CSV' }
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // TODO: Implement API call to save scheduled report
            console.log('Scheduling report:', formData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            alert('Report scheduled successfully!');
            onClose();
        } catch (error) {
            console.error('Error scheduling report:', error);
            alert('Failed to schedule report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule Report" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Report Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Report Type
                    </label>
                    <select
                        value={formData.reportType}
                        onChange={(e) => handleInputChange('reportType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select a report type</option>
                        {reportTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Frequency and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Frequency
                        </label>
                        <select
                            value={formData.frequency}
                            onChange={(e) => handleInputChange('frequency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {frequencies.map(freq => (
                                <option key={freq.value} value={freq.value}>
                                    {freq.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Time
                        </label>
                        <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => handleInputChange('time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                {/* Recipients */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Recipients
                    </label>
                    <textarea
                        value={formData.recipients}
                        onChange={(e) => handleInputChange('recipients', e.target.value)}
                        placeholder="Enter email addresses separated by commas"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        required
                    />
                </div>

                {/* Format */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Format
                    </label>
                    <select
                        value={formData.format}
                        onChange={(e) => handleInputChange('format', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {formats.map(format => (
                            <option key={format.value} value={format.value}>
                                {format.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Scheduling...' : 'Schedule Report'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ScheduleReportModal;