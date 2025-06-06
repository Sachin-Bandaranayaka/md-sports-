'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';
import { authDelete } from '@/utils/api';
interface CustomerDetails {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    contactPerson?: string | null;
    contactPersonPhone?: string | null;
    paymentType?: string | null;
    creditLimit?: number | null;
    creditPeriod?: number | null;
    taxId?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    customerType: 'retail' | 'wholesale';
    isActive: boolean;
    invoices?: Invoice[];
}

export default function CustomerDetails({ params }: { params: { id: string } }) {
    // Access params directly - no need for React.use() in App Router
    const customerId = params.id;

    const router = useRouter();
    const [customer, setCustomer] = useState<CustomerDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    useEffect(() => {
        async function fetchCustomerDetails() {
            try {
                const response = await fetch(`/api/customers/${customerId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch customer details');
                }
                const data = await response.json();

                // Parse the address field which contains JSON data
                let addressData = {};
                try {
                    if (data.address && typeof data.address === 'string') {
                        const parsedAddress = JSON.parse(data.address);

                        // Check if parsedAddress has a mainAddress that's also a JSON string
                        if (parsedAddress.mainAddress && typeof parsedAddress.mainAddress === 'string' &&
                            parsedAddress.mainAddress.startsWith('{')) {
                            try {
                                // Try to parse the nested JSON
                                const nestedAddress = JSON.parse(parsedAddress.mainAddress);
                                // Use the nested object's properties
                                addressData = {
                                    ...parsedAddress,
                                    ...nestedAddress
                                };
                            } catch (nestedError) {
                                console.error('Error parsing nested address data:', nestedError);
                                addressData = parsedAddress;
                            }
                        } else {
                            addressData = parsedAddress;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing address data:', e);
                }

                // Merge the parsed address data with the customer data
                setCustomer({
                    ...data,
                    // Add parsed fields while keeping original data
                    address: addressData.mainAddress || null,
                    city: addressData.city || null,
                    postalCode: addressData.postalCode || null,
                    contactPerson: addressData.contactPerson || data.name,
                    contactPersonPhone: addressData.contactPersonPhone || data.phone,
                    paymentType: addressData.paymentType || data.paymentType || 'Cash',
                    creditLimit: data.creditLimit !== undefined ? data.creditLimit : (addressData.creditLimit || null),
                    creditPeriod: data.creditPeriod !== undefined ? data.creditPeriod : (addressData.creditPeriod || null),
                    taxId: addressData.taxId || null,
                    notes: addressData.notes || null,
                    customerType: data.customerType || 'retail',
                    isActive: data.isActive || true,
                    invoices: data.invoices || []
                });
            } catch (error) {
                console.error('Error fetching customer details:', error);
                setError('Failed to load customer details. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        fetchCustomerDetails();
    }, [customerId]);

    const handleDeleteCustomer = async () => {
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            return;
        }

        setDeleteLoading(true);
        setError(null);

        try {
            const response = await authDelete(`/api/customers/${customerId}`);
            const data = await response.json();

            if (data.success) {
                router.push('/customers');
            } else {
                setError(data.message || 'Failed to delete customer');
                setDeleteLoading(false);
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            setError('Failed to delete customer. Please try again later.');
            setDeleteLoading(false);
        }
    };

    // Calculate customer balance (for wholesale)
    const calculateCustomerBalance = () => {
        if (!customer || customer.customerType !== 'wholesale') {
            return null;
        }
        const unpaidInvoicesTotal = customer.invoices
            .filter(invoice => !invoice.isPaid)
            .reduce((total, invoice) => total + invoice.total, 0);
        return unpaidInvoicesTotal;
    };

    const customerBalance = calculateCustomerBalance();
    const availableCredit = customer?.customerType === 'wholesale' ? (customer.creditLimit || 0) - (customerBalance || 0) : null;

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    if (error || !customer) {
        return (
            <MainLayout>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error || 'Customer not found'}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => router.push('/customers')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Customers
                </Button>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Customer Details</h1>
                        <p className="text-black/70">View detailed information about this customer</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/customers')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => router.push(`/customers/${customerId}/edit`)}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteCustomer}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Customer information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-primary/5">
                        <h2 className="text-lg font-medium text-primary">Basic Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Customer ID</h3>
                            <p className="mt-1 text-sm text-black">CUS-{String(customer.id).padStart(3, '0')}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Name</h3>
                            <p className="mt-1 text-sm text-black">{customer.name}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Email</h3>
                            <p className="mt-1 text-sm text-black">{customer.email || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Phone</h3>
                            <p className="mt-1 text-sm text-black">{customer.phone || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Customer Type</h3>
                            <p className="mt-1 text-sm text-black">{customer.customerType.charAt(0).toUpperCase() + customer.customerType.slice(1)}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Payment Type</h3>
                            <p className="mt-1 text-sm text-black">{customer.paymentType || 'Cash'}</p>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-primary/5">
                        <h2 className="text-lg font-medium text-primary">Contact Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Contact Person</h3>
                            <p className="mt-1 text-sm text-black">{customer.contactPerson || customer.name}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Contact Phone</h3>
                            <p className="mt-1 text-sm text-black">{customer.contactPersonPhone || customer.phone || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Address</h3>
                            <p className="mt-1 text-sm text-black">{customer.address || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">City</h3>
                            <p className="mt-1 text-sm text-black">{customer.city || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Postal Code</h3>
                            <p className="mt-1 text-sm text-black">{customer.postalCode || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-black/70">Tax ID</h3>
                            <p className="mt-1 text-sm text-black">{customer.taxId || '-'}</p>
                        </div>
                    </div>

                    {/* Payment Information (only shown for credit customers) */}
                    {customer.paymentType === 'Credit' && (
                        <>
                            <div className="px-6 py-4 border-t border-gray-200 bg-primary/5">
                                <h2 className="text-lg font-medium text-primary">Payment Information</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-black/70">Credit Limit</h3>
                                    <p className="mt-1 text-sm text-black">
                                        {customer.creditLimit ? `Rs. ${customer.creditLimit.toLocaleString()}` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-black/70">Credit Period</h3>
                                    <p className="mt-1 text-sm text-black">
                                        {customer.creditPeriod ? `${customer.creditPeriod} days` : '-'}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-primary/5">
                        <h2 className="text-lg font-medium text-primary">Additional Information</h2>
                    </div>
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-black/70">Notes</h3>
                        <p className="mt-1 text-sm text-black whitespace-pre-line">
                            {customer.notes || 'No additional notes'}
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Financial Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><p className="text-sm text-gray-500">Type:</p><p className="text-gray-800">{customer.customerType.charAt(0).toUpperCase() + customer.customerType.slice(1)}</p></div>
                        {customer.customerType === 'wholesale' && (
                            <>
                                <div><p className="text-sm text-gray-500">Credit Limit:</p><p className="text-gray-800">Rs. {customer.creditLimit?.toLocaleString() || '0.00'}</p></div>
                                <div><p className="text-sm text-gray-500">Credit Period:</p><p className="text-gray-800">{customer.creditPeriod || 0} days</p></div>
                            </>
                        )}
                        <div><p className="text-sm text-gray-500">Active Status:</p><p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{customer.isActive ? 'Active' : 'Inactive'}</p></div>
                    </div>
                </div>

                {(customer.customerType === 'wholesale' || customer.creditLimit || customer.creditPeriod) && (
                    <>
                        <div className="px-6 py-4 border-t border-gray-200 bg-primary/5">
                            <h2 className="text-lg font-medium text-primary">Financial Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {customer.customerType === 'wholesale' && (
                                <>
                                    <div>
                                        <h3 className="text-sm font-medium text-black/70">Credit Limit</h3>
                                        <p className="mt-1 text-sm text-black">
                                            {customer.creditLimit ? `Rs. ${customer.creditLimit.toLocaleString()}` : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-black/70">Credit Period</h3>
                                        <p className="mt-1 text-sm text-black">
                                            {customer.creditPeriod ? `${customer.creditPeriod} days` : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-black/70">Available Credit</h3>
                                        <p className="mt-1 text-sm text-black">
                                            {availableCredit !== null ? `Rs. ${availableCredit.toLocaleString()}` : '-'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Invoices Section */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">Customer Invoices</h2>
                {customer.invoices && customer.invoices.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Invoice #
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customer.invoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                                <button onClick={() => router.push(`/invoices/${invoice.id}`)} className="hover:underline">
                                                    {invoice.invoiceNumber}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                Rs. {invoice.total.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvoiceStatusClass(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 px-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-500">No invoices found for this customer.</p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

// Helper function to get badge class for invoice status (you might have this elsewhere)
const getInvoiceStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'overdue':
            return 'bg-red-100 text-red-800';
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};