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
    const paidAmount = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
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
                } catch (e) {
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
        <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center">
                    {/* Company Logo/Brand */}
                    <div className="mr-4">
                        <div className="bg-red-600 text-white px-3 py-1 text-sm font-bold rounded">
                            SPORTS
                        </div>
                        <div className="bg-black text-white px-3 py-1 text-lg font-bold mt-1">
                            MS
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-black">{currentCompanyInfo.name}</h1>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-black mb-2">Invoice</h2>
                </div>
            </div>

            {/* Invoice Info and Customer Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Customer Information */}
                <div>
                    <h3 className="text-lg font-bold text-black mb-3">Customer Name</h3>
                    <div className="text-black">
                        <div className="font-medium text-lg">{invoice.customer.name}</div>
                        {renderCustomerAddress()}
                        {invoice.customer.phone && <div>Phone: {invoice.customer.phone}</div>}
                        {invoice.customer.email && <div>Email: {invoice.customer.email}</div>}
                    </div>
                </div>

                {/* Invoice Details */}
                <div className="text-right">
                    <div className="mb-4">
                        <div className="text-black font-bold">Invoice Number</div>
                        <div className="text-black">{invoice.invoiceNumber}</div>
                    </div>
                    <div className="mb-4">
                        <div className="text-black font-bold">Issued Date</div>
                        <div className="text-black">{formatDate(invoice.createdAt)}</div>
                    </div>
                    <div className="mb-4">
                        <div className="text-black font-bold">Due Date</div>
                        <div className="text-black">
                            {invoice.paymentMethod === 'Cash' ? 'N/A' : formatDate(dueDate.toISOString())}
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
                        {invoice.items.map((item) => (
                            <tr key={item.id}>
                                <td className="border border-gray-300 px-4 py-3 text-black">
                                    <div className="font-medium">{item.product.name}</div>
                                    {item.product.description && (
                                        <div className="text-sm text-gray-600">{item.product.description}</div>
                                    )}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center text-black">{item.quantity}</td>
                                <td className="border border-gray-300 px-4 py-3 text-right text-black">{formatCurrency(item.price)}</td>
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
                            <span className="text-black font-bold">Total</span>
                            <span className="text-black font-bold">{formatCurrency(invoice.total)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm text-gray-600">
                            <span>Receipt — 6359 — {formatDate(invoice.createdAt)}</span>
                            <span>-{formatCurrency(paidAmount)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t border-gray-300">
                            <span className="text-black font-bold">Balance due</span>
                            <span className="text-black font-bold">{formatCurrency(remainingBalance)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Status */}
            {remainingBalance <= 0 ? (
                <div className="text-center mb-8">
                    <div className="inline-block border-4 border-green-600 px-8 py-2">
                        <span className="text-green-600 text-xl font-bold">PAID IN FULL</span>
                    </div>
                </div>
            ) : paidAmount > 0 ? (
                <div className="text-center mb-8">
                    <div className="inline-block border-4 border-orange-500 px-8 py-2">
                        <span className="text-orange-500 text-xl font-bold">PARTIALLY PAID</span>
                    </div>
                </div>
            ) : null}

            {/* Footer */}
            <div className="border-t border-gray-300 pt-6">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-black font-bold mb-2">MBA Branch</div>
                        <div className="text-black text-sm">{currentCompanyInfo.address}</div>
                        <div className="text-black text-sm">Phone: {currentCompanyInfo.phone}</div>
                        <div className="text-black text-sm">Email: {currentCompanyInfo.email}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-black font-bold text-lg mb-2">PLAY GENUINE PAY LESS</div>
                    </div>
                    <div className="text-right">
                        <div className="text-black font-bold mb-2">Zimantra Branch</div>
                        <div className="text-black text-sm">No 465, Ganahena, Battaramulla</div>
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
                                <th className="border border-gray-300 px-4 py-2 text-right text-black font-bold">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="border border-gray-300 px-4 py-2 text-black">{formatDate(payment.createdAt)}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-black">{payment.paymentMethod}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-black">{payment.referenceNumber || '-'}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right text-black">{formatCurrency(payment.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InvoiceTemplate;