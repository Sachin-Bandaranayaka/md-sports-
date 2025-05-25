'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';
import { authDelete } from '@/utils/api';
import { use } from 'react';

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
    customerType?: string | null;
    paymentType?: string | null;
    creditLimit?: number | null;
    creditPeriod?: number | null;
    taxId?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function CustomerDetails({ params }: { params: { id: string } }) {
    // Unwrap params using React.use()
    const unwrappedParams = use(params);
    const customerId = unwrappedParams.id;

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
                    if (data.address) {
                        addressData = JSON.parse(data.address);
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
                    customerType: addressData.customerType || 'Retail',
                    paymentType: addressData.paymentType || data.paymentType || 'Cash',
                    creditLimit: addressData.creditLimit || null,
                    creditPeriod: addressData.creditPeriod || null,
                    taxId: addressData.taxId || null,
                    notes: addressData.notes || null
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
                        <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
                        <p className="text-gray-500">View detailed information about this customer</p>
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
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Customer ID</h3>
                            <p className="mt-1 text-sm text-gray-900">CUS-{String(customer.id).padStart(3, '0')}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Name</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Email</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.email || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.phone || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Customer Type</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.customerType || 'Retail'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Payment Type</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.paymentType || 'Cash'}</p>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="px-6 py-4 border-b border-t border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.contactPerson || customer.name}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Contact Phone</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.contactPersonPhone || customer.phone || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Address</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.address || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">City</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.city || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Postal Code</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.postalCode || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Tax ID</h3>
                            <p className="mt-1 text-sm text-gray-900">{customer.taxId || '-'}</p>
                        </div>
                    </div>

                    {/* Payment Information (only shown for credit customers) */}
                    {customer.paymentType === 'Credit' && (
                        <>
                            <div className="px-6 py-4 border-b border-t border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Credit Limit</h3>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {customer.creditLimit ? `Rs. ${customer.creditLimit.toLocaleString()}` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Credit Period</h3>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {customer.creditPeriod ? `${customer.creditPeriod} days` : '-'}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    <div className="px-6 py-4 border-b border-t border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
                    </div>
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                            {customer.notes || 'No additional notes'}
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 