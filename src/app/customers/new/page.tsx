'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

// Interface for customer form data
interface CustomerFormData {
    name: string;
    phone: string;
    address: string;
    customerType: 'Retail' | 'Wholesale';
    creditLimit?: number;
    creditPeriod?: number;
    notes: string;
}

export default function NewCustomer() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        phone: '',
        address: '',
        customerType: 'Retail',
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
                const errorData = await response.json().catch(() => ({ message: 'Failed to create customer' }));
                if (errorData.error === 'Duplicate mobile number') {
                    throw new Error('A customer with this mobile number already exists. Please use a different mobile number.');
                } else {
                    throw new Error(errorData.message || 'Failed to create customer. Please check server logs.');
                }
            }

            toast.success('Customer created successfully!');
            // Redirect to customers list page
            router.push('/customers');
            router.refresh();
        } catch (error) {
            console.error('Error creating customer:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast.error(errorMessage);
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