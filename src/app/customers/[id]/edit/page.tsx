'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { use } from 'react';

interface CustomerFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    contactPerson: string;
    contactPersonPhone: string;
    customerType: string;
    creditLimit: string;
    creditPeriod: string;
    taxId: string;
    notes: string;
}

export default function EditCustomer({ params }: { params: { id: string } }) {
    // Unwrap params using React.use()
    const unwrappedParams = use(params);
    const customerId = unwrappedParams.id;

    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        contactPerson: '',
        contactPersonPhone: '',
        customerType: 'Retail',
        creditLimit: '0',
        creditPeriod: '0',
        taxId: '',
        notes: ''
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
                    email: data.email || '',
                    phone: data.phone || '',
                    address: typeof addressData.mainAddress === 'string' ? addressData.mainAddress : '',
                    city: addressData.city || data.city || '',
                    postalCode: addressData.postalCode || data.postalCode || '',
                    contactPerson: addressData.contactPerson || data.contactPerson || '',
                    contactPersonPhone: addressData.contactPersonPhone || data.contactPersonPhone || '',
                    customerType: addressData.customerType || data.customerType || 'Retail',
                    creditLimit: (addressData.creditLimit?.toString() || data.creditLimit?.toString() || '0').toString(),
                    creditPeriod: (addressData.creditPeriod?.toString() || data.creditPeriod?.toString() || '0').toString(),
                    taxId: addressData.taxId || data.taxId || '',
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Format the address data to match the expected structure
            const addressData = {
                mainAddress: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
                contactPerson: formData.contactPerson,
                contactPersonPhone: formData.contactPersonPhone,
                customerType: formData.customerType,
                creditLimit: parseFloat(formData.creditLimit) || 0,
                creditPeriod: parseInt(formData.creditPeriod) || 0,
                taxId: formData.taxId,
                notes: formData.notes
            };

            const response = await fetch(`/api/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: JSON.stringify(addressData),
                    status: 'active'
                }),
            });

            const data = await response.json();

            if (data.success) {
                router.push(`/customers/${customerId}`);
            } else {
                setError(data.message || 'Failed to update customer');
                setSaving(false);
            }
        } catch (err) {
            console.error('Error updating customer:', err);
            setError('Failed to update customer. Please try again later.');
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
                        <h1 className="text-2xl font-bold text-primary">Edit Customer</h1>
                        <p className="text-black/70">Update customer information</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/customers/${customerId}`)}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Customer form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Basic Information */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-primary/5">
                            <h2 className="text-lg font-medium text-primary">Basic Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-medium text-black">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-black">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="phone" className="block text-sm font-medium text-black">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    id="phone"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="customerType" className="block text-sm font-medium text-black">
                                    Customer Type
                                </label>
                                <select
                                    name="customerType"
                                    id="customerType"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.customerType}
                                    onChange={handleChange}
                                >
                                    <option value="Retail">Retail</option>
                                    <option value="Wholesale">Wholesale</option>
                                </select>
                            </div>
                        </div>

                        {/* Address Details Section */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-primary/5">
                            <h2 className="text-lg font-medium text-primary">Address Details</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label htmlFor="address" className="block text-sm font-medium text-black">
                                    Address
                                </label>
                                <textarea
                                    name="address"
                                    id="address"
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="city" className="block text-sm font-medium text-black">
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    id="city"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="postalCode" className="block text-sm font-medium text-black">
                                    Postal Code
                                </label>
                                <input
                                    type="text"
                                    name="postalCode"
                                    id="postalCode"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-primary/5">
                            <h2 className="text-lg font-medium text-primary">Contact Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="contactPerson" className="block text-sm font-medium text-black">
                                    Contact Person
                                </label>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    id="contactPerson"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.contactPerson}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="contactPersonPhone" className="block text-sm font-medium text-black">
                                    Contact Phone
                                </label>
                                <input
                                    type="text"
                                    name="contactPersonPhone"
                                    id="contactPersonPhone"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.contactPersonPhone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="taxId" className="block text-sm font-medium text-black">
                                    Tax ID
                                </label>
                                <input
                                    type="text"
                                    name="taxId"
                                    id="taxId"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Credit Information */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-primary/5">
                            <h2 className="text-lg font-medium text-primary">Credit Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="creditLimit" className="block text-sm font-medium text-black">
                                    Credit Limit (Rs.)
                                </label>
                                <input
                                    type="number"
                                    name="creditLimit"
                                    id="creditLimit"
                                    min="0"
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.creditLimit}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="creditPeriod" className="block text-sm font-medium text-black">
                                    Credit Period (days)
                                </label>
                                <input
                                    type="number"
                                    name="creditPeriod"
                                    id="creditPeriod"
                                    min="0"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.creditPeriod}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-primary/5">
                            <h2 className="text-lg font-medium text-primary">Additional Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="notes" className="block text-sm font-medium text-black">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    id="notes"
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-black"
                                    value={formData.notes}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>

                        {/* Form actions */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-primary/5 flex justify-end">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
} 