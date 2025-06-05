'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
interface CustomerFormData {
    name: string;
    phone: string;
    address: string;
    customerType: 'Retail' | 'Wholesale';
    creditLimit?: number;
    creditPeriod?: number;
    notes: string;
}

export default function EditCustomer({ params }: { params: { id: string } }) {
    // Access params directly - they are already resolved in App Router
    const customerId = params.id;

    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        phone: '',
        address: '',
        customerType: 'Retail',
        notes: '',
    });

    useEffect(() => {
        async function fetchCustomerData() {
            try {
                const response = await fetch(`/api/customers/${customerId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch customer data');
                }
                const data = await response.json();

                // Parse the address field which might contain JSON data
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

                // Update form data with customer data
                setFormData({
                    name: data.name || '',
                    phone: data.phone || '',
                    address: typeof addressData.mainAddress === 'string' ? addressData.mainAddress : (data.address || ''),
                    customerType: (addressData.customerType || data.customerType || 'Retail') as 'Retail' | 'Wholesale',
                    creditLimit: addressData.creditLimit || data.creditLimit || undefined,
                    creditPeriod: addressData.creditPeriod || data.creditPeriod || undefined,
                    notes: addressData.notes || data.notes || ''
                });
            } catch (error) {
                console.error('Error fetching customer data:', error);
                setError('Failed to load customer data. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        fetchCustomerData();
    }, [customerId]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        // Handle number inputs separately
        if (type === 'number') {
            setFormData({
                ...formData,
                [name]: value === '' ? undefined : Number(value),
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to update customer' }));
                throw new Error(errorData.message || 'Failed to update customer. Please check server logs.');
            }

            router.push('/customers');
            router.refresh();
        } catch (error) {
            console.error('Error updating customer:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setSaving(false);
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

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
                        <p className="text-gray-500">Update customer information</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Customers
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Customer Form */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Address Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Customer Type */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Customer Classification</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="customerType"
                                        value={formData.customerType}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        required
                                    >
                                        <option value="Retail">Retail</option>
                                        <option value="Wholesale">Wholesale</option>
                                    </select>
                                </div>

                                {formData.customerType === 'Wholesale' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Credit Limit
                                            </label>
                                            <input
                                                type="number"
                                                name="creditLimit"
                                                value={formData.creditLimit || ''}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Credit Period (days)
                                            </label>
                                            <input
                                                type="number"
                                                name="creditPeriod"
                                                value={formData.creditPeriod || ''}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                                min="0"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Additional Information</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                ></textarea>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={saving}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Update Customer
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}