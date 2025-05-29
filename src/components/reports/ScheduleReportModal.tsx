'use client';

import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface ScheduleReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule Report">
            <div className="space-y-4">
                <p className="text-gray-600">
                    Report scheduling functionality is currently under development.
                    This feature will allow you to set up recurring generation and delivery of your key reports.
                </p>
                <p className="text-gray-600">
                    Please check back later for updates!
                </p>
                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ScheduleReportModal; 