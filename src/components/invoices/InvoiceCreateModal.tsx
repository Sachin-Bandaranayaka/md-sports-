'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Combobox } from '@/components/ui/Combobox';
import { Textarea } from '@/components/ui/Textarea';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
}

interface InvoiceItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

interface InvoiceFormData {
    customerId: string;
    customerName: string;
    invoiceNumber: string;
    dueDate: string;
    paymentMethod: string;
    notes: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
}

interface InvoiceCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (invoice: any) => void;
    onSuccess?: () => void;
    customers: Customer[];
    products: Product[];
    isLoading?: boolean;
}

const InvoiceCreateModal: React.FC<InvoiceCreateModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onSuccess,
    customers = [],
    products = [],
    isLoading = false
}) => {
    const [formData, setFormData] = useState<InvoiceFormData>({
        customerId: '',
        customerName: '',
        invoiceNumber: '',
        dueDate: '',
        paymentMethod: 'cash',
        notes: '',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Generate invoice number on modal open
    useEffect(() => {
        if (isOpen && !formData.invoiceNumber) {
            const invoiceNumber = `INV-${Date.now()}`;
            const defaultDueDate = new Date();
            defaultDueDate.setDate(defaultDueDate.getDate() + 30);

            setFormData(prev => ({
                ...prev,
                invoiceNumber,
                dueDate: defaultDueDate.toISOString().split('T')[0]
            }));
        }
    }, [isOpen]);

    // Calculate totals when items change
    useEffect(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;

        setFormData(prev => ({
            ...prev,
            subtotal,
            tax,
            total
        }));
    }, [formData.items]);

    const handleCustomerSelect = (customerId: string) => {
        const customer = customers.find(c => c.id.toString() === customerId);
        setFormData(prev => ({
            ...prev,
            customerId,
            customerName: customer?.name || ''
        }));
        setErrors(prev => ({ ...prev, customerId: '' }));
    };

    const addItem = () => {
        const newItem: InvoiceItem = {
            id: `item-${Date.now()}`,
            productId: '',
            productName: '',
            quantity: 1,
            price: 0,
            total: 0
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    const removeItem = (itemId: string) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));
    };

    const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, [field]: value };

                    // Handle product selection
                    if (field === 'productId') {
                        const product = products.find(p => p.id.toString() === value);
                        if (product) {
                            updatedItem.productName = product.name;
                            updatedItem.price = product.price;
                        }
                    }

                    // Recalculate total
                    updatedItem.total = updatedItem.quantity * updatedItem.price;

                    return updatedItem;
                }
                return item;
            })
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.customerId) {
            newErrors.customerId = 'Customer is required';
        }

        if (!formData.invoiceNumber) {
            newErrors.invoiceNumber = 'Invoice number is required';
        }

        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        }

        if (formData.items.length === 0) {
            newErrors.items = 'At least one item is required';
        }

        formData.items.forEach((item, index) => {
            if (!item.productId) {
                newErrors[`item-${index}-product`] = 'Product is required';
            }
            if (item.quantity <= 0) {
                newErrors[`item-${index}-quantity`] = 'Quantity must be greater than 0';
            }
            if (item.price <= 0) {
                newErrors[`item-${index}-price`] = 'Price must be greater than 0';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const invoiceData = {
                ...formData,
                items: formData.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                }))
            };

            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invoiceData),
            });

            if (!response.ok) {
                throw new Error('Failed to create invoice');
            }

            const result = await response.json();

            if (onSave) {
                onSave(result);
            }

            if (onSuccess) {
                onSuccess();
            }

            handleClose();
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            customerId: '',
            customerName: '',
            invoiceNumber: '',
            dueDate: '',
            paymentMethod: 'cash',
            notes: '',
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0
        });
        setErrors({});
        onClose();
    };

    const customerOptions = Array.isArray(customers) ? customers.map(customer => ({
        value: customer.id.toString(),
        label: customer.name
    })) : [];

    const productOptions = Array.isArray(products) ? products.map(product => ({
        value: product.id.toString(),
        label: `${product.name} - LKR ${product.price.toFixed(2)}`
    })) : [];

    const footer = (
        <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">
                Total: LKR {formData.total.toFixed(2)}
            </div>
            <div className="flex space-x-3">
                <Button variant="outline" onClick={handleClose} disabled={submitting}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={submitting}
                    disabled={submitting || isLoading}
                >
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? 'Creating...' : 'Create Invoice'}
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Invoice"
            size="4xl"
            footer={footer}
        >
            <div className="space-y-6">
                {/* Invoice Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="customer" className="text-black font-semibold">Customer *</Label>
                        <Combobox
                            options={customerOptions}
                            value={formData.customerId}
                            onChange={handleCustomerSelect}
                            placeholder="Select a customer"
                            className={errors.customerId ? 'border-red-500' : 'border-gray-300'}
                        />
                        {errors.customerId && (
                            <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="invoiceNumber" className="text-black font-semibold">Invoice Number *</Label>
                        <Input
                            id="invoiceNumber"
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                            className={`text-black ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.invoiceNumber && (
                            <p className="text-red-500 text-sm mt-1">{errors.invoiceNumber}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="dueDate" className="text-black font-semibold">Due Date *</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            className={`text-black ${errors.dueDate ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.dueDate && (
                            <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="paymentMethod" className="text-black font-semibold">Payment Method</Label>
                        <select
                            id="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>
                </div>

                {/* Invoice Items */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-black">Invoice Items</h3>
                        <Button variant="outline" size="sm" onClick={addItem} className="text-black border-gray-300">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    {errors.items && (
                        <p className="text-red-500 text-sm mb-4">{errors.items}</p>
                    )}

                    <div className="space-y-4 max-h-64 overflow-y-auto">
                        <AnimatePresence>
                            {formData.items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-12 gap-3 items-end p-4 border border-gray-200 rounded-lg bg-gray-50"
                                >
                                    <div className="col-span-4">
                                        <Label className="text-black font-medium">Product *</Label>
                                        <Combobox
                                            options={productOptions}
                                            value={item.productId}
                                            onChange={(value) => updateItem(item.id, 'productId', value)}
                                            placeholder="Select product"
                                            className={errors[`item-${index}-product`] ? 'border-red-500' : 'border-gray-300'}
                                        />
                                        {errors[`item-${index}-product`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`item-${index}-product`]}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <Label className="text-black font-medium">Quantity *</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                            className={`text-black ${errors[`item-${index}-quantity`] ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors[`item-${index}-quantity`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`item-${index}-quantity`]}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <Label className="text-black font-medium">Price *</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                            className={`text-black ${errors[`item-${index}-price`] ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors[`item-${index}-price`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`item-${index}-price`]}</p>
                                        )}
                                    </div>

                                    <div className="col-span-3">
                                        <Label className="text-black font-medium">Total</Label>
                                        <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-black font-semibold">
                                            LKR {item.total.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeItem(item.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {formData.items.length === 0 && (
                        <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-gray-400 mb-2">
                                <Plus className="w-8 h-8 mx-auto" />
                            </div>
                            <p className="text-black">No items added yet. Click "Add Item" to get started.</p>
                        </div>
                    )}
                </div>

                {/* Invoice Summary */}
                {formData.items.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                            <div className="flex justify-between text-black">
                                <span className="font-medium">Subtotal:</span>
                                <span className="font-semibold">LKR {formData.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-black">
                                <span className="font-medium">Tax (10%):</span>
                                <span className="font-semibold">LKR {formData.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t border-blue-300 pt-2 text-black">
                                <span>Total:</span>
                                <span>LKR {formData.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <Label htmlFor="notes" className="text-black font-semibold">Notes</Label>
                    <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes or comments..."
                        rows={3}
                        className="text-black border-gray-300 focus:border-blue-500"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceCreateModal;