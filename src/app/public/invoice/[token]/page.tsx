'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import InvoiceTemplate from '@/components/invoices/InvoiceTemplate';

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
        <div id="invoice-content" className="bg-white">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={invoice.status} />
              {invoice.publicViewCount !== undefined && (
                <Badge variant="outline" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Viewed {invoice.publicViewCount} times
                </Badge>
              )}
            </div>
          </div>
          
          <InvoiceTemplate
             invoice={{
               id: invoice.id,
               invoiceNumber: invoice.invoiceNumber,
               customerId: invoice.customerId || 0,
               customerName: invoice.customer?.name || '',
               customer: invoice.customer,
               dueDate: invoice.dueDate || '',
               createdAt: invoice.createdAt,
               paymentMethod: invoice.paymentMethod || 'Cash',
               notes: invoice.notes || '',
               items: invoice.items.map(item => ({
                 id: item.id.toString(),
                 productId: item.productId.toString(),
                 productName: item.product.name,
                 quantity: item.quantity,
                 price: item.price,
                 total: item.total,
                 product: item.product
               })),
               subtotal: subtotal,
               tax: 0,
               total: invoice.total,
               status: invoice.status,
               discountAmount: discount
             }}
           />
          
          {/* Public View Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>This is a public view of the invoice. For any questions, please contact the issuing company.</p>
            {invoice.publicLastViewedAt && (
              <p className="mt-2">
                Last viewed: {format(new Date(invoice.publicLastViewedAt), 'dd/MM/yyyy HH:mm')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}