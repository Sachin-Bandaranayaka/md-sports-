'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/Button';
import { Download, Eye, Calendar, DollarSign, User, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  sku?: string;
}

interface InvoiceItem {
  id: number;
  productId: number;
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
  address?: string;
  city?: string;
  postalCode?: string;
}

interface Shop {
  id: string;
  name: string;
  location: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId?: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: string;
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
  discountType?: string;
  discountValue?: number;
  publicViewCount?: number;
  publicLastViewedAt?: string;
  customer?: Customer;
  shop?: Shop;
  items: InvoiceItem[];
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} border`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function PublicInvoiceView() {
  const params = useParams();
  const token = params.token as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvoice();
    }
  }, [token]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/invoice/${token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invoice not found or link has expired');
        } else if (response.status === 410) {
          throw new Error('This invoice link has expired');
        } else {
          throw new Error('Failed to load invoice');
        }
      }
      
      const data = await response.json();
      setInvoice(data.invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    setIsDownloading(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const calculateSubtotal = () => {
    if (!invoice) return 0;
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    return subtotal;
  };

  const calculateDiscount = () => {
    if (!invoice || !invoice.discountValue) return 0;
    const subtotal = calculateSubtotal();
    if (invoice.discountType === 'percentage') {
      return (subtotal * invoice.discountValue) / 100;
    }
    return invoice.discountValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice Not Available</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                Please contact the sender if you believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice Not Found</h2>
              <p className="text-gray-600">The requested invoice could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice</h1>
          <p className="text-gray-600">Public view - No login required</p>
        </div>

        {/* Download Button */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>

        {/* Invoice Content */}
        <Card id="invoice-content" className="bg-white">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Invoice #{invoice.invoiceNumber}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={invoice.status} />
                  {invoice.publicViewCount !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Viewed {invoice.publicViewCount} times
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(invoice.total)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {invoice.paymentMethod && (
                    <span className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3" />
                      {invoice.paymentMethod}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Company and Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Company Info */}
              {invoice.shop && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    From
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{invoice.shop.name}</p>
                    {invoice.shop.address_line1 && (
                      <p className="text-gray-600 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {invoice.shop.address_line1}
                          {invoice.shop.address_line2 && <><br />{invoice.shop.address_line2}</>}
                          {invoice.shop.city && <><br />{invoice.shop.city}</>}
                          {invoice.shop.state && `, ${invoice.shop.state}`}
                          {invoice.shop.postal_code && ` ${invoice.shop.postal_code}`}
                          {invoice.shop.country && <><br />{invoice.shop.country}</>}
                        </span>
                      </p>
                    )}
                    {invoice.shop.phone && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {invoice.shop.phone}
                      </p>
                    )}
                    {invoice.shop.email && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {invoice.shop.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              {invoice.customer && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Bill To
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{invoice.customer.name}</p>
                    {invoice.customer.address && (
                      <p className="text-gray-600 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {invoice.customer.address}
                          {invoice.customer.city && <><br />{invoice.customer.city}</>}
                          {invoice.customer.postalCode && ` ${invoice.customer.postalCode}`}
                        </span>
                      </p>
                    )}
                    {invoice.customer.phone && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {invoice.customer.phone}
                      </p>
                    )}
                    {invoice.customer.email && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {invoice.customer.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Invoice Date</p>
                <p className="text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : formatDate(invoice.createdAt)}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Due Date</p>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Payment Method</p>
                <p className="text-gray-900">{invoice.paymentMethod || 'Cash'}</p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Invoice Items */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Item</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500">Qty</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">Price</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            {item.product.description && (
                              <p className="text-sm text-gray-500">{item.product.description}</p>
                            )}
                            {item.product.sku && (
                              <p className="text-xs text-gray-400">SKU: {item.product.sku}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-900">{item.quantity}</td>
                        <td className="py-3 px-2 text-right text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-gray-900">
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
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">
                      Discount ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Amount'}):
                    </span>
                    <span className="font-medium text-red-600">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>This is a public view of the invoice. For any questions, please contact the issuing company.</p>
              {invoice.publicLastViewedAt && (
                <p className="mt-2">
                  Last viewed: {format(new Date(invoice.publicLastViewedAt), 'dd/MM/yyyy HH:mm')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}