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
        <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center">
                    {/* Company Logo */}
                    <div className="mr-4">
                        <img 
                            src="/mssport-logo.jpeg" 
                            alt="MS Sports Logo" 
                            className="h-16 w-auto object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-black">{companyInfo.name}</h1>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-black mb-2">Quotation</h2>
                </div>
            </div>

            {/* Quotation Info and Customer Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Customer Information */}
                <div>
                    <h3 className="text-lg font-bold text-black mb-3">Customer Name</h3>
                    <div className="text-black">
                        <div className="font-medium text-lg">{quotation.customerName}</div>
                        <div className="text-sm text-gray-600">Customer ID: {quotation.customerId}</div>
                    </div>
                </div>

                {/* Quotation Details */}
                <div className="text-right">
                    <div className="mb-4">
                        <div className="text-black font-bold">Quotation Number</div>
                        <div className="text-black">{quotation.quotationNumber}</div>
                    </div>
                    <div className="mb-4">
                        <div className="text-black font-bold">Issue Date</div>
                        <div className="text-black">{formatDate(quotation.date)}</div>
                    </div>
                    <div className="mb-4">
                        <div className="text-black font-bold">Valid Until</div>
                        <div className={`text-black ${
                            isExpired ? 'text-red-600' : 'text-black'
                        }`}>
                            {formatDate(quotation.expiryDate)}
                            {isExpired && <span className="ml-2 text-xs text-red-600">(EXPIRED)</span>}
                        </div>
                    </div>
                </div>
            </div>



            {/* Items Table */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-black mb-4">Description</h3>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-3 text-left text-black font-bold">Item</th>
                            <th className="border border-gray-300 px-4 py-3 text-center text-black font-bold">Qty</th>
                            <th className="border border-gray-300 px-4 py-3 text-right text-black font-bold">Unit price</th>
                            <th className="border border-gray-300 px-4 py-3 text-right text-black font-bold">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotation.items.map((item, index) => (
                            <tr key={item.id || index}>
                                <td className="border border-gray-300 px-4 py-3 text-black">
                                    <div className="font-medium">{item.productName}</div>
                                    <div className="text-sm text-gray-600">ID: {item.productId}</div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center text-black">{item.quantity}</td>
                                <td className="border border-gray-300 px-4 py-3 text-right text-black">{formatCurrency(item.unitPrice)}</td>
                                <td className="border border-gray-300 px-4 py-3 text-right text-black font-medium">{formatCurrency(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
                <div className="w-80">
                    <div className="border-t border-gray-300 pt-4">
                        <div className="flex justify-between py-2">
                            <span className="text-black">Subtotal</span>
                            <span className="text-black">{formatCurrency(quotation.subtotal)}</span>
                        </div>
                        {quotation.discount > 0 && (
                            <div className="flex justify-between py-2">
                                <span className="text-black">Discount</span>
                                <span className="text-black">-{formatCurrency(quotation.discount)}</span>
                            </div>
                        )}
                        {quotation.tax > 0 && (
                            <div className="flex justify-between py-2">
                                <span className="text-black">Tax</span>
                                <span className="text-black">{formatCurrency(quotation.tax)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-t border-gray-300">
                            <span className="text-black font-bold">Total</span>
                            <span className="text-black font-bold">{formatCurrency(quotation.total)}</span>
                        </div>
                        <div className="text-center mt-4 text-sm text-gray-600">
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
            <div className="mt-8 pt-6 border-t border-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-black">
                    <div className="text-center md:text-left">
                        <div className="font-bold text-lg mb-2">MBA Branch</div>
                        <div className="text-sm">{companyInfo.address}</div>
                        <div className="text-sm mt-1">{companyInfo.phone}</div>
                    </div>
                    <div className="text-center">
                        <div className="bg-red-600 text-white px-6 py-3 rounded font-bold text-lg">
                            PLAY GENUINE PAY LESS
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className="font-bold text-lg mb-2">Zimantra Branch</div>
                        <div className="text-sm">No 465, Ganahena, Battaramulla</div>
                    </div>
                </div>
                <div className="text-center mt-6 pt-4 border-t border-gray-300">
                    <p className="text-sm text-gray-600">
                        Thank you for considering our quotation. We look forward to serving you!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuotationTemplate;