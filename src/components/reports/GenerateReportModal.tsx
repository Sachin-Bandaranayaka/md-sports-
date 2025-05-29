'use client';

import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { FileText } from "lucide-react";

interface ReportOption {
    id: string;
    name: string;
    description: string;
    data?: any; // To check if data is loaded
    isLoading: boolean;
}

interface GenerateReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reports: ReportOption[];
    onGenerate: (reportId: string) => void;
}

const GenerateReportModal: React.FC<GenerateReportModalProps> = ({ isOpen, onClose, reports, onGenerate }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Ad-hoc Report">
            <div className="space-y-4">
                <p className="text-gray-600">
                    Select a report from the list below to generate and view it.
                </p>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex items-start justify-between gap-4 ${report.isLoading || !report.data ? 'opacity-60 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (report.isLoading) {
                                    alert('This report is still loading. Please wait.');
                                    return;
                                }
                                if (!report.data) {
                                    alert('Report data is not available yet. Please wait for it to load.');
                                    return;
                                }
                                onGenerate(report.id);
                            }}
                        >
                            <div>
                                <h4 className="font-semibold text-gray-800">{report.name} {report.isLoading && <span className="text-xs font-normal text-gray-500">(Loading...)</span>}</h4>
                                <p className="text-sm text-gray-500">{report.description}</p>
                            </div>
                            <FileText className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default GenerateReportModal; 