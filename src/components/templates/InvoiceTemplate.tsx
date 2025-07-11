'use client';

import React from 'react';
import { formatCurrency } from '@/utils/formatters';

interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
}

interface InvoiceItem {
    id: number;
    productId: number;
    invoiceId: number;
    quantity: number;
    price: number;
    total: number;
    product: Product;
}

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string | {
        mainAddress?: string;
        city?: string;
        postalCode?: string;
        contactPerson?: string;
        contactPersonPhone?: string;
        customerType?: string;
        paymentType?: string;
        creditLimit?: number | null;
        creditPeriod?: number | null;
        taxId?: string;
        notes?: string;
    };
    city?: string;
    postalCode?: string;
    contactPerson?: string;
    contactPersonPhone?: string;
}

interface Payment {
    id: number;
    invoiceId: number;
    customerId: number;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    createdAt: string;
    receipt?: {
        id: number;
        receiptNumber: string;
        receiptDate: string;
    };
}

interface Shop {
    id: string;
    name: string;
    location: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
}

interface Invoice {
    id: number;
    invoiceNumber: string;
    customerId: number;
    shopId?: string | null;
    total: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    customer: Customer;
    shop?: Shop | null;
    items: InvoiceItem[];
    payments: Payment[];
    paymentMethod: string;
    dueDate?: string;
    totalProfit?: number;
    profitMargin?: number;
}

interface InvoiceTemplateProps {
    invoice: Invoice;
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

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
    invoice,
    companyInfo
}) => {
    // Use shop information if available, otherwise fall back to companyInfo or defaults
    const getCompanyInfo = () => {
        if (invoice.shop) {
            const shopAddress = [
                invoice.shop.address_line1,
                invoice.shop.address_line2,
                invoice.shop.city && invoice.shop.postal_code ? `${invoice.shop.city}, ${invoice.shop.postal_code}` : invoice.shop.city || invoice.shop.postal_code,
                invoice.shop.state
            ].filter(Boolean).join(', ');
            
            return {
                name: invoice.shop.name,
                address: shopAddress || invoice.shop.location,
                phone: invoice.shop.phone || "+94 11 234 5678",
                email: invoice.shop.email || "info@mdsports.lk"
            };
        }
        
        return companyInfo || {
            name: "MD Sports Management Pvt. Ltd",
            address: "No 28, Malalsekara Mawatha, Colombo 07",
            phone: "+94 11 234 5678",
            email: "info@mdsports.lk"
        };
    };
    
    const currentCompanyInfo = getCompanyInfo();
    const paidAmount = invoice.payments?.reduce((sum, payment) => {
        return payment.receipt ? sum + (Number(payment.amount) || 0) : sum;
    }, 0) || 0;

    // Calculate subtotal (sum of line totals before discount) and discount applied
    const subtotalBeforeDiscount = invoice.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const discountAmount = Math.max(0, subtotalBeforeDiscount - invoice.total);

    const remainingBalance = invoice.total - paidAmount;

    // Calculate due date (30 days after creation)
    const createdDate = new Date(invoice.createdAt);
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const renderCustomerAddress = () => {
        if (typeof invoice.customer.address === 'string') {
            if (invoice.customer.address.trim().startsWith('{')) {
                try {
                    const addressObj = JSON.parse(invoice.customer.address);
                    return (
                        <>
                            {addressObj.mainAddress && <div>{addressObj.mainAddress}</div>}
                            {addressObj.city && <div>{addressObj.city}</div>}
                            {addressObj.postalCode && <div>{addressObj.postalCode}</div>}
                            {addressObj.contactPerson && <div>Contact: {addressObj.contactPerson}</div>}
                        </>
                    );
                } catch {
                    return <div>{invoice.customer.address}</div>;
                }
            } else {
                return <div>{invoice.customer.address}</div>;
            }
        } else if (typeof invoice.customer.address === 'object' && invoice.customer.address !== null) {
            return (
                <>
                    {invoice.customer.address.mainAddress && <div>{invoice.customer.address.mainAddress}</div>}
                    {invoice.customer.address.city && <div>{invoice.customer.address.city}</div>}
                    {invoice.customer.address.postalCode && <div>{invoice.customer.address.postalCode}</div>}
                    {invoice.customer.address.contactPerson && <div>Contact: {invoice.customer.address.contactPerson}</div>}
                </>
            );
        } else {
            return (
                <>
                    {invoice.customer.city && invoice.customer.postalCode && (
                        <div>{invoice.customer.city}, {invoice.customer.postalCode}</div>
                    )}
                </>
            );
        }
    };

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
                        <h1 className="text-lg font-bold text-black print:text-base">{currentCompanyInfo.name}</h1>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-black mb-1 print:text-xl print:mb-0">Invoice</h2>
                </div>
            </div>

            {/* Invoice Info and Customer Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 print:gap-3 print:mb-3">
                {/* Customer Information */}
                <div>
                    <h3 className="text-base font-bold text-black mb-2 print:text-sm print:mb-1">Customer Name</h3>
                    <div className="text-black text-sm print:text-xs">
                        <div className="font-medium text-base print:text-sm">{invoice.customer.name}</div>
                        {renderCustomerAddress()}
                        {invoice.customer.phone && <div>Phone: {invoice.customer.phone}</div>}
                        {invoice.customer.email && <div>Email: {invoice.customer.email}</div>}
                    </div>
                </div>

                {/* Invoice Details */}
                <div className="text-right">
                    <div className="mb-2 print:mb-1">
                        <div className="text-black font-bold text-sm print:text-xs">Invoice Number</div>
                        <div className="text-black text-sm print:text-xs">{invoice.invoiceNumber}</div>
                    </div>
                    <div className="mb-2 print:mb-1">
                        <div className="text-black font-bold text-sm print:text-xs">Issued Date</div>
                        <div className="text-black text-sm print:text-xs">{formatDate(invoice.createdAt)}</div>
                    </div>
                    <div className="mb-2 print:mb-1">
                        <div className="text-black font-bold text-sm print:text-xs">Due Date</div>
                        <div className="text-black text-sm print:text-xs">
                            {invoice.paymentMethod === 'Cash' ? 'N/A' : formatDate(dueDate.toISOString())}
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
                        {invoice.items.map((item) => (
                            <tr key={item.id}>
                                <td className="border border-gray-300 px-2 py-2 text-black print:px-1 print:py-1">
                                    <div className="font-medium">{item.product.name}</div>
                                    {item.product.description && (
                                        <div className="text-xs text-gray-600 print:text-xs">{item.product.description}</div>
                                    )}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center text-black print:px-1 print:py-1">{item.quantity}</td>
                                <td className="border border-gray-300 px-2 py-2 text-right text-black print:px-1 print:py-1">{formatCurrency(item.price)}</td>
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
                        {/* Sub-total */}
                        <div className="flex justify-between py-1 text-sm print:text-xs">
                            <span className="text-black">Sub-total</span>
                            <span className="text-black">{formatCurrency(subtotalBeforeDiscount)}</span>
                        </div>

                        {/* Discount row */}
                        {discountAmount > 0 && (
                            <div className="flex justify-between py-1 text-sm print:text-xs">
                                <span className="text-black">Discount</span>
                                <span className="text-black">-{formatCurrency(discountAmount)}</span>
                            </div>
                        )}

                        {/* Total after discount */}
                        <div className="flex justify-between py-1 text-sm print:text-xs border-t border-gray-300 mt-1 pt-1">
                            <span className="text-black font-bold">Total</span>
                            <span className="text-black font-bold">{formatCurrency(invoice.total)}</span>
                        </div>
                        {invoice.payments && invoice.payments.length > 0 && invoice.payments.some(p => p.receipt) && (
                            <div className="flex justify-between py-1 text-xs text-gray-600 print:text-xs">
                                <span>
                                    Receipt — {invoice.payments.filter(p => p.receipt).map(p => p.receipt?.receiptNumber).join(', ') || 'N/A'} — {formatDate(invoice.createdAt)}
                                </span>
                                <span>-{formatCurrency(paidAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-1 border-t border-gray-300 text-sm print:text-xs">
                            <span className="text-black font-bold">Balance due</span>
                            <span className="text-black font-bold">{formatCurrency(remainingBalance)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Status */}
            {remainingBalance <= 0 ? (
                <div className="text-center mb-4 print:mb-3">
                    <div className="inline-block border-2 border-green-600 px-4 py-1 print:px-3 print:py-1">
                        <span className="text-green-600 text-base font-bold print:text-sm">PAID IN FULL</span>
                    </div>
                </div>
            ) : paidAmount > 0 ? (
                <div className="text-center mb-4 print:mb-3">
                    <div className="inline-block border-2 border-orange-500 px-4 py-1 print:px-3 print:py-1">
                        <span className="text-orange-500 text-base font-bold print:text-sm">PARTIALLY PAID</span>
                    </div>
                </div>
            ) : null}

            {/* Footer */}
            <div className="border-t border-gray-300 pt-3 print:pt-2">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-black font-bold mb-1 text-sm print:text-xs print:mb-0">MBA Branch</div>
                        <div className="text-black text-xs print:text-xs">{currentCompanyInfo.address}</div>
                        <div className="text-black text-xs print:text-xs">Phone: {currentCompanyInfo.phone}</div>
                        <div className="text-black text-xs print:text-xs">Email: {currentCompanyInfo.email}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-black font-bold text-sm mb-1 print:text-xs print:mb-0">PLAY GENUINE PAY LESS</div>
                    </div>
                    <div className="text-right">
                        <div className="text-black font-bold mb-1 text-sm print:text-xs print:mb-0">Zimantra Branch</div>
                        <div className="text-black text-xs print:text-xs">No 465, Ganahena, Battaramulla</div>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-300">
                    <h4 className="font-bold text-black mb-4">Payment History</h4>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left text-black font-bold">Date</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-black font-bold">Method</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-black font-bold">Reference</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-black font-bold">Receipt</th>
                                <th className="border border-gray-300 px-4 py-2 text-right text-black font-bold">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="border border-gray-300 px-4 py-2 text-black">{formatDate(payment.createdAt)}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-black">{payment.paymentMethod}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-black">{payment.referenceNumber || '-'}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-black">
                                        {payment.receipt ? payment.receipt.receiptNumber : 'No receipt'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right text-black">{payment.receipt ? formatCurrency(Number(payment.amount) || 0) : formatCurrency(0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </>
    );
};

export default InvoiceTemplate;