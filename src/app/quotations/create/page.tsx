'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, Trash, Search } from 'lucide-react';
import { SalesQuotation, QuotationItem, Customer, Product } from '@/types';

export default function CreateQuotation() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Add state for customer search dropdown
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    // Initialize form with empty quotation
    const [formData, setFormData] = useState<Partial<SalesQuotation> & { customerName?: string }>({
        customerId: '',
        customerName: '',
        date: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        notes: '',
        status: 'pending',
        customerName: ''
    });

    // Initialize items state
    const [items, setItems] = useState<Partial<QuotationItem>[]>([{
            productId: '',
        quantity: '',
        unitPrice: '',
            total: 0
    }]);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch customers for the form
                const customersResponse = await fetch('/api/customers');
                if (!customersResponse.ok) {
                    throw new Error('Failed to fetch customers');
                }
                const customersData = await customersResponse.json();
                console.log('Customers API response:', customersData);

                // The customers API returns the array directly, not wrapped in a data property
                if (Array.isArray(customersData)) {
                setCustomers(customersData);
                    setFilteredCustomers(customersData);
                } else {
                    console.error('Unexpected customers data format:', customersData);
                    setError('Customers data is in an unexpected format.');
                    setCustomers([]);
                    setFilteredCustomers([]);
                }

                // Fetch products for the form
                const productsResponse = await fetch('/api/products');
                if (!productsResponse.ok) {
                    throw new Error('Failed to fetch products');
                }
                const productsData = await productsResponse.json();
                console.log('Products API response:', productsData);

                // Handle different response formats and ensure products is always an array
                if (productsData && productsData.data && Array.isArray(productsData.data)) {
                    console.log('Setting products from productsData.data');
                    setProducts(productsData.data);
                } else if (Array.isArray(productsData)) {
                    console.log('Setting products directly from productsData array');
                setProducts(productsData);
                } else {
                    console.error('Unexpected products data format:', productsData);
                    setError('Products data is in an unexpected format.');
                    setProducts([]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error instanceof Error ? error.message : 'An error occurred');
                setProducts([]); // Ensure products is always an array
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Add effect for filtering customers based on search term
    useEffect(() => {
        if (customerSearch.trim() === '') {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter(customer =>
                customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
                (customer.phone && customer.phone.toLowerCase().includes(customerSearch.toLowerCase()))
            );
            setFilteredCustomers(filtered);
        }
    }, [customerSearch, customers]);

    // Add effect to close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false);
            }
        }

        // Add event listener when dropdown is open
        if (showCustomerDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Clean up event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCustomerDropdown]);

    // Add handler for selecting a customer
    const handleSelectCustomer = (customer: Customer) => {
        setFormData({
            ...formData,
            customerId: customer.id.toString(),
            customerName: customer.name
        });
        setCustomerSearch('');
        setShowCustomerDropdown(false);
    };

    // Handle form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // If changing customerName manually, clear customerId to allow selecting a new customer
        if (name === 'customerName') {
            setFormData({
                ...formData,
                customerName: value,
                customerId: '' // Clear the customer ID
            });
            setCustomerSearch(value);
            setShowCustomerDropdown(true);
            return;
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle item field changes
    const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedItems = [...items];

        if (name === 'productId') {
            const selectedProduct = products.find(product => product.id === value);
            updatedItems[index] = {
                ...updatedItems[index],
                productId: value,
                productName: selectedProduct?.name || '',
                unitPrice: selectedProduct?.price || '' // Use price instead of retailPrice and set as empty string
            };
        } else {
            updatedItems[index] = {
                ...updatedItems[index],
                [name]: value
            };
        }

        // Recalculate total for this item
        if (name === 'quantity' || name === 'unitPrice' || name === 'productId') {
            const quantity = value === '' || isNaN(Number(updatedItems[index].quantity)) ? 0 : Number(updatedItems[index].quantity);
            const unitPrice = value === '' || isNaN(Number(updatedItems[index].unitPrice)) ? 0 : Number(updatedItems[index].unitPrice);
            updatedItems[index].total = quantity * unitPrice;
        }

        setItems(updatedItems);

        // Update form subtotal, tax, and total
        updateTotals(updatedItems);
    };

    // Add a new item row
    const addItem = () => {
        setItems([
            ...items,
            {
                productId: '',
                productName: '',
                quantity: '',
                unitPrice: '',
                total: 0
            }
        ]);
    };

    // Remove an item row
    const removeItem = (index: number) => {
        if (items.length === 1) {
            // Don't remove the last item, just reset it
            const resetItems = [{
                productId: '',
                productName: '',
                quantity: '',
                unitPrice: '',
                total: 0
            }];
            setItems(resetItems);
            updateTotals(resetItems);
            return;
        }

        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
        updateTotals(updatedItems);
    };

    // Update totals based on items
    const updateTotals = (currentItems: Partial<QuotationItem>[]) => {
        const subtotal = currentItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const discount = Number(formData.discount) || 0;
        const total = subtotal - discount;

        setFormData(prev => ({
            ...prev,
            subtotal,
            total
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Validate form
            if (!formData.customerId) {
                alert('Please select a customer');
                return;
            }

            if (items.length === 0 || !items[0].productId) {
                alert('Please add at least one item');
                return;
            }

            // Prepare the quotation data
            const quotationData: Partial<SalesQuotation> = {
                ...formData,
                items: items as QuotationItem[]
            };

            // Send the data to the API
            const response = await fetch('/api/quotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(quotationData)
            });

            if (!response.ok) {
                throw new Error('Failed to create quotation');
            }

            // Redirect to the quotations list
            router.push('/quotations');
        } catch (err) {
            console.error('Error creating quotation:', err);
            alert('Failed to create quotation. Please try again.');
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-black">Create New Quotation</h1>
                        <p className="text-black">Create a new sales quotation for your customer</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/quotations')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Quotations
                        </Button>
                    </div>
                </div>

                {/* Loading and error states */}
                {loading ? (
                    <div className="text-center py-4">
                        <p className="text-black">Loading data...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-4">
                        <p className="text-red-500">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="mt-2"
                        >
                            Retry
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Customer*
                                </label>
                                <div className="relative" ref={customerDropdownRef}>
                                    <input
                                        type="text"
                                        name="customerName"
                                        placeholder="Search for a customer..."
                                        value={formData.customerName || customerSearch}
                                        onChange={(e) => {
                                            if (!formData.customerId) {
                                                setCustomerSearch(e.target.value);
                                                setShowCustomerDropdown(true);
                                            } else {
                                                // If already selected a customer, clear it to enable searching
                                                handleChange(e);
                                            }
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black pr-10"
                                    required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-500" />
                                    </div>

                                    {showCustomerDropdown && (
                                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {filteredCustomers.length > 0 ? (
                                                <ul className="py-1 text-sm text-black">
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
                                <input type="hidden" name="customerId" value={formData.customerId || ''} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Date*
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Expiry Date*
                                </label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Discount Amount
                                </label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={formData.discount || 0}
                                    onChange={(e) => {
                                        handleChange(e);
                                        updateTotals(items);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                                    min="0"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-black mb-1">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                                    placeholder="Add any additional information or terms..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Item Management */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-black">Items</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-3 text-left text-black font-medium">Product</th>
                                            <th className="p-3 text-left text-black font-medium">Quantity</th>
                                            <th className="p-3 text-left text-black font-medium">Unit Price</th>
                                            <th className="p-3 text-left text-black font-medium">Total</th>
                                            <th className="p-3 text-left text-black font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-3">
                                                    <select
                                                        name="productId"
                                                        value={item.productId || ''}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-black"
                                                        required
                                                    >
                                                        <option value="">Select a product</option>
                                                        {Array.isArray(products) ?
                                                            products.map((product) => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.name}
                                                            </option>
                                                            ))
                                                            :
                                                            <option value="">No products available</option>
                                                        }
                                                    </select>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        name="quantity"
                                                        value={item.quantity || ''}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-black"
                                                        min="1"
                                                        required
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        name="unitPrice"
                                                        value={item.unitPrice || ''}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-black"
                                                        min="0"
                                                        required
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-black font-medium">
                                                        {(item.total || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex flex-col items-end mb-8">
                            <div className="w-full md:w-1/3 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-black">Subtotal:</span>
                                    <span className="text-black font-medium">{(formData.subtotal || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black">Discount:</span>
                                    <span className="text-black font-medium">{(formData.discount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="text-black font-bold">Total:</span>
                                    <span className="text-black font-bold">{(formData.total || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.push('/quotations')}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Create Quotation
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </MainLayout>
    );
} 