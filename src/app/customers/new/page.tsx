'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';

// Interface for customer form data
interface CustomerFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    contactPerson: string;
    contactPersonPhone: string;
    customerType: 'Retail' | 'Wholesale';
    paymentType: 'Cash' | 'Credit';
    creditLimit: number;
    creditPeriod: number;
    taxId: string;
    notes: string;
}

export default function NewCustomer() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        paymentType: 'Cash',
        creditLimit: 0,
        creditPeriod: 30,
        taxId: '',
        notes: '',
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        // Handle number inputs separately
        if (type === 'number') {
            setFormData({
                ...formData,
                [name]: value === '' ? 0 : Number(value),
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
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to create customer');
            }

            // Redirect to customers list page
            router.push('/customers');
            router.refresh();
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Failed to create customer. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create New Customer</h1>
                        <p className="text-gray-500">Add a new customer to your business</p>
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
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tax ID
                                    </label>
                                    <input
                                        type="text"
                                        name="taxId"
                                        value={formData.taxId}
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Person */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Contact Person</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person Name
                                    </label>
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="contactPersonPhone"
                                        value={formData.contactPersonPhone}
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
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                id="retail"
                                                name="customerType"
                                                value="Retail"
                                                checked={formData.customerType === 'Retail'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor="retail" className="ml-2 text-sm font-medium text-gray-700">
                                                Retail
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                id="wholesale"
                                                name="customerType"
                                                value="Wholesale"
                                                checked={formData.customerType === 'Wholesale'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor="wholesale" className="ml-2 text-sm font-medium text-gray-700">
                                                Wholesale
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                id="cash"
                                                name="paymentType"
                                                value="Cash"
                                                checked={formData.paymentType === 'Cash'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor="cash" className="ml-2 text-sm font-medium text-gray-700">
                                                Cash
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                id="credit"
                                                name="paymentType"
                                                value="Credit"
                                                checked={formData.paymentType === 'Credit'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor="credit" className="ml-2 text-sm font-medium text-gray-700">
                                                Credit
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Credit Information - Only shown if payment type is Credit */}
                        {formData.paymentType === 'Credit' && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Credit Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Credit Limit (Rs.) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="creditLimit"
                                            value={formData.creditLimit}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                            required={formData.paymentType === 'Credit'}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Credit Period (Days) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="creditPeriod"
                                            value={formData.creditPeriod}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                            required={formData.paymentType === 'Credit'}
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

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
                                isLoading={isSubmitting}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Customer
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
} 