'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Eye, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface PublicInvoiceData {
  id: number;
  invoiceNumber: string;
  total: number;
  discountType?: string;
  discountValue?: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
  customer?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  shop?: {
    name: string;
    location: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    total: number;
    product: {
      name: string;
      description?: string;
    };
  }>;
  createdBy?: string;
}

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params.token as string;
  const [invoice, setInvoice] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/public/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch invoice');
        }

        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvoice();
    }
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/public/${token}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${invoice?.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invoice Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">The requested invoice could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = invoice.discountType === 'percentage' 
    ? (subtotal * (invoice.discountValue || 0)) / 100
    : invoice.discountValue || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Action Buttons - Hidden in print */}
        <div className="mb-6 flex gap-4 print:hidden">
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View/Print
          </Button>
          <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Invoice Content */}
        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <p className="text-lg text-gray-600">#{invoice.invoiceNumber}</p>
              </div>
              {invoice.shop && (
                <div className="text-right">
                  <h2 className="text-xl font-semibold text-gray-900">{invoice.shop.name}</h2>
                  <div className="text-gray-600 mt-2 space-y-1">
                    {invoice.shop.address_line1 && (
                      <p className="flex items-center justify-end gap-1">
                        <MapPin className="h-4 w-4" />
                        {invoice.shop.address_line1}
                      </p>
                    )}
                    {invoice.shop.address_line2 && <p>{invoice.shop.address_line2}</p>}
                    {invoice.shop.city && <p>{invoice.shop.city} {invoice.shop.postal_code}</p>}
                    {invoice.shop.phone && (
                      <p className="flex items-center justify-end gap-1">
                        <Phone className="h-4 w-4" />
                        {invoice.shop.phone}
                      </p>
                    )}
                    {invoice.shop.email && (
                      <p className="flex items-center justify-end gap-1">
                        <Mail className="h-4 w-4" />
                        {invoice.shop.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Bill To */}
              {invoice.customer && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                  <div className="text-gray-600 space-y-1">
                    <p className="font-medium">{invoice.customer.name}</p>
                    {invoice.customer.email && <p>{invoice.customer.email}</p>}
                    {invoice.customer.phone && <p>{invoice.customer.phone}</p>}
                    {invoice.customer.address && <p>{invoice.customer.address}</p>}
                  </div>
                </div>
              )}

              {/* Invoice Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details:</h3>
                <div className="text-gray-600 space-y-1">
                  {invoice.invoiceDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Date:</span>
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </p>
                  )}
                  {invoice.dueDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Due Date:</span>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  <p><span className="font-medium">Status:</span> {invoice.status}</p>
                  {invoice.paymentMethod && (
                    <p><span className="font-medium">Payment Method:</span> {invoice.paymentMethod}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items:</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-4 py-2">
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            {item.product.description && (
                              <p className="text-sm text-gray-600">{item.product.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Amount'}):</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes:</h3>
                <p className="text-gray-600">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>Thank you for your business!</p>
              {invoice.createdBy && (
                <p className="mt-1">Created by: {invoice.createdBy}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}