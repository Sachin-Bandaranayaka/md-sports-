'use client';

import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import { SalesQuotation } from '@/types';

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

    return (
        <>
            <style jsx>{`
                @media print {
                    @page {
                        size: A5;
                        margin: 15mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
            `}</style>
            <div className="bg-white p-4 max-w-full mx-auto print:p-2" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4 print:mb-3">
                <div className="flex items-center">
                    {/* Company Logo */}
                    <div className="mr-3 print:mr-2">
                        <img 
                            src="/mssport-logo.jpeg" 
                            alt="MS Sports Logo" 
                            className="h-12 w-auto object-contain print:h-10"
                            style={{ 
                                backgroundColor: 'white',
                                filter: 'brightness(1.3) contrast(1.5) saturate(1.2)',
                                mixBlendMode: 'darken',
                                borderRadius: '4px',
                                padding: '2px'
                            }}
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-black print:text-base">{companyInfo.name}</h1>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-black mb-1 print:text-xl print:mb-0">Quotation</h2>
                </div>
            </div>

            {/* Quotation Info and Customer Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 print:gap-3 print:mb-3">
                {/* Customer Information */}
                <div>
                    <h3 className="text-base font-bold text-black mb-2 print:text-sm print:mb-1">Customer Name</h3>
                    <div className="text-black">
                        <div className="font-medium text-base print:text-sm">{quotation.customerName}</div>
                        <div className="text-xs text-gray-600 print:text-xs">Customer ID: {quotation.customerId}</div>
                    </div>
                </div>

                {/* Quotation Details */}
                <div className="text-right">
                    <div className="mb-2 print:mb-1">
                        <div className="text-black font-bold text-sm print:text-xs">Quotation Number</div>
                        <div className="text-black text-sm print:text-xs">{quotation.quotationNumber}</div>
                    </div>
                    <div className="mb-2 print:mb-1">
                        <div className="text-black font-bold text-sm print:text-xs">Issue Date</div>
                        <div className="text-black text-sm print:text-xs">{formatDate(quotation.date)}</div>
                    </div>
                    <div className="mb-2 print:mb-1">
                        <div className="text-black font-bold text-sm print:text-xs">Valid Until</div>
                        <div className={`text-black text-sm print:text-xs ${
                            isExpired ? 'text-red-600' : 'text-black'
                        }`}>
                            {formatDate(quotation.expiryDate)}
                            {isExpired && <span className="ml-1 text-xs text-red-600 print:text-xs">(EXPIRED)</span>}
                        </div>
                    </div>
                </div>
            </div>



            {/* Items Table */}
            <div className="mb-4 print:mb-3">
                <h3 className="text-base font-bold text-black mb-2 print:text-sm print:mb-1">Description</h3>
                <table className="w-full border-collapse text-sm print:text-xs">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-2 py-2 text-left text-black font-bold print:px-1 print:py-1">Item</th>
                            <th className="border border-gray-300 px-2 py-2 text-center text-black font-bold print:px-1 print:py-1">Qty</th>
                            <th className="border border-gray-300 px-2 py-2 text-right text-black font-bold print:px-1 print:py-1">Unit price</th>
                            <th className="border border-gray-300 px-2 py-2 text-right text-black font-bold print:px-1 print:py-1">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotation.items.map((item, index) => (
                            <tr key={item.id || index}>
                                <td className="border border-gray-300 px-2 py-2 text-black print:px-1 print:py-1">
                                    <div className="font-medium">{item.productName}</div>
                                    <div className="text-xs text-gray-600 print:text-xs">ID: {item.productId}</div>
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center text-black print:px-1 print:py-1">{item.quantity}</td>
                                <td className="border border-gray-300 px-2 py-2 text-right text-black print:px-1 print:py-1">{formatCurrency(item.unitPrice)}</td>
                                <td className="border border-gray-300 px-2 py-2 text-right text-black font-medium print:px-1 print:py-1">{formatCurrency(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-4 print:mb-3">
                <div className="w-60 print:w-48">
                    <div className="border-t border-gray-300 pt-2 print:pt-1">
                        <div className="flex justify-between py-1 text-sm print:text-xs">
                            <span className="text-black">Subtotal</span>
                            <span className="text-black">{formatCurrency(quotation.subtotal)}</span>
                        </div>
                        {quotation.discount > 0 && (
                            <div className="flex justify-between py-1 text-sm print:text-xs">
                                <span className="text-black">Discount</span>
                                <span className="text-black">-{formatCurrency(quotation.discount)}</span>
                            </div>
                        )}
                        {quotation.tax > 0 && (
                            <div className="flex justify-between py-1 text-sm print:text-xs">
                                <span className="text-black">Tax</span>
                                <span className="text-black">{formatCurrency(quotation.tax)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-1 border-t border-gray-300 text-sm print:text-xs">
                            <span className="text-black font-bold">Total</span>
                            <span className="text-black font-bold">{formatCurrency(quotation.total)}</span>
                        </div>
                        <div className="text-center mt-2 text-xs text-gray-600 print:mt-1 print:text-xs">
                            Valid until {formatDate(quotation.expiryDate)}
                        </div>
                    </div>
                </div>
            </div>



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

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-300 print:mt-3 print:pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-black print:gap-2">
                    <div className="text-center md:text-left">
                        <div className="font-bold text-sm mb-1 print:text-xs print:mb-0">MBA Branch</div>
                        <div className="text-xs print:text-xs">{companyInfo.address}</div>
                        <div className="text-xs mt-1 print:text-xs print:mt-0">{companyInfo.phone}</div>
                    </div>
                    <div className="text-center">
                        <div className="bg-red-600 text-white px-3 py-2 rounded font-bold text-sm print:px-2 print:py-1 print:text-xs">
                            PLAY GENUINE PAY LESS
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className="font-bold text-sm mb-1 print:text-xs print:mb-0">Zimantra Branch</div>
                        <div className="text-xs print:text-xs">No 465, Ganahena, Battaramulla</div>
                    </div>
                </div>
                <div className="text-center mt-3 pt-2 border-t border-gray-300 print:mt-2 print:pt-1">
                    <p className="text-xs text-gray-600 print:text-xs">
                        Thank you for considering our quotation. We look forward to serving you!
                    </p>
                </div>
            </div>
        </div>
        </>
    );
};

export default QuotationTemplate;