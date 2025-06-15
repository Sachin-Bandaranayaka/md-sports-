import { Suspense } from 'react';
import { headers } from 'next/headers';
import MainLayout from '@/components/layout/MainLayout';
import { PurchaseInvoice, PurchaseInvoiceItem } from '@/types';
import { Loader2, AlertTriangle, ArrowLeft, Edit, Calendar, DollarSign, Package, Building2, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Helper function to get base URL
function getBaseUrl() {
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    return `${protocol}://${host}`;
}

async function fetchPurchaseInvoice(id: string, baseUrl: string): Promise<PurchaseInvoice & { items: PurchaseInvoiceItem[] } | null> {
    try {
        const response = await fetch(`${baseUrl}/api/purchases/${id}`, { cache: 'no-store' });
        if (!response.ok) {
            if (response.status === 404) return null;
            console.error(`Failed to fetch invoice ${id}: ${response.status} ${await response.text()}`);
            return null;
        }
        const data = await response.json();
        return data.success && data.data ? data.data : data;
    } catch (error) {
        console.error(`Error fetching invoice ${id}:`, error);
        return null;
    }
}

async function fetchShops(baseUrl: string) {
    try {
        const response = await fetch(`${baseUrl}/api/shops`, { 
            cache: 'no-store',
            headers: {
                'Authorization': 'Bearer dev-token'
            }
        });
        if (!response.ok) {
            console.error('Failed to fetch shops:', response.status);
            return [];
        }
        const data = await response.json();
        return data.success ? data.data : data;
    } catch (error) {
        console.error('Error fetching shops:', error);
        return [];
    }
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'unpaid':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'overdue':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(status)}`}>
            {status?.charAt(0).toUpperCase() + (status?.slice(1) || '')}
        </span>
    );
};

interface PurchaseInvoiceDetailPageProps {
    params: { id: string };
}

export default async function PurchaseInvoiceDetailPage({ params }: PurchaseInvoiceDetailPageProps) {
    const { id } = params;
    const baseUrl = getBaseUrl();

    const [invoice, shops] = await Promise.all([
        fetchPurchaseInvoice(id, baseUrl),
        fetchShops(baseUrl)
    ]);

    if (!invoice) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-8 text-center">
                    <div className="inline-flex items-center bg-red-100 text-red-700 p-6 rounded-lg border border-red-200">
                        <AlertTriangle className="h-8 w-8 mr-4" />
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Purchase Invoice Not Found</h2>
                            <p className="text-red-600">The requested purchase invoice could not be found or loaded.</p>
                        </div>
                    </div>
                    <Link href="/purchases" className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Purchase Invoices
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/purchases" className="p-2 rounded-md hover:bg-blue-50 transition-colors">
                            <ArrowLeft className="w-6 h-6 text-blue-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-900">Purchase Invoice Details</h1>
                            <p className="text-blue-600 mt-1">Invoice #{invoice.invoiceNumber}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/purchases/${invoice.id}/edit`}>
                            <Button variant="primary" className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Edit Invoice
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Invoice Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-600">Invoice Number</p>
                                <p className="text-lg font-bold text-blue-900">{invoice.invoiceNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-600">Total Amount</p>
                                <p className="text-lg font-bold text-green-900">Rs. {invoice.total?.toLocaleString() || '0.00'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Building2 className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-purple-600">Supplier</p>
                                <p className="text-lg font-bold text-purple-900">{invoice.supplier?.name || 'Unknown Supplier'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-orange-600">Status</p>
                                <div className="mt-1">
                                    <StatusBadge status={invoice.status || 'unknown'} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Invoice Information */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                            <div className="p-6 border-b border-blue-100">
                                <h2 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Invoice Information
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-blue-600 mb-1">Invoice Date</label>
                                        <div className="flex items-center gap-2 text-blue-900">
                                            <Calendar className="w-4 h-4" />
                                            <span>{invoice.date ? new Date(invoice.date).toLocaleDateString() : 'Not specified'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-600 mb-1">Due Date</label>
                                        <div className="flex items-center gap-2 text-blue-900">
                                            <Calendar className="w-4 h-4" />
                                            <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-600 mb-1">Subtotal</label>
                                        <p className="text-blue-900 font-medium">Rs. {invoice.subtotal?.toLocaleString() || '0.00'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-600 mb-1">Tax Amount</label>
                                        <p className="text-blue-900 font-medium">Rs. {invoice.taxAmount?.toLocaleString() || '0.00'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-600 mb-1">Discount</label>
                                        <p className="text-blue-900 font-medium">Rs. {invoice.discount?.toLocaleString() || '0.00'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-600 mb-1">Total Amount</label>
                                        <p className="text-xl font-bold text-blue-900">Rs. {invoice.total?.toLocaleString() || '0.00'}</p>
                                    </div>
                                </div>
                                {invoice.notes && (
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-blue-600 mb-2">Notes</label>
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-blue-900">{invoice.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Supplier Information */}
                    <div>
                        <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                            <div className="p-6 border-b border-purple-100">
                                <h2 className="text-xl font-semibold text-purple-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Supplier Details
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-purple-600 mb-1">Name</label>
                                        <p className="text-purple-900 font-medium">{invoice.supplier?.name || 'Unknown Supplier'}</p>
                                    </div>
                                    {invoice.supplier?.email && (
                                        <div>
                                            <label className="block text-sm font-medium text-purple-600 mb-1">Email</label>
                                            <p className="text-purple-900">{invoice.supplier.email}</p>
                                        </div>
                                    )}
                                    {invoice.supplier?.phone && (
                                        <div>
                                            <label className="block text-sm font-medium text-purple-600 mb-1">Phone</label>
                                            <p className="text-purple-900">{invoice.supplier.phone}</p>
                                        </div>
                                    )}
                                    {invoice.supplier?.address && (
                                        <div>
                                            <label className="block text-sm font-medium text-purple-600 mb-1">Address</label>
                                            <p className="text-purple-900">{invoice.supplier.address}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice Items */}
                <div className="mt-8">
                    <div className="bg-white rounded-lg shadow-sm border border-green-100">
                        <div className="p-6 border-b border-green-100">
                            <h2 className="text-xl font-semibold text-green-900 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Invoice Items
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-green-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-green-700">Product</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-green-700">Quantity</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-green-700">Shop Distribution</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-green-700">Unit Price</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-green-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-100">
                                    {invoice.items && invoice.items.length > 0 ? (
                                        invoice.items.map((item, index) => {
                                            // Get distribution for this item
                                            const itemDistribution = invoice.distributions && Array.isArray(invoice.distributions) && invoice.distributions[index]
                                                ? invoice.distributions[index]
                                                : null;
                                            
                                            return (
                                                <tr key={item.id || index} className="hover:bg-green-50">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium text-green-900">{item.product?.name || 'Unknown Product'}</p>
                                                            {item.product?.sku && (
                                                                <p className="text-sm text-green-600">SKU: {item.product.sku}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-green-900 font-medium">{item.quantity}</td>
                                                    <td className="px-6 py-4">
                                                        {itemDistribution && Object.keys(itemDistribution).length > 0 ? (
                                                            <div className="space-y-1">
                                                                {Object.entries(itemDistribution).map(([shopId, quantity]) => {
                                                                    // Find the shop by matching the ID as string
                                                                    const shop = shops.find((s: any) => String(s.id) === String(shopId));
                                                                    const shopName = shop?.name || `Shop ${shopId}`;
                                                                    return (
                                                                        <div key={shopId} className="flex items-center justify-between bg-green-50 px-2 py-1 rounded text-sm">
                                                                            <span className="text-green-700 font-medium">{shopName}</span>
                                                                            <span className="text-green-900 font-semibold">{quantity}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 text-sm italic">No distribution data</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-green-900 font-medium">Rs. {item.price?.toLocaleString() || '0.00'}</td>
                                                    <td className="px-6 py-4 text-right text-green-900 font-bold">Rs. {((item.quantity || 0) * (item.price || 0)).toLocaleString()}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-green-600">
                                                No items found for this invoice.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {invoice.items && invoice.items.length > 0 && (
                                    <tfoot className="bg-green-50">
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-right font-semibold text-green-900">Total Amount:</td>
                                            <td className="px-6 py-4 text-right font-bold text-xl text-green-900">Rs. {invoice.total?.toLocaleString() || '0.00'}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-between items-center">
                    <Link href="/purchases">
                        <Button variant="outline" className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Purchase Invoices
                        </Button>
                    </Link>
                    <Link href={`/purchases/${invoice.id}/edit`}>
                        <Button variant="primary" className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit Invoice
                        </Button>
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}