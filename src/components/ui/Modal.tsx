'use client';

import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    footer?: React.ReactNode; // Optional footer content
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out" onClick={onClose}>
            <div
                className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col overflow-hidden`}
                onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
            >
                {/* Modal Header */}
                {title && (
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-grow">
                    {children}
                </div>

                {/* Modal Footer */}
                {footer && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal; 