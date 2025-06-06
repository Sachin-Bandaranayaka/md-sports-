'use client';

import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import { SalesQuotation, QuotationItem } from '@/types';
import { Calendar, User, FileText } from 'lucide-react';

interface QuotationTemplateProps {
    quotation: SalesQuotation;
    companyInfo?: {
        name: string;
        address: string;
        phone: string;
        email: string;
        logo?: string;
    };
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const QuotationTemplate: React.FC<QuotationTemplateProps> = ({
    quotation,
    companyInfo = {
        name: "MS Sports Management Pvt. Ltd",
        address: "No 28, Malalsekara Mawatha, Colombo 07",
        phone: "+94 11 234 5678",
        email: "info@mssports.lk"
    }
}) => {
    // Check if quotation is expired
    const isExpired = new Date(quotation.expiryDate) < new Date();
    const isAccepted = quotation.status === 'accepted';
    const isRejected = quotation.status === 'rejected';

    return (
        <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header with Blue Theme */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg mb-8">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        {/* Company Logo/Brand with Blue Theme */}
                        <div className="mr-4">
                            <div className="bg-white text-blue-600 px-3 py-1 text-sm font-bold rounded">
                                SPORTS
                            </div>
                            <div className="bg-blue-900 text-white px-3 py-1 text-lg font-bold mt-1">
                                MS
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{companyInfo.name}</h1>
                            <p className="text-blue-100 text-sm">{companyInfo.address}</p>
                            <p className="text-blue-100 text-sm">{companyInfo.phone} | {companyInfo.email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-bold mb-2">QUOTATION</h2>
                        <div className="bg-white text-blue-600 px-4 py-2 rounded font-bold">
                            #{quotation.quotationNumber}
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer and Quotation Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Information Card */}
                <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-600">
                    <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Customer Information
                    </h3>
                    <div className="text-black">
                        <div className="font-bold text-xl mb-2">{quotation.customerName}</div>
                        <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded inline-block">
                            Customer ID: {quotation.customerId}
                        </div>
                    </div>
                </div>

                {/* Quotation Details Card */}
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600">
                    <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Quotation Details
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Issue Date:</span>
                            <span className="font-medium">{formatDate(quotation.date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Valid Until:</span>
                            <span className={`font-medium ${
                                isExpired ? 'text-red-600' : 'text-green-600'
                            }`}>
                                {formatDate(quotation.expiryDate)}
                                {isExpired && <span className="ml-2 text-xs">(EXPIRED)</span>}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Badge */}
            <div className="mb-6 text-center">
                <div className="inline-flex items-center bg-white border-2 border-blue-600 rounded-full px-6 py-3 shadow-lg">
                    <span className="text-blue-600 font-bold mr-3">Current Status:</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${
                        quotation.status === 'pending' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            quotation.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-300' :
                                quotation.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                    quotation.status === 'expired' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                                        'bg-gray-100 text-gray-800 border-gray-300'
                    }`}>
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                    </span>
                </div>
            </div>

            {/* Items Table with Blue Theme */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center">
                    <FileText className="w-6 h-6 mr-2" />
                    Quoted Items
                </h3>
                <div className="overflow-hidden rounded-lg border border-blue-200 shadow-lg">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                <th className="px-6 py-4 text-left font-bold">Product Details</th>
                                <th className="px-4 py-4 text-center font-bold">Quantity</th>
                                <th className="px-4 py-4 text-right font-bold">Unit Price</th>
                                <th className="px-6 py-4 text-right font-bold">Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.items.map((item, index) => (
                                <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                                    <td className="px-6 py-4 border-b border-blue-100">
                                        <div className="font-semibold text-gray-900">{item.productName}</div>
                                        <div className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded inline-block mt-1">
                                            ID: {item.productId}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center border-b border-blue-100 font-medium">{item.quantity}</td>
                                    <td className="px-4 py-4 text-right border-b border-blue-100 font-medium">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-6 py-4 text-right border-b border-blue-100 font-bold text-blue-600">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Totals Section with Blue Theme */}
            <div className="flex justify-end mb-8">
                <div className="w-96">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200 shadow-lg">
                        <h4 className="text-lg font-bold text-blue-600 mb-4">Quotation Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-blue-200">
                                <span className="text-gray-700">Subtotal:</span>
                                <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
                            </div>
                            {quotation.discount > 0 && (
                                <div className="flex justify-between py-2 border-b border-blue-200">
                                    <span className="text-gray-700">Discount:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(quotation.discount)}</span>
                                </div>
                            )}
                            {quotation.tax > 0 && (
                                <div className="flex justify-between py-2 border-b border-blue-200">
                                    <span className="text-gray-700">Tax:</span>
                                    <span className="font-medium">{formatCurrency(quotation.tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-3 border-t-2 border-blue-300 bg-white rounded px-4 shadow">
                                <span className="text-blue-600 font-bold text-lg">TOTAL AMOUNT</span>
                                <span className="text-blue-600 font-bold text-xl">{formatCurrency(quotation.total)}</span>
                            </div>
                            <div className="text-center mt-4">
                                <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Valid until {formatDate(quotation.expiryDate)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Stamp */}
            {(isAccepted || isRejected || isExpired) && (
                <div className="text-center mb-8">
                    <div className={`inline-block border-4 px-8 py-2 ${isAccepted ? 'border-green-600' :
                            isRejected ? 'border-red-600' :
                                'border-gray-600'
                        }`}>
                        <span className={`text-xl font-bold ${isAccepted ? 'text-green-600' :
                                isRejected ? 'text-red-600' :
                                    'text-gray-600'
                            }`}>
                            {isAccepted ? 'ACCEPTED' :
                                isRejected ? 'REJECTED' :
                                    'EXPIRED'}
                        </span>
                    </div>
                </div>
            )}

            {/* Notes */}
            {quotation.notes && (
                <div className="mb-8">
                    <h4 className="font-bold text-black mb-2">Notes:</h4>
                    <div className="bg-gray-50 p-4 rounded border">
                        <p className="text-black whitespace-pre-wrap">{quotation.notes}</p>
                    </div>
                </div>
            )}

            {/* Terms and Conditions */}
            <div className="mb-8">
                <h4 className="font-bold text-black mb-2">Terms & Conditions:</h4>
                <div className="bg-gray-50 p-4 rounded border">
                    <ul className="text-black text-sm space-y-1">
                        <li>• This quotation is valid until the expiry date mentioned above.</li>
                        <li>• Prices are subject to change without prior notice.</li>
                        <li>• Payment terms: As per agreed terms and conditions.</li>
                        <li>• Delivery terms: As per agreed terms and conditions.</li>
                        <li>• All disputes are subject to Colombo jurisdiction.</li>
                    </ul>
                </div>
            </div>

            {/* Footer with Blue Theme */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="text-center md:text-left">
                        <div className="font-bold text-lg mb-2">MBA Branch</div>
                        <div className="text-blue-100 text-sm">{companyInfo.address}</div>
                        <div className="text-blue-100 text-sm mt-1">{companyInfo.phone}</div>
                    </div>
                    <div className="text-center">
                        <div className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                            PLAY GENUINE PAY LESS
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className="font-bold text-lg mb-2">Zimantra Branch</div>
                        <div className="text-blue-100 text-sm">No 465, Ganahena, Battaramulla</div>
                    </div>
                </div>
                <div className="text-center mt-6 pt-4 border-t border-blue-400">
                    <p className="text-blue-100 text-sm">
                        Thank you for considering our quotation. We look forward to serving you!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuotationTemplate;