'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';

// Interface for Customer in dropdown
interface Customer {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
}

// Interface for Product in dropdown
interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
    sku?: string;
}

// Interface for Invoice Line Item
interface InvoiceItem {
    id: string; // Temporary ID for UI
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

// Interface for Invoice Form Data
interface InvoiceFormData {
    customerId: number;
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    notes: string;
    status: 'Draft' | 'Pending' | 'Paid' | 'Overdue';
    items: InvoiceItem[];
}

export default function CreateInvoice() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<number>(1);

    const [formData, setFormData] = useState<InvoiceFormData>({
        customerId: 0,
        customerName: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        status: 'Pending',
        items: []
    });

    // Generate a unique invoice number based on current date
    const invoiceNumber = useMemo(() => {
        const now = new Date();
        return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }, []);

    // Calculate invoice total based on line items
    const invoiceTotal = useMemo(() => {
        return formData.items.reduce((sum, item) => sum + item.total, 0);
    }, [formData.items]);

    // Fetch customers and products on component mount
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch customers
                const customerResponse = await fetch('/api/customers');
                if (customerResponse.ok) {
                    const customerData = await customerResponse.json();
                    // Handle both direct array and wrapped object formats
                    setCustomers(Array.isArray(customerData) ? customerData :
                        (customerData.data && Array.isArray(customerData.data) ? customerData.data : []));
                }

                // Fetch products
                const productResponse = await fetch('/api/products');
                if (productResponse.ok) {
                    const productData = await productResponse.json();
                    setProducts(Array.isArray(productData.data) ? productData.data : []);
                } else {
                    // If API not available, set some sample products
                    setProducts([
                        { id: 1, name: 'Cricket Bat', price: 12500, description: 'Professional cricket bat', sku: 'CB-001' },
                        { id: 2, name: 'Cricket Ball', price: 1800, description: 'Match quality cricket ball', sku: 'CBL-002' },
                        { id: 3, name: 'Basketball', price: 4500, description: 'Official size basketball', sku: 'BB-003' },
                        { id: 4, name: 'Football', price: 3200, description: 'Professional football', sku: 'FB-004' },
                        { id: 5, name: 'Tennis Racket', price: 8500, description: 'Professional tennis racket', sku: 'TR-005' },
                    ]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                // Set sample data if API fails
                setCustomers([
                    { id: 1, name: 'Colombo Cricket Club', email: 'info@colombocricket.lk', phone: '+94 112 345 123' },
                    { id: 2, name: 'Kandy Sports Association', email: 'info@kandysports.lk', phone: '+94 812 345 456' },
                    { id: 3, name: 'Galle School District', email: 'sports@galleschools.lk', phone: '+94 912 345 789' },
                ]);
            }
        }

        fetchData();
    }, []);

    // Filter customers based on search term
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers;
        if (!Array.isArray(customers)) return [];
        return customers.filter(customer =>
            customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
            (customer.phone && customer.phone.includes(customerSearch))
        );
    }, [customers, customerSearch]);

    // Filter products based on search term
    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        if (!Array.isArray(products)) return [];
        return products.filter(product =>
            product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))
        );
    }, [products, productSearch]);

    // Handle form input changes
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle customer selection
    const handleSelectCustomer = (customer: Customer) => {
        setFormData({
            ...formData,
            customerId: customer.id,
            customerName: customer.name
        });
        setCustomerSearch('');
        setShowCustomerDropdown(false);
    };

    // Handle product selection for adding to line items
    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setProductSearch('');
        setShowProductDropdown(false);
    };

    // Add line item to invoice
    const handleAddLineItem = () => {
        if (!selectedProduct) return;

        const newItem: InvoiceItem = {
            id: Date.now().toString(), // Temporary ID for UI
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: quantity,
            price: selectedProduct.price,
            total: selectedProduct.price * quantity
        };

        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });

        // Reset selection
        setSelectedProduct(null);
        setQuantity(1);
    };

    // Remove line item from invoice
    const handleRemoveLineItem = (itemId: string) => {
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.id !== itemId)
        });
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Transform data for API
            const invoiceData = {
                invoiceNumber,
                customerId: formData.customerId,
                total: invoiceTotal,
                status: formData.status,
                notes: formData.notes,
                invoiceDate: formData.invoiceDate,
                dueDate: formData.dueDate,
                items: formData.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                }))
            };

            // Create invoice via API
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

            // Redirect to invoices list page
            router.push('/invoices');
            router.refresh();
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice. Please try again.');
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
                        <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
                        <p className="text-gray-500">Create an invoice for your customer</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Invoices
                        </Button>
                    </div>
                </div>

                {/* Invoice Form */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Invoice Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Invoice Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Invoice Number
                                        </label>
                                        <input
                                            type="text"
                                            value={invoiceNumber}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900 bg-gray-100"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Overdue">Overdue</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Invoice Date
                                        </label>
                                        <input
                                            type="date"
                                            name="invoiceDate"
                                            value={formData.invoiceDate}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={formData.dueDate}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Customer Information</h2>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Customer <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search for a customer..."
                                                value={formData.customerName || customerSearch}
                                                onChange={(e) => {
                                                    if (!formData.customerId) {
                                                        setCustomerSearch(e.target.value);
                                                        setShowCustomerDropdown(true);
                                                    }
                                                }}
                                                onFocus={() => setShowCustomerDropdown(true)}
                                                className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                                required
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                {formData.customerId ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                customerId: 0,
                                                                customerName: ''
                                                            });
                                                            setCustomerSearch('');
                                                        }}
                                                        className="text-gray-400 hover:text-gray-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                                                        className="text-gray-400 hover:text-gray-500"
                                                    >
                                                        {showCustomerDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {showCustomerDropdown && !formData.customerId && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {filteredCustomers.length > 0 ? (
                                                    <ul className="py-1 text-sm text-gray-700">
                                                        {filteredCustomers.map((customer) => (
                                                            <li
                                                                key={customer.id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleSelectCustomer(customer)}
                                                            >
                                                                <div className="font-medium">{customer.name}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    {customer.email} {customer.phone && `• ${customer.phone}`}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="px-4 py-2 text-sm text-gray-500">No customers found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-8">
                                        <div className="bg-gray-50 p-4 rounded-md">
                                            <h3 className="font-semibold text-sm text-gray-700 mb-2">Invoice Summary</h3>
                                            <div className="flex justify-between text-sm">
                                                <span>Subtotal:</span>
                                                <span>Rs. {invoiceTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm mt-1">
                                                <span>Tax (0%):</span>
                                                <span>Rs. 0.00</span>
                                            </div>
                                            <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                                                <span>Total:</span>
                                                <span>Rs. {invoiceTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Invoice Items</h2>

                            {/* Add new line item */}
                            <div className="bg-gray-50 p-4 rounded-md mb-4">
                                <h3 className="font-medium text-sm text-gray-700 mb-3">Add Item</h3>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    <div className="md:col-span-3 relative">
                                        <input
                                            type="text"
                                            placeholder="Search for a product..."
                                            value={selectedProduct ? selectedProduct.name : productSearch}
                                            onChange={(e) => {
                                                if (!selectedProduct) {
                                                    setProductSearch(e.target.value);
                                                    setShowProductDropdown(true);
                                                }
                                            }}
                                            onFocus={() => setShowProductDropdown(true)}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        />
                                        {showProductDropdown && !selectedProduct && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {filteredProducts.length > 0 ? (
                                                    <ul className="py-1 text-sm text-gray-700">
                                                        {filteredProducts.map((product) => (
                                                            <li
                                                                key={product.id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleSelectProduct(product)}
                                                            >
                                                                <div className="font-medium">{product.name}</div>
                                                                <div className="text-xs flex justify-between">
                                                                    <span className="text-gray-500">{product.sku}</span>
                                                                    <span>Rs. {product.price.toLocaleString()}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="px-4 py-2 text-sm text-gray-500">No products found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-1">
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <input
                                            type="text"
                                            placeholder="Price"
                                            value={selectedProduct ? selectedProduct.price.toLocaleString() : ''}
                                            disabled
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900 bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <Button
                                            type="button"
                                            onClick={handleAddLineItem}
                                            disabled={!selectedProduct}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Line items table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">Item</th>
                                            <th className="px-4 py-3 text-center">Quantity</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                            <th className="px-4 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.length > 0 ? (
                                            formData.items.map((item) => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                        {item.productName}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">Rs. {item.price.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right">Rs. {item.total.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveLineItem(item.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                                                    No items added yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-semibold text-gray-900">
                                            <td colSpan={3} className="px-4 py-3 text-right">
                                                Grand Total:
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                Rs. {invoiceTotal.toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
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
                                    placeholder="Add any additional notes or payment instructions..."
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
                                disabled={formData.items.length === 0 || !formData.customerId}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Invoice
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
} 